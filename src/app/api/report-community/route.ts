import { NextRequest, NextResponse } from 'next/server';
import { getAllReports, voteReport, addComment, Report, Comment } from '@/lib/report-store';
import { validateSession } from '@/lib/session-store';
import { loadUsers } from '@/lib/user-store';

const ADMIN_EMAILS = ['idrissiziad7@gmail.com'];

async function getAdminNames(): Promise<Map<string, string>> {
  const adminMap = new Map<string, string>();
  try {
    const usersData = await loadUsers();
    for (const user of Object.values(usersData.users)) {
      if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        adminMap.set(user.id, user.name);
      }
    }
  } catch {}
  return adminMap;
}

function anonymizeReport(report: Report, adminNames: Map<string, string>) {
  const { user_email, user_name, ...rest } = report;
  const isAuthorAdmin = adminNames.has(report.user_id);
  return {
    ...rest,
    display_name: isAuthorAdmin ? adminNames.get(report.user_id)! : null,
    comments: rest.comments.map((c: Comment) => ({
      id: c.id,
      user_id: c.user_id,
      display_name: adminNames.has(c.user_id) ? adminNames.get(c.user_id)! : null,
      text: c.text,
      created_at: c.created_at,
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!token || !userId) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const isValid = await validateSession(userId, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Session expirée', code: 'SESSION_INVALID' }, { status: 401 });
    }

    const [allReports, adminNames] = await Promise.all([
      getAllReports(),
      getAdminNames(),
    ]);

    const result = allReports.map(({ moduleId, reports }) => {
      const flatReports: ReturnType<typeof anonymizeReport>[] = [];
      for (const [questionId, questionReports] of Object.entries(reports)) {
        for (const report of questionReports) {
          flatReports.push({
            ...anonymizeReport(report, adminNames),
            question_id: questionId,
          });
        }
      }
      return { module_id: moduleId, reports: flatReports };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Get community reports error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, action } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    const isValid = await validateSession(user_id, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Session expirée', code: 'SESSION_INVALID' }, { status: 401 });
    }

    if (action === 'vote') {
      const { module_id, question_id, report_id, value } = body;
      if (!module_id || !question_id || !report_id || value === undefined) {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
      }
      if (![1, -1, 0].includes(value)) {
        return NextResponse.json({ error: 'Valeur de vote invalide' }, { status: 400 });
      }

      const report = await voteReport(
        parseInt(String(module_id)),
        String(question_id),
        String(report_id),
        String(user_id),
        value
      );

      if (!report) {
        return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
      }

      const upvotes = Object.values(report.votes).filter(v => v === 1).length;
      const downvotes = Object.values(report.votes).filter(v => v === -1).length;
      const userVote = report.votes[user_id] || 0;

      return NextResponse.json({
        success: true,
        upvotes,
        downvotes,
        user_vote: userVote,
      });
    }

    if (action === 'comment') {
      const { module_id, question_id, report_id, text } = body;
      if (!module_id || !question_id || !report_id || !text?.trim()) {
        return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
      }

      const trimmedText = text.trim().substring(0, 500);
      const report = await addComment(
        parseInt(String(module_id)),
        String(question_id),
        String(report_id),
        String(user_id),
        trimmedText
      );

      if (!report) {
        return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
      }

      const adminNames = await getAdminNames();
      const newComment = report.comments[report.comments.length - 1];
      return NextResponse.json({
        success: true,
        comment: {
          id: newComment.id,
          user_id: newComment.user_id,
          display_name: adminNames.has(newComment.user_id) ? adminNames.get(newComment.user_id)! : null,
          text: newComment.text,
          created_at: newComment.created_at,
        },
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Community report action error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}