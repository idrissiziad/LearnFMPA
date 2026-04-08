import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress, saveUserProgress, loadQuestionStats, saveQuestionStats } from '@/lib/user-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, answers } = body;

    if (!user_id || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    let progress = await loadUserProgress(user_id);
    const statsMap: { [key: string]: any } = {};

    for (const answer of answers) {
      const { module_id, question_id, is_correct, selected_options } = answer;

      const moduleKey = `module_${module_id}`;
      if (!progress[moduleKey]) {
        progress[moduleKey] = {};
      }
      progress[moduleKey][question_id] = {
        is_correct,
        answered_at: new Date().toISOString()
      };

      if (selected_options) {
        const statsKey = String(module_id);
        if (!statsMap[statsKey]) {
          statsMap[statsKey] = await loadQuestionStats(parseInt(module_id));
        }

        const options = Array.isArray(selected_options)
          ? selected_options.map((o: string | number) => parseInt(String(o)))
          : [parseInt(String(selected_options))];

        if (!statsMap[statsKey][question_id]) {
          statsMap[statsKey][question_id] = {
            total_answers: 0,
            correct_answers: 0,
            option_counts: {},
          };
        }
        statsMap[statsKey][question_id].total_answers += 1;
        if (is_correct) {
          statsMap[statsKey][question_id].correct_answers += 1;
        }
        for (const opt of options) {
          statsMap[statsKey][question_id].option_counts[opt] =
            (statsMap[statsKey][question_id].option_counts[opt] || 0) + 1;
        }
      }
    }

    await saveUserProgress(user_id, progress);

    for (const [moduleIdStr, stats] of Object.entries(statsMap)) {
      await saveQuestionStats(parseInt(moduleIdStr), stats);
    }

    const lastAnswer = answers[answers.length - 1];
    const lastStats = statsMap[String(lastAnswer.module_id)]?.[lastAnswer.question_id] || null;
    const totalAnswers = lastStats?.total_answers || 0;

    return NextResponse.json({
      success: true,
      statistics: totalAnswers > 1 ? lastStats : null,
      progress,
    });
  } catch (error) {
    console.error('Batch answer error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
