import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    throw new Error('Upstash Redis environment variables are not set')
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  }
  return redis
}

export async function setJSON<T>(key: string, value: T) {
  const client = getRedis()
  await client.set(key, JSON.stringify(value))
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const client = getRedis()
  const raw = (await client.get(key)) as unknown
  if (raw == null) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch (error) {
      console.log('Upstash getJSON parse error for key', key, error)
      return null
    }
  }
  return raw as T
}

export async function lpushJSON<T>(key: string, value: T) {
  const client = getRedis()
  await client.lpush(key, JSON.stringify(value))
}

export async function lrangeJSON<T>(key: string, start = 0, stop = 0): Promise<T[]> {
  const client = getRedis()
  const arr = ((await client.lrange(key, start, stop)) as unknown[]) || []
  return arr
    .map((v: unknown) => {
      if (typeof v === 'string') {
        try {
          return JSON.parse(v) as T
        } catch {
          return null
        }
      }
      return v as T
    })
    .filter(Boolean) as T[]
}

