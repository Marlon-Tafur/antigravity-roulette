import { NextResponse } from 'next/server';
import * as db from '@/lib/database';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const rouletteId = searchParams.get('roulette_id');
        if (!rouletteId) {
            return NextResponse.json({ error: 'roulette_id required' }, { status: 400 });
        }
        const results = await db.getResultsByRoulette(rouletteId);
        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const result = await db.createResult(data);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
