/**
 * Better Auth configuration.
 *
 * Provides email/password auth out of the box, with optional Google and GitHub
 * OAuth providers enabled when their credentials are present in the environment.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb, schema } from '../db/index.js';
import { env } from '../config/index.js';

const db = getDb();

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  /**
   * Requests are only accepted from origins we know about. Without this, a
   * front-end served from any other host (a preview deploy, a different
   * port) is rejected with "Invalid origin" and signing in silently fails.
   */
  trustedOrigins: [
    env.FRONTEND_URL,
    env.BETTER_AUTH_URL,
    ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
    ...env.TRUSTED_ORIGINS,
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: 'resume-forge',
    useSecureCookies: env.NODE_ENV === 'production',
  },
});

export type Auth = typeof auth;
