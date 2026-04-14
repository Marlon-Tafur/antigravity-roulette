import { NextResponse } from 'next/server';
import * as db from '@/lib/database';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rouletteId = searchParams.get('roulette_id');
        if (!rouletteId) {
            return NextResponse.json({ error: 'roulette_id required' }, { status: 400 });
        }
        const session = await db.getSession(rouletteId);
        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { roulette_id, ...updateData } = data;
        // Ensure session exists
        await db.getSession(roulette_id);
        const updated = await db.updateSession(roulette_id, updateData);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
