// "Hey Azarvis" detection on speech-to-text output. The recognizer often mishears the name,
// so a few sound-alikes count too (and the earlier name, Jarvis; "as Jarvis" is a common hearing
// of "Azarvis"). Anything said before the name (background chatter) is dropped.
const WAKE = /\b(?:(?:hey|hi|hello|ok|okay|yo)[\s,]+)?(?:azarvis|azarvas|azervis|azarbis|azar vis|a zarvis|jarvis|jarvi|jarvas|jarviz|jervis|javis|jaarvis|travis)\b[\s,.!?:;-]*/i;

/**
 * null           - the wake word wasn't said: ignore this speech
 * ''             - only the wake word: Azarvis should answer "Yes?" and listen
 * 'open notepad' - the request that followed the wake word
 */
// The same name as a Hindi or Urdu recognizer writes it.
const WAKE_NATIVE = /(?:(?:हे|हाय|हेलो|ओके|ہے|ہائے|ہیلو)[\s,،]*)?(?:जार्विस|जारविस|जार्वेस|अज़ार्विस|अजार्विस|अजारविस|جاروس|جارویس|جاروِس|ازارویس)[\s,.!?:;،۔।-]*/;

export function afterWakeWord(text) {
  const m = (text || '').match(WAKE) || (text || '').match(WAKE_NATIVE);
  if (!m) return null;
  return text.slice(m.index + m[0].length).trim();
}
