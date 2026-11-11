// Google Analytics 4 (only when VITE_GA_ID is set: index.html then loads gtag; otherwise these
// do nothing). Page views for the single-page routes (?page=demo …) and a few key actions:
// demo opened, sign-up started, feedback sent, voice used, project opened.

export function track(event, params = {}) {
  try {
    window.gtag?.('event', event, params);
  } catch {}
}

export function pageView(title) {
  try {
    window.gtag?.('event', 'page_view', { page_title: title, page_location: window.location.href });
  } catch {}
}
