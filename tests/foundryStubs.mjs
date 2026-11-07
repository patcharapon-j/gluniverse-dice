// Minimal Foundry globals for tests that import module/glu files: LegacyIdentity.js installs on
// import and registers init/ready hooks. Import this first.
const hooks = {};
globalThis.Hooks ??= {
    _hooks: hooks,
    on: (name, fn) => (hooks[name] ??= []).push(fn),
    once: (name, fn) => (hooks[name] ??= []).push(fn),
    off: (name, fn) => { hooks[name] = (hooks[name] ?? []).filter(f => f !== fn); },
    callAll: (name, ...args) => { for (const fn of hooks[name] ?? []) fn(...args); return true; },
    call: (name, ...args) => { for (const fn of hooks[name] ?? []) if (fn(...args) === false) return false; return true; }
};
