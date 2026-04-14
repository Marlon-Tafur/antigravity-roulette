import { NextResponse } from 'next/server';
import * as store from '@/lib/store';

export async function GET() {
    try {
        const roulettes = store.getAllRoulettes();
        return NextResponse.json(roulettes);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const roulette = store.createRoulette(data);
        return NextResponse.json(roulette, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
