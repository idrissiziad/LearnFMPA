import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress, saveUserProgress, loadQuestionStats, saveQuestionStats, loadUsers, saveUsers, isTrialExpired, getDailyAnswerCount, setDailyAnswerCount } from '@/lib/user-store';
import { requireAuth } from '@/lib/auth';

const FREE_EXPLANATION_LIMIT = 200;
const FREE_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const FULL_PROCESS_THRESHOLD = 10;

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

    const dailyData = await getDailyAnswerCount(user_id);
    let { count: dailyAnswerCount, resetTime: dailyResetTime } = dailyData;
    let subscriptionStatus = dailyData.subscriptionStatus || null;
    const now = Date.now();
    const resetMs = dailyResetTime ? new Date(dailyResetTime).getTime() : 0;

    if (now - resetMs >= FREE_DAILY_WINDOW_MS) {
      dailyAnswerCount = 0;
      dailyResetTime = new Date().toISOString();
      subscriptionStatus = null;
    } else if (!dailyResetTime) {
      dailyResetTime = new Date().toISOString();
    }

    dailyAnswerCount += answers.length;
    const previousCount = dailyAnswerCount - answers.length;
    const needsFullProcess = previousCount < FULL_PROCESS_THRESHOLD;

    let isPaid = subscriptionStatus === 'paid';
    let progress: any = {};
    let lastStats: any = null;

    if (needsFullProcess) {
      const usersData = await loadUsers();
      const user = usersData.users[user_id];
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      if (isTrialExpired(user)) {
        usersData.users[user_id].subscription_status = 'free';
        usersData.users[user_id].has_paid = false;
        user.subscription_status = 'free';
        user.has_paid = false;
      }

      subscriptionStatus = user.subscription_status || (user.has_paid ? 'paid' : (user.is_active ? 'free' : 'inactive'));
      isPaid = subscriptionStatus === 'paid';

      usersData.users[user_id].daily_answer_count = dailyAnswerCount;
      usersData.users[user_id].daily_answer_reset = dailyResetTime;
      usersData.users[user_id].subscription_status = subscriptionStatus as any;
      await saveUsers(usersData);

      if (isPaid) {
        progress = await loadUserProgress(user_id);
        const statsMap: Record<string, any> = {};

        const answersToProcess = answers.slice(0, Math.max(0, FULL_PROCESS_THRESHOLD - previousCount));

        for (const answer of answersToProcess) {
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

        const lastAnswer = answersToProcess[answersToProcess.length - 1];
        lastStats = statsMap[String(lastAnswer.module_id)]?.[lastAnswer.question_id] || null;
      }
    } else if (!subscriptionStatus) {
      const usersData = await loadUsers();
      const user = usersData.users[user_id];
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      subscriptionStatus = user.subscription_status || (user.has_paid ? 'paid' : (user.is_active ? 'free' : 'inactive'));
      isPaid = subscriptionStatus === 'paid';
    }

    if (!needsFullProcess && isPaid) {
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

    await setDailyAnswerCount(user_id, dailyAnswerCount, dailyResetTime, subscriptionStatus || undefined);

    const freeLimitReached = !isPaid && dailyAnswerCount > FREE_EXPLANATION_LIMIT;
    const explanationsVisible = isPaid || dailyAnswerCount <= FREE_EXPLANATION_LIMIT;

    return NextResponse.json({
      success: true,
      statistics: lastStats,
      progress: isPaid ? progress : {},
      free_limit_reached: freeLimitReached,
      explanations_visible: explanationsVisible,
      explanation_limit: FREE_EXPLANATION_LIMIT,
      daily_answer_count: dailyAnswerCount,
      daily_answer_reset: dailyResetTime,
    });
  } catch (error) {
    console.error('Batch answer error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}