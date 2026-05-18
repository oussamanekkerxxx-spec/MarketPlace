import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Require a secret token so only authorised callers can bust the cache.
  // Set INTERNAL_API_SECRET in your environment variables.
  const authHeader = request.headers.get('authorization');
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('site-settings', 'default');
  return NextResponse.json({ revalidated: true, tag: 'site-settings' });
}
