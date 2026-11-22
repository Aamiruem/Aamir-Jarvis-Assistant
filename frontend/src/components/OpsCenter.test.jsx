// Cyber Ops against a fake API: every quick action is a button that starts a real job, network
// scans ask for consent first, results render from the job, and Stop all cancels everything.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Element.prototype.scrollIntoView = () => {};

const IDS = ['laptop', 'devices', 'network', 'ip', 'security', 'hardware', 'cpu_ram', 'disk', 'files', 'speed', 'bluetooth', 'wifi', 'website', 'ports', 'report', 'emergency', 'investigate', 'netfix', 'traceroute', 'connections', 'deps', 'cve', 'code_audit', 'toolbox'];
const INPUT = { website: 'url', files: 'path', investigate: 'target', traceroute: 'target', cve: 'query', deps: 'folder', code_audit: 'folder' };
const CATALOG = IDS.map((id) => ({ id, title: `Title ${id}`, icon: 'zap', does: `Does ${id}`, consent: id === 'devices' || id === 'network', input: INPUT[id] || null }));
const fake = {
  opsActions: vi.fn(), opsJobs: vi.fn(), opsJob: vi.fn(), opsRun: vi.fn(), opsCancel: vi.fn(), opsStopAll: vi.fn(),
  systemStatus: vi.fn(), orchestratorRuns: vi.fn(), runAction: vi.fn(), opsReport: vi.fn(),
  opsCommand: vi.fn(), opsFix: vi.fn(), opsSetSafeMode: vi.fn(), startRun: vi.fn(), orchestratorRun: vi.fn(), decideApproval: vi.fn(),
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
const type = async (el, value) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
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
  it('shows all 24 quick actions in groups, numbered, plus live load', async () => {
    await mount();
    const actions = host.querySelectorAll('.ops-action');
    expect(actions).toHaveLength(24);
    expect(actions[0].textContent).toContain('01');
    expect(actions[23].textContent).toContain('24');
    expect([...host.querySelectorAll('.ops-group h3')].map((h) => h.textContent)).toEqual(['Device intelligence', 'Network intelligence', 'Security & threats', 'Vulnerabilities & code', 'Global intelligence']);
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
    expect(fake.opsRun).toHaveBeenCalledWith('devices', { authorized: true, profile: 'home' });
  });

  it('an organisation network needs who authorized it', async () => {
    await mount();
    await click(button('Title network'));
    await click(host.querySelector('.ops-modal input[value=org]'));
    await click(host.querySelector('.ops-modal input[type=checkbox]'));
    expect(button('Start scan').disabled).toBe(true);
    await type(host.querySelector('.ops-modal input[aria-label="Who authorized the test"]'), 'IT ticket 42');
    await click(button('Start scan'));
    expect(fake.opsRun).toHaveBeenCalledWith('network', { authorized: true, profile: 'org', authorized_by: 'IT ticket 42' });
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


  it('asks for a domain or IP to investigate and sends it as target', async () => {
    await mount();
    await click(button('Title investigate'));
    const input = host.querySelector('.ops-modal input');
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(input, 'example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => host.querySelector('.ops-modal form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fake.opsRun).toHaveBeenCalledWith('investigate', { target: 'example.com' });
  });

  it('stop all cancels scans and running agent tasks', async () => {
    await mount();
    await click(button('Stop all tasks'));
    expect(fake.opsStopAll).toHaveBeenCalled();
    expect(fake.runAction).toHaveBeenCalledWith('r1', 'cancel');
    expect(fake.runAction).not.toHaveBeenCalledWith('r2', 'cancel');
  });

  it('universal command runs the matching action with its target', async () => {
    fake.opsCommand.mockResolvedValue({ mode: 'action', action: 'traceroute', title: 'Title traceroute', params: { target: 'github.com' }, missing: null });
    await mount();
    await type(host.querySelector('input[aria-label="Universal command"]'), 'traceroute to github.com');
    await act(async () => host.querySelector('.ops-command-row').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fake.opsCommand).toHaveBeenCalledWith('traceroute to github.com');
    expect(fake.opsRun).toHaveBeenCalledWith('traceroute', { target: 'github.com' });
    expect(host.querySelector('.ops-terminal').textContent).toContain('Title traceroute');
  });

  it('universal command asks for a missing input, and hands open problems to the agent team', async () => {
    fake.opsCommand.mockResolvedValueOnce({ mode: 'action', action: 'cve', title: 'Title cve', params: { query: '' }, missing: 'query' });
    fake.startRun.mockResolvedValue({ id: 'r9', status: 'planning', instruction: 'build an app', subtasks: [], approvals: [] });
    await mount();
    await type(host.querySelector('input[aria-label="Universal command"]'), 'look up a cve');
    await act(async () => host.querySelector('.ops-command-row').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fake.opsRun).not.toHaveBeenCalled();
    expect(host.querySelector('.ops-modal')).not.toBeNull();
    await click(button('Cancel'));
    fake.opsCommand.mockResolvedValueOnce({ mode: 'agents' });
    await type(host.querySelector('input[aria-label="Universal command"]'), 'build an app');
    await act(async () => host.querySelector('.ops-command-row').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => {});
    expect(fake.startRun).toHaveBeenCalledWith('build an app');
  });

  it('a suggested fix runs only after approval', async () => {
    fake.opsJob.mockImplementation(async (id) => ({ ...DONE, id, result: { ...DONE.result, fixes: [{ id: 'flush_dns', label: 'Flush the DNS cache', why: 'Clears stale lookups.' }] } }));
    fake.opsFix.mockResolvedValue({ ...DONE, id: 'fx1', action: 'fix_flush_dns', status: 'running', steps: [], result: null });
    await mount();
    await click(button('Title netfix'));
    await act(async () => {});
    await click(button('Apply…'));
    expect(fake.opsFix).not.toHaveBeenCalled();
    await click(button('Approve & run'));
    expect(fake.opsFix).toHaveBeenCalledWith('flush_dns');
  });

  it('emergency safe mode switches on and shows a banner', async () => {
    fake.opsSetSafeMode.mockResolvedValue({ on: true, stopped: 1 });
    await mount();
    await click(button('Emergency safe mode'));
    expect(fake.opsSetSafeMode).toHaveBeenCalledWith(true);
    expect(host.querySelector('.ops-safe-banner')).not.toBeNull();
  });

  it('project scans default to the Jarvis project when no folder is given', async () => {
    await mount();
    await click(button('Title deps'));
    expect(button('Scan the Jarvis project')).toBeTruthy();
    await act(async () => host.querySelector('.ops-modal form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fake.opsRun).toHaveBeenCalledWith('deps', {});
  });

  it('explains itself when the AI service is not on this PC', async () => {
    fake.opsActions.mockResolvedValue({ supported: false, reason: 'Start Azarvis on your PC to use it.', actions: CATALOG });
    await mount();
    expect(host.textContent).toContain('Start Azarvis on your PC');
    expect(button('Title laptop').disabled).toBe(true);
  });

  it('shows the safe testing profiles apart from quick actions; the network one still asks for consent', async () => {
    const profiles = [
      { id: 'lab_code', title: 'Source-code security analysis', icon: 'code', does: 'Read only', consent: false, input: 'folder', profile: true },
      { id: 'lab_local', title: 'Local network audit', icon: 'network', does: 'Your network', consent: true, input: null, profile: true },
      { id: 'lab_incident', title: 'Defensive incident investigation', icon: 'siren', does: 'This PC', consent: false, input: null, profile: true },
    ];
    fake.opsActions.mockResolvedValue({ supported: true, actions: [...CATALOG, ...profiles] });
    await mount();
    expect(host.querySelectorAll('.ops-action')).toHaveLength(24); // profiles are not quick actions
    const cards = host.querySelectorAll('.od-profile');
    expect(cards).toHaveLength(3);
    expect(cards[1].textContent).toContain('Authorization required');
    await click(cards[2].querySelector('button'));
    expect(fake.opsRun).toHaveBeenCalledWith('lab_incident', {});
    await click(host.querySelectorAll('.od-profile')[1].querySelector('button'));
    expect(fake.opsRun).not.toHaveBeenCalledWith('lab_local', expect.anything());
    expect(host.querySelector('.ops-modal')).toBeTruthy();
  });

  it('Investigations view runs passive modules on one target and keeps its own history', async () => {
    fake.opsJobs.mockResolvedValue([
      { ...DONE, id: 'inv1', action: 'investigate', title: 'Investigate domain / IP', params: { target: 'github.com' }, summary: 'github.com · 1 IP(s)' },
      { ...DONE, id: 'cpu1', action: 'cpu_ram', title: 'Check CPU & RAM', params: {} },
    ]);
    await mount();
    await click([...host.querySelectorAll('.od-tabs button')].find((b) => b.textContent.includes('Investigations')));
    const items = host.querySelectorAll('.od-intel-history li');
    expect(items).toHaveLength(1); // only investigations, not every scan
    expect(items[0].textContent).toContain('github.com');
    await type(host.querySelector('.od-intel input'), 'https://example.com/login');
    await click(button('Investigate'));
    expect(fake.opsRun).toHaveBeenCalledWith('investigate', { target: 'example.com' });
    await click(button('Web security'));
    expect(fake.opsRun).toHaveBeenCalledWith('website', { url: 'https://example.com/login' });
  });
});
