/**
 * Express application factory.
 *
 * Configures middleware, routes, and error handling. The returned app is
 * passed to `http.listen()` in `index.ts`.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { auth } from './auth/index.js';
import { toNodeHandler } from 'better-auth/node';
import { createResumesRouter } from './modules/resumes/index.js';
import { aiRoutes } from './modules/ai/index.js';
import { exportRoutes } from './modules/exports/index.js';
import {
  attachUser,
  notFoundHandler,
  errorHandler,
} from './middleware/index.js';
import { env } from './config/index.js';

/**
 * Turn an IP address into a stable rate-limit key.
 *
 * IPv6 clients are usually handed a whole /64 subnet, so the address itself
 * is not a usable key — a single user could rotate through billions of
 * addresses. The /64 prefix is used instead.
 */
function ipKey(ip: string): string {
  if (!ip) return 'unknown';
  if (!ip.includes(':')) return ip;
  return ip.split(':').slice(0, 4).join(':');
}

export function createApp() {
  const app = express();

  // Behind a reverse proxy (nginx, Fly, Railway, Cloudflare) the client IP
  // only shows up in `X-Forwarded-For`. Trusting a fixed number of hops keeps
  // the rate limiter honest without letting a client spoof its own address.
  if (env.TRUST_PROXY) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  // --- Security & utility middleware ---
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map((s: string) => s.trim()),
    credentials: true,
  }));

  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Attach user from session on every request. This runs *before* the rate
  // limiter so authenticated traffic can be budgeted per account.
  app.use(attachUser);

  // --- Health check ---
  // Mounted ahead of the rate limiter on purpose: a monitor polling this
  // endpoint every second must never be able to exhaust the API budget.
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  // --- Rate limiting ---
  // Signed-in requests are budgeted per account; anonymous requests per IP.
  // Keying everything by IP would let one noisy client lock out everyone
  // sharing the same address (a company NAT, a CI runner, a VPN).
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userId = req.user?.id;
      return userId ? `user:${userId}` : `ip:${ipKey(req.ip ?? '')}`;
    },
  });
  app.use('/api/', limiter);

  // Credential endpoints get their own, much tighter budget, keyed by the
  // account being targeted so one attacker cannot lock out other users.
  const authLimiter = rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) =>
      `auth:${ipKey(req.ip ?? '')}:${String(req.body?.email ?? '').toLowerCase()}`,
    message: { error: 'Too many attempts — please try again later.' },
  });
  app.use(['/api/auth/sign-in/email', '/api/auth/sign-up/email'], authLimiter);

  // --- Better Auth routes (mounted at /api/auth/*) ---
  app.all('/api/auth/*', toNodeHandler(auth));

  // --- API v1 routes ---
  const api = express.Router();
  api.use('/resumes', createResumesRouter());
  api.use('/ai', aiRoutes);
  api.use('/export', exportRoutes);
  app.use('/api/v1', api);

  // --- 404 & error handling ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}