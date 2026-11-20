import { describe, expect, it } from 'vitest';
import { browserVoiceFor, detectLanguage, languageCommand, LANGUAGES, neuralVoiceFor, voiceGender } from './languages.js';
import { pickVoice } from './speechText.js';

describe('detectLanguage', () => {
  it.each([
    ['आज मौसम बहुत अच्छा है।', 'hi-IN'],
    ['آج موسم بہت اچھا ہے۔', 'ur-IN'],
    ['اليوم الطقس جميل جدا', 'ar-SA'],
    ['امروز هوا خیلی خوب است', 'fa-IR'],
    ['আজ আবহাওয়া খুব ভালো', 'bn-IN'],
    ['இன்று வானிலை நன்றாக உள்ளது', 'ta-IN'],
    ['ఈ రోజు వాతావరణం బాగుంది', 'te-IN'],
    ['ਅੱਜ ਮੌਸਮ ਬਹੁਤ ਵਧੀਆ ਹੈ', 'pa-IN'],
    ['Сегодня хорошая погода', 'ru-RU'],
    ['今天天气很好', 'zh-CN'],
    ['今日はいい天気ですね', 'ja-JP'],
    ['오늘 날씨가 좋네요', 'ko-KR'],
    ['Hola, ¿cómo estás? Estoy bien, gracias.', 'es-ES'],
    ["Bonjour, je suis très content de vous voir", 'fr-FR'],
    ['Kya haal hai? Main theek hoon, aap batao.', 'hi-Latn'],
    ['The weather in Pune is sunny today.', 'en-IN'],
  ])('%s → %s', (text, code) => {
    expect(detectLanguage(text, 'en-IN')).toBe(code);
  });

  it('uses the language the user speaks to break ties', () => {
    expect(detectLanguage('आज हवामान छान आहे', 'mr-IN')).toBe('mr-IN');
    expect(detectLanguage('آج موسم اچھا ہے', 'ur-PK')).toBe('ur-PK');
    expect(detectLanguage('Que tal', 'es-MX')).toBe('es-MX');
    expect(detectLanguage('Sure, here you go.', 'en-GB')).toBe('en-GB');
    expect(detectLanguage('It is 5 pm.', 'hi-IN')).toBe('en-IN');
  });
});

describe('neuralVoiceFor', () => {
  it('keeps the chosen voice for its own language', () => {
    expect(neuralVoiceFor('Good evening, sir.', 'en-IN', 'en-GB-RyanNeural')).toBe('en-GB-RyanNeural');
  });
  it('switches to a native voice of the same gender for other languages', () => {
    expect(neuralVoiceFor('आप कैसे हैं?', 'en-IN', 'en-GB-RyanNeural')).toBe('hi-IN-MadhurNeural');
    expect(neuralVoiceFor('आप कैसे हैं?', 'en-IN', 'en-GB-SoniaNeural')).toBe('hi-IN-SwaraNeural');
    expect(neuralVoiceFor('آپ کیسے ہیں؟', 'en-IN', 'en-US-AriaNeural')).toBe('ur-IN-GulNeural');
    expect(neuralVoiceFor('Kya haal hai? Main theek hoon.', 'en-IN', 'en-GB-RyanNeural')).toBe('en-IN-PrabhatNeural');
  });
  it('has no neural voice for Punjabi (the browser reads it)', () => {
    expect(neuralVoiceFor('ਅੱਜ ਮੌਸਮ ਵਧੀਆ ਹੈ', 'en-IN', 'en-GB-RyanNeural')).toBeNull();
  });
  it('lists a male and a female voice for every language that has them', () => {
    for (const l of LANGUAGES.filter((x) => x.voices)) {
      expect(voiceGender(l.voices[0])).toBe(0);
      expect(voiceGender(l.voices[1])).toBe(1);
    }
  });
});

describe('browserVoiceFor', () => {
  const voices = [
    { name: 'Microsoft Ryan Online (Natural)', lang: 'en-GB' },
    { name: 'Microsoft Madhur Online (Natural)', lang: 'hi-IN' },
    { name: 'Google हिन्दी', lang: 'hi-IN' },
  ];
  it('keeps the chosen voice for its language, else picks a natural one for the text', () => {
    expect(browserVoiceFor('en-IN', voices[0], voices, pickVoice)).toBe(voices[0]);
    expect(browserVoiceFor('hi-IN', voices[0], voices, pickVoice)).toBe(voices[1]);
    expect(browserVoiceFor('ta-IN', voices[0], voices, pickVoice)).toBeNull();
  });
});

describe('languageCommand', () => {
  it.each([
    ['speak in Hindi', 'hi-IN'],
    ['Switch to Urdu.', 'ur-IN'],
    ['can you talk to me in Tamil', 'ta-IN'],
    ['change the language to French', 'fr-FR'],
    ["let's talk in spanish", 'es-ES'],
    ['Hindi mein baat karo', 'hi-IN'],
    ['urdu me bolo', 'ur-IN'],
    ['हिंदी में बात करो', 'hi-IN'],
    ['اردو میں بات کرو', 'ur-IN'],
  ])('%s → %s', (text, code) => {
    expect(languageCommand(text, 'en-IN')).toBe(code);
  });
  it('keeps the user’s own variety of a language', () => {
    expect(languageCommand('speak in English', 'en-GB')).toBe('en-GB');
    expect(languageCommand('urdu mein baat karo', 'ur-PK')).toBe('ur-PK');
  });
  it('ignores everything else', () => {
    expect(languageCommand('switch to dark mode', 'en-IN')).toBeNull();
    expect(languageCommand('what is the weather in Pune', 'en-IN')).toBeNull();
    expect(languageCommand('translate good morning to Hindi and copy it to my clipboard please', 'en-IN')).toBeNull();
  });
});

// ---------- Auto: Jarvis follows the language the person speaks ----------
import { AUTO, browserLanguage, chooseLanguage, followSpeaker, languageLabel, readLanguage, readLanguageMode, speakerLanguage } from './languages.js';

describe('speakerLanguage (what to listen for next)', () => {
  it.each([
    ['आप कैसे हैं, सब ठीक?', 'en-IN', 'hi-IN'],
    ['aap kaise ho, kya haal hai', 'en-IN', 'hi-IN'], // Hinglish: the Hindi recognizer hears it best
    ['آپ کیسے ہیں؟', 'en-IN', 'ur-IN'],
    ['வணக்கம் எப்படி இருக்கீங்க', 'en-IN', 'ta-IN'],
    ['hola, ¿cómo estás? que tal', 'en-IN', 'es-ES'],
    ['what is the weather in delhi today', 'hi-IN', browserLanguage()], // clear English: back to the browser's English
    ['what is the weather in delhi today', 'en-GB', 'en-GB'], // already English: keep the variety
  ])('%s (on %s) → %s', (text, current, next) => {
    expect(speakerLanguage(text, current)).toBe(next);
  });

  it('keeps listening as before when a phrase is too short or unclear', () => {
    expect(speakerLanguage('ok', 'hi-IN')).toBeNull();
    expect(speakerLanguage('open youtube', 'hi-IN')).toBeNull();
    expect(speakerLanguage('', 'en-IN')).toBeNull();
  });
});

describe('Auto language mode', () => {
  const reset = () => localStorage.clear();

  it('is the default, starts from the browser language, and follows each sentence', () => {
    reset();
    expect(readLanguageMode()).toBe(AUTO);
    expect(browserLanguage(['hi', 'en-US'])).toBe('hi-IN');
    expect(browserLanguage(['xx-YY'])).toBe('en-IN');
    localStorage.setItem('azarvis-language', 'en-IN');
    expect(followSpeaker('मुझे कल सुबह याद दिलाना')).toBe('hi-IN');
    expect(readLanguage()).toBe('hi-IN');
    expect(languageLabel()).toBe('Auto · Hindi');
    expect(followSpeaker('please remind me to call the bank tomorrow')).toBe('en-IN'); // back to the English used before
    expect(followSpeaker('thanks a lot for the help')).toBeNull(); // no change
  });

  it('a chosen language stays put; "my language" turns Auto back on', () => {
    reset();
    chooseLanguage('ta-IN');
    expect(readLanguageMode()).toBe('fixed');
    expect(followSpeaker('what is the weather in delhi today')).toBeNull();
    expect(readLanguage()).toBe('ta-IN');
    expect(languageCommand('speak in my language')).toBe(AUTO);
    expect(languageCommand('detect my language')).toBe(AUTO);
    chooseLanguage(AUTO);
    expect(readLanguageMode()).toBe(AUTO);
    expect(followSpeaker('what is the weather in delhi today')).toBe(browserLanguage()); // no English used here yet
  });
});
