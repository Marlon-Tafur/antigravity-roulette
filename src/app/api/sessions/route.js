import { NextResponse } from 'next/server';
import * as store from '@/lib/store';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rouletteId = searchParams.get('roulette_id');
        if (!rouletteId) {
            return NextResponse.json({ error: 'roulette_id required' }, { status: 400 });
        }
        let session = store.getSession(rouletteId);
        if (!session) {
            session = store.createSession(rouletteId);
        }
        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { roulette_id, ...updateData } = data;
        let session = store.getSession(roulette_id);
        if (!session) {
            session = store.createSession(roulette_id);
        }
        const updated = store.updateSession(roulette_id, updateData);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
