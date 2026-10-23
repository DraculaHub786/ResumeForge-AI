import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import {
  enhanceContent,
  rewriteSummary,
  generateAchievements,
  checkAts,
} from './service.js';

const router = Router();

/**
 * AI endpoints call a paid provider, so they are closed to anonymous traffic
 * and get their own, much tighter budget than the rest of the API.
 */
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests — please slow down.' },
});

router.use(requireAuth, aiLimiter);

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

export { router as aiRoutes };