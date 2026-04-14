import { NextResponse } from 'next/server';
import * as store from '@/lib/store';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rouletteId = searchParams.get('roulette_id');
        if (!rouletteId) {
            return NextResponse.json({ error: 'roulette_id required' }, { status: 400 });
        }
        const participants = store.getParticipantsByRoulette(rouletteId);
        return NextResponse.json(participants);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const participant = store.createParticipant(data);
        return NextResponse.json(participant, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
