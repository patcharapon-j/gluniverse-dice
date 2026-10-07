---
title: Hide a result shown in another chat message
description: Keep a roll result hidden in another chat message until the dice of that roll land.
---

When a chat message that is not the roll message shows the result of a roll (a summary of saving throws, a request ticking off who rolled), wrap that part in an element with a `data-message-id` attribute set to the ID of the roll message. Dice So Nice! hides it while the dice roll, and shows it when they land.

```html
<li class="target" data-message-id="{{ resultMessageId }}">
    <span class="name">Bob</span>
    <span class="result">17</span>
</li>
```

## Next steps

- If the whole other message is tied to the roll, a [companion link](/foundryvtt-dice-so-nice/api/quick/rolls/several-messages/) is simpler.

## Full documentation

- [Showing a roll result inside another message](/foundryvtt-dice-so-nice/api/roll/#showing-a-roll-result-inside-another-message)
