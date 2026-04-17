// Unified database layer
// Uses Supabase when configured, falls back to local store
import { supabase, isSupabaseConfigured } from './supabase';
import * as localStore from './store';

const useSupabase = isSupabaseConfigured();

// ========== Roulettes ==========
export async function getAllRoulettes() {
    if (useSupabase) {
        const { data, error } = await supabase.from('roulettes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
    return localStore.getAllRoulettes();
}

export async function getRoulette(id) {
    if (useSupabase) {
        // If it looks like a 6-digit code, search by code first
        if (/^\d{6}$/.test(id)) {
            const { data, error } = await supabase.from('roulettes').select('*').eq('code_6d', id).single();
            if (data) return data;
            if (error && error.code !== 'PGRST116') throw error;
        }
        // Try by UUID id
        const { data, error } = await supabase.from('roulettes').select('*').eq('id', id).single();
        if (error && error.code === 'PGRST116') return null;
        if (error) throw error;
        return data;
    }
    return localStore.getRoulette(id) || localStore.getRouletteByCode(id);
}

function generate6DigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createRoulette(input) {
    if (useSupabase) {
        const rouletteData = {
            name: input.name || 'Nueva Ruleta',
            code_6d: generate6DigitCode(),
            colors: input.colors || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
            logo_url: input.logo_url || '',
            is_active: true,
            is_physical: input.is_physical || false,
            form_config: input.form_config || {
                fields: [
                    { key: 'name', label: 'Nombre', type: 'text', required: true, order: 0 },
                    { key: 'email', label: 'Email', type: 'email', required: true, order: 1 },
                ]
            },
        };
        const { data, error } = await supabase.from('roulettes').insert(rouletteData).select().single();
        if (error) throw error;
        // Also create session
        await supabase.from('sessions').insert({ roulette_id: data.id, status: 'libre' });
        return data;
    }
    return localStore.createRoulette(input);
}

export async function updateRoulette(id, updates) {
    if (useSupabase) {
        const { data, error } = await supabase.from('roulettes').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
    return localStore.updateRoulette(id, updates);
}

export async function deleteRoulette(id) {
    if (useSupabase) {
        const { error } = await supabase.from('roulettes').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
    return localStore.deleteRoulette(id);
}

// ========== Items ==========
export async function getItemsByRoulette(rouletteId) {
    if (useSupabase) {
        const { data, error } = await supabase.from('items').select('*').eq('roulette_id', rouletteId).order('created_at');
        if (error) throw error;
        return data;
    }
    return localStore.getItemsByRoulette(rouletteId);
}

export async function createItem(input) {
    if (useSupabase) {
        const { data, error } = await supabase.from('items').insert({
            roulette_id: input.roulette_id,
            label: input.label || 'Premio',
            emoji: input.emoji ?? '',
            image_url: input.image_url || '',
            is_active: input.is_active !== undefined ? input.is_active : true,
        }).select().single();
        if (error) throw error;
        return data;
    }
    return localStore.createItem(input);
}

export async function updateItem(id, updates) {
    if (useSupabase) {
        const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
    return localStore.updateItem(id, updates);
}

export async function deleteItem(id) {
    if (useSupabase) {
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
    return localStore.deleteItem(id);
}

// ========== Sessions ==========
export async function getSession(rouletteId) {
    if (useSupabase) {
        let { data, error } = await supabase.from('sessions').select('*').eq('roulette_id', rouletteId).single();
        if (error && error.code === 'PGRST116') {
            // No session found, create one
            const res = await supabase.from('sessions').insert({ roulette_id: rouletteId, status: 'libre' }).select().single();
            data = res.data;
            error = res.error;
        }
        if (error) throw error;
        return data;
    }
    let session = localStore.getSession(rouletteId);
    if (!session) session = localStore.createSession(rouletteId);
    return session;
}

export async function updateSession(rouletteId, updates) {
    if (useSupabase) {
        const { data, error } = await supabase.from('sessions').update(updates).eq('roulette_id', rouletteId).select().single();
        if (error) throw error;
        return data;
    }
    return localStore.updateSession(rouletteId, updates);
}

// ========== Participants ==========
export async function getParticipantsByRoulette(rouletteId) {
    if (useSupabase) {
        const { data, error } = await supabase.from('participants').select('*').eq('roulette_id', rouletteId).order('created_at');
        if (error) throw error;
        return data;
    }
    return localStore.getParticipantsByRoulette(rouletteId);
}

export async function getParticipant(id) {
    if (useSupabase) {
        const { data, error } = await supabase.from('participants').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    }
    return localStore.getParticipant(id);
}

export async function createParticipant(input) {
    if (useSupabase) {
        const { data, error } = await supabase.from('participants').insert({
            roulette_id: input.roulette_id,
            data: input.data || {},
        }).select().single();
        if (error) throw error;
        return data;
    }
    return localStore.createParticipant(input);
}

// ========== Results ==========
export async function getResultsByRoulette(rouletteId) {
    if (useSupabase) {
        const { data, error } = await supabase.from('results').select('*').eq('roulette_id', rouletteId).order('played_at', { ascending: false });
        if (error) throw error;
        return data;
    }
    return localStore.getResultsByRoulette(rouletteId);
}

export async function createResult(input) {
    if (useSupabase) {
        const { data, error } = await supabase.from('results').insert({
            roulette_id: input.roulette_id,
            participant_id: input.participant_id,
            item_won: input.item_won,
        }).select().single();
        if (error) throw error;
        return data;
    }
    return localStore.createResult(input);
}
