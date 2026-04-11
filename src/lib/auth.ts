import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session-store';

export async function requireAuth(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Non autorisé', code: 'SESSION_INVALID' },
      { status: 401 }
    );
  }

  const body = await request.clone().json().catch(() => ({}));
  const queryUrl = new URL(request.url);
  const userId = body.user_id || queryUrl.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json(
      { error: 'ID utilisateur requis' },
      { status: 400 }
    );
  }

  const isValid = await validateSession(userId, token);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Session expirée. Vous avez été déconnecté car un autre appareil s\'est connecté.', code: 'SESSION_INVALID' },
      { status: 401 }
    );
  }

  return { userId };
}
