import { createClient } from 'redis';
import { NextResponse } from 'next/server';

let redis: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL || process.env.KV_REST_API_URL,
    });
    await redis.connect();
  }
  return redis;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  must_change_password: boolean;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  years: string[];
  activation_days: number;
  activated_at: string | null;
  has_paid: boolean;
  is_trial?: boolean;
  trial_started_at?: string | null;
}

export interface UsersData {
  users: { [key: string]: User };
}

export async function loadUsers(): Promise<UsersData> {
  try {
    const client = await getRedis();
    const data = await client.get('users');
    return data ? JSON.parse(data) : { users: {} };
  } catch (error) {
    console.error('Redis load error:', error);
    return { users: {} };
  }
}

export async function saveUsers(data: UsersData): Promise<void> {
  try {
    const client = await getRedis();
    await client.set('users', JSON.stringify(data));
  } catch (error) {
    console.error('Redis save error:', error);
  }
}

export async function loadUserProgress(userId: string): Promise<any> {
  try {
    const client = await getRedis();
    const data = await client.get(`progress:${userId}`);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Redis load progress error:', error);
    return {};
  }
}

export async function saveUserProgress(userId: string, progress: any): Promise<void> {
  try {
    const client = await getRedis();
    await client.set(`progress:${userId}`, JSON.stringify(progress));
  } catch (error) {
    console.error('Redis save progress error:', error);
  }
}

export interface QuestionStats {
  total_answers: number;
  correct_answers: number;
  option_counts: { [optionIndex: string]: number };
}

export interface ModuleStats {
  [questionId: string]: QuestionStats;
}

export async function loadQuestionStats(moduleId: number): Promise<ModuleStats> {
  try {
    const client = await getRedis();
    const data = await client.get(`stats:module_${moduleId}`);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Redis load stats error:', error);
    return {};
  }
}

export async function saveQuestionStats(moduleId: number, stats: ModuleStats): Promise<void> {
  try {
    const client = await getRedis();
    await client.set(`stats:module_${moduleId}`, JSON.stringify(stats));
  } catch (error) {
    console.error('Redis save stats error:', error);
  }
}

export async function getSignupOpen(): Promise<boolean> {
  try {
    const client = await getRedis();
    const value = await client.get('signup_open');
    return value === 'true';
  } catch (error) {
    console.error('Redis get signup_open error:', error);
    return false;
  }
}

export async function setSignupOpen(open: boolean): Promise<void> {
  try {
    const client = await getRedis();
    await client.set('signup_open', open ? 'true' : 'false');
  } catch (error) {
    console.error('Redis set signup_open error:', error);
  }
}

export async function recordAnswerStat(
  moduleId: number,
  questionId: string,
  selectedOptions: number[],
  isCorrect: boolean
): Promise<QuestionStats> {
  const stats = await loadQuestionStats(moduleId);

  if (!stats[questionId]) {
    stats[questionId] = {
      total_answers: 0,
      correct_answers: 0,
      option_counts: {},
    };
  }

  stats[questionId].total_answers += 1;
  if (isCorrect) {
    stats[questionId].correct_answers += 1;
  }
  for (const opt of selectedOptions) {
    stats[questionId].option_counts[opt] =
      (stats[questionId].option_counts[opt] || 0) + 1;
  }

  await saveQuestionStats(moduleId, stats);
  return stats[questionId];
}
