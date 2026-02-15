import { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session/edge';
import axios from 'axios';
import { sessionConfig } from '@/config';
import { rateLimit } from '@/rateLimit';
import { getRedisClient, isRedisAvailable } from '@/lib/redis';
import { buildCacheKey, flattenParams, isAllowedPath } from '@/lib/proxy-cache';
import { defaultRequestConfig } from '@/api/config';
import { logger } from '@/logger';

const log = logger.child({}, { msgPrefix: '[proxy] ' });

const CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL ?? '300', 10) || 300;
const CACHE_MAX_SIZE = parseInt(process.env.REDIS_CACHE_MAX_SIZE ?? '5242880', 10) || 5242880;

const getClientIp = (req: NextApiRequest): string =>
  (
    (req.headers['x-original-forwarded-for'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    ''
  )
    .split(',')[0]
    .trim() || 'unknown';

const isValidOrigin = (req: NextApiRequest): boolean => {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  const origin = (req.headers['origin'] as string) || (req.headers['referer'] as string) || '';
  const host = req.headers['host'] || '';
  if (!host) {
    return false;
  }
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pathSegments = req.query.path;
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const upstreamPath = `/${pathSegments.join('/')}`;

  if (!isAllowedPath(upstreamPath)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const session = await getIronSession(req, res, sessionConfig);
  if (!session.token?.access_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isValidOrigin(req)) {
    log.warn({ path: upstreamPath }, 'Origin check failed');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    log.warn({ ip, path: upstreamPath }, 'Rate limit exceeded');
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { path: _, ...queryParams } = req.query;
  const params = flattenParams(queryParams as Record<string, string | string[] | undefined>);
  const cacheKey = buildCacheKey('GET', upstreamPath, params);

  // Cache lookup
  const redis = getRedisClient();
  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.hgetall(cacheKey);
      if (cached && cached.body) {
        const duration = Date.now() - startTime;
        log.info({ path: upstreamPath, duration, cache: 'hit' }, 'Cache hit');
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', cached.contentType || 'application/json');
        return res.status(parseInt(cached.statusCode || '200', 10)).send(cached.body);
      }
    } catch (err) {
      log.warn({ err: (err as Error).message, path: upstreamPath }, 'Cache read failed, falling through');
    }
  }

  // Forward to upstream
  try {
    const upstreamUrl = `${defaultRequestConfig.baseURL}${upstreamPath}`;
    const upstreamResponse = await axios.get(upstreamUrl, {
      params,
      headers: {
        Authorization: `Bearer ${session.token.access_token}`,
        'Content-Type': 'application/json',
      },
      timeout: defaultRequestConfig.timeout as number,
      validateStatus: () => true,
    });

    const statusCode = upstreamResponse.status;
    const contentType = (upstreamResponse.headers['content-type'] as string) || 'application/json';
    const body =
      typeof upstreamResponse.data === 'string' ? upstreamResponse.data : JSON.stringify(upstreamResponse.data);

    const duration = Date.now() - startTime;
    log.info({ path: upstreamPath, duration, statusCode, cache: 'miss' }, 'Cache miss');

    // Cache successful responses within size limit
    if (redis && isRedisAvailable() && statusCode >= 200 && statusCode < 300 && body.length <= CACHE_MAX_SIZE) {
      const pipeline = redis.multi();
      pipeline.hset(cacheKey, {
        body,
        contentType,
        statusCode: String(statusCode),
      });
      pipeline.expire(cacheKey, CACHE_TTL);
      pipeline.exec().catch((writeErr) => {
        log.warn({ err: (writeErr as Error).message, path: upstreamPath }, 'Cache write failed');
      });
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Content-Type', contentType);
    return res.status(statusCode).send(body);
  } catch (err) {
    const duration = Date.now() - startTime;
    log.error({ err: (err as Error).message, path: upstreamPath, duration }, 'Upstream request failed');
    return res.status(502).json({ error: 'Upstream request failed' });
  }
}
