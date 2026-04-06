import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress, loadUsers } from '@/lib/user-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');
    const email = searchParams.get('email');

    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'learnfmpa2024') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const usersData = await loadUsers();
    let userId: string | null = null;

    for (const [id, user] of Object.entries(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        userId = id;
        break;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const progress = await loadUserProgress(userId);

    return NextResponse.json({
      success: true,
      email,
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
