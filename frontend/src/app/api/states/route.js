import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getProviderFromRequest } from '@/lib/ai/provider';
import { generateState, generateStateFlag, generateStateDescription, generateReasonablePolicy } from '@/lib/game/state-generator';
import { generateFutureEvents, generateFuturePolicySuggestion } from '@/lib/game/events';
import { parseState, addMonths } from '@/lib/game/parsing';

const START_DATE = '2022-01';
const CREDITS_NEW_STATE_COST = parseInt(process.env.CREDITS_NEW_STATE_COST || '1');

function sendEvent(controller, type, data) {
  const line = JSON.stringify({ type, ...data }) + '\n';
  controller.enqueue(new TextEncoder().encode(line));
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req, prisma);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const states = await prisma.state.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(states);
  } catch (err) {
    console.error('Get states error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUserFromRequest(req, prisma);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, questions, aiProvider, aiApiKey } = body;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (user.credits < CREDITS_NEW_STATE_COST) {
          sendEvent(controller, 'error', {
            message: `Not enough credits (${user.credits} vs ${CREDITS_NEW_STATE_COST}) to create a new state.`,
          });
          controller.close();
          return;
        }

        // Create placeholder state
        const state = await prisma.state.create({
          data: {
            userId: user.id,
            date: START_DATE,
            aiProvider: aiProvider || 'openai',
          },
        });

        sendEvent(controller, 'state_created', { id: state.id });
        sendEvent(controller, 'status', { message: 'Generating initial state...' });

        const provider = getProviderFromRequest(req);
        const endDate = addMonths(START_DATE, 12);

        const { overview, state: mdState } = await generateState(provider, START_DATE, name, questions);

        sendEvent(controller, 'status', { message: 'Designing flag, events, and description...' });

        const [svgFlag, randomEventsMd, stateDescription] = await Promise.all([
          generateStateFlag(provider, overview),
          generateFutureEvents(provider, START_DATE, endDate, mdState, []),
          generateStateDescription(provider, overview),
        ]);

        sendEvent(controller, 'status', { message: 'Generating policy suggestions...' });
        const policySuggestion = await generateFuturePolicySuggestion(
          provider, START_DATE, endDate, mdState, randomEventsMd
        );

        // Parse state to get country name
        const parsedState = parseState(mdState);
        const fullName = parsedState?.government?.government_metadata?.metrics?.country_official_name
          || parsedState?.government?.government_metadata?.value
          || name;

        // Create snapshot
        const snapshot = await prisma.stateSnapshot.create({
          data: {
            stateId: state.id,
            date: START_DATE,
            markdownState: mdState,
            markdownFutureEvents: randomEventsMd,
            markdownFutureEventsPolicy: policySuggestion,
          },
        });

        // Update state
        await prisma.state.update({
          where: { id: state.id },
          data: {
            name: fullName,
            flagSvg: svgFlag,
            description: stateDescription,
          },
        });

        // Deduct credits
        await prisma.user.update({
          where: { id: user.id },
          data: { credits: { decrement: CREDITS_NEW_STATE_COST } },
        });

        const updatedState = await prisma.state.findUnique({ where: { id: state.id } });

        sendEvent(controller, 'complete', {
          state: updatedState,
          snapshot: {
            id: snapshot.id,
            date: snapshot.date,
            markdownFutureEvents: randomEventsMd,
            markdownFutureEventsPolicy: policySuggestion,
          },
        });
      } catch (err) {
        console.error('Create state error:', err);
        sendEvent(controller, 'error', { message: 'Failed to create state. Please try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
