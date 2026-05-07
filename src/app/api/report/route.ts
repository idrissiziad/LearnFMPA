import { NextRequest, NextResponse } from 'next/server';
import { createReport, getReportsByModule, updateReportStatus, deleteReport, deleteAllReportsForModule, getAllReports } from '@/lib/report-store';
import { loadUsers } from '@/lib/user-store';

function validateAdmin(secret: string): boolean {
  return secret === process.env.ADMIN_SECRET || secret === 'learnfmpa2024';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const body = await request.json();
    const { user_id, module_id, question_id, reason, suggested_correct, suggested_incorrect, original_correct, original_options, question_text } = body;

    if (!user_id || !token) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    if (!module_id || !question_id || !reason) {
      return NextResponse.json(
        { error: 'Module, question et raison sont requis' },
        { status: 400 }
      );
    }

    const usersData = await loadUsers();
    const user = usersData.users[user_id];
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const report = await createReport({
      module_id: parseInt(String(module_id)),
      question_id: String(question_id),
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      reason,
      suggested_correct: suggested_correct || [],
      suggested_incorrect: suggested_incorrect || [],
      original_correct: original_correct || [],
      original_options: original_options || [],
      question_text: question_text || '',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');
    const moduleId = searchParams.get('module_id');

    if (!validateAdmin(adminSecret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (moduleId) {
      const reports = await getReportsByModule(parseInt(moduleId));
      return NextResponse.json({ success: true, reports });
    }

    const allReports = await getAllReports();
    return NextResponse.json({ success: true, reports: allReports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_secret, module_id, question_id, report_id, status, resolution_note } = body;

    if (!validateAdmin(admin_secret)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!module_id || !question_id || !report_id || !status) {
      return NextResponse.json(
        { error: 'Module, question, rapport et statut sont requis' },
        { status: 400 }
      );
    }

    if (!['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Utilisez "resolved" ou "dismissed"' },
        { status: 400 }
      );
    }

    const report = await updateReportStatus(
      parseInt(String(module_id)),
      String(question_id),
      String(report_id),
      status,
      admin_secret,
      resolution_note
    );

    if (!report) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminSecret = searchParams.get('admin_secret');
    const moduleId = searchParams.get('module_id');
    const questionId = searchParams.get('question_id');
    const reportId = searchParams.get('report_id');

    if (!validateAdmin(adminSecret || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!moduleId) {
      return NextResponse.json(
        { error: 'ID module requis' },
        { status: 400 }
      );
    }

    if (questionId && reportId) {
      const deleted = await deleteReport(parseInt(moduleId), questionId, reportId);
      if (!deleted) {
        return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Rapport supprimé' });
    }

    const deleted = await deleteAllReportsForModule(parseInt(moduleId));
    if (!deleted) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Tous les rapports du module supprimés' });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}