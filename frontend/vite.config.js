import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * SEO files that depend on where the app is deployed (VITE_SITE_URL, see .env.example):
 * absolute canonical / Open Graph links, the Google Search Console verification tag,
 * robots.txt and sitemap.xml. Without VITE_SITE_URL the links stay relative and there is no sitemap.
 */
function seo(env) {
  const site = (env.VITE_SITE_URL || '').replace(/\/$/, '');
  const verification = env.VITE_GOOGLE_SITE_VERIFICATION || '';
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
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), seo(env)],
    server: {
      port: 5173,
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
            return 'vendor';
          },
        },
      },
    },
  };
});
