import { NextResponse } from 'next/server';
import { getAllModels } from '@/lib/ai/provider';

export async function GET() {
  return NextResponse.json(getAllModels());
}
