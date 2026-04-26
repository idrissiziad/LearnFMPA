import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress, saveUserProgress, loadQuestionStats, saveQuestionStats, loadUsers, saveUsers } from '@/lib/user-store';
import { requireAuth } from '@/lib/auth';

const FREE_DAILY_LIMIT = 10;

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { user_id, answers } = body;

    if (!user_id || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const usersData = await loadUsers();
    const user = usersData.users[user_id];
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const subscriptionStatus = user.subscription_status || (user.has_paid ? 'paid' : (user.is_active ? 'free' : 'inactive'));
    let dailyAnswerCount = user.daily_answer_count || 0;
    const dailyAnswerReset = user.daily_answer_reset || user.activated_at || user.created_at;

    const today = getTodayString();
    const resetDate = dailyAnswerReset ? dailyAnswerReset.split('T')[0] : today;
    if (resetDate !== today) {
      dailyAnswerCount = 0;
    }

    dailyAnswerCount += answers.length;
    usersData.users[user_id].daily_answer_count = dailyAnswerCount;
    usersData.users[user_id].daily_answer_reset = new Date().toISOString();
    usersData.users[user_id].subscription_status = subscriptionStatus;
    await saveUsers(usersData);

    const isPaid = subscriptionStatus === 'paid';
    const freeLimitReached = !isPaid && dailyAnswerCount > FREE_DAILY_LIMIT;

    let progress: any = {};
    let lastStats: any = null;

    if (isPaid) {
      progress = await loadUserProgress(user_id);
      const statsMap: Record<string, any> = {};

      for (const answer of answers) {
        const { module_id, question_id, is_correct, selected_options } = answer;
        const moduleKey = `module_${module_id}`;
        if (!progress[moduleKey]) progress[moduleKey] = {};
        progress[moduleKey][question_id] = { is_correct, answered_at: new Date().toISOString() };

        if (selected_options) {
          const statsKey = String(module_id);
          if (!statsMap[statsKey]) statsMap[statsKey] = await loadQuestionStats(parseInt(module_id));
          const options = Array.isArray(selected_options) ? selected_options.map((o: string | number) => parseInt(String(o))) : [parseInt(String(selected_options))];
          if (!statsMap[statsKey][question_id]) statsMap[statsKey][question_id] = { total_answers: 0, correct_answers: 0, option_counts: {} };
          statsMap[statsKey][question_id].total_answers += 1;
          if (is_correct) statsMap[statsKey][question_id].correct_answers += 1;
          for (const opt of options) statsMap[statsKey][question_id].option_counts[opt] = (statsMap[statsKey][question_id].option_counts[opt] || 0) + 1;
        }
      }

      await saveUserProgress(user_id, progress);
      for (const [moduleIdStr, stats] of Object.entries(statsMap)) {
        await saveQuestionStats(parseInt(moduleIdStr), stats);
      }

      const lastAnswer = answers[answers.length - 1];
      lastStats = statsMap[String(lastAnswer.module_id)]?.[lastAnswer.question_id] || null;
    }

    return NextResponse.json({
      success: true,
      statistics: isPaid ? lastStats : null,
      progress: isPaid ? progress : {},
      free_limit_reached: freeLimitReached,
      daily_answer_count: dailyAnswerCount,
      daily_limit: FREE_DAILY_LIMIT,
    });
  } catch (error) {
    console.error('Batch answer error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}