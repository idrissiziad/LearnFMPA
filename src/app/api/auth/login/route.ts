import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers, User } from '@/lib/user-store';
import { createSession } from '@/lib/session-store';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function isAccountExpired(user: User): boolean {
  if (!user.activated_at) return false;
  const activatedDate = new Date(user.activated_at);
  const expirationDate = new Date(activatedDate.getTime() + user.activation_days * 24 * 60 * 60 * 1000);
  return new Date() > expirationDate;
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

    if (isAccountExpired(foundUser)) {
      return NextResponse.json(
        { error: 'Compte expiré. Contactez l\'administrateur pour renouveler votre accès.' },
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
    if (!Array.isArray(usersData.users[foundUserId].years)) {
      const legacyYear = (usersData.users[foundUserId] as any).year;
      if (legacyYear && typeof legacyYear === 'string') {
        usersData.users[foundUserId].years = [legacyYear];
        delete (usersData.users[foundUserId] as any).year;
      } else {
        usersData.users[foundUserId].years = ['3ème année'];
      }
    }
    if (usersData.users[foundUserId].activation_days === undefined || usersData.users[foundUserId].activation_days === null) usersData.users[foundUserId].activation_days = 150;
    if (!usersData.users[foundUserId].activated_at) usersData.users[foundUserId].activated_at = usersData.users[foundUserId].created_at;
    if (usersData.users[foundUserId].has_paid === undefined || usersData.users[foundUserId].has_paid === null) usersData.users[foundUserId].has_paid = false;
    await saveUsers(usersData);

    const token = generateToken();
    await createSession(foundUserId, token);

    return NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        must_change_password: foundUser.must_change_password,
        years: foundUser.years || ['3ème année'],
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
