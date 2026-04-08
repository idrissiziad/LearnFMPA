import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress, saveUserProgress } from '@/lib/user-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const progress = await loadUserProgress(userId);

    return NextResponse.json({
      success: true,
      progress
    }, {
      headers: { 'Cache-Control': 'private, max-age=0, s-maxage=10, stale-while-revalidate=30' }
    });

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, module_id, question_id, is_correct } = body;

    if (!user_id || module_id === undefined || question_id === undefined || is_correct === undefined) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    let progress = await loadUserProgress(user_id);

    const moduleKey = `module_${module_id}`;
    if (!progress[moduleKey]) {
      progress[moduleKey] = {};
    }

    progress[moduleKey][question_id] = {
      is_correct,
      answered_at: new Date().toISOString()
    };

    await saveUserProgress(user_id, progress);

    const moduleProgress = progress[moduleKey] || {};
    const totalAnswered = Object.keys(moduleProgress).length;
    const totalCorrect = Object.values(moduleProgress).filter(
      (p: any) => p.is_correct
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        total_answered: totalAnswered,
        total_correct: totalCorrect,
        success_rate: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const moduleId = searchParams.get('module_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    let progress = await loadUserProgress(userId);

    if (moduleId) {
      const moduleKey = `module_${moduleId}`;
      delete progress[moduleKey];
    } else {
      Object.keys(progress).forEach(key => {
        if (key.startsWith('module_')) {
          delete progress[key];
        }
      });
    }

    await saveUserProgress(userId, progress);

    return NextResponse.json({
      success: true,
      message: moduleId ? 'Progression du module réinitialisée' : 'Toute la progression réinitialisée'
    });

  } catch (error) {
    console.error('Reset progress error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
