import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers } from '@/lib/user-store';
import { requireAuth } from '@/lib/auth';
import { destroySession } from '@/lib/session-store';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    if (authResult.userId !== user_id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const usersData = await loadUsers();
    const user = usersData.users[user_id];

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    delete usersData.users[user_id];
    await saveUsers(usersData);
    await destroySession(user_id);

    return NextResponse.json({ success: true, message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}