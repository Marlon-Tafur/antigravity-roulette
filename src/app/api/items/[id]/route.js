import { NextResponse } from 'next/server';
import * as store from '@/lib/store';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();
        const item = store.updateItem(id, data);
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        store.deleteItem(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
