// Project HQ against a fake API: cards show measured values (or "—" when not checked), filters work,
// Check updates one card, Lighthouse without quota says so, tests run as a job and show failures.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fake = {};
vi.mock('../api.js', () => ({ api: new Proxy({}, { get: (_, k) => (...a) => fake[k](...a) }) }));
vi.mock('../ui.jsx', () => ({ toast: vi.fn() }));
const { default: ProjectHQ } = await import('./ProjectHQ.jsx');
const { toast } = await import('../ui.jsx');

const now = Date.now() / 1000;
const APP = {
  id: 'azarvis-app', name: 'Azarvis Voice App', description: 'React app', kind: 'web', platform: 'vercel', url: 'https://azarvis-app.vercel.app/',
  repo: 'Aamiruem/Aamir-Jarvis-Assistant', local_path: 'frontend', stack: 'React · Vite',
  status: {
    site: { up: true, status: 200, ttfb_ms: 239, tls: { days_left: 67 }, findings: [{ severity: 'medium', title: 'No Content-Security-Policy', area: 'security', fix: 'Add a CSP.' }], checked_at: now },
    seo: { score: 94, title: 'Azarvis', ga4_ids: [], google_verification: false, sitemap: 'x', sitemap_urls: 14, robots_txt: true, links_checked: 5, broken_links: [], jsonld_types: ['WebApplication'], findings: [], checked_at: now },
    github: { full_name: 'Aamiruem/Aamir-Jarvis-Assistant', ci: { conclusion: 'success', name: 'CI', commit: 'commit add' }, pushed_at: '2026-11-22T10:00:00Z', open_issues: 0, findings: [], checked_at: now },
  },
  health: { state: 'warning', score: 94, counts: { medium: 1 } },
};
const API = { id: 'azarvis-api', name: 'Azarvis API', description: 'Express', kind: 'api', platform: 'vercel', health_url: 'https://x/api/health', status: {}, health: { state: 'unknown', score: null, counts: {} } };
const DATA = { projects: [APP, API], keys: { pagespeed: false, github: false }, local: true, google: {} };

let root;
let host;
async function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(ProjectHQ)));
  await act(async () => {});
}
const button = (text, scope = host) => [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === text || b.textContent.includes(text));
const click = async (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

beforeEach(() => {
  for (const k of Object.keys(fake)) delete fake[k];
  Object.assign(fake, {
    projects: vi.fn().mockResolvedValue(DATA),
    projectCheck: vi.fn(async (id) => ({ ...API, id, status: { api: { up: true, status: 200, ms: 505, findings: [{ severity: 'high', title: "API reports 'ai' is down", area: 'api' }], checked_at: now } },
      health: { state: 'warning', score: 88, counts: { high: 1 } } })),
    projectPagespeed: vi.fn().mockRejectedValue(new Error("Google's shared PageSpeed quota is used up. Add a free PAGESPEED_API_KEY")),
    projectTests: vi.fn().mockResolvedValue({ id: 'job1', status: 'running', steps: [{ label: 'npm run test', status: 'running', detail: '' }] }),
    projectJob: vi.fn().mockResolvedValue({ id: 'job1', status: 'done', steps: [{ label: 'npm run test', status: 'failed', detail: 'FAILED (exit 1) in 40 s' }],
      result: { summary: '0/1 passed', results: [{ command: 'npm run test', ok: false, exit: 1, tail: 'AssertionError: expected 1 to be 2' }], findings: [{ severity: 'high' }] } }),
  });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe('ProjectHQ', () => {
  it('shows measured values and "—" for anything not checked', async () => {
    await mount();
    const cards = host.querySelectorAll('.hq-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('239 ms');
    expect(cards[0].textContent).toContain('67 d');
    expect(cards[0].textContent).toContain('success');
    expect(cards[1].textContent).toContain('Not checked');
    expect(host.textContent).toContain('Search Console & GA4 reports: not connected');
    expect(host.textContent).toContain('GA4 on 0/1');
  });

  it('filters by status', async () => {
    await mount();
    await click(button('Warning'));
    expect(host.querySelectorAll('.hq-card')).toHaveLength(1);
  });

  it('Check updates that card with the real result', async () => {
    await mount();
    await click(button('Check', host.querySelectorAll('.hq-card')[1]));
    expect(fake.projectCheck).toHaveBeenCalledWith('azarvis-api');
    expect(host.querySelectorAll('.hq-card')[1].textContent).toContain('505 ms');
  });

  it('Lighthouse without quota explains the missing key', async () => {
    await mount();
    await click(button('Lighthouse'));
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('PAGESPEED_API_KEY'), 'error');
  });

  it('runs the project tests as a job and shows the failing output', async () => {
    await mount();
    await click(button('Run tests'));
    expect(fake.projectTests).toHaveBeenCalledWith('azarvis-app');
    await act(async () => vi.advanceTimersByTime(1600));
    await act(async () => {});
    const drawer = host.querySelector('.hq-drawer');
    expect(drawer.textContent).toContain('0/1 passed');
    expect(drawer.textContent).toContain('AssertionError: expected 1 to be 2');
    expect(drawer.textContent).toContain('No Content-Security-Policy');
  });
});
