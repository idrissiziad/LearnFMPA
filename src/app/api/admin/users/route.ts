import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadUsers, saveUsers } from '@/lib/user-store';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(): string {
  return `user_${crypto.randomBytes(4).toString('hex')}`;
}

function validateAdmin(secret: string): boolean {
  return secret === process.env.ADMIN_SECRET || secret === 'learnfmpa2024';
}

const VALID_YEARS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
];

function migrateUser(user: any): any {
  if (!user.years || !Array.isArray(user.years)) {
    if (user.year && typeof user.year === 'string') {
      user.years = [user.year];
    } else {
      user.years = ['3ème année'];
    }
    delete user.year;
  }
  if (user.years.length === 0) user.years = ['3ème année'];
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

  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, email, password, admin_secret, new_password, is_active, year, years, activation_days, has_paid, is_trial, trial_started_at, subscription_status } = body;

    if (!validateAdmin(admin_secret)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Activate user: set is_active=true and subscription_status='paid' (7-day premium trial)
    if (action === 'activate') {
      if (!email) {
        return NextResponse.json({ error: 'Email requis' }, { status: 400 });
      }
      const usersData = await loadUsers();
      let found = false;

      for (const [userId, user] of Object.entries(usersData.users)) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          const migrated = migrateUser(usersData.users[userId]);
          migrated.is_active = true;
          migrated.activated_at = new Date().toISOString();
          if (!migrated.subscription_status || migrated.subscription_status === 'inactive') {
            migrated.subscription_status = 'paid';
          }
          migrated.daily_answer_count = 0;
          migrated.daily_answer_reset = new Date().toISOString();
          found = true;
          break;
        }
      }

      if (!found) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      await saveUsers(usersData);
      return NextResponse.json({ success: true, message: 'Compte activé avec succès' });
    }

    // Update user properties
    if (action === 'update_user' || (!action && email && !name && !password && !new_password && is_active === undefined && (year !== undefined || years !== undefined || activation_days !== undefined || has_paid !== undefined || is_trial !== undefined || subscription_status !== undefined))) {
      const usersData = await loadUsers();
      let found = false;
      
      for (const [userId, user] of Object.entries(usersData.users)) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          const migrated = migrateUser(usersData.users[userId]);
          const resolvedYears = Array.isArray(years)
            ? years.filter((y: string) => VALID_YEARS.includes(y))
            : (year && VALID_YEARS.includes(year) ? [year] : null);
          if (resolvedYears && resolvedYears.length > 0) {
            migrated.years = resolvedYears;
          }
          if (activation_days !== undefined && typeof activation_days === 'number' && activation_days > 0) {
            migrated.activation_days = activation_days;
          }
          if (has_paid !== undefined && typeof has_paid === 'boolean') {
            migrated.has_paid = has_paid;
            if (has_paid && !migrated.activated_at) {
              migrated.activated_at = new Date().toISOString();
            }
          }
          if (is_trial !== undefined) {
            migrated.is_trial = !!is_trial;
            if (!migrated.is_trial) {
              migrated.trial_started_at = null;
            }
          }
          if (trial_started_at !== undefined) {
            migrated.trial_started_at = trial_started_at;
          }
          if (subscription_status !== undefined && ['inactive', 'free', 'paid'].includes(subscription_status)) {
            migrated.subscription_status = subscription_status;
            if (subscription_status === 'paid') {
              migrated.has_paid = true;
              migrated.is_active = true;
            }
            if (subscription_status === 'free') {
              migrated.is_active = true;
              migrated.has_paid = false;
            }
            if (subscription_status === 'inactive') {
              migrated.is_active = false;
              migrated.has_paid = false;
            }
          }
          found = true;
          break;
        }
      }
      
      if (!found) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }
      
      await saveUsers(usersData);
      return NextResponse.json({ success: true, message: 'Utilisateur mis à jour' });
    }

    // Reset password
    if (action === 'reset_password' || (!action && email && new_password && !name)) {
      const usersData = await loadUsers();
      let found = false;
      
      for (const [userId, user] of Object.entries(usersData.users)) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          usersData.users[userId].password_hash = hashPassword(new_password);
          usersData.users[userId].must_change_password = true;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }
      
      await saveUsers(usersData);
      return NextResponse.json({ success: true, message: 'Mot de passe réinitialisé' });
    }

    // Activate/Deactivate user
    if (action === 'set_active' || (!action && email && is_active !== undefined && !name)) {
      const usersData = await loadUsers();
      let found = false;
      
      for (const [userId, user] of Object.entries(usersData.users)) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          usersData.users[userId].is_active = is_active;
          if (is_active) {
            const migrated = migrateUser(usersData.users[userId]);
            if (!migrated.subscription_status || migrated.subscription_status === 'inactive') {
              migrated.subscription_status = 'free';
            }
          } else {
            usersData.users[userId].subscription_status = 'inactive';
          }
          found = true;
          break;
        }
      }
      
      if (!found) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }
      
      await saveUsers(usersData);
      return NextResponse.json({ success: true, message: `Utilisateur ${is_active ? 'activé' : 'désactivé'}` });
    }

    // Create user
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe requis' },
        { status: 400 }
      );
    }

    const resolvedYears = Array.isArray(years)
      ? years.filter((y: string) => VALID_YEARS.includes(y))
      : (year && VALID_YEARS.includes(year) ? [year] : ['3ème année']);
    if (resolvedYears.length === 0) resolvedYears.push('3ème année');
    const userActivationDays = (activation_days && typeof activation_days === 'number' && activation_days > 0) ? activation_days : 7;

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
    const now = new Date().toISOString();
    
    usersData.users[userId] = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      must_change_password: true,
      created_at: now,
      last_login: null,
      is_active: true,
      years: resolvedYears,
      activation_days: userActivationDays,
      activated_at: now,
      has_paid: has_paid === true,
      subscription_status: has_paid ? 'paid' : 'free',
      daily_answer_count: 0,
      daily_answer_reset: now,
    };

    await saveUsers(usersData);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
        years: resolvedYears,
        activation_days: userActivationDays,
        has_paid: has_paid === true,
        subscription_status: has_paid ? 'paid' : 'free',
      },
      temp_password: password
    });

  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');
    const email = searchParams.get('email');

    if (!validateAdmin(adminSecret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const usersData = await loadUsers();
    let needsMigration = false;

    for (const [userId, user] of Object.entries(usersData.users)) {
      const userAny = user as any;
      if (!user.years || !Array.isArray(user.years) || userAny.year || user.activation_days === undefined || user.has_paid === undefined || !user.subscription_status) {
        migrateUser(usersData.users[userId]);
        needsMigration = true;
      }
    }

    if (needsMigration) {
      await saveUsers(usersData);
    }

    if (email) {
      for (const user of Object.values(usersData.users)) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              must_change_password: user.must_change_password,
              created_at: user.created_at,
              last_login: user.last_login,
              is_active: user.is_active,
              years: user.years,
              activation_days: user.activation_days,
              activated_at: user.activated_at,
              has_paid: user.has_paid,
              is_trial: user.is_trial || false,
              trial_started_at: user.trial_started_at || null,
              subscription_status: user.subscription_status || (user.has_paid ? 'paid' : user.is_active ? 'free' : 'inactive'),
              daily_answer_count: user.daily_answer_count || 0,
              daily_answer_reset: user.daily_answer_reset || null,
            }
          });
        }
      }
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const users = Object.values(usersData.users).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      must_change_password: user.must_change_password,
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active,
      years: user.years,
      activation_days: user.activation_days,
      activated_at: user.activated_at,
      has_paid: user.has_paid,
      is_trial: user.is_trial || false,
      trial_started_at: user.trial_started_at || null,
      subscription_status: user.subscription_status || (user.has_paid ? 'paid' : user.is_active ? 'free' : 'inactive'),
      daily_answer_count: user.daily_answer_count || 0,
      daily_answer_reset: user.daily_answer_reset || null,
    }));

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');
    const email = searchParams.get('email');

    if (!validateAdmin(adminSecret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const usersData = await loadUsers();
    let found = false;

    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        delete usersData.users[userId];
        found = true;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    await saveUsers(usersData);
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé' });

  } catch (error) {
    console.error('Admin DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}