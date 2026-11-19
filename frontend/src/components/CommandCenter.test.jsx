// The Command Center against a fake API: it shows what the backend says (no invented numbers),
// its buttons do what they say, and it explains itself when the AI service is down.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLCanvasElement.prototype.getContext = () => null; // no canvas in jsdom: the globe just doesn't draw

const commandCenter = vi.fn();
vi.mock('../api.js', () => ({ api: { commandCenter: (...a) => commandCenter(...a) } }));
const { default: CommandCenter } = await import('./CommandCenter.jsx');

const DATA = {
  status: { level: 'attention', reasons: ['1 overdue'] },
  core: { model: 'claude-opus-5-5', claude: 'connected', memories: 3, voice: { neural: true }, agents_total: 6, agents_active: 1, providers_linked: 2, system_control: true },
  agents: [
    { id: 'research', name: 'Research Agent', icon: 'search', does: '', state: 'active', uses_24h: 2, last_used: new Date().toISOString() },
    { id: 'memory', name: 'Memory Agent', icon: 'brain', does: '', state: 'ready', uses_24h: 0, last_used: null },
  ],
  timeline: [{ id: 1, title: 'Send invoice', remind_at: new Date(Date.now() - 600000).toISOString(), done: false }],
  open_tasks: 4,
  overdue_count: 1,
  unread_count: 0,
  feed: [{ level: 'warn', title: '1 task is overdue', body: '“Send invoice”', action: 'tasks' }],
  device: { cpu: { percent: 44, threads: 4 }, memory: { percent: 61, used_gb: 7, total_gb: 12 }, disk: { percent: 50, free_gb: 100 }, network: { online: true, type: 'wifi', speed_mbps: 300 }, battery: null, uptime_hours: 3 },
  memory: { memories: 3, documents: 1, messages: 20, tool_calls: 9 },
  providers: [
    { id: 'claude', name: 'Claude', state: 'connected', detail: 'Connected · powers Jarvis' },
    { id: 'openai', name: 'OpenAI', state: 'not_linked', detail: 'Not linked' },
  ],
  recent: [],
};

let root;
let host;
const props = { onOpenTab: vi.fn(), onAsk: vi.fn(), onStartSession: vi.fn(), onOpenPalette: vi.fn() };
async function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(CommandCenter, props)));
  await act(async () => {});
}
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  Object.values(props).forEach((f) => f.mockReset());
  commandCenter.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe('CommandCenter', () => {
  it('shows the live data from the backend', async () => {
    commandCenter.mockResolvedValue(DATA);
    await mount();
    const text = host.textContent;
    expect(text).toContain('Attention');
    expect(text).toContain('1 task is overdue');
    expect(text).toContain('Send invoice');
    expect(text).toContain('Not linked');
    expect(text).toContain('4 open tasks · 1 overdue');
    expect(host.querySelector('[aria-label="CPU 44%"]')).not.toBeNull();
  });

  it('refreshes every few seconds', async () => {
    commandCenter.mockResolvedValue(DATA);
    await mount();
    expect(commandCenter).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(5000));
    expect(commandCenter).toHaveBeenCalledTimes(2);
  });

  it('buttons start a voice session, ask Jarvis, and open tabs', async () => {
    commandCenter.mockResolvedValue(DATA);
    await mount();
    act(() => button('Talk to Jarvis').click());
    expect(props.onStartSession).toHaveBeenCalled();
    act(() => button('Executive briefing').click());
    expect(props.onAsk).toHaveBeenCalledWith(expect.stringContaining('executive briefing'), true);
    act(() => button('1 task is overdue').click());
    expect(props.onOpenTab).toHaveBeenCalledWith('tasks');
  });

  it('says what is wrong when the AI service is unreachable', async () => {
    commandCenter.mockRejectedValue(new Error('Failed to fetch.'));
    await mount();
    expect(host.querySelector('[role="alert"]').textContent).toContain("can't reach the AI service");
    expect(button('Retry')).toBeTruthy();
  });
});
