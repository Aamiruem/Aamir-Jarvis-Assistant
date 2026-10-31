import { useEffect, useState } from 'react';

// Color theme: "dark", "light" or "system" (follows Windows). Saved per browser, applied as
// <html data-theme="dark|light">; index.html sets it before React loads so there's no flash.
const KEY = 'jarvis-theme';
const media = window.matchMedia('(prefers-color-scheme: light)');

const read = () => {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
};
const resolve = (choice) => (choice === 'system' ? (media.matches ? 'light' : 'dark') : choice);

export function useTheme() {
  const [choice, setChoice] = useState(read);

  useEffect(() => {
    const apply = () => {
      const mode = resolve(choice);
      document.documentElement.dataset.theme = mode;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'light' ? '#f4f7fd' : '#050816');
    };
    apply();
    try {
      localStorage.setItem(KEY, choice);
    } catch {}
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [choice]);

  return { choice, mode: resolve(choice), setChoice };
}
