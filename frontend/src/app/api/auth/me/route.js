import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req, prisma);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      credits: user.credits,
    });
  } catch (err) {
    console.error('Me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
