// The public content pages and analytics consent (seo/pages.js, seo/render.js): every page is
// unique, well-formed for search engines, and Google Analytics sends nothing before "Accept".
import { beforeEach, describe, expect, it } from 'vitest';
import { analyticsSnippet, PAGES, renderPage, sitemap } from '../seo/render.js';

const SITE = 'https://azarvis-app.vercel.app';
const parse = (html) => new DOMParser().parseFromString(html, 'text/html');

describe('content pages', () => {
  it('have unique paths, titles and descriptions of a searchable length', () => {
    for (const key of ['path', 'title', 'description']) expect(new Set(PAGES.map((p) => p[key])).size).toBe(PAGES.length);
    for (const p of PAGES) {
      expect(p.path).toMatch(/^\/[a-z-]+$/);
      expect(p.title.length).toBeLessThanOrEqual(65);
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('render with one h1, a canonical link and valid structured data', () => {
    for (const p of PAGES) {
      const doc = parse(renderPage(p, { site: SITE }));
      expect(doc.title).toBe(p.title);
      expect(doc.querySelectorAll('h1')).toHaveLength(1);
      expect(doc.querySelector('link[rel=canonical]').getAttribute('href')).toBe(`${SITE}${p.path}`);
      expect(doc.querySelector('meta[name=robots]').content).toContain('index');
      const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
      const types = ld['@graph'].map((n) => n['@type']);
      expect(types).toContain('BreadcrumbList');
      expect(ld['@graph'][1].itemListElement[1].item).toBe(`${SITE}${p.path}`);
    }
  });

  it('only link to pages that exist', () => {
    const known = new Set(['/', ...PAGES.map((p) => p.path)]);
    for (const p of PAGES) {
      for (const a of parse(renderPage(p, { site: SITE })).querySelectorAll('a[href^="/"]')) {
        const path = a.getAttribute('href').split(/[?#]/)[0];
        expect(known.has(path), `${p.path} links to ${path}`).toBe(true);
      }
    }
  });

  it('leave out the analytics notice when there is no measurement ID', () => {
    expect(renderPage(PAGES[0], { site: SITE })).not.toContain('azarvis-analytics-consent');
    expect(analyticsSnippet('')).toBe('');
    expect(analyticsSnippet("G-1');alert(1)//")).toBe(''); // only real IDs reach the script
  });
});

describe('sitemap', () => {
  it('lists the home page, the demo and every content page, but no sign-in pages', () => {
    const xml = sitemap(SITE, '2026-11-19');
    for (const p of PAGES) expect(xml).toContain(`<loc>${SITE}${p.path}</loc>`);
    expect(xml).toContain(`<loc>${SITE}/</loc>`);
    expect(xml).not.toMatch(/page=(login|signup)/);
    expect(new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror')).toBeNull();
  });
});

describe('analytics consent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.gtag;
    delete window.dataLayer;
  });
  const run = () => new Function(analyticsSnippet('G-TEST123'))();
  const gaScript = () => document.querySelector('script[src*="googletagmanager"]');

  it('loads nothing until the visitor accepts', () => {
    run();
    expect(gaScript()).toBeNull();
    expect(window.gtag).toBeUndefined();
    document.querySelector('#az-consent [data-v="granted"]').click();
    expect(gaScript()).not.toBeNull();
    expect(localStorage.getItem('azarvis-analytics-consent')).toBe('granted');
    expect(document.getElementById('az-consent')).toBeNull();
  });

  it('stays off after "Decline", and remembers the choice', () => {
    run();
    document.querySelector('#az-consent [data-v="denied"]').click();
    expect(gaScript()).toBeNull();
    run(); // next page view
    expect(document.getElementById('az-consent')).toBeNull();
    expect(gaScript()).toBeNull();
  });

  it('loads at once for a visitor who already accepted', () => {
    localStorage.setItem('azarvis-analytics-consent', 'granted');
    run();
    expect(gaScript()).not.toBeNull();
    expect(document.getElementById('az-consent')).toBeNull();
  });
});
