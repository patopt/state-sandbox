import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { signToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

const CREDITS_DEFAULT = parseInt(process.env.CREDITS_DEFAULT || '10');

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get or create user
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail, credits: CREDITS_DEFAULT },
      });
    }

    // Create magic link token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.magicLink.create({
      data: { token, userId: user.id, expiresAt },
    });

    // Send email (if POSTMARK_API_KEY configured)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/auth/verify?token=${token}`;

    if (process.env.POSTMARK_API_KEY) {
      await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY,
        },
        body: JSON.stringify({
          From: process.env.EMAIL_FROM || 'no-reply@example.com',
          To: normalizedEmail,
          Subject: 'Your login link for State Sandbox',
          TextBody: `Click here to login: ${loginUrl}\n\nThis link expires in 24 hours.`,
          HtmlBody: `<p>Click <a href="${loginUrl}">here</a> to login to State Sandbox.</p><p>This link expires in 24 hours.</p>`,
        }),
      });
    } else {
      // In development, return the token directly
      console.log(`[DEV] Magic link: ${loginUrl}`);
    }

    return NextResponse.json({
      message: 'Magic link sent. Check your email.',
      // In dev mode, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { devToken: token }),
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
