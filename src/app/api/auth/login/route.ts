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

function isTrialExpired(user: User): boolean {
  if (!user.activated_at) return false;
  const activatedDate = new Date(user.activated_at);
  const expirationDate = new Date(activatedDate.getTime() + user.activation_days * 24 * 60 * 60 * 1000);
  return new Date() > expirationDate;
}

const FREE_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

function shouldResetDailyCount(user: User): boolean {
  const resetTime = user.daily_answer_reset ? new Date(user.daily_answer_reset).getTime() : 0;
  return Date.now() - resetTime >= FREE_DAILY_WINDOW_MS;
}

function migrateUser(user: any): any {
  if (!Array.isArray(user.years)) {
    if (user.year && typeof user.year === 'string') {
      user.years = [user.year];
    } else {
      user.years = ['3ème année'];
    }
    delete user.year;
  }
  if (user.years.length === 0) user.years = ['3ème année'];
  const VALID_YEARS = ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année', '6ème année'];
  user.years = user.years.filter((y: string) => VALID_YEARS.includes(y));
  if (user.years.length === 0) user.years = ['3ème année'];
  if (user.activation_days === undefined || user.activation_days === null) user.activation_days = 7;
  if (!user.activated_at) user.activated_at = user.created_at;
  if (user.has_paid === undefined || user.has_paid === null) user.has_paid = false;
  if (user.is_trial === undefined || user.is_trial === null) { user.is_trial = false; }
  if (user.trial_started_at === undefined) { user.trial_started_at = null; }

  if (!user.subscription_status) {
    if (user.has_paid) {
      user.subscription_status = 'paid';
    } else if (user.is_active) {
      user.subscription_status = 'free';
    } else {
      user.subscription_status = 'inactive';
    }
  }
  if (user.daily_answer_count === undefined) user.daily_answer_count = 0;
  if (!user.daily_answer_reset) user.daily_answer_reset = user.activated_at || user.created_at;

  if (user.subscription_status === 'paid' && isTrialExpired(user)) {
    user.subscription_status = 'free';
    user.has_paid = false;
  }

  return user;
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

    const migrated = migrateUser(usersData.users[foundUserId!]);
    usersData.users[foundUserId!] = migrated;

    if (!migrated.is_active) {
      return NextResponse.json(
        { error: 'Votre compte n\'a pas encore été activé. Vous recevrez un email lorsqu\'il sera prêt.', code: 'ACCOUNT_NOT_ACTIVATED' },
        { status: 403 }
      );
    }

    if (migrated.subscription_status === 'paid' && isTrialExpired(migrated)) {
      usersData.users[foundUserId!].subscription_status = 'free';
      usersData.users[foundUserId!].has_paid = false;
      migrated.subscription_status = 'free';
      migrated.has_paid = false;
    }

    const passwordHash = hashPassword(password);
    if (migrated.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    usersData.users[foundUserId!].last_login = new Date().toISOString();
    if (!Array.isArray(usersData.users[foundUserId!].years)) {
      const legacyYear = (usersData.users[foundUserId!] as any).year;
      if (legacyYear && typeof legacyYear === 'string') {
        usersData.users[foundUserId!].years = [legacyYear];
        delete (usersData.users[foundUserId!] as any).year;
      } else {
        usersData.users[foundUserId!].years = ['3ème année'];
      }
    }
    if (usersData.users[foundUserId!].activation_days === undefined || usersData.users[foundUserId!].activation_days === null) usersData.users[foundUserId!].activation_days = 7;
    if (!usersData.users[foundUserId!].activated_at) usersData.users[foundUserId!].activated_at = usersData.users[foundUserId!].created_at;
    if (usersData.users[foundUserId!].has_paid === undefined || usersData.users[foundUserId!].has_paid === null) usersData.users[foundUserId!].has_paid = false;

    const effectiveStatus = usersData.users[foundUserId!].subscription_status || 'free';
    if (effectiveStatus !== 'paid' && shouldResetDailyCount(usersData.users[foundUserId!])) {
      usersData.users[foundUserId!].daily_answer_count = 0;
      usersData.users[foundUserId!].daily_answer_reset = null;
    }

    await saveUsers(usersData);

    const finalUser = usersData.users[foundUserId!];

    const token = generateToken();
    await createSession(foundUserId!, token);

    const statusValue = finalUser.subscription_status || 'free';
    let trialDaysLeft: number | null = null;
    if (statusValue === 'paid' && finalUser.activated_at) {
      const activatedDate = new Date(finalUser.activated_at);
      const expirationDate = new Date(activatedDate.getTime() + finalUser.activation_days * 24 * 60 * 60 * 1000);
      const now = new Date();
      const msLeft = expirationDate.getTime() - now.getTime();
      trialDaysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    }

    return NextResponse.json({
      success: true,
      user: {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        must_change_password: finalUser.must_change_password,
        years: finalUser.years || ['3ème année'],
        subscription_status: statusValue,
        daily_answer_count: finalUser.daily_answer_count || 0,
        daily_answer_reset: finalUser.daily_answer_reset || null,
        trial_days_left: trialDaysLeft,
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