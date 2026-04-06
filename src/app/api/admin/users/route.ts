import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers } from '@/lib/user-store';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(): string {
  return `user_${crypto.randomBytes(4).toString('hex')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, admin_secret } = body;

    if (admin_secret !== process.env.ADMIN_SECRET && admin_secret !== 'learnfmpa2024') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe requis' },
        { status: 400 }
      );
    }

    const usersData = await loadUsers();
    
    for (const user of Object.values(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà' },
          { status: 400 }
        );
      }
    }

    const userId = generateId();
    
    usersData.users[userId] = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      must_change_password: true,
      created_at: new Date().toISOString(),
      last_login: null,
      is_active: true
    };

    await saveUsers(usersData);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email: email.toLowerCase()
      },
      temp_password: password
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');

    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'learnfmpa2024') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const usersData = await loadUsers();
    const users = Object.values(usersData.users).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      must_change_password: user.must_change_password,
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active
    }));

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
