import net from 'node:net';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Development only. When the local API (localhost:4000) isn't running, typically because only
 * the frontend was started ("npm run dev" inside frontend/), /api requests go to the LIVE
 * Azarvis API instead of failing with "Can't reach the Azarvis server". Accounts made this way
 * are real. AZARVIS_LIVE_API=off turns this off; AZARVIS_LIVE_API=<url> picks another API.
 */
function liveApiFallback() {
  const live = (process.env.AZARVIS_LIVE_API || 'https://azarvis-api.vercel.app').replace(/\/$/, '');
  let localUp = false;
  let checkedAt = 0;
  let warned = false;
  const probe = () =>
    new Promise((resolve) => {
      const s = net.connect(4000, '127.0.0.1');
      const done = (up) => {
        s.destroy();
        resolve(up);
      };
      s.setTimeout(400, () => done(false));
      s.once('connect', () => done(true));
      s.once('error', () => done(false));
    });
  const readBody = async (req) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    return chunks.length ? Buffer.concat(chunks) : undefined;
  };
  // Hop-by-hop headers and ones fetch() sets itself are not copied.
  const SKIP_REQ = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'keep-alive', 'transfer-encoding']);
  const SKIP_RES = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive', 'set-cookie']);

  return {
    name: 'azarvis-live-api-fallback',
    apply: 'serve',
    configureServer(server) {
      if (live === 'off') return;
      // Added here (not returned), so it runs before Vite's own /api proxy.
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        if (Date.now() - checkedAt > 3000) {
          localUp = await probe();
          checkedAt = Date.now();
        }
        if (localUp) return next(); // the normal local proxy
        if (!warned) {
          warned = true;
          server.config.logger.warn(
            `\n  Local API (localhost:4000) is not running, so /api uses the LIVE API: ${live}\n` +
              '  Accounts you create are real. For a local API, run "npm run dev" in the main project folder.\n',
          );
        }
        try {
          const headers = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !SKIP_REQ.has(k)));
          const upstream = await fetch(live + req.url, {
            method: req.method,
            headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req),
            redirect: 'manual',
          });
          res.statusCode = upstream.status;
          upstream.headers.forEach((value, key) => !SKIP_RES.has(key) && res.setHeader(key, value));
          const cookies = upstream.headers.getSetCookie();
          if (cookies.length) res.setHeader('set-cookie', cookies);
          res.setHeader('x-azarvis-api', 'live');
          if (upstream.body) for await (const chunk of upstream.body) res.write(chunk); // streams chat replies too
          res.end();
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: `Neither the local API nor the live API (${live}) answered: ${err.message}`, code: 'API_UNREACHABLE' }));
        }
      });
    },
  };
}

/**
 * SEO files that depend on where the app is deployed (VITE_SITE_URL, see .env.example):
 * absolute canonical / Open Graph links, the Google Search Console verification tag, Google
 * Analytics (VITE_GA_ID), robots.txt and sitemap.xml. Without VITE_SITE_URL the links stay relative and there is no sitemap.
 */
function seo(env) {
  const vercelSite = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
  const site = (env.VITE_SITE_URL || vercelSite).replace(/\/$/, '');
  const verification = env.VITE_GOOGLE_SITE_VERIFICATION || '';
  const gaId = /^G-[A-Z0-9]+$/.test((env.VITE_GA_ID || '').trim()) ? env.VITE_GA_ID.trim() : '';
  return {
    name: 'jarvis-seo',
    transformIndexHtml() {
      const meta = (attrs) => ({ tag: 'meta', attrs, injectTo: 'head' });
      const tags = [meta({ property: 'og:image', content: `${site}/og-image.png` })];
      if (site) {
        tags.push({ tag: 'link', attrs: { rel: 'canonical', href: `${site}/` }, injectTo: 'head' });
        tags.push(meta({ property: 'og:url', content: `${site}/` }));
        tags.push(meta({ name: 'twitter:image', content: `${site}/og-image.png` }));
      }
      if (verification) tags.push(meta({ name: 'google-site-verification', content: verification }));
      // Structured data for the site itself: helps Google show "Azarvis" as the site name and
      // connect the app to Aamir's profiles (the app and FAQ data are in index.html / Landing.jsx).
      tags.push({
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Azarvis',
          alternateName: ['Azarvis AI', 'Azarvis AI Assistant', 'Azarvis by Aamir Hussain Azad'],
          ...(site ? { url: `${site}/` } : {}),
          inLanguage: 'en-IN',
          publisher: { '@type': 'Person', name: 'Aamir Hussain Azad', url: 'https://aamir-hussain-azad.vercel.app/' },
        }),
        injectTo: 'head',
      });
      if (gaId) {
        // Google Analytics 4. The ID was checked against /^G-[A-Z0-9]+$/, so it is safe inside the script.
        tags.push({ tag: 'script', attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${gaId}` }, injectTo: 'head' });
        tags.push({
          tag: 'script',
          children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`,
          injectTo: 'head',
        });
      }
      return tags;
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', 'Disallow: /api/', ...(site ? [`Sitemap: ${site}/sitemap.xml`] : [])];
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });
      if (site) {
        const today = new Date().toISOString().slice(0, 10);
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...[
              ['/', 'weekly', '1.0'],
              ['/?page=demo', 'weekly', '0.8'],
              ['/?page=signup', 'monthly', '0.6'],
              ['/?page=login', 'monthly', '0.5'],
            ].map(([path, freq, priority]) => `  <url><loc>${site}${path.replace('&', '&amp;')}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`),
            '</urlset>',
            '',
          ].join('\n'),
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), seo(env), liveApiFallback()],
    server: {
      port: 5173,
      // Only with "npm run dev -- --phone": reachable from other devices on the home Wi-Fi.
      host: process.env.JARVIS_PHONE === '1' ? true : 'localhost',
      proxy: { '/api': 'http://localhost:4000' },
    },
    build: {
      target: 'es2022',
      rollupOptions: {
        output: {
          // Libraries change rarely, so they get their own long-cached files: an app update
          // re-downloads only the app code, not React or the Markdown renderer.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react';
            // Formulas and tables are only needed by Notes: keep them out of what Chat downloads.
            if (/[\/](katex|rehype-katex|remark-math|remark-gfm|micromark-extension-(math|gfm[^\/]*)|mdast-util-(math|gfm[^\/]*)|hast-util-from-dom|hast-util-to-text|unist-util-find-after|ccount|escape-string-regexp|markdown-table)[\/]/.test(id)) return 'notes-vendor';
            return 'vendor';
          },
        },
      },
    },
  };
});
