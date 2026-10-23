/**
 * Export routes — thin HTTP adapters over the export service.
 *
 * Client-side PDF/DOCX/PNG generation is preferred (no Chromium dependency).
 * These endpoints remain for LaTeX and scheduled server-side export.
 */

import { Router } from 'express';
import {
  resumeContentSchema,
  validateResumeForExport,
} from '@resume-builder/types';
import { latexFromResume } from './service.js';

const router = Router();

router.post('/latex', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    // Reject malformed payloads rather than emitting a broken document.
    const parsed = resumeContentSchema.safeParse(content);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid resume content',
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    // A resume with no name and no history cannot be handed to anyone, so
    // refuse it. Smaller gaps are reported as warnings on a successful export.
    const issues = validateResumeForExport(parsed.data);
    const blocking = issues.filter(
      (i) => i.field === 'profile.fullName' || i.field === 'experience'
    );
    if (blocking.length > 0) {
      res.status(422).json({ error: 'Resume is not ready to export', issues });
      return;
    }
    if (issues.length > 0) {
      res.setHeader('X-Resume-Warnings', String(issues.length));
    }

    const latex = latexFromResume(parsed.data);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.tex"');
    res.send(latex);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Failed to generate LaTeX' });
  }
});

export { router as exportRoutes };