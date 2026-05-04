// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 10 * 60 * 1000 }, // 5 per 10 min
  otp: { maxRequests: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 min
  upload: { maxRequests: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour
  api: { maxRequests: 500, windowMs: 60 * 1000 }, // 500 per min
}

export function checkRateLimit(identifier: string, action: keyof typeof RATE_LIMITS): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const config = RATE_LIMITS[action]
  if (!config) return { allowed: true, remaining: 999, resetAt: 0 }

  const key = `${action}:${identifier}`
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now - entry.windowStart > config.windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + config.windowMs,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "127.0.0.1"
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    const action = key.split(":")[0] as keyof typeof RATE_LIMITS
    const config = RATE_LIMITS[action]
    if (config && now - entry.windowStart > config.windowMs) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 1000) // every minute
