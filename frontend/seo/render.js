// Static HTML for the public content pages (seo/pages.js) and the analytics consent snippet that
// both these pages and the app (index.html) use. Run at build time by vite.config.js.
import { PAGES } from './pages.js';

const PERSON = { '@type': 'Person', name: 'Aamir Hussain Azad', url: 'https://aamir-hussain-azad.vercel.app/' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SAFE_GA = /^G-[A-Z0-9]+$/;

/**
 * Google Analytics 4 with consent: nothing loads and nothing is sent until the visitor clicks
 * "Accept" in a small notice (the choice is saved in this browser). "Decline" keeps it off.
 * window.azarvisConsent.open() shows the notice again (the "Analytics settings" links).
 * Returns '' when there is no valid measurement ID, so no notice is shown either.
 */
export function analyticsSnippet(gaId) {
  if (!SAFE_GA.test(gaId || '')) return '';
  return `(function(){var K='azarvis-analytics-consent',ID='${gaId}',loaded=false;
function get(){try{return localStorage.getItem(K)}catch(e){return null}}
function put(v){try{localStorage.setItem(K,v)}catch(e){}}
function clear(){document.cookie.split(';').forEach(function(c){var n=c.split('=')[0].trim();if(/^_ga/.test(n)){var h=location.hostname;document.cookie=n+'=;Max-Age=0;path=/';document.cookie=n+'=;Max-Age=0;path=/;domain=.'+h.replace(/^www\./,'')}})}
function load(){if(loaded)return;loaded=true;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
gtag('js',new Date());gtag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false});
var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s)}
function bar(){if(document.getElementById('az-consent'))return;var d=document.createElement('div');d.id='az-consent';d.setAttribute('role','dialog');d.setAttribute('aria-label','Analytics choice');
d.innerHTML='<p>May Azarvis count visits with Google Analytics? Your messages, voice and files are never sent. <a href="/privacy">Privacy</a></p><div><button type="button" data-v="denied">Decline</button><button type="button" data-v="granted" class="az-yes">Accept</button></div>';
d.style.cssText='position:fixed;z-index:2147483000;left:12px;right:12px;bottom:12px;max-width:560px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:12px;background:#0f1522;color:#e3ecff;border:1px solid #2a3550;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.45 Inter,system-ui,sans-serif';
d.querySelectorAll('button').forEach(function(b){b.style.cssText='font:inherit;cursor:pointer;padding:7px 14px;border-radius:8px;border:1px solid #3a4a6b;background:transparent;color:inherit;margin-left:6px';if(b.className==='az-yes'){b.style.background='#22d3ee';b.style.color='#04111a';b.style.borderColor='#22d3ee'}
b.onclick=function(){var v=b.getAttribute('data-v');put(v);d.remove();if(v==='granted')load();else{clear();if(loaded)location.reload()}}});
d.querySelector('a').style.color='#67e8f9';d.querySelector('p').style.margin='0';document.body.appendChild(d)}
window.azarvisConsent={open:bar};
var c=get();if(c==='granted')load();else if(c!=='denied'){if(document.body)bar();else document.addEventListener('DOMContentLoaded',bar)}})();`;
}

const CSS = `:root{--bg:#080b14;--panel:#0d1322;--text:#f4f7ff;--muted:#a4b0c4;--line:#26344b;--accent:#00d4ff;--on:#04121a;color-scheme:dark}
@media (prefers-color-scheme:light){:root{--bg:#f5f7fc;--panel:#fff;--text:#142033;--muted:#637087;--line:#dce4ef;--accent:#087eaa;--on:#fff;color-scheme:light}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--accent)}.wrap{max-width:860px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);background:var(--panel)}header .wrap{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;padding-block:12px}
.brand{display:flex;align-items:center;gap:10px;font:700 21px/1 Inter,system-ui,sans-serif;letter-spacing:-.02em;color:var(--text);text-decoration:none;margin-right:auto}.brand img{border-radius:8px}
nav.top{display:flex;flex-wrap:wrap;gap:4px 16px}nav.top a{color:var(--muted);text-decoration:none;font-size:14px;white-space:nowrap}nav.top a:hover,nav.top a[aria-current]{color:var(--text)}
.crumbs{font-size:13px;color:var(--muted);margin:22px 0 0}.crumbs a{color:var(--muted)}
h1{font:700 clamp(28px,5vw,40px)/1.15 "Space Grotesk",Inter,sans-serif;letter-spacing:.01em;margin:10px 0 12px}h2{font:700 22px/1.3 "Space Grotesk",Inter,sans-serif;margin:30px 0 6px}
.intro{font-size:18px;color:var(--muted);margin:0 0 8px}ul{padding-left:20px}li{margin:4px 0}code{background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1px 5px;font-size:.9em}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:34px 0 10px}.btn{display:inline-block;padding:10px 18px;border-radius:10px;border:1px solid var(--line);text-decoration:none;color:var(--text);font-weight:600}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on)}
footer{margin-top:48px;border-top:1px solid var(--line);padding-block:20px;font-size:14px;color:var(--muted)}footer a{color:var(--muted);margin-right:14px}
footer button{font:inherit;background:none;border:0;padding:0;color:var(--muted);text-decoration:underline;cursor:pointer}`;

function breadcrumbs(site, page) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Azarvis', item: `${site}/` },
      { '@type': 'ListItem', position: 2, name: page.nav, item: `${site}${page.path}` },
    ],
  };
}

/** One page as a complete HTML document. site: absolute origin ('' = relative links). */
export function renderPage(page, { site = '', gaId = '', verification = '' } = {}) {
  const url = `${site}${page.path}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': page.schema || 'WebPage', name: page.title, description: page.description, url, inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'Azarvis', url: `${site}/` }, author: PERSON },
      breadcrumbs(site, page),
    ],
  };
  const body = page.sections
    .map((s) => `<section><h2>${esc(s.h2)}</h2>${s.p ? `<p>${s.p}</p>` : ''}${s.list ? `<ul>${s.list.map((li) => `<li>${li}</li>`).join('')}</ul>` : ''}</section>`)
    .join('\n');
  const nav = PAGES.filter((p) => !['/privacy', '/terms', '/contact'].includes(p.path))
    .map((p) => `<a href="${p.path}"${p.path === page.path ? ' aria-current="page"' : ''}>${esc(p.nav)}</a>`)
    .join('');
  const consent = analyticsSnippet(gaId);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
${site ? `<link rel="canonical" href="${url}" />` : ''}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Azarvis AI Assistant" />
<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(page.description)}" />
${site ? `<meta property="og:url" content="${url}" />\n<meta property="og:image" content="${site}/og-image.png" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
${verification ? `<meta name="google-site-verification" content="${esc(verification)}" />` : ''}
<meta name="theme-color" content="#0b0d12" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family="Space Grotesk":wght@600;700&family=Inter:wght@400;600&display=swap" media="print" onload="this.media='all'" />
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${consent ? `<script>${consent}</script>` : ''}
</head>
<body>
<header><div class="wrap"><a class="brand" href="/"><img src="/icon.svg" alt="" width="30" height="30" />Azarvis</a><nav class="top" aria-label="Site">${nav}</nav></div></header>
<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Azarvis</a> › <span aria-current="page">${esc(page.nav)}</span></nav>
<h1>${esc(page.h1)}</h1>
<p class="intro">${esc(page.intro)}</p>
${body}
<div class="cta"><a class="btn primary" href="/?page=demo">Try the live demo</a><a class="btn" href="/?page=signup">Create a free account</a></div>
</main>
<footer><div class="wrap"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a>${consent ? '<button type="button" onclick="window.azarvisConsent&&azarvisConsent.open()">Analytics settings</button>' : ''}<p>Azarvis by <a href="https://aamir-hussain-azad.vercel.app/" rel="noopener">Aamir Hussain Azad</a></p></div></footer>
</body>
</html>
`;
}

/** The sitemap: the home page, the demo and every content page (sign-in pages are left out). */
export function sitemap(site, today) {
  const urls = [['/', 'weekly', '1.0'], ['/?page=demo', 'weekly', '0.8'], ...PAGES.map((p) => [p.path, 'monthly', ['/privacy', '/terms'].includes(p.path) ? '0.3' : '0.7'])];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(([path, freq, priority]) => `  <url><loc>${site}${path.replace(/&/g, '&amp;')}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

export { PAGES };
