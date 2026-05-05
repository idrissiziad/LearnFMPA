import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers, isTrialExpired } from '@/lib/user-store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const usersData = await loadUsers();
    const user = usersData.users[userId];

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (isTrialExpired(user)) {
      usersData.users[userId].subscription_status = 'free';
      usersData.users[userId].has_paid = false;
      await saveUsers(usersData);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        must_change_password: user.must_change_password,
        last_login: user.last_login,
        subscription_status: usersData.users[userId].subscription_status || (usersData.users[userId].has_paid ? 'paid' : usersData.users[userId].is_active ? 'free' : 'inactive'),
        daily_answer_count: user.daily_answer_count || 0,
        daily_answer_reset: user.daily_answer_reset || null,
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
