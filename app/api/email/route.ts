import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotificationEmail } from '@/lib/email/notifications';

export async function POST(request: NextRequest) {
  // Require a secret token so only server actions can trigger notification emails.
  const authHeader = request.headers.get('authorization');
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await sendOrderNotificationEmail(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.details ? 500 : 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
