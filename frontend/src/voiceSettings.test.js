// Voice settings: saved per browser, kept within the speech engine's limits, applied to every
// utterance, and announced so a voice that is already loaded picks up the change.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyVoice, DEFAULT_TUNING, readTuning, readVoiceName, resetVoiceSettings, saveVoiceSettings, VOICE_EVENT, voiceOptions } from './voiceSettings.js';

afterEach(() => localStorage.clear());

describe('voice settings', () => {
  it('starts with the defaults', () => {
    expect(readTuning()).toEqual(DEFAULT_TUNING);
    expect(readVoiceName()).toBe('');
  });

  it('saves pitch, speed and volume, and keeps them in range', () => {
    saveVoiceSettings({ pitch: 0.8, rate: 9 });
    expect(readTuning()).toEqual({ rate: 1.6, pitch: 0.8, volume: 1 });
    saveVoiceSettings({ volume: 0.5 });
    expect(readTuning()).toEqual({ rate: 1.6, pitch: 0.8, volume: 0.5 });
  });

  it('ignores broken saved values', () => {
    localStorage.setItem('jarvis-voice-tuning', '{"pitch":"loud"');
    expect(readTuning()).toEqual(DEFAULT_TUNING);
  });

  it('tells listeners when something changes, and reset clears it all', () => {
    const heard = vi.fn();
    window.addEventListener(VOICE_EVENT, heard);
    saveVoiceSettings({ voice: 'Microsoft Neerja Online (Natural)', pitch: 1.3 });
    expect(readVoiceName()).toBe('Microsoft Neerja Online (Natural)');
    resetVoiceSettings();
    window.removeEventListener(VOICE_EVENT, heard);
    expect(heard).toHaveBeenCalledTimes(2);
    expect(readVoiceName()).toBe('');
    expect(readTuning()).toEqual(DEFAULT_TUNING);
  });

  it('applies the settings to an utterance', () => {
    saveVoiceSettings({ rate: 0.9, pitch: 1.2, volume: 0.7 });
    const voice = { name: 'V', lang: 'en-GB' };
    const u = applyVoice({}, voice, 'en-IN');
    expect(u).toEqual({ voice, lang: 'en-GB', rate: 0.9, pitch: 1.2, volume: 0.7 });
    expect(applyVoice({}, null, 'en-IN').lang).toBe('en-IN');
  });

  it('lists natural voices in the language first', () => {
    const names = voiceOptions(
      [
        { name: 'Microsoft Ravi', lang: 'en-IN' },
        { name: 'Google Deutsch', lang: 'de-DE' },
        { name: 'Microsoft Neerja Online (Natural)', lang: 'en-IN' },
        { name: 'Microsoft Zira', lang: 'en-US' },
      ],
      'en-IN',
    );
    expect(names.map((o) => o.name)).toEqual(['Microsoft Neerja Online (Natural)', 'Microsoft Ravi', 'Microsoft Zira', 'Google Deutsch']);
    expect(names[0]).toMatchObject({ natural: true, recommended: true });
  });
});
