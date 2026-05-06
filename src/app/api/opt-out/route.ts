import { NextRequest, NextResponse } from 'next/server';
import { addOptOut, removeOptOut, isOptedOut } from '@/lib/user-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Adresse e-mail requise' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 });
    }

    if (action === 'opt-in') {
      await removeOptOut(normalizedEmail);
      return NextResponse.json({ success: true, message: 'Vous avez été réinscrit(e) aux e-mails.' });
    }

    await addOptOut(normalizedEmail);
    return NextResponse.json({ success: true, message: 'Vous avez été désinscrit(e) des e-mails.' });
  } catch (error) {
    console.error('Opt-out POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Adresse e-mail requise' }, { status: 400 });
    }

    const optedOut = await isOptedOut(email);
    return NextResponse.json({ email: email.toLowerCase().trim(), opted_out: optedOut });
  } catch (error) {
    console.error('Opt-out GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}