/**
 * Authentication middleware.
 *
 * Verifies the Better Auth session cookie and attaches the user to the request.
 * Routes that require a user are protected with `requireAuth`.
 */

import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/index.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
      };
    }
  }
}

/** Attaches `req.user` when a valid session exists. Does not block. */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      };
    }
  } catch {
    // A missing or malformed session is not an error at this stage —
    // protected routes will reject it.
    req.user = undefined;
  }
  next();
}

/** Rejects requests without an authenticated user. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be signed in to perform this action.',
    });
    return;
  }
  next();
}
