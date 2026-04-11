import { createClient } from 'redis';

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

export interface Session {
  token: string;
  user_id: string;
  created_at: string;
}

export async function createSession(userId: string, token: string): Promise<void> {
  const client = await getRedis();
  const session: Session = {
    token,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  await client.set(`session:${userId}`, JSON.stringify(session));
}

export async function validateSession(userId: string, token: string): Promise<boolean> {
  try {
    const client = await getRedis();
    const data = await client.get(`session:${userId}`);
    if (!data) return false;
    const session: Session = JSON.parse(data);
    return session.token === token;
  } catch {
    return false;
  }
}

export async function destroySession(userId: string): Promise<void> {
  const client = await getRedis();
  await client.del(`session:${userId}`);
}
