import { useEffect, useRef, useState } from 'react';

/**
 * Runs fn now and then every `ms`, but only while the browser tab is visible (Page Visibility
 * API). Hidden tabs make no requests; coming back refreshes at once.
 */
export function useVisibleInterval(fn, ms) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let timer;
    const tick = () => fnRef.current();
    const start = () => {
      clearInterval(timer);
      tick();
      timer = setInterval(tick, ms);
    };
    const onVisibility = () => (document.hidden ? clearInterval(timer) : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ms]);
}

/** The current time, updated every `ms`. Use it in the smallest component that shows the time. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useVisibleInterval(() => setNow(new Date()), ms);
  return now;
}
