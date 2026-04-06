import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { signToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (magicLink.usedAt) {
      return NextResponse.json({ error: 'Token already used' }, { status: 401 });
    }

    if (new Date() > magicLink.expiresAt) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Mark token as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    const jwt = await signToken({ userId: magicLink.userId });

    return NextResponse.json({
      token: jwt,
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
        credits: magicLink.user.credits,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
