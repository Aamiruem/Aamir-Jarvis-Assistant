import { describe, expect, it } from 'vitest';
import { aiProblemOf, isSetupError, spokenFailure } from './AiNotice.jsx';

describe('AI status wording', () => {
  it('turns a health answer into a problem key', () => {
    expect(aiProblemOf({ ai: 'down' })).toBe('ai_down');
    expect(aiProblemOf({ ai: 'up', claude: 'invalid_key' })).toBe('invalid_key');
    expect(aiProblemOf({ ai: 'up', claude: 'ok' })).toBeNull();
  });
  it('says a rejected key out loud in one short, URL-free sentence', () => {
    const msg = 'Jarvis can\'t reach Claude: the ANTHROPIC_API_KEY in .env was rejected. Create a new key at https://console.anthropic.com/settings/keys';
    expect(isSetupError(msg)).toBe(true);
    const said = spokenFailure(msg);
    expect(said).toMatch(/API key was rejected/);
    expect(said).not.toMatch(/https?:/);
  });
  it('keeps other errors, without reading links aloud', () => {
    expect(spokenFailure('Timed out, see https://x.dev/help')).toBe('Sorry, that didn\'t work. Timed out, see the link on screen');
  });
});
