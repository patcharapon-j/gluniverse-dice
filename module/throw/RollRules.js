import { DsnSettings } from '../settings/DsnSettings.js';

//the rules that decide what a client shows for a roll: real, secret or ghost dice, npc rolls, owner dice, "only my dice"
//they work on a chat message, or on an unsaved one built for a roll that has no message
export class RollRules {

    //animate: this client shows the dice, ghost: it shows them without the result, secret: the roll is whispered
    static visibility(message) {
        const hide3dDiceOnSecretRolls = game.settings.get("dice-so-nice", "hide3dDiceOnSecretRolls");
        const showGhostDice = game.settings.get("dice-so-nice", "showGhostDice");
        const shouldShowGhostDice = showGhostDice === "1" ||
            (showGhostDice === "2" && game.user.id === message.author?.id && hide3dDiceOnSecretRolls) ||
            (showGhostDice === "3" && !message.author?.isGM && hide3dDiceOnSecretRolls);
        const isContentVisible = message.isContentVisible;
        return {
            animate: isContentVisible || shouldShowGhostDice || !hide3dDiceOnSecretRolls,
            ghost: !isContentVisible && hide3dDiceOnSecretRolls,
            secret: message.whisper.length > 0 && hide3dDiceOnSecretRolls
        };
    }

    static isHiddenNpc(speaker) {
        if (!speaker || !game.settings.get("dice-so-nice", "hideNpcRolls")) return false;
        const actor = ChatMessage.getSpeakerActor(speaker);
        return actor ? !actor.hasPlayerOwner : false;
    }

    //"only my dice": this client does not show the dice of other users
    static isHiddenUser(user) {
        return DsnSettings.CONFIG().visibility === "mine" && user !== game.user;
    }

    static shouldResolveOwner(isInitiative = false) {
        const setting = game.settings.get("dice-so-nice", "forceCharacterOwnerAppearance");
        return setting === "2" || (setting === "1" && !!isInitiative);
    }

    //the player of a character: the user whose character it is, else its only player owner
    static ownerOf(actor) {
        if (!actor?.hasPlayerOwner) return null;
        let ownerUser = game.users.find(user => !user.isGM && user.character?.id == actor.id);
        if (!ownerUser) {
            const ownership = { ...actor.ownership };
            if (ownership.default != CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
                delete ownership.default;
                const playerOwners = Object.keys(ownership).filter(key => game.users.get(key) && !game.users.get(key).isGM);
                if (playerOwners.length == 1) {
                    ownerUser = game.users.get(playerOwners[0]);
                }
            }
        }
        return ownerUser || null;
    }

    //whose dice to show and which speaker to use: the player of the actor when owner dice apply, else the author
    static diceOwner(author, speaker, actorId, resolveOwner) {
        if (!resolveOwner) return { user: author, speaker };
        let actor;
        if (actorId) actor = game.actors.get(actorId);
        if (!actor && speaker) actor = ChatMessage.getSpeakerActor(speaker);
        const ownerUser = RollRules.ownerOf(actor);
        if (!ownerUser) return { user: author, speaker };
        return { user: ownerUser, speaker: actorId ? { actor: actorId } : speaker };
    }
}
