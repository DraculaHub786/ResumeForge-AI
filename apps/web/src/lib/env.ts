/**
 * Public runtime configuration.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so a single variable
 * controls where the browser finds the API. `NEXT_PUBLIC_BASE_URL` is kept as
 * a fallback for older deployments that already set it.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  'http://localhost:5000';
