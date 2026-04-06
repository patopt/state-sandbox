import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getProviderFromRequest } from '@/lib/ai/provider';
import { generateNextState } from '@/lib/game/next-state';
import { generateReasonablePolicy } from '@/lib/game/state-generator';
import { generateFutureEvents, generateFuturePolicySuggestion, generateDiffReport } from '@/lib/game/events';
import { parseState, addMonths } from '@/lib/game/parsing';

const CREDITS_NEXT_YEAR_COST = parseInt(process.env.CREDITS_NEXT_YEAR_COST || '1');

function sendEvent(controller, type, data) {
  const line = JSON.stringify({ type, ...data }) + '\n';
  controller.enqueue(new TextEncoder().encode(line));
}

function fixSnapshotJson(snapshot) {
  const parsed = parseState(snapshot.markdownState);
  parsed.date = snapshot.date;
  parsed.id = snapshot.id;
  parsed.events = snapshot.markdownFutureEvents
    ? snapshot.markdownFutureEvents.split('\n')
    : [];
  parsed.events_policy = snapshot.markdownFutureEventsPolicy
    ? snapshot.markdownFutureEventsPolicy.split('\n')
    : [];
  parsed.delta_report = snapshot.markdownDeltaReport || '';
  return { ...snapshot, jsonState: parsed };
}

export async function GET(req, { params }) {
  try {
    const stateId = parseInt(params.id);
    const snapshots = await prisma.stateSnapshot.findMany({
      where: { stateId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(snapshots.map(fixSnapshotJson));
  } catch (err) {
    console.error('Get snapshots error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const user = await getUserFromRequest(req, prisma);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stateId = parseInt(params.id);
  const body = await req.json();
  const { policy } = body;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (user.credits < CREDITS_NEXT_YEAR_COST) {
          sendEvent(controller, 'error', {
            message: `Not enough credits (${user.credits} vs ${CREDITS_NEXT_YEAR_COST}) to advance the year.`,
          });
          controller.close();
          return;
        }

        const state = await prisma.state.findFirst({
          where: { id: stateId, userId: user.id },
        });
        if (!state) {
          sendEvent(controller, 'error', { message: 'State not found' });
          controller.close();
          return;
        }

        if (state.turnInProgress) {
          sendEvent(controller, 'error', { message: 'Turn already in progress. Try again later.' });
          controller.close();
          return;
        }

        await prisma.state.update({
          where: { id: stateId },
          data: { turnInProgress: true },
        });

        const previousSnapshots = await prisma.stateSnapshot.findMany({
          where: { stateId },
          orderBy: { date: 'asc' },
          take: 10,
        });

        if (!previousSnapshots.length) {
          sendEvent(controller, 'error', { message: 'No previous snapshots found' });
          controller.close();
          return;
        }

        const latestSnapshot = previousSnapshots[previousSnapshots.length - 1];
        const currentDate = latestSnapshot.date;
        const nextDate = addMonths(currentDate, 12);

        const historicalEvents = previousSnapshots
          .filter((s) => s.markdownFutureEvents)
          .map((s) => [s.date, s.markdownFutureEvents.split('\n')]);

        try {
          sendEvent(controller, 'status', { message: 'Drafting your policies...' });
          const provider = getProviderFromRequest(req);
          const reasonablePolicy = await generateReasonablePolicy(provider, policy);

          sendEvent(controller, 'status', { message: 'Simulating next year...' });
          const { diff, newState, simulatedEvents } = await generateNextState(
            provider,
            currentDate,
            nextDate,
            latestSnapshot.markdownState,
            latestSnapshot.markdownFutureEvents || '',
            reasonablePolicy,
            historicalEvents
          );

          sendEvent(controller, 'status', { message: 'Generating report and events...' });
          const [nextStateReport, nextEvents] = await Promise.all([
            generateDiffReport(provider, currentDate, nextDate, latestSnapshot.markdownState, diff),
            generateFutureEvents(provider, nextDate, addMonths(nextDate, 12), newState, historicalEvents),
          ]);

          sendEvent(controller, 'status', { message: 'Generating policy suggestions...' });
          const nextEventsPolicy = await generateFuturePolicySuggestion(
            provider, nextDate, addMonths(nextDate, 12), newState, nextEvents
          );

          // Update latest snapshot with simulated events
          await prisma.stateSnapshot.update({
            where: { id: latestSnapshot.id },
            data: { markdownFutureEvents: simulatedEvents },
          });

          // Create new snapshot
          const newSnapshot = await prisma.stateSnapshot.create({
            data: {
              stateId,
              date: nextDate,
              markdownState: newState,
              markdownDelta: diff,
              markdownDeltaReport: nextStateReport,
              markdownFutureEvents: nextEvents,
              markdownFutureEventsPolicy: nextEventsPolicy,
            },
          });

          // Deduct credits and unlock turn
          await prisma.user.update({
            where: { id: user.id },
            data: { credits: { decrement: CREDITS_NEXT_YEAR_COST } },
          });
          await prisma.state.update({
            where: { id: stateId },
            data: { turnInProgress: false },
          });

          sendEvent(controller, 'snapshot_complete', {
            snapshot: fixSnapshotJson(newSnapshot),
          });
        } catch (err) {
          console.error('Simulate error:', err);
          await prisma.state.update({
            where: { id: stateId },
            data: { turnInProgress: false },
          });
          sendEvent(controller, 'error', { message: 'Failed to simulate. Please try again.' });
        }
      } catch (err) {
        console.error('Snapshot POST error:', err);
        sendEvent(controller, 'error', { message: 'Internal server error' });
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
