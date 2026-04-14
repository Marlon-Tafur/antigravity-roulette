import { NextResponse } from 'next/server';
import * as db from '@/lib/database';

export async function GET() {
    try {
        const roulettes = await db.getAllRoulettes();
        return NextResponse.json(roulettes);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const roulette = await db.createRoulette(data);
        return NextResponse.json(roulette, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
