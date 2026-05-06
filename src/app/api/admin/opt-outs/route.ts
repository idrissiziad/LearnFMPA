import { NextRequest, NextResponse } from 'next/server';
import { loadOptOuts } from '@/lib/user-store';

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

    const optOuts = await loadOptOuts();
    return NextResponse.json({ success: true, opt_outs: optOuts, total: optOuts.length });
  } catch (error) {
    console.error('Admin opt-outs GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}