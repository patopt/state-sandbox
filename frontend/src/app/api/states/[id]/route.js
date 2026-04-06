import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { parseState } from '@/lib/game/parsing';

export async function GET(req, { params }) {
  try {
    const stateId = parseInt(params.id);
    const state = await prisma.state.findUnique({ where: { id: stateId } });
    if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });
    return NextResponse.json(state);
  } catch (err) {
    console.error('Get state error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
