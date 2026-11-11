import { useEffect, useRef, useState } from 'react';

// Speech-to-text with the browser's own recognizer (Chrome, Edge, Safari; not Firefox).
// For the website and the demo: one phrase at a time, shown live while you speak.
const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

/**
 * @param {(text: string) => void} onFinal called with what was said, when the speaker stops
 * @returns {{ supported: boolean, listening: boolean, transcript: string, error: string, start: () => void, stop: () => void }}
 */
export function useListen(onFinal, lang = 'en-IN') {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const rec = useRef(null);
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;

  useEffect(() => () => rec.current?.abort(), []);

  const start = () => {
    if (!Recognition) return setError('Voice input needs Chrome, Edge or Safari. You can type instead.');
    rec.current?.abort();
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = true;
    r.maxAlternatives = 1;
    let heard = '';
    r.onresult = (e) => {
      heard = Array.from(e.results).map((res) => res[0].transcript).join(' ').trim();
      setTranscript(heard);
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Microphone blocked. Allow it in the address bar, or type instead.');
      else if (e.error === 'no-speech') setError("I didn't hear anything. Tap the mic and try again.");
      else if (e.error !== 'aborted') setError(`Voice input stopped (${e.error}).`);
    };
    r.onend = () => {
      setListening(false);
      rec.current = null;
      if (heard) finalRef.current?.(heard);
    };
    setError('');
    setTranscript('');
    rec.current = r;
    setListening(true);
    r.start();
  };

  const stop = () => rec.current?.stop();

  return { supported: Boolean(Recognition), listening, transcript, error, start, stop };
}
