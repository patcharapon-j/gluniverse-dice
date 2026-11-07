---
title: Roll Area
description: Get, set and preview the area dice land in, on this client or, as a GM, on another user's client such as a stream capture login. GLUniverse Dice only.
---

The roll area is the part of the window the 3D dice board covers. The dice are thrown, bounce off the walls and settle inside it. Each client has its own: it is Dice So Nice!'s *Rollable area* setting (the `rollingArea` value in the user's `dice-so-nice.settings` flag), which players edit from the settings menu.

GLUniverse Dice adds an API for it at `game.dice3d.rollArea` (also at `game.modules.get("gluniverse-dice").api.rollArea`). A change applies **live**, without a reload. A GM can also change the area of another user's client. This is meant for a stream capture login: a dedicated user, with Foundry's interface hidden, used as an OBS source, whose dice have to land inside one part of the picture.

Nothing on this page exists in upstream Dice So Nice!. Feature-test before you call it:

```javascript
const area = game.dice3d?.rollArea;
if (!area) return; // plain Dice So Nice!, or 3D dice are off on this client
```

## Units

A rect is `{ left, top, width, height }` in **CSS pixels of the client's window**, measured from its top-left corner. This is what Dice So Nice! stores, so a saved area is an ordinary *Rollable area* value.

Every call that takes a rect also takes `{ units: "fraction" }`: the same four keys as fractions of the client's window, each between 0 and 1. The client converts them to pixels **once, when it applies them**, against its own window. Use fractions from another client, which does not know the capture window's size. After that the area is stored in pixels, like any *Rollable area* value. A later window resize keeps the pixels and does not rescale them.

The client checks every rect:

- `left`, `top`, `width` and `height` must be finite numbers. A missing or non-numeric value, `NaN`, a zero or negative size, a negative `left`/`top`, or a fraction outside [0, 1] is rejected with an error.
- A rect that overflows the window is moved inside it, and shrunk if it is bigger than the window.
- Each side is at least 64 px, or the whole window if that is smaller.
- Values are rounded to whole pixels.

## On this client

### `get()`

Returns the state of this client:

```javascript
{
    userId: "…",                   // this user
    rect: { left, top, width, height } | null, // the area in effect; null = whole window (DSN's default)
    fractions: { left, top, width, height } | null, // rect as fractions of the viewport
    effective: { left, top, width, height } | null, // the dice canvas as it is built right now
    viewport: { width, height },   // this window in CSS px
    persisted: { … } | null,       // the area saved in the Rollable area setting
    transient: false,              // true while a persist:false area is in effect
    preview: false                 // the outline is showing
}
```

`effective` can differ from `rect` for about 150 ms after a change, or until the dice in flight have landed (see [Live apply](#live-apply)). With no area set, Dice So Nice! covers the whole window and keeps the dice clear of the sidebar.

### `set(rect, { units = "px", persist = true })`

Sets the area and applies it live. Returns a promise that resolves with the new state once the board has been rebuilt.

```javascript
// the lower-right quarter of the window, saved in the Rollable area setting
await game.dice3d.rollArea.set({ left: 0.5, top: 0.5, width: 0.5, height: 0.5 }, { units: "fraction" });
```

With `persist: true` (default) the area is saved in this user's *Rollable area* setting and survives a reload. With `persist: false` it lasts until the next page load and the saved setting is left alone. Use it to try out an area before you save it.

### `clear({ persist = true })`

Removes the area, so the board covers the whole window again (Dice So Nice!'s default). With `persist: false` only this page load goes back to the whole window, and the saved area returns after a reload.

### `preview(on = true)`

Shows (`true`) or hides (`false`) a dashed outline of the area, labelled with its size, on this client. It is a plain element above everything else and does not take the mouse. It follows every change, and shows a requested area before the rebuild has finished. **It shows on the capture too**: turn it off before going live. A reload always clears it.

### `viewport()`

This window in CSS px: `{ width, height }`.

## On another user's client (GM)

```javascript
const streamUserId = "…";
const area = game.dice3d.rollArea;

const state = await area.query(streamUserId);   // null if that client did not answer
await area.previewFor(streamUserId, true);
await area.setFor(streamUserId, { left: 0.05, top: 0.55, width: 0.4, height: 0.4 }, { units: "fraction" });
await area.previewFor(streamUserId, false);
await area.clearFor(streamUserId);
```

| Call | What the target client does |
|---|---|
| `setFor(userId, rect, { units, persist })` | `set(rect, { units, persist })` |
| `clearFor(userId, { persist })` | `clear({ persist })` |
| `previewFor(userId, on)` | `preview(on)` |
| `query(userId, { timeout = 3000 })` | answers with its `get()` state. Resolves `null` after `timeout` ms if the user is offline or 3D dice are off on that client. |

`setFor`, `clearFor` and `previewFor` are for **GMs only** and throw for anyone else. They check the rect before sending it, so a bad rect fails on the caller. They return when the request has been saved, **not** when the target has applied it. To know when it has, listen for `gluDiceRollAreaReport` or call `query` again. A call with your own user id runs locally.

### How it travels

- **Writes** are saved as a flag on the target's User document, `flags.gluniverse-dice.rollAreaRequest`: `{ action, rect, units, persist, on, at, by }`. Foundry's server lets only a GM (or the user) change it. The target client acts on the `updateUser` hook, and only when the author Foundry reports for the update is a GM or itself. The target checks the request again against its own window. It acts on changes only: a request still saved from earlier is ignored at load, so a reload never brings back an old preview. The flag holds only the last request, as a record.
- With `persist: true` the target saves the area in **its own** *Rollable area* setting. A GM who edits the target's `dice-so-nice.settings.rollingArea` directly gets the same live result.
- **Reads** use the module socket (`module.gluniverse-dice`): `{ type: "gluRollAreaQuery", to, from, requestId }` and the answer `{ type: "gluRollAreaState", from, requestId, state }`. Foundry does not check who sent a socket message, so a read carries no authority and changes nothing.

## Hooks

| Hook | Where | Arguments |
|---|---|---|
| `gluDiceRollAreaChanged` | on the client whose board was rebuilt for a new area | `state` (as `get()`) |
| `gluDiceRollAreaReport` | on every **other** connected client, after a rebuild or an answer to `query` | `state`, `fromUserId` |

```javascript
Hooks.on("gluDiceRollAreaReport", (state, fromUserId) => {
    if (fromUserId !== streamUserId) return;
    drawMiniMap(state.viewport, state.rect);
});
```

## Live apply

A new area is applied the way Dice So Nice! already handles a window resize, with `Dice3D.resizeAndRebuild()`. That rebuilds the dice canvas, the renderer, the camera and the physics walls. Then the shaders are compiled again, so the next throw does not stutter.

- Several changes within 150 ms are merged into one rebuild, so a director dragging an area costs one rebuild. Send the final rect when the drag ends, and use `preview` while dragging.
- The rebuild waits until no dice are in flight, so a roll already on screen finishes where it started. Completion signals (`diceSoNiceRollComplete`, `waitFor3DAnimationByMessageID`) are not delayed.
- As with a window resize, dice lying on the board are cleared by the rebuild, persistent dice included. Persistent dice come back at the next load, from their flags.
- With 3D dice off on that client (*visibility: none*), the area is saved but nothing is rebuilt.

Other clients simulate each throw against their own board, as they always do in Dice So Nice!, so the capture client's area does not change what players see.

## Limits

- A transient area (`persist: false`) is saved for real if the player saves Dice So Nice!'s settings dialog while it is in effect. On a capture login nobody opens that dialog.
- Dice So Nice!'s own *Rollable area* dialog still saves and asks for a reload, as upstream does. The live path makes the reload unnecessary, but harmless.
