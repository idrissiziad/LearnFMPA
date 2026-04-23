import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers, getSignupOpen } from '@/lib/user-store';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(): string {
  return `user_${crypto.randomBytes(4).toString('hex')}`;
}

const VALID_YEARS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
];

const TRIAL_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const signupOpen = await getSignupOpen();
    if (!signupOpen) {
      return NextResponse.json(
        { error: 'Les inscriptions sont actuellement fermées.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, year } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe requis.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
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
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà.' },
          { status: 400 }
        );
      }
    }

    const userId = generateId();
    const now = new Date().toISOString();

    usersData.users[userId] = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      must_change_password: false,
      created_at: now,
      last_login: null,
      is_active: true,
      years: resolvedYears,
      activation_days: TRIAL_DAYS,
      activated_at: now,
      has_paid: false,
      is_trial: true,
      trial_started_at: now,
    };

    await saveUsers(usersData);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
        years: resolvedYears,
        activation_days: TRIAL_DAYS,
        is_trial: true,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}