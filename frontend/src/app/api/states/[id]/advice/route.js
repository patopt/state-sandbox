import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getProviderFromRequest } from '@/lib/ai/provider';
import { generateStateAdvice } from '@/lib/game/next-state';

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req, prisma);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stateId = parseInt(params.id);
    const state = await prisma.state.findFirst({ where: { id: stateId, userId: user.id } });
    if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

    const latestSnapshot = await prisma.stateSnapshot.findFirst({
      where: { stateId },
      orderBy: { date: 'desc' },
    });
    if (!latestSnapshot) return NextResponse.json({ error: 'No snapshots found' }, { status: 404 });

    const { question, events } = await req.json();
    const provider = getProviderFromRequest(req);

    const advice = await generateStateAdvice(
      provider,
      latestSnapshot.markdownState,
      question,
      Array.isArray(events) ? events.join('\n') : events || ''
    );

    return NextResponse.json({ markdownAdvice: advice });
  } catch (err) {
    console.error('Advice error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
