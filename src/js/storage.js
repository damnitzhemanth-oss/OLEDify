const KEY = 'oledify-state-v1';

export function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function save(state) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch {

    }
}

export function clear() {
    localStorage.removeItem(KEY);
}