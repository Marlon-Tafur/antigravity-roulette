import { NextResponse } from 'next/server';
import * as store from '@/lib/store';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const roulette = store.getRoulette(id) || store.getRouletteByCode(id);
        if (!roulette) {
            return NextResponse.json({ error: 'Roulette not found' }, { status: 404 });
        }
        return NextResponse.json(roulette);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();
        const roulette = store.updateRoulette(id, data);
        if (!roulette) {
            return NextResponse.json({ error: 'Roulette not found' }, { status: 404 });
        }
        return NextResponse.json(roulette);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        store.deleteRoulette(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
