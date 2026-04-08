import { NextRequest, NextResponse } from 'next/server';
import { loadQuestionStats, recordAnswerStat, saveQuestionStats } from '@/lib/user-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('module_id');
    const questionId = searchParams.get('question_id');

    if (!moduleId) {
      return NextResponse.json(
        { error: 'ID module requis' },
        { status: 400 }
      );
    }

    const stats = await loadQuestionStats(parseInt(moduleId));

    if (questionId) {
      const questionStats = stats[questionId] || null;
      return NextResponse.json({
        success: true,
        statistics: questionStats,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
      });
    }

    return NextResponse.json({
      success: true,
      statistics: stats,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module_id, question_id, selected_options, is_correct } = body;

    if (
      module_id === undefined ||
      !question_id ||
      !selected_options ||
      is_correct === undefined
    ) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const options = Array.isArray(selected_options)
      ? selected_options.map((o: string | number) => parseInt(String(o)))
      : [parseInt(String(selected_options))];

    const questionStats = await recordAnswerStat(
      parseInt(module_id),
      question_id,
      options,
      is_correct
    );

    return NextResponse.json({
      success: true,
      statistics: questionStats,
    });
  } catch (error) {
    console.error('Record statistics error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { module_id, stats } = body;

    if (module_id === undefined || !stats) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    await saveQuestionStats(parseInt(module_id), stats);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Update statistics error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('module_id');

    if (!moduleId) {
      const body = await request.json().catch(() => ({}));
      const bodyModuleId = body.module_id;
      if (!bodyModuleId) {
        return NextResponse.json(
          { error: 'ID module requis' },
          { status: 400 }
        );
      }
      await saveQuestionStats(parseInt(bodyModuleId), {});
      return NextResponse.json({
        success: true,
        message: 'Statistiques du module réinitialisées',
      });
    }

    await saveQuestionStats(parseInt(moduleId), {});

    return NextResponse.json({
      success: true,
      message: 'Statistiques du module réinitialisées',
    });
  } catch (error) {
    console.error('Delete statistics error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
