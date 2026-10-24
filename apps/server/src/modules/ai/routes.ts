import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import {
  enhanceContent,
  rewriteSummary,
  generateAchievements,
  checkAts,
  generateResumeFromNotes,
  auditResumeWithAi,
  enhanceResumeWithAi,
  parseLatexWithAi,
} from './service.js';
import { getActiveAiProvider } from '@resume-builder/ai';

const router = Router();

/**
 * AI endpoints call a paid or API-limited provider, so they are closed to anonymous traffic
 * and get their own, much tighter budget than the rest of the API.
 */
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests — please slow down.' },
});

router.use(requireAuth, aiLimiter);

router.get('/status', async (_req, res) => {
  const active = getActiveAiProvider();
  res.json({
    active: !!active,
    provider: active?.name ?? 'local',
    model: active?.defaultModel ?? 'heuristic',
  });
});

router.post('/enhance', async (req, res) => {
  try {
    const { sectionId, content, targetJobTitle, targetJobDescription } = req.body;
    if (!sectionId || !content) {
      res.status(400).json({ error: 'sectionId and content are required' });
      return;
    }
    const result = await enhanceContent({
      sectionId,
      content,
      targetJobTitle,
      targetJobDescription,
    });
    res.json(result);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/enhance-resume', async (req, res) => {
  try {
    const { content, instruction } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const result = await enhanceResumeWithAi(content, instruction);
    res.json(result);
  } catch (error) {
    console.error('[error enhancing resume]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/parse-latex', async (req, res) => {
  try {
    const { tex } = req.body;
    const result = await parseLatexWithAi(tex ?? '');
    res.json(result);
  } catch (error) {
    console.error('[error parsing latex with AI]', error);
    res.status(500).json({ error: 'Failed to parse LaTeX with AI' });
  }
});

router.post('/rewrite-summary', async (req, res) => {
  try {
    const { content, targetJobTitle } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const result = await rewriteSummary(content, targetJobTitle);
    res.json(result);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/achievement-generator', async (req, res) => {
  try {
    const { content, targetJobTitle } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const result = await generateAchievements(content, targetJobTitle);
    res.json(result);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/ats-check', async (req, res) => {
  try {
    const { content, targetJobDescription } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const result = await checkAts(content, targetJobDescription);
    res.json(result);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate-resume', async (req, res) => {
  try {
    const { role, experienceLevel, industry, userNotes, targetJobDescription, targetTone } = req.body;
    if (!role || !userNotes) {
      res.status(400).json({ error: 'role and userNotes are required' });
      return;
    }
    const result = await generateResumeFromNotes({
      role,
      experienceLevel,
      industry,
      userNotes,
      targetJobDescription,
      targetTone,
    });
    res.json(result);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/audit', async (req, res) => {
  try {
    const { content, targetJobDescription } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    const result = await auditResumeWithAi(content, targetJobDescription);
    res.json(result);
  } catch (error) {
    console.error('[error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as aiRoutes };