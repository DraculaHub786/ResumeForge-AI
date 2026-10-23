import { describe, it, expect } from 'vitest';
import {
  buildEnhancePrompt,
  PROMPT_PRESETS,
  AI_PROMPTS,
  RESUME_BUILDER_SYSTEM,
} from '../src/prompts.js';

describe('buildEnhancePrompt', () => {
  it('builds system and user prompt for experience section', () => {
    const prompt = buildEnhancePrompt({
      sectionId: 'experience',
      content: 'Software engineer at Acme. Wrote code.',
      targetJobTitle: 'Staff Frontend Engineer',
    });

    expect(prompt.system).toBe(RESUME_BUILDER_SYSTEM);
    expect(prompt.user).toContain('SECTION TYPE: experience');
    expect(prompt.user).toContain('Software engineer at Acme');
    expect(prompt.user).toContain('TARGET JOB CONTEXT:');
    expect(prompt.user).toContain('Title: Staff Frontend Engineer');
    expect(prompt.user).toContain('Rewrite each bullet to start with an action verb');
  });

  it('handles sections without job context', () => {
    const prompt = buildEnhancePrompt({
      sectionId: 'summary',
      content: 'Experienced developer passionate about web tech.',
    });

    expect(prompt.user).toContain('SECTION TYPE: summary');
    expect(prompt.user).not.toContain('TARGET JOB CONTEXT:');
    expect(prompt.user).toContain('Write 3-4 tight sentences');
  });

  it('supports custom sections gracefully', () => {
    const prompt = buildEnhancePrompt({
      sectionId: 'custom',
      content: 'Volunteered as code mentor.',
    });

    expect(prompt.user).toContain('SECTION TYPE: custom');
    expect(prompt.user).toContain("Improve readability and clarity while preserving the user's wording.");
  });
});

describe('PROMPT_PRESETS', () => {
  it('has presets for enhance, rewrite-summary, and ats-check', () => {
    expect(PROMPT_PRESETS['enhance']).toBeDefined();
    expect(PROMPT_PRESETS['rewrite-summary']).toBeDefined();
    expect(PROMPT_PRESETS['ats-check']).toBeDefined();

    const summaryUser = PROMPT_PRESETS['rewrite-summary'].user({
      sectionId: 'summary',
      content: 'Tech lead with 10 years experience',
      targetJobTitle: 'Director of Engineering',
    });
    expect(summaryUser).toContain('CURRENT SUMMARY:');
    expect(summaryUser).toContain('TARGET ROLE: Director of Engineering');
  });
});

describe('AI_PROMPTS', () => {
  it('provides ready-to-send system messages for OpenRouter', () => {
    const enhanceMsg = AI_PROMPTS.enhance({});
    expect(enhanceMsg.role).toBe('system');
    expect(enhanceMsg.content).toContain('expert resume writer');

    const atsMsg = AI_PROMPTS['ats-check']({});
    expect(atsMsg.role).toBe('system');
    expect(atsMsg.content).toContain('ATS compliance analyst');
  });
});
