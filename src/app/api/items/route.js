import { NextResponse } from 'next/server';
import * as db from '@/lib/database';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rouletteId = searchParams.get('roulette_id');
        if (!rouletteId) {
            return NextResponse.json({ error: 'roulette_id required' }, { status: 400 });
        }
        const items = await db.getItemsByRoulette(rouletteId);
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const item = await db.createItem(data);
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
