import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers } from '@/lib/user-store';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(): string {
  return `user_${crypto.randomBytes(4).toString('hex')}`;
}

function generateTempPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 10; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

const VALID_YEARS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, year } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom et email requis.' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    if (!emailLower.endsWith('@edu.uiz.ac.ma')) {
      return NextResponse.json(
        { error: 'Seules les adresses email @edu.uiz.ac.ma sont autorisées pour l\'inscription.' },
        { status: 400 }
      );
    }

    const resolvedYears: string[] = [];
    if (year && VALID_YEARS.includes(year)) {
      resolvedYears.push(year);
    } else {
      resolvedYears.push('3ème année');
    }

    const usersData = await loadUsers();

    for (const user of Object.values(usersData.users)) {
      if (user.email.toLowerCase() === emailLower) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà.' },
          { status: 400 }
        );
      }
    }

    const userId = generateId();
    const now = new Date().toISOString();
    const tempPassword = generateTempPassword();

    usersData.users[userId] = {
      id: userId,
      name,
      email: emailLower,
      password_hash: hashPassword(tempPassword),
      must_change_password: true,
      created_at: now,
      last_login: null,
      is_active: false,
      years: resolvedYears,
      activation_days: 7,
      activated_at: null,
      has_paid: false,
      subscription_status: 'inactive',
      daily_answer_count: 0,
      daily_answer_reset: now,
    };

    await saveUsers(usersData);

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Vous recevrez un email avec vos identifiants lorsque votre compte sera activé.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}