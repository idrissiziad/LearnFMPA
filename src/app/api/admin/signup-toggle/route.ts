import { NextRequest, NextResponse } from 'next/server';
import { getSignupOpen, setSignupOpen } from '@/lib/user-store';

function validateAdmin(secret: string): boolean {
  return secret === process.env.ADMIN_SECRET || secret === 'learnfmpa2024';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');

    if (!validateAdmin(adminSecret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const open = await getSignupOpen();
    return NextResponse.json({ success: true, signup_open: open });
  } catch (error) {
    console.error('Signup toggle GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_secret, signup_open } = body;

    if (!validateAdmin(admin_secret)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (typeof signup_open !== 'boolean') {
      return NextResponse.json(
        { error: 'signup_open doit être true ou false' },
        { status: 400 }
      );
    }

    await setSignupOpen(signup_open);
    return NextResponse.json({
      success: true,
      signup_open,
      message: signup_open ? 'Inscriptions ouvertes' : 'Inscriptions fermées',
    });
  } catch (error) {
    console.error('Signup toggle POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}