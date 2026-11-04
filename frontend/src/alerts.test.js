import { describe, expect, it } from 'vitest';
import { alertSpeech, readAlertsAloud, setReadAlertsAloud } from './alerts.js';

describe('spoken alerts', () => {
  it('reads one to three alerts in full and sums up more', () => {
    expect(alertSpeech([{ title: 'Battery at 19%', body: 'Plug in the charger soon.' }])).toBe('Battery at 19%. Plug in the charger soon.');
    const many = Array.from({ length: 5 }, (_, i) => ({ title: `Alert ${i}`, body: '' }));
    expect(alertSpeech(many)).toBe('You have 5 new alerts. The first one: Alert 0.');
    expect(alertSpeech([])).toBe('');
  });
  it('is on by default and remembers when switched off', () => {
    localStorage.clear();
    expect(readAlertsAloud()).toBe(true);
    setReadAlertsAloud(false);
    expect(readAlertsAloud()).toBe(false);
  });
});
