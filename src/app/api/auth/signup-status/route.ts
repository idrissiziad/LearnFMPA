import { NextResponse } from 'next/server';
import { getSignupOpen } from '@/lib/user-store';

export async function GET() {
  try {
    const open = await getSignupOpen();
    return NextResponse.json({ success: true, signup_open: open });
  } catch (error) {
    console.error('Signup status error:', error);
    return NextResponse.json({ success: true, signup_open: false });
  }
}