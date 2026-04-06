import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { parseState } from '@/lib/game/parsing';

let leaderboardCache = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const valueKeys = searchParams.get('valueKeys')?.split(',') || null;

    const now = Date.now();
    if (!leaderboardCache || now - cacheTime > CACHE_TTL) {
      // Get all states with their latest snapshot
      const states = await prisma.state.findMany({
        include: {
          snapshots: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      leaderboardCache = states
        .filter((s) => s.snapshots.length > 0)
        .map((s) => {
          const snapshot = s.snapshots[0];
          const parsed = parseState(snapshot.markdownState);
          return {
            id: s.id,
            name: s.name,
            description: s.description,
            flagSvg: s.flagSvg,
            date: snapshot.date,
            jsonState: parsed,
            cacheUpdatedAt: new Date().toISOString(),
          };
        });
      cacheTime = now;
    }

    let result = leaderboardCache;
    if (valueKeys) {
      result = result.map((s) => ({
        ...s,
        jsonState: Object.fromEntries(
          Object.entries(s.jsonState).filter(([k]) => valueKeys.includes(k))
        ),
      }));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
