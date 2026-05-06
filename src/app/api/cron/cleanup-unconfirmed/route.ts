import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers } from '@/lib/user-store';

const UNCONFIRMED_TTL_MS = 48 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  const isVercelCron = request.headers.get('x-vercel-cron-schedule') !== null;
  const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usersData = await loadUsers();
    const now = Date.now();
    const deletedEmails: string[] = [];

    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.must_change_password) {
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

    console.log(`[cron:cleanup-unconfirmed] Removed ${deletedEmails.length} unconfirmed account(s): ${deletedEmails.join(', ')}`);

    return NextResponse.json({
      success: true,
      removed: deletedEmails.length,
      emails: deletedEmails,
    });
  } catch (error) {
    console.error('Cron cleanup unconfirmed error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}