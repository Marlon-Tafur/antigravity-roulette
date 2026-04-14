// Realtime event system
// Uses BroadcastChannel API for local mode, Supabase Realtime when configured

const channels = new Map();
const listeners = new Map();

function getLocalChannel(channelName) {
    if (typeof window === 'undefined') return null;
    if (!channels.has(channelName)) {
        const bc = new BroadcastChannel(channelName);
        channels.set(channelName, bc);
    }
    return channels.get(channelName);
}

export function subscribe(rouletteId, eventType, callback) {
    const channelName = `roulette_${rouletteId}`;
    const key = `${channelName}:${eventType}`;

    const channel = getLocalChannel(channelName);
    if (!channel) return () => { };

    const handler = (event) => {
        if (event.data && event.data.type === eventType) {
            callback(event.data.payload);
        }
    };

    channel.addEventListener('message', handler);

    // Store listener for cleanup  
    if (!listeners.has(key)) {
        listeners.set(key, []);
    }
    listeners.get(key).push({ handler, callback });

    return () => {
        channel.removeEventListener('message', handler);
        const arr = listeners.get(key);
        if (arr) {
            const idx = arr.findIndex(l => l.callback === callback);
            if (idx !== -1) arr.splice(idx, 1);
        }
    };
}

export function broadcast(rouletteId, eventType, payload) {
    const channelName = `roulette_${rouletteId}`;
    const channel = getLocalChannel(channelName);
    if (channel) {
        channel.postMessage({ type: eventType, payload });
    }
}

// Also fire locally on the same tab
export function emit(rouletteId, eventType, payload) {
    broadcast(rouletteId, eventType, payload);

    // Also notify same-tab listeners via custom event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(`roulette_${rouletteId}`, {
            detail: { type: eventType, payload }
        }));
    }
}

export function subscribeAll(rouletteId, callback) {
    const channelName = `roulette_${rouletteId}`;
    const channel = getLocalChannel(channelName);
    if (!channel) return () => { };

    const handler = (event) => {
        if (event.data) {
            callback(event.data.type, event.data.payload);
        }
    };

    channel.addEventListener('message', handler);

    // Also listen for same-tab events
    const localHandler = (event) => {
        callback(event.detail.type, event.detail.payload);
    };
    window.addEventListener(`roulette_${rouletteId}`, localHandler);

    return () => {
        channel.removeEventListener('message', handler);
        window.removeEventListener(`roulette_${rouletteId}`, localHandler);
    };
}

export function cleanup(rouletteId) {
    const channelName = `roulette_${rouletteId}`;
    const channel = channels.get(channelName);
    if (channel) {
        channel.close();
        channels.delete(channelName);
    }
}

// Event types
export const EVENTS = {
    SESSION_ACTIVE: 'sesion_activa',
    ROULETTE_STATE: 'estado_ruleta',
    NEW_PARTICIPANT: 'nuevo_participante',
    SPIN_RESULT: 'resultado_spin',
};
