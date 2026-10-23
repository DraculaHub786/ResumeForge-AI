/**
 * Resume HTTP controllers.
 *
 * Thin adapters that parse request bodies with Zod schemas and delegate to the
 * service layer.
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  listResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
} from './service.js';
import type { ResumeDraft } from '@resume-builder/types';
import { createId } from '@resume-builder/types';
import { asyncHandler } from '../../middleware/error.js';

const createResumeBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(100).optional(),
    metadata: z.record(z.unknown()),
    content: z.record(z.unknown()),
  })
  .passthrough();

const updateResumeBodySchema = createResumeBodySchema.partial();

/** Transform an API payload into the canonical resume draft shape. */
function toDraft(body: z.infer<typeof createResumeBodySchema>): ResumeDraft {
  return {
    id: createId('res'),
    title: body.title,
    // Slug ownership and disambiguation are resolved by the service layer,
    // so the controller only forwards what the client supplied.
    slug: body.slug,
    metadata: body.metadata as unknown as ResumeDraft['metadata'],
    content: body.content as unknown as ResumeDraft['content'],
  };
}

export const listResumeController = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    userId: req.user?.id ?? null,
    search: req.query.search as string | undefined,
    template: req.query.template as string | undefined,
  };
  const params = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  };
  const result = await listResumes(filters, params);
  res.json(result);
});

export const getResumeController = asyncHandler(async (req: Request, res: Response) => {
  const result = await getResume(req.params.id, req.user?.id);
  res.json(result);
});

export const createResumeController = asyncHandler(async (req: Request, res: Response) => {
  const body = createResumeBodySchema.parse(req.body);
  const draft = toDraft(body);
  const result = await createResume(draft, req.user?.id);
  res.status(201).json(result);
});

export const updateResumeController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = updateResumeBodySchema.parse(req.body);
    const patch: Partial<ResumeDraft> = {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.metadata !== undefined
        ? { metadata: body.metadata as unknown as ResumeDraft['metadata'] }
        : {}),
      ...(body.content !== undefined
        ? { content: body.content as unknown as ResumeDraft['content'] }
        : {}),
    };
    const result = await updateResume(req.params.id, patch, req.user?.id);
    res.json(result);
  }
);

export const deleteResumeController = asyncHandler(async (req: Request, res: Response) => {
  await deleteResume(req.params.id, req.user?.id);
  res.status(204).end();
});
