/**
 * Shared E2E configuration.
 *
 * The suite runs against dedicated ports and an isolated database so it can
 * never disturb a developer's running dev server or dev data.
 */

export const API_PORT = Number(process.env.E2E_API_PORT ?? 5001);
export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);

export const API_URL = process.env.E2E_API_URL ?? `http://localhost:${API_PORT}`;
export const WEB_URL = process.env.E2E_WEB_URL ?? `http://localhost:${WEB_PORT}`;

/** Credentials used by the seeded test account. */
export const TEST_USER = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'analytical-engine',
} as const;
