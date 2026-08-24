---
title: Interactive Throws
description: Request or opt out of interactive dice throws per roll, and integrate with their completion timing.
---

Interactive throws let a player reveal a roll by picking up the 3D dice on the tabletop and throwing them. Foundry still decides the result when the roll is evaluated. The throw only shows that result: Dice So Nice! corrects the physics animation so each thrown die lands on the number Foundry already picked, the same way it does for a normal 3D roll.

This page explains how to ask for, or refuse, an interactive throw on a given roll, and what happens to your automation and to completion timing while a throw is pending.

## How a roll becomes interactive

When an eligible roll message is created, the roller's client marks it as pending. Every client then holds the message instead of animating it, and Dice So Nice! posts a separate chat card, visible to everyone, that shows the progress of the throw. The roll has one slot per die, and the roller fills the slots by throwing dice on the tabletop.

The pending throw ends when every die has been thrown. It also ends early when the roller clicks *"Just roll it"*, when a GM force-resolves it, when the roller or a GM skips the animation, or when the roller reloads or disconnects.

Eligibility is decided once, when the message is created, from:

- the GM world setting (*Interactive dice throws*: disabled / allowed off by default / allowed on by default),
- the user's own setting (world default / never / only when requested / whenever possible),
- the per-roll request flags described below,
- the features it depends on: dice interaction and persistent dice must be enabled, chat messages must not be displayed immediately, and the roller must have 3D dice active on their own client,
- the roll itself: it must be public (not whispered, not blind) and contain at least one die Dice So Nice! can animate in 3D whose term is not already fulfilled by an interactive fulfillment method (manual input, connected dice).

## Request flags

Set the `dice-so-nice.interactive` flag on the chat message when you create it. It works the same way as [`dice-so-nice.skip`](/foundryvtt-dice-so-nice/api/roll/#skip-animation-for-a-specific-message-recommended).

`interactive: true` asks for an interactive throw, for example on an important roll. It only works when both the world and the user allow interactive throws. A user at "never" or a world at "disabled" always refuses:

```javascript
let r = await new Roll('1d20').evaluate();
await r.toMessage({
    flags: {
        'dice-so-nice': {
            interactive: true
        }
    }
});
```

`interactive: false` prevents an interactive throw for this roll, even for a user at "whenever possible". Use it for bulk NPC rolls or sweeps, where nobody wants to throw the dice by hand:

```javascript
let r = await new Roll('20d6').evaluate();
await r.toMessage({
    flags: {
        'dice-so-nice': {
            interactive: false
        }
    }
});
```

Dice So Nice! reads the flag once, when the message is created. A flag added or changed after that is ignored.

## Automation is not delayed

The roll is fully evaluated before the pending throw opens. Anything your system or module does with the evaluated roll (apply damage, update a tracker, post a follow-up card) runs right away. Dice So Nice! only holds back what it controls itself: the chat message, the initiative value in the combat tracker, and Foundry's core dice sound. If your follow-up output must appear after the throw, wait for the completion API described below.

Dice So Nice! does not register a Foundry dice fulfillment resolver. The throw does not produce the result. It only reveals the result Foundry already produced.

## Completion timing

Everything that signals the end of the animation waits until the last thrown die lands, or until the pending throw ends another way (escape, force-resolve, skip, reload, disconnect). Nothing resolves earlier. This applies to:

- the promises returned by the public API methods,
- `game.dice3d.waitFor3DAnimationByMessageID(messageId)`,
- the `diceSoNiceRollComplete` hook.

There is no timeout. A pending throw stays open as long as the table wants, but it can always be ended: the roller can escape at any time, a GM can force-resolve at any time, and if the roller reloads or disconnects, the throw is abandoned and the result is revealed.

```javascript
Hooks.on('createChatMessage', async (message) => {
    if (!message.isRoll) return;
    //resolves when the last die lands (or immediately for a normal roll)
    await game.dice3d.waitFor3DAnimationByMessageID(message.id);
    //safe to reveal follow-up content here
});
```

## Lifecycle hooks

Three hooks expose the pending throw lifecycle on each client:

```javascript
//a pending throw opened for this message
Hooks.on('diceSoNicePendingThrowOpened', (messageId) => {});

//a thrown die landed and filled one or more slots
Hooks.on('diceSoNicePendingSlotsBound', (messageId) => {});

//the pending throw ended on this client (completed, escaped, forced, skipped, abandoned, or cancelled)
Hooks.on('diceSoNicePendingThrowClosed', (messageId) => {});
```

They fire on every client and only describe what that client is showing. To know when the roll is done, keep using `diceSoNiceRollComplete`.
