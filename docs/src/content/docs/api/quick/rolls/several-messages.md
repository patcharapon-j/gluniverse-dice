---
title: One roll, several chat messages
description: Keep the other messages of a roll hidden until the dice land, with a companion link.
---

Some systems post several messages for one roll, like a roll message and a separate message with buttons and results. Put the Roll on the main message, and link the others to it with the `dice-so-nice.linkedTo` flag. They stay hidden while the dice roll, and show up with the main message.

```javascript
let roll = await new Roll('1d20').evaluate();
let primary = await ChatMessage.create({
    rolls: [roll],
    content: '<p>Attack roll</p>'
});

await ChatMessage.create({
    content: '<p>Damage options and buttons here</p>',
    flags: {
        'dice-so-nice': {
            linkedTo: primary.id
        }
    }
});
```

## Next steps

- Create the main message first: a companion created before it shows right away.
- Keep the Roll on the main message only. A companion with its own rolls is treated as a normal roll.

## Full documentation

- [Companion Messages](/foundryvtt-dice-so-nice/api/companion-messages/)
