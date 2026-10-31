// "Hey Jarvis" detection on speech-to-text output. The recognizer often mishears the name,
// so a few sound-alikes count too. Anything said before the name (background chatter) is dropped.
const WAKE = /\b(?:(?:hey|hi|hello|ok|okay|yo)[\s,]+)?(?:jarvis|jarvi|jarvas|jarviz|jervis|javis|jaarvis|travis)\b[\s,.!?:;-]*/i;

/**
 * null           - the wake word wasn't said: ignore this speech
 * ''             - only the wake word: Jarvis should answer "Yes?" and listen
 * 'open notepad' - the request that followed the wake word
 */
export function afterWakeWord(text) {
  const m = (text || '').match(WAKE);
  if (!m) return null;
  return text.slice(m.index + m[0].length).trim();
}
