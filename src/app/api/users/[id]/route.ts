import { NextRequest, NextResponse } from 'next/server';
import { loadUsers } from '@/lib/user-store';
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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        must_change_password: user.must_change_password,
        last_login: user.last_login,
        subscription_status: user.subscription_status || (user.has_paid ? 'paid' : user.is_active ? 'free' : 'inactive'),
        daily_answer_count: user.daily_answer_count || 0,
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
