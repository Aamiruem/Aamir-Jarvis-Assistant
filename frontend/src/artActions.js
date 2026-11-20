// Actions behind the tappable spots in page pictures (PageHeader `spots`). Each spot runs a real
// feature: open a screen, ask Azarvis, start voice, search, or jump to a field on the page.
// App.jsx listens for ACTION_EVENT and does the app-level ones.
export const ACTION_EVENT = 'azarvis:action';

const send = (detail) => window.dispatchEvent(new CustomEvent(ACTION_EVENT, { detail }));

/** Open a screen; `anchor` (a CSS selector) is scrolled to and highlighted once it renders. */
export const openTab = (tab, anchor) => send({ tab, anchor });
/** Open a fresh chat with this text; now = true sends it at once, otherwise it waits in the box. */
export const askAzarvis = (text, now = false) => send({ ask: text, send: now });
export const startVoice = () => send({ voice: true });
export const openSearch = (query = '') => send({ search: query });

/**
 * Scroll an element on this page into view, then focus it (or click it with click: true) and
 * flash it so you see where you landed. `text` picks the match containing that text, `nth` the
 * nth match. Returns false when there is no such element, or it is disabled.
 */
export function reach(selector, { click = false, text, nth = 0 } = {}) {
  const all = [...document.querySelectorAll(selector)];
  const el = text ? all.find((e) => e.textContent.includes(text)) : all[nth];
  if (!el || el.disabled) return false;
  el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  if (click) el.click();
  else el.focus?.({ preventScroll: true });
  el.classList.add('spot-flash');
  setTimeout(() => el.classList.remove('spot-flash'), 1600);
  return true;
}

/** reach(), retried for a moment: for a screen that is still loading. */
export function reachWhenReady(selector, tries = 20) {
  if (reach(selector) || tries <= 0) return;
  setTimeout(() => reachWhenReady(selector, tries - 1), 150);
}
