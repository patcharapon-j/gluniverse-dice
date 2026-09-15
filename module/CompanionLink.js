import { HideRules } from './HideRules.js';

/**
 * Tracks companion messages linked to a primary roll message so they can be
 * hidden during animation and revealed together when the roll completes.
 */
export class CompanionLink {

    static _primaryToCompanions = new Map();
    static _companionToPrimary = new Map();

    static _hideCompanion(companionId) {
        HideRules.add(`companion:${companionId}`, `.chat-message[data-message-id="${CSS.escape(companionId)}"]`);
    }

    static _revealCompanionElement(companionId) {
        HideRules.remove(`companion:${companionId}`);

        //the notification pip aged while hidden, post a fresh one
        const notifEl = document.querySelector(`#chat-notifications .message[data-message-id="${companionId}"]`);
        if (notifEl) notifEl.remove();

        if (!ui.sidebar.expanded) {
            const msg = game.messages.get(companionId);
            if (msg) {
                ui.chat.notify(msg, {
                    newMessage: true,
                    existing: ui.chat.element.querySelector(`[data-message-id="${companionId}"]`)
                });
            }
        }
    }

    static register(companionId, primaryId) {
        if (!this._primaryToCompanions.has(primaryId))
            this._primaryToCompanions.set(primaryId, new Set());
        this._primaryToCompanions.get(primaryId).add(companionId);
        this._companionToPrimary.set(companionId, primaryId);
        this._hideCompanion(companionId);
        return true;
    }

    static release(primaryId) {
        const companions = this._primaryToCompanions.get(primaryId);
        if (!companions) return [];

        const released = [...companions];
        for (const companionId of released) {
            this._revealCompanionElement(companionId);
            this._companionToPrimary.delete(companionId);
        }
        this._primaryToCompanions.delete(primaryId);
        return released;
    }

    static cleanup(messageId) {
        if (this._primaryToCompanions.has(messageId)) {
            this.release(messageId);
            return;
        }
        const primaryId = this._companionToPrimary.get(messageId);
        if (!primaryId) return;
        HideRules.remove(`companion:${messageId}`);
        this._companionToPrimary.delete(messageId);
        const set = this._primaryToCompanions.get(primaryId);
        if (set) {
            set.delete(messageId);
            if (!set.size) this._primaryToCompanions.delete(primaryId);
        }
    }
}
