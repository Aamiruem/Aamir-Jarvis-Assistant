// Every language Jarvis can hear and speak. Pure helpers (no React) so they are unit-tested.
//
//   Hearing: the browser's recognizer listens for ONE language at a time, the one chosen in
//            Account → Voice (or switched by voice: "speak in Hindi", "Urdu mein baat karo").
//   Speaking: each sentence of a reply is checked for its language (by script, then common words)
//            and read by a native neural voice of that language, same gender as the chosen voice.
//            English keeps the user's own chosen voice (e.g. the British "Jarvis").
//
// voices: [male, female] Microsoft neural voices (edge-tts names, see backend routers/tts.py).
// null = no neural voice exists for it: the browser's own voice reads it.
export const LANGUAGES = [
  { code: 'en-IN', name: 'English (India)', native: 'English', script: 'latn', names: ['english', 'angrezi', 'अंग्रेज़ी', 'अंग्रेजी', 'इंग्लिश', 'انگریزی'], voices: ['en-IN-PrabhatNeural', 'en-IN-NeerjaNeural'], hello: "Sure, let's talk in English. How can I help you?" },
  { code: 'en-US', name: 'English (US)', native: 'English', script: 'latn', names: [], voices: ['en-US-AndrewNeural', 'en-US-AvaNeural'], hello: "Sure, let's talk in English. How can I help you?" },
  { code: 'en-GB', name: 'English (UK)', native: 'English', script: 'latn', names: [], voices: ['en-GB-RyanNeural', 'en-GB-SoniaNeural'], hello: "Of course, let's talk in English. How can I help?" },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', script: 'deva', names: ['hindi', 'हिंदी', 'हिन्दी', 'ہندی'], voices: ['hi-IN-MadhurNeural', 'hi-IN-SwaraNeural'], hello: 'ठीक है, अब हम हिंदी में बात करते हैं। बताइए, मैं आपकी क्या मदद करूँ?' },
  { code: 'ur-IN', name: 'Urdu (India)', native: 'اردو', script: 'arab', names: ['urdu', 'उर्दू', 'اردو'], voices: ['ur-IN-SalmanNeural', 'ur-IN-GulNeural'], hello: 'ٹھیک ہے، اب ہم اردو میں بات کرتے ہیں۔ بتائیے، میں آپ کی کیا مدد کروں؟' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)', native: 'اردو', script: 'arab', names: [], voices: ['ur-PK-AsadNeural', 'ur-PK-UzmaNeural'], hello: 'ٹھیک ہے، اب ہم اردو میں بات کرتے ہیں۔ بتائیے، میں آپ کی کیا مدد کروں؟' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', script: 'beng', names: ['bengali', 'bangla', 'বাংলা', 'बंगाली'], voices: ['bn-IN-BashkarNeural', 'bn-IN-TanishaaNeural'], hello: 'ঠিক আছে, এখন আমরা বাংলায় কথা বলি। বলুন, আমি কীভাবে সাহায্য করতে পারি?' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'guru', names: ['punjabi', 'panjabi', 'ਪੰਜਾਬੀ', 'पंजाबी', 'پنجابی'], voices: null, hello: 'ਠੀਕ ਹੈ, ਹੁਣ ਅਸੀਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਦੇ ਹਾਂ। ਦੱਸੋ, ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰਾਂ?' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', script: 'gujr', names: ['gujarati', 'ગુજરાતી', 'गुजराती'], voices: ['gu-IN-NiranjanNeural', 'gu-IN-DhwaniNeural'], hello: 'ઠીક છે, હવે આપણે ગુજરાતીમાં વાત કરીએ. કહો, હું તમારી શું મદદ કરું?' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', script: 'deva', names: ['marathi', 'मराठी'], voices: ['mr-IN-ManoharNeural', 'mr-IN-AarohiNeural'], hello: 'ठीक आहे, आता आपण मराठीत बोलूया. सांगा, मी तुमची काय मदत करू?' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', script: 'taml', names: ['tamil', 'தமிழ்', 'तमिल'], voices: ['ta-IN-ValluvarNeural', 'ta-IN-PallaviNeural'], hello: 'சரி, இனி தமிழில் பேசலாம். சொல்லுங்கள், நான் எப்படி உதவலாம்?' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', script: 'telu', names: ['telugu', 'తెలుగు', 'तेलुगु'], voices: ['te-IN-MohanNeural', 'te-IN-ShrutiNeural'], hello: 'సరే, ఇప్పుడు తెలుగులో మాట్లాడుకుందాం. చెప్పండి, నేను మీకు ఎలా సహాయం చేయగలను?' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'knda', names: ['kannada', 'ಕನ್ನಡ', 'कन्नड़'], voices: ['kn-IN-GaganNeural', 'kn-IN-SapnaNeural'], hello: 'ಸರಿ, ಈಗ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡೋಣ. ಹೇಳಿ, ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', script: 'mlym', names: ['malayalam', 'മലയാളം', 'मलयालम'], voices: ['ml-IN-MidhunNeural', 'ml-IN-SobhanaNeural'], hello: 'ശരി, ഇനി നമുക്ക് മലയാളത്തിൽ സംസാരിക്കാം. പറയൂ, ഞാൻ എങ്ങനെ സഹായിക്കാം?' },
  { code: 'ne-NP', name: 'Nepali', native: 'नेपाली', script: 'deva', names: ['nepali', 'नेपाली'], voices: ['ne-NP-SagarNeural', 'ne-NP-HemkalaNeural'], hello: 'ठिक छ, अब हामी नेपालीमा कुरा गरौं। भन्नुहोस्, म तपाईंलाई कसरी मद्दत गर्न सक्छु?' },
  { code: 'ar-SA', name: 'Arabic', native: 'العربية', script: 'arab', names: ['arabic', 'العربية', 'عربی', 'अरबी'], voices: ['ar-SA-HamedNeural', 'ar-SA-ZariyahNeural'], hello: 'حسنًا، لنتحدث بالعربية الآن. كيف يمكنني مساعدتك؟' },
  { code: 'fa-IR', name: 'Persian', native: 'فارسی', script: 'arab', names: ['persian', 'farsi', 'فارسی'], voices: ['fa-IR-FaridNeural', 'fa-IR-DilaraNeural'], hello: 'باشه، حالا فارسی صحبت کنیم. چطور می‌توانم کمکتان کنم؟' },
  { code: 'ps-AF', name: 'Pashto', native: 'پښتو', script: 'arab', names: ['pashto', 'pushto', 'پښتو'], voices: ['ps-AF-GulNawazNeural', 'ps-AF-LatifaNeural'], hello: 'ښه، اوس به په پښتو خبرې وکړو. زه څنګه مرسته کولی شم؟' },
  { code: 'es-ES', name: 'Spanish (Spain)', native: 'Español', script: 'latn', names: ['spanish', 'español', 'espanol'], voices: ['es-ES-AlvaroNeural', 'es-ES-ElviraNeural'], hello: '¡Claro! Hablemos en español. ¿En qué te puedo ayudar?' },
  { code: 'es-MX', name: 'Spanish (Mexico)', native: 'Español', script: 'latn', names: [], voices: ['es-MX-JorgeNeural', 'es-MX-DaliaNeural'], hello: '¡Claro! Hablemos en español. ¿En qué te puedo ayudar?' },
  { code: 'fr-FR', name: 'French', native: 'Français', script: 'latn', names: ['french', 'français', 'francais'], voices: ['fr-FR-HenriNeural', 'fr-FR-DeniseNeural'], hello: "D'accord, parlons en français. Comment puis-je vous aider ?" },
  { code: 'de-DE', name: 'German', native: 'Deutsch', script: 'latn', names: ['german', 'deutsch'], voices: ['de-DE-ChristophNeural', 'de-DE-TanjaNeural'], hello: 'Alles klar, sprechen wir Deutsch. Wie kann ich helfen?' },
  { code: 'it-IT', name: 'Italian', native: 'Italiano', script: 'latn', names: ['italian', 'italiano'], voices: ['it-IT-DiegoNeural', 'it-IT-ElsaNeural'], hello: 'Certo, parliamo in italiano. Come posso aiutarti?' },
  { code: 'pt-BR', name: 'Portuguese', native: 'Português', script: 'latn', names: ['portuguese', 'português', 'portugues'], voices: ['pt-BR-AntonioNeural', 'pt-BR-FranciscaNeural'], hello: 'Claro, vamos falar em português. Como posso ajudar?' },
  { code: 'ru-RU', name: 'Russian', native: 'Русский', script: 'cyrl', names: ['russian', 'русский'], voices: ['ru-RU-DmitryNeural', 'ru-RU-SvetlanaNeural'], hello: 'Хорошо, давайте говорить по-русски. Чем могу помочь?' },
  { code: 'uk-UA', name: 'Ukrainian', native: 'Українська', script: 'cyrl', names: ['ukrainian', 'українська'], voices: ['uk-UA-OstapNeural', 'uk-UA-PolinaNeural'], hello: 'Добре, давайте говорити українською. Чим можу допомогти?' },
  { code: 'tr-TR', name: 'Turkish', native: 'Türkçe', script: 'latn', names: ['turkish', 'türkçe', 'turkce'], voices: ['tr-TR-AhmetNeural', 'tr-TR-EmelNeural'], hello: 'Tamam, Türkçe konuşalım. Nasıl yardımcı olabilirim?' },
  { code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', script: 'latn', names: ['indonesian', 'bahasa'], voices: ['id-ID-ArdiNeural', 'id-ID-GadisNeural'], hello: 'Baik, mari kita bicara dalam bahasa Indonesia. Ada yang bisa saya bantu?' },
  { code: 'ms-MY', name: 'Malay', native: 'Bahasa Melayu', script: 'latn', names: ['malay', 'melayu'], voices: ['ms-MY-OsmanNeural', 'ms-MY-YasminNeural'], hello: 'Baiklah, mari kita bercakap dalam bahasa Melayu. Apa yang boleh saya bantu?' },
  { code: 'zh-CN', name: 'Chinese', native: '中文', script: 'hani', names: ['chinese', 'mandarin', '中文'], voices: ['zh-CN-YunxiNeural', 'zh-CN-XiaoxiaoNeural'], hello: '好的，我们用中文聊吧。有什么可以帮你的？' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語', script: 'kana', names: ['japanese', '日本語'], voices: ['ja-JP-KeitaNeural', 'ja-JP-NanamiNeural'], hello: 'わかりました。日本語で話しましょう。何をお手伝いしましょうか？' },
  { code: 'ko-KR', name: 'Korean', native: '한국어', script: 'hang', names: ['korean', '한국어'], voices: ['ko-KR-InJoonNeural', 'ko-KR-SunHiNeural'], hello: '좋아요, 이제 한국어로 이야기해요. 무엇을 도와드릴까요?' },
  { code: 'th-TH', name: 'Thai', native: 'ไทย', script: 'thai', names: ['thai', 'ไทย'], voices: ['th-TH-NiwatNeural', 'th-TH-PremwadeeNeural'], hello: 'ได้เลย มาคุยกันเป็นภาษาไทยนะ มีอะไรให้ช่วยไหม' },
  { code: 'vi-VN', name: 'Vietnamese', native: 'Tiếng Việt', script: 'latn', names: ['vietnamese', 'tiếng việt'], voices: ['vi-VN-NamMinhNeural', 'vi-VN-HoaiMyNeural'], hello: 'Được rồi, mình nói tiếng Việt nhé. Tôi có thể giúp gì cho bạn?' },
  { code: 'nl-NL', name: 'Dutch', native: 'Nederlands', script: 'latn', names: ['dutch', 'nederlands'], voices: ['nl-NL-MaartenNeural', 'nl-NL-ColetteNeural'], hello: 'Prima, laten we Nederlands praten. Waarmee kan ik helpen?' },
  { code: 'pl-PL', name: 'Polish', native: 'Polski', script: 'latn', names: ['polish', 'polski'], voices: ['pl-PL-MarekNeural', 'pl-PL-ZofiaNeural'], hello: 'Dobrze, porozmawiajmy po polsku. W czym mogę pomóc?' },
  { code: 'he-IL', name: 'Hebrew', native: 'עברית', script: 'hebr', names: ['hebrew', 'עברית'], voices: ['he-IL-AvriNeural', 'he-IL-HilaNeural'], hello: 'בסדר, בוא נדבר בעברית. איך אפשר לעזור?' },
  { code: 'el-GR', name: 'Greek', native: 'Ελληνικά', script: 'grek', names: ['greek', 'ελληνικά'], voices: ['el-GR-NestorasNeural', 'el-GR-AthinaNeural'], hello: 'Εντάξει, ας μιλήσουμε ελληνικά. Πώς μπορώ να βοηθήσω;' },
  { code: 'sw-KE', name: 'Swahili', native: 'Kiswahili', script: 'latn', names: ['swahili', 'kiswahili'], voices: ['sw-KE-RafikiNeural', 'sw-KE-ZuriNeural'], hello: 'Sawa, tuzungumze kwa Kiswahili. Nikusaidie nini?' },
];

export const DEFAULT_LANGUAGE = 'en-IN';
const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));
export const languageInfo = (code) => BY_CODE.get(code) || BY_CODE.get(DEFAULT_LANGUAGE);
const base = (code) => (code || '').split('-')[0].toLowerCase();

// ---------- The language Jarvis listens for (saved in this browser) ----------
const KEY = 'azarvis-language';
export const LANGUAGE_EVENT = 'azarvis-language-change';

export function readLanguage() {
  try {
    const saved = localStorage.getItem(KEY);
    return BY_CODE.has(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(code) {
  if (!BY_CODE.has(code)) return;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // storage blocked: applies until the page reloads
  }
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: code }));
}

// ---------- Which language a piece of text is in ----------
const SCRIPTS = {
  deva: /[ऀ-ॿ]/g,
  arab: /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g,
  beng: /[ঀ-৿]/g,
  guru: /[਀-੿]/g,
  gujr: /[઀-૿]/g,
  taml: /[஀-௿]/g,
  telu: /[ఀ-౿]/g,
  knda: /[ಀ-೿]/g,
  mlym: /[ഀ-ൿ]/g,
  thai: /[฀-๿]/g,
  hebr: /[֐-׿]/g,
  grek: /[Ͱ-Ͽ]/g,
  cyrl: /[Ѐ-ӿ]/g,
  hang: /[가-힯ᄀ-ᇿ㄰-㆏]/g,
  kana: /[぀-ヿ]/g,
  hani: /[一-鿿]/g,
  latn: /[A-Za-zÀ-ɏḀ-ỿ]/g,
};
const ONE_LANGUAGE = { beng: 'bn-IN', guru: 'pa-IN', gujr: 'gu-IN', taml: 'ta-IN', telu: 'te-IN', knda: 'kn-IN', mlym: 'ml-IN', thai: 'th-TH', hebr: 'he-IL', grek: 'el-GR', hang: 'ko-KR', kana: 'ja-JP' };

// Common little words of Latin-script languages (and Hinglish: Hindi typed in English letters).
const COMMON = {
  'hi-Latn': 'hai hain kya kaise kaisa kaun kahan kab nahi nahin mein mai main mujhe tum aap aapka aapki hum ham karo karna kar raha rahi tha thi aur bhi toh yeh woh accha acha theek thik haan bahut kuch kyun kyon batao bolo chahiye sakta sakte wala wali hoga',
  'es-ES': 'el la los las que de y en un una es por para con no se lo como más pero sus le ya o muy también hola gracias qué está estoy',
  'fr-FR': 'le la les des est et en un une du que qui pas pour sur avec ne se dans ce il elle je vous nous mais très bonjour merci',
  'de-DE': 'der die das und ist nicht ein eine ich du sie es mit den dem zu auf für sich auch wir ihr mein kann sehr hallo danke',
  'it-IT': 'il lo la gli le di che è e un una per non sono con mi ti si ma anche molto ciao grazie questo',
  'pt-BR': 'o a os as de que e é um uma não para com em do da dos se por mais mas você eu muito olá obrigado',
  'nl-NL': 'de het een en is van ik je niet dat die op te zijn met voor maar ook wat hallo dank',
  'tr-TR': 've bir bu da de ne için ben sen mi çok var yok ama gibi daha merhaba teşekkür',
  'id-ID': 'yang dan di ini itu dengan untuk tidak ada saya kamu anda dari ke akan bisa juga apa terima kasih',
  'pl-PL': 'i w nie to jest się na że z co jak ale tak do czy jestem dziękuję cześć',
  'sw-KE': 'na ya wa ni kwa za katika la hii kama sana habari asante ndiyo hapana',
};
const COMMON_SETS = Object.fromEntries(Object.entries(COMMON).map(([k, v]) => [k, new Set(v.split(' '))]));

/**
 * The language of a sentence, as a code from LANGUAGES, or 'hi-Latn' for Hinglish.
 * hint: the language the user speaks (from Account → Voice): breaks ties such as Hindi vs
 * Marathi (both Devanagari) or Urdu vs Arabic, and wins for Latin text when it is not English.
 */
export function detectLanguage(text, hint = DEFAULT_LANGUAGE) {
  const t = text || '';
  const counts = Object.entries(SCRIPTS).map(([s, re]) => [s, (t.match(re) || []).length]);
  const [script, n] = counts.reduce((a, b) => (b[1] > a[1] ? b : a));
  const hb = base(hint);
  const hintIs = (...bases) => bases.includes(hb);
  if (!n) return hint;
  if (script === 'hani' && counts.find(([s]) => s === 'kana')[1] > 0) return 'ja-JP';
  if (ONE_LANGUAGE[script]) return ONE_LANGUAGE[script];
  switch (script) {
    case 'deva':
      return hintIs('mr', 'ne') ? hint : 'hi-IN';
    case 'arab':
      if (hintIs('ur', 'fa', 'ps', 'ar')) return hint;
      if (/[ټډړږښځڅ]/.test(t)) return 'ps-AF';
      if (/[ٹڈڑںےھ]/.test(t)) return hint.endsWith('-PK') ? 'ur-PK' : 'ur-IN';
      if (/[پچژگکی]/.test(t)) return 'fa-IR';
      return 'ar-SA';
    case 'cyrl':
      return hintIs('uk') || /[іїєґ]/i.test(t) ? 'uk-UA' : 'ru-RU';
    case 'hani':
      return hintIs('ja') ? 'ja-JP' : 'zh-CN';
    default: {
      // Latin letters: the user's own language if it is a Latin one, else guess from common words.
      if (!hintIs('en') && languageInfo(hint).script === 'latn' && BY_CODE.has(hint)) return hint;
      if (/[ăâđêôơư]/i.test(t) && /[ạảãấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏõốồổỗộớờởỡợụủũứừửữựỳỷỹỵ]/i.test(t)) return 'vi-VN';
      const words = t.toLowerCase().match(/[\p{L}\p{M}']+/gu) || [];
      let bestCode = null;
      let bestHits = 0;
      for (const [code, set] of Object.entries(COMMON_SETS)) {
        const hits = words.filter((w) => set.has(w)).length;
        if (hits > bestHits) [bestCode, bestHits] = [code, hits];
      }
      const english = words.filter((w) => ENGLISH.has(w)).length;
      if (bestCode && bestHits >= 2 && bestHits > english && bestHits / words.length >= 0.2) return bestCode;
      return hintIs('en') ? hint : DEFAULT_LANGUAGE;
    }
  }
}
const ENGLISH = new Set('the a an is are was were i you he she it we they to of and in on for with that this what how my your me be do have not can will at it\'s i\'m'.split(' '));

/** The locale a browser voice should use for a detected language. */
export const speechLocale = (code) => (code === 'hi-Latn' ? 'en-IN' : code);

const FEMALE = new Set(['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-EmmaMultilingualNeural', 'en-US-AvaMultilingualNeural', 'en-IN-NeerjaExpressiveNeural', 'en-GB-LibbyNeural']);
/** 1 for a female neural voice, 0 for male. */
export function voiceGender(voiceId) {
  if (FEMALE.has(voiceId)) return 1;
  for (const l of LANGUAGES) if (l.voices?.[1] === voiceId) return 1;
  return 0;
}

/**
 * The neural voice for one sentence: the user's own voice when it already speaks that language,
 * else a native voice of the language with the same gender. null = no neural voice for it.
 */
export function neuralVoiceFor(text, hint, chosenVoice) {
  const code = detectLanguage(text, hint);
  const gender = voiceGender(chosenVoice);
  // Hinglish sounds right in an Indian English voice, not a British or American one.
  if (code === 'hi-Latn') return chosenVoice?.startsWith('en-IN') ? chosenVoice : BY_CODE.get('en-IN').voices[gender];
  if (base(chosenVoice) === base(code)) return chosenVoice;
  const voices = BY_CODE.get(code)?.voices;
  return voices ? voices[gender] : null;
}

/**
 * The installed browser voice for a detected language: the chosen one when it speaks it, else
 * the most natural installed voice for it (pickVoice), else none (the browser chooses by lang).
 */
export function browserVoiceFor(code, chosen, voices, pickVoice) {
  const locale = speechLocale(code);
  if (chosen && base(chosen.lang) === base(locale) && code !== 'hi-Latn') return chosen;
  return pickVoice(voices, locale) || null;
}

// ---------- Switching language by voice ----------
const NAME_TO_CODE = new Map();
for (const l of LANGUAGES) for (const n of l.names) NAME_TO_CODE.set(n.toLowerCase(), l.code);

/**
 * "speak in Hindi", "switch to Urdu", "talk to me in Tamil", "Hindi mein baat karo",
 * "हिंदी में बात करो", "اردو میں بات کرو" → that language's code. Anything else → null.
 * current: keeps the user's own variety ("English" while on en-GB stays en-GB).
 */
export function languageCommand(text, current = DEFAULT_LANGUAGE) {
  const t = (text || '').trim().replace(/[.!?।۔]+$/, '').toLowerCase();
  if (t.split(/\s+/).length > 8) return null;
  const patterns = [
    /^(?:(?:please|can you|could you|ok|okay|jarvis|azarvis)[\s,]+)*(?:speak|talk|switch|change(?: the)? language)(?: to me| with me)?(?: in| to)\s+([\p{L}\p{M} ]+?)(?:\s+(?:language|please|now|from now on))*$/u,
    /^(?:let's|lets) (?:speak|talk) (?:in )?([\p{L}\p{M} ]+?)(?: now)?$/u,
    /^([\p{L}\p{M}]+(?: [\p{L}\p{M}]+)?)\s+(?:mein|me|mai|main|में|मे|میں)\s+(?:baat|bolo|bol|boliye|baatein|jawab|बात|बोलो|बोलिए|बोल|जवाब|بات|بولو|بولیں|جواب)/u,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (!m) continue;
    const code = NAME_TO_CODE.get(m[1].trim());
    if (!code) return null;
    return base(code) === base(current) ? current : code;
  }
  return null;
}
