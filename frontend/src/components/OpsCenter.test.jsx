// Cyber Ops against a fake API: every quick action is a button that starts a real job, network
// scans ask for consent first, results render from the job, and Stop all cancels everything.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Element.prototype.scrollIntoView = () => {};

const IDS = ['laptop', 'devices', 'network', 'ip', 'security', 'hardware', 'cpu_ram', 'disk', 'files', 'speed', 'bluetooth', 'wifi', 'website', 'ports', 'report', 'emergency'];
const CATALOG = IDS.map((id) => ({ id, title: `Title ${id}`, icon: 'zap', does: `Does ${id}`, consent: id === 'devices' || id === 'network', input: id === 'website' ? 'url' : id === 'files' ? 'path' : null }));
const fake = {
  opsActions: vi.fn(), opsJobs: vi.fn(), opsJob: vi.fn(), opsRun: vi.fn(), opsCancel: vi.fn(), opsStopAll: vi.fn(),
  systemStatus: vi.fn(), orchestratorRuns: vi.fn(), runAction: vi.fn(), opsReport: vi.fn(),
};
vi.mock('../api.js', () => ({ api: new Proxy({}, { get: (_, k) => (...a) => fake[k](...a) }) }));
vi.mock('../ui.jsx', () => ({ toast: vi.fn() }));
const { default: OpsCenter } = await import('./OpsCenter.jsx');

const DONE = {
  id: 'j1', action: 'cpu_ram', title: 'Check CPU & RAM', status: 'done', params: {}, created_at: Date.now() / 1000 - 5, started_at: Date.now() / 1000 - 5, finished_at: Date.now() / 1000,
  steps: [{ label: 'Sampling CPU', status: 'done', detail: 'CPU 20%', ms: 1500 }],
  result: {
    summary: 'CPU 20% · RAM 91%', score: 88,
    findings: [{ severity: 'high', title: 'Memory is 91% full', detail: 'Slow.', fix: 'Close apps.' }, { severity: 'ok', title: 'Processor 20% busy', detail: '' }],
    sections: [
      { title: 'Load now', type: 'bars', items: [{ label: 'CPU', value: 20, max: 100, unit: '%' }] },
      { title: 'Devices on your network', type: 'devices', devices: [{ id: 'ip-1', ip: '192.168.1.4', name: 'HP printer', category: 'Printer', status: 'online', connection: 'network', security: { level: 'ok', notes: [] } }] },
    ],
  },
};

let root;
let host;
async function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(OpsCenter, { onAsk: vi.fn() })));
  await act(async () => {});
}
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const click = async (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

beforeEach(() => {
  Object.values(fake).forEach((f) => f.mockReset());
  fake.opsActions.mockResolvedValue({ supported: true, actions: CATALOG });
  fake.opsJobs.mockResolvedValue([]);
  fake.systemStatus.mockResolvedValue({ cpu: 12, ram: 80, disk: 99, battery: 50 });
  fake.opsRun.mockImplementation(async (action) => ({ ...DONE, id: `new-${action}`, action, status: 'running', steps: [], result: null }));
  fake.opsJob.mockImplementation(async (id) => ({ ...DONE, id }));
  fake.opsStopAll.mockResolvedValue({ stopped: 2 });
  fake.orchestratorRuns.mockResolvedValue([{ id: 'r1', status: 'running' }, { id: 'r2', status: 'done' }]);
  fake.runAction.mockResolvedValue({});
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('OpsCenter', () => {
  it('shows all 16 quick actions, numbered, plus live load', async () => {
    await mount();
    const actions = host.querySelectorAll('.ops-action');
    expect(actions).toHaveLength(16);
    expect(actions[0].textContent).toContain('01');
    expect(actions[15].textContent).toContain('16');
    expect(host.textContent).toContain('Disk 99%');
    expect(host.textContent).toContain('Agent online');
  });

  it('starts a plain action at once and shows its result', async () => {
    await mount();
    await click(button('Title cpu_ram'));
    expect(fake.opsRun).toHaveBeenCalledWith('cpu_ram', {});
    await act(async () => {});
    expect(host.textContent).toContain('Memory is 91% full');
    expect(host.textContent).toContain('Close apps.');
    expect(host.querySelector('.ops-score').textContent).toBe('88');
    expect(host.textContent).toContain('HP printer');
  });

  it('asks for consent before a network scan and sends authorized only after it', async () => {
    await mount();
    await click(button('Title devices'));
    expect(fake.opsRun).not.toHaveBeenCalled();
    const start = button('Start scan');
    expect(start.disabled).toBe(true);
    const box = host.querySelector('.ops-modal input[type=checkbox]');
    await click(box);
    expect(start.disabled).toBe(false);
    await click(start);
    expect(fake.opsRun).toHaveBeenCalledWith('devices', { authorized: true });
  });

  it('asks for the website address', async () => {
    await mount();
    await click(button('Title website'));
    const input = host.querySelector('.ops-modal input');
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(input, 'example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => host.querySelector('.ops-modal form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fake.opsRun).toHaveBeenCalledWith('website', { url: 'example.com' });
  });

  it('stop all cancels scans and running agent tasks', async () => {
    await mount();
    await click(button('Stop all tasks'));
    expect(fake.opsStopAll).toHaveBeenCalled();
    expect(fake.runAction).toHaveBeenCalledWith('r1', 'cancel');
    expect(fake.runAction).not.toHaveBeenCalledWith('r2', 'cancel');
  });

  it('explains itself when the AI service is not on this PC', async () => {
    fake.opsActions.mockResolvedValue({ supported: false, reason: 'Start Azarvis on your PC to use it.', actions: CATALOG });
    await mount();
    expect(host.textContent).toContain('Start Azarvis on your PC');
    expect(button('Title laptop').disabled).toBe(true);
  });
});
