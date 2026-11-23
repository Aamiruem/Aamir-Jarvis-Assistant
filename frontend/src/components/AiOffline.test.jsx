// The AI-offline card: offers "Start AI service" only when the gateway says it may (owner's PC),
// waits for the real health check before continuing, and Project HQ still lists the live projects.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fake = {};
vi.mock('../api.js', () => ({ api: new Proxy({}, { get: (_, k) => (...a) => fake[k](...a) }) }));
vi.mock('../ui.jsx', () => ({ toast: vi.fn() }));
const { default: AiOffline, isAiDown } = await import('./AiOffline.jsx');
const { default: ProjectHQ } = await import('./ProjectHQ.jsx');

const DOWN = "The AI service isn't running (nothing answered at http://localhost:8001). Start everything with \"npm run dev\" in the project folder.";
let root;
let host;
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(el));
  await act(async () => {});
}
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const click = async (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

beforeEach(() => {
  for (const k of Object.keys(fake)) delete fake[k];
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.useRealTimers();
});

describe('AiOffline', () => {
  it('recognises the gateway messages', () => {
    expect(isAiDown(DOWN)).toBe(true);
    expect(isAiDown("Azarvis's AI runs on its owner's PC, which isn't connected right now")).toBe(true);
    expect(isAiDown('Project not found.')).toBe(false);
  });

  it('on the owner PC: starts the service and continues only once health says it is up', async () => {
    let up = false;
    fake.health = vi.fn(async () => ({ ai: up ? 'up' : 'down', canStartAi: !up }));
    fake.startAiService = vi.fn(async () => ({ status: 'started', pid: 1 }));
    const onReady = vi.fn();
    await mount(createElement(AiOffline, { message: DOWN, onReady, what: 'Project HQ' }));
    await click(button('Start AI service'));
    expect(fake.startAiService).toHaveBeenCalled();
    expect(host.textContent).toContain('Starting the AI service');
    await act(async () => vi.advanceTimersByTime(1600));
    expect(onReady).not.toHaveBeenCalled(); // still down: keep waiting
    up = true;
    await act(async () => vi.advanceTimersByTime(1600));
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('elsewhere: no start button, explains and offers a retry', async () => {
    fake.health = vi.fn(async () => ({ ai: 'down', canStartAi: false }));
    await mount(createElement(AiOffline, { message: DOWN, onReady: vi.fn() }));
    expect(button('Start AI service')).toBeUndefined();
    expect(button('Try again')).toBeTruthy();
    expect(host.textContent).toContain('npm run dev');
  });
});

describe('Project HQ while the AI service is off', () => {
  it('shows the offline card and still lists the live projects with working links', async () => {
    fake.projects = vi.fn().mockRejectedValue(new Error(DOWN));
    fake.health = vi.fn(async () => ({ ai: 'down', canStartAi: true }));
    await mount(createElement(ProjectHQ));
    expect(host.textContent).toContain('The AI service is offline');
    expect(button('Start AI service')).toBeTruthy();
    const links = [...host.querySelectorAll('.hq-offline a')].map((a) => a.getAttribute('href'));
    expect(links).toContain('https://azarvis-app.vercel.app/');
    expect(links.some((h) => h.startsWith('https://github.com/Aamiruem/'))).toBe(true);
  });
});
