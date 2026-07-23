import { redis } from './redis.js';

export async function getOrSet(key, fetchFn, ttl = 300) {
  if (!redis) return fetchFn;
  const cached = await redis.get(key);
  if (cached !== null) return cached;

  const data = await fetchFn();
  await redis.set(key, JSON.stringify(data), { ex: ttl });
  return data;
}

export async function invalidateCache(key) {
  if (!redis) return;
  await redis.del(key);
}
