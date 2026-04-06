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
