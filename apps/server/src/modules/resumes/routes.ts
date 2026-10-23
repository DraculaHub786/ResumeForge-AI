/**
 * Resume route definitions.
 */

import { Router } from 'express';
import { requireAuth, attachUser } from '../../middleware/auth.js';
import {
  listResumeController,
  getResumeController,
  createResumeController,
  updateResumeController,
  deleteResumeController,
} from './controller.js';

export function createResumesRouter() {
  const router = Router();

  router.use(attachUser);

  // Every resume is owned by a user, so all routes require a session. Without
  // this a signed-out visitor could read any resume by id.
  router.get('/', requireAuth, listResumeController);
  router.get('/:id', requireAuth, getResumeController);
  router.post('/', requireAuth, createResumeController);
  router.patch('/:id', requireAuth, updateResumeController);
  router.delete('/:id', requireAuth, deleteResumeController);

  return router;
}