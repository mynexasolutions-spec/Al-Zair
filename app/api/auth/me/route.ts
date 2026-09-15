import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    let sessionValue = '';
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('alzair_customer_session');
      if (sessionCookie?.value) {
        sessionValue = sessionCookie.value;
      }
    } catch {}

    if (!sessionValue) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/alzair_customer_session=([^;]+)/);
      if (match && match[1]) {
        sessionValue = decodeURIComponent(match[1]);
      }
    }

    if (!sessionValue) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = JSON.parse(sessionValue);
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
