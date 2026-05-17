import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieList = await cookies();
    const sessionCookie = cookieList.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false });
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const [userId, email, role] = decoded.split(':');

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email,
        role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}