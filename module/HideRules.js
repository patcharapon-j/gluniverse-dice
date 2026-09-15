/**
 * One style tag shared by the features that hide chat content by selector instead of by class,
 * for elements that get rendered or replaced without a hook handing them over (nested roll results, companion messages).
 */
export class HideRules {

    static _rules = new Map();

    static add(key, selector) {
        this._rules.set(key, selector);
        this._refresh();
    }

    static remove(key) {
        if (!this._rules.delete(key)) return;
        this._refresh();
    }

    static _refresh() {
        let style = document.getElementById("dsn-hide-rules");
        if (!style) {
            style = document.createElement("style");
            style.id = "dsn-hide-rules";
            document.head.appendChild(style);
        }
        style.textContent = [...this._rules.values()].map(selector => `${selector} { display: none !important; }`).join("\n");
    }
}
