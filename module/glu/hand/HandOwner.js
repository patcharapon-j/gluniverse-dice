// GLUniverse Dice: whose dice a held roll shows in the hand (M5).
//
// The hand must show the dice the throw will use. ThrowPipeline.animateRolls picks them with
// RollRules.diceOwner: with DSN's "use the character owner's appearance" world setting
// (forceCharacterOwnerAppearance), a roll from a player's character, made by the GM or by
// another player, uses that player's dice, not the roller's. A message with rolls of several
// actors is never held (PendingThrowManager.isEligible), so there is a single owner.
//
// `rules` is RollRules, passed in so this file loads without Foundry (tests/handOwner.test.mjs).

/**
 * @param {ChatMessage} message   the held message
 * @param {Roll[]} rollList       ThrowPipeline._buildRollList of its stamped rolls
 * @param {typeof import('../../throw/RollRules.js').RollRules} rules
 * @returns {{ user: User, actor: Actor|null }}
 */
export function handOwner(message, rollList, rules) {
    const author = message.author ?? game.user;
    const resolveOwner = rules.shouldResolveOwner(message.getFlag?.("core", "initiativeRoll"));
    //animateRolls with a single actor group: only the first die's dsnActorId, else the speaker
    const actorId = rollList[0]?.dice?.[0]?.options?.dsnActorId;
    const owner = rules.diceOwner(author, message.speaker, actorId, resolveOwner);
    return { user: owner.user ?? author, actor: ChatMessage.getSpeakerActor(owner.speaker) };
}
