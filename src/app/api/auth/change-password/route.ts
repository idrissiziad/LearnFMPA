import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers } from '@/lib/user-store';
import { requireAuth } from '@/lib/auth';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { email, current_password, new_password } = body;

    if (!email || !current_password || !new_password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const usersData = await loadUsers();
    
    let foundUserId: string | null = null;
    
    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        foundUserId = userId;
        break;
      }
    }

    if (!foundUserId) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const user = usersData.users[foundUserId];

    const currentHash = hashPassword(current_password);
    if (user.password_hash !== currentHash) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 401 }
      );
    }

    usersData.users[foundUserId].password_hash = hashPassword(new_password);
    usersData.users[foundUserId].must_change_password = false;
    
    await saveUsers(usersData);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
