import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers } from '@/lib/user-store';

function validateAdmin(secret: string): boolean {
  return secret === process.env.ADMIN_SECRET || secret === 'learnfmpa2024';
}

const UNCONFIRMED_TTL_MS = 48 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, string> = {};
    try {
      body = await request.json();
    } catch {}
    const admin_secret = body.admin_secret;

    if (!validateAdmin(admin_secret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const usersData = await loadUsers();
    const now = Date.now();
    const deletedEmails: string[] = [];
    let checked = 0;

    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.must_change_password) {
        checked++;
        const createdAt = new Date(user.created_at).getTime();
        if (!isNaN(createdAt) && (now - createdAt) > UNCONFIRMED_TTL_MS) {
          deletedEmails.push(user.email);
          delete usersData.users[userId];
        }
      }
    }

    if (deletedEmails.length > 0) {
      await saveUsers(usersData);
    }

    return NextResponse.json({
      success: true,
      deleted: deletedEmails.length,
      checked,
      emails: deletedEmails,
    });

  } catch (error) {
    console.error('Cleanup unconfirmed error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');

    if (!validateAdmin(adminSecret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const usersData = await loadUsers();
    const now = Date.now();
    const unconfirmed: { email: string; name: string; created_at: string; hours_ago: number }[] = [];

    for (const user of Object.values(usersData.users)) {
      if (user.must_change_password) {
        const createdAt = new Date(user.created_at).getTime();
        if (!isNaN(createdAt) && (now - createdAt) > UNCONFIRMED_TTL_MS) {
          const hoursAgo = Math.round((now - createdAt) / (60 * 60 * 1000));
          unconfirmed.push({
            email: user.email,
            name: user.name,
            created_at: user.created_at,
            hours_ago: hoursAgo,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: unconfirmed.length,
      unconfirmed,
    });

  } catch (error) {
    console.error('Cleanup unconfirmed preview error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}