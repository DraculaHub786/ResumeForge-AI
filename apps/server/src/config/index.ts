/**
 * Server configuration loaded from environment variables.
 */

import { config } from 'dotenv';
config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',

  // Auth
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-in-production',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5000',

  // OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,

  // AI
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_BASE_URL: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
  GROQ_DEFAULT_MODEL: process.env.GROQ_DEFAULT_MODEL ?? 'openai/gpt-oss-20b',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  OPENROUTER_DEFAULT_MODEL: process.env.OPENROUTER_DEFAULT_MODEL ?? 'openai/gpt-4o-mini',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
  /** Tighter budget for the credential endpoints. */
  AUTH_RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000',
    10
  ),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.AUTH_RATE_LIMIT_MAX_REQUESTS ?? '10',
    10
  ),

  /**
   * How many proxy hops to trust for the client IP.
   *
   * `1` is correct for a single reverse proxy in front of the app. `0`
   * disables it. `true` is deliberately not supported: it lets a client
   * spoof `X-Forwarded-For` and escape the rate limiter.
   */
  TRUST_PROXY: parseInt(process.env.TRUST_PROXY ?? '0', 10),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:5000',

  /**
   * Extra origins that may talk to the auth endpoints.
   *
   * Better Auth rejects any request whose `Origin` header is not trusted, so
   * this has to cover every front-end URL the app is served from — including
   * preview deployments, which is why it is not hard-coded.
   */
  TRUSTED_ORIGINS: (process.env.TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
} as const;

export function validateEnv(): void {
  const required = ['BETTER_AUTH_SECRET'] as const;
  const missing = required.filter(key => !env[key]);
  if (missing.length > 0 && env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}