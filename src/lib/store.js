// In-memory data store with localStorage persistence
// Used as fallback when Supabase is not configured

const STORAGE_KEY = 'antigravity_roulette_data';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generate6DigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function loadFromStorage() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveToStorage(data) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore storage errors
    }
}

const defaultData = {
    roulettes: [],
    items: [],
    sessions: [],
    participants: [],
    results: [],
};

let memoryStore = null;

function getStore() {
    if (!memoryStore) {
        memoryStore = loadFromStorage() || { ...defaultData };
    }
    return memoryStore;
}

function persist() {
    saveToStorage(getStore());
}

// ---------- Roulettes ----------
export function getAllRoulettes() {
    return getStore().roulettes;
}

export function getRoulette(id) {
    return getStore().roulettes.find(r => r.id === id) || null;
}

export function getRouletteByCode(code) {
    return getStore().roulettes.find(r => r.code_6d === code) || null;
}

export function createRoulette(data) {
    const roulette = {
        id: generateId(),
        name: data.name || 'Nueva Ruleta',
        code_6d: generate6DigitCode(),
        colors: data.colors || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
        logo_url: data.logo_url || '',
        is_active: true,
        form_config: data.form_config || {
            fields: [
                { key: 'name', label: 'Nombre', type: 'text', required: true, order: 0 },
                { key: 'email', label: 'Email', type: 'email', required: true, order: 1 },
            ]
        },
        email_template: data.email_template || null,
        created_at: new Date().toISOString(),
    };
    getStore().roulettes.push(roulette);
    // Create session for the roulette
    createSession(roulette.id);
    persist();
    return roulette;
}

export function updateRoulette(id, data) {
    const store = getStore();
    const idx = store.roulettes.findIndex(r => r.id === id);
    if (idx === -1) return null;
    store.roulettes[idx] = { ...store.roulettes[idx], ...data };
    persist();
    return store.roulettes[idx];
}

export function deleteRoulette(id) {
    const store = getStore();
    store.roulettes = store.roulettes.filter(r => r.id !== id);
    store.items = store.items.filter(i => i.roulette_id !== id);
    store.sessions = store.sessions.filter(s => s.roulette_id !== id);
    store.participants = store.participants.filter(p => p.roulette_id !== id);
    store.results = store.results.filter(r => r.roulette_id !== id);
    persist();
    return true;
}

// ---------- Items ----------
export function getItemsByRoulette(rouletteId) {
    return getStore().items.filter(i => i.roulette_id === rouletteId);
}

export function getItem(id) {
    return getStore().items.find(i => i.id === id) || null;
}

export function createItem(data) {
    const item = {
        id: generateId(),
        roulette_id: data.roulette_id,
        label: data.label || 'Premio',
        emoji: data.emoji || '🎁',
        image_url: data.image_url || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: new Date().toISOString(),
    };
    getStore().items.push(item);
    persist();
    return item;
}

export function updateItem(id, data) {
    const store = getStore();
    const idx = store.items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    store.items[idx] = { ...store.items[idx], ...data };
    persist();
    return store.items[idx];
}

export function deleteItem(id) {
    const store = getStore();
    store.items = store.items.filter(i => i.id !== id);
    persist();
    return true;
}

// ---------- Sessions ----------
export function getSession(rouletteId) {
    return getStore().sessions.find(s => s.roulette_id === rouletteId) || null;
}

export function createSession(rouletteId) {
    const existing = getSession(rouletteId);
    if (existing) return existing;
    const session = {
        id: generateId(),
        roulette_id: rouletteId,
        status: 'libre',
        current_participant_id: null,
        created_at: new Date().toISOString(),
    };
    getStore().sessions.push(session);
    persist();
    return session;
}

export function updateSession(rouletteId, data) {
    const store = getStore();
    const idx = store.sessions.findIndex(s => s.roulette_id === rouletteId);
    if (idx === -1) return null;
    store.sessions[idx] = { ...store.sessions[idx], ...data };
    persist();
    return store.sessions[idx];
}

// ---------- Participants ----------
export function getParticipantsByRoulette(rouletteId) {
    return getStore().participants.filter(p => p.roulette_id === rouletteId);
}

export function getParticipant(id) {
    return getStore().participants.find(p => p.id === id) || null;
}

export function createParticipant(data) {
    const participant = {
        id: generateId(),
        roulette_id: data.roulette_id,
        data: data.data || {},
        created_at: new Date().toISOString(),
    };
    getStore().participants.push(participant);
    persist();
    return participant;
}

// ---------- Results ----------
export function getResultsByRoulette(rouletteId) {
    return getStore().results.filter(r => r.roulette_id === rouletteId);
}

export function createResult(data) {
    const result = {
        id: generateId(),
        roulette_id: data.roulette_id,
        participant_id: data.participant_id,
        item_won: data.item_won,
        played_at: new Date().toISOString(),
    };
    getStore().results.push(result);
    persist();
    return result;
}

// ---------- Reset ----------
export function resetStore() {
    memoryStore = { ...defaultData };
    persist();
}
