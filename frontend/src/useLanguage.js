import { useEffect, useState } from 'react';
import { LANGUAGE_EVENT, readLanguage } from './languages.js';

/** The language Jarvis listens for (Account → Voice, or "speak in Hindi"), kept up to date. */
export function useLanguage() {
  const [lang, setLang] = useState(readLanguage);
  useEffect(() => {
    const update = () => setLang(readLanguage());
    window.addEventListener(LANGUAGE_EVENT, update);
    window.addEventListener('storage', update); // changed in another tab
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return lang;
}
