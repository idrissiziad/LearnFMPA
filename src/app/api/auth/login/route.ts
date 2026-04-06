import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers, User } from '@/lib/user-store';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const usersData = await loadUsers();
    
    let foundUser: User | null = null;
    let foundUserId: string | null = null;
    
    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        foundUser = user;
        foundUserId = userId;
        break;
      }
    }

    if (!foundUser || !foundUserId) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (!foundUser.is_active) {
      return NextResponse.json(
        { error: 'Compte désactivé. Contactez l\'administrateur.' },
        { status: 403 }
      );
    }

    const passwordHash = hashPassword(password);
    if (foundUser.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    usersData.users[foundUserId].last_login = new Date().toISOString();
    await saveUsers(usersData);

    const token = generateToken();

    return NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        must_change_password: foundUser.must_change_password,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
