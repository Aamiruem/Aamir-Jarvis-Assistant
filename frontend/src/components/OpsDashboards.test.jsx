// The Cyber Ops dashboards render real API data, say "not available" / "not run" instead of
// inventing numbers, and hand off to the Operations view (open a scan, run a check).
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fake = { opsLive: vi.fn(), opsOverview: vi.fn(), opsMission: vi.fn(), opsGeo: vi.fn() };
vi.mock('../api.js', () => ({ api: new Proxy({}, { get: (_, k) => (...a) => fake[k](...a) }) }));
const { LiveMonitor, SecurityOverview, MissionControl, RobotCore, fmtBytes, fmtUptime } = await import('./OpsDashboards.jsx');
const { robotMood } = await import('./OpsCenter.jsx');

const LIVE = {
  at: 1, uptime: 90061, static: { host: 'GTI-PC', os: 'Windows 11', cpu_name: 'Intel Core i3-1005G1', cores: 2, threads: 4, base_mhz: 1190 },
  cpu: { percent: 55, per_core: [60, 50, 53, 55], mhz: 1295, base_mhz: 1190 },
  ram: { total: 12e9, used: 11e9, available: 1e9, percent: 90, swap_total: 12e9, swap_used: 2e9 },
  disks: [{ mount: 'C:\\', total: 2e11, free: 2e9, used: 1.98e11, percent: 99 }],
  disk_io: { read: 44000, write: 1400000 }, net: { up: 709, down: 458, sent: 4e8, recv: 2e9 },
  battery: { percent: 93, plugged: false }, gpu: { name: 'Intel(R) UHD Graphics', util: 3, engines: { '3d': 3, copy: 0 }, dedicated: 0, shared: 3.2e8, vram_total: 1073741824 },
  temps: { cpu: null, zones: [], reason: 'This PC exposes no temperature sensor' }, sensors: 'Windows performance counters',
  processes: { count: 370, cpu: [{ pid: 1, name: 'python.exe', cpu: 11.2, mem: 3.2e7 }], mem: [{ pid: 2, name: 'chrome.exe', mem: 9e8 }] },
  history: [{ cpu: 40, ram: 89, gpu: 2, up: 100, down: 300 }, { cpu: 55, ram: 90, gpu: 3, up: 709, down: 458 }],
};
const NOW = Date.now() / 1000;
const OVERVIEW = {
  posture: { score: 72, basis: 'Latest full security report', checks: 1 }, trend: [{ score: 60 }, { score: 72 }],
  counts: { critical: 1, high: 2, medium: 0, low: 3 }, alerts_total: 6,
  incidents: [{ severity: 'critical', title: 'Defender real-time protection is off', check: 'Check system security', job_id: 'job-sec', at: NOW - 120 }],
  per_day: Array.from({ length: 7 }, (_, i) => ({ day: `2026-11-${16 + i}`, critical: i === 6 ? 1 : 0, high: 0, medium: 0, low: 0 })),
  threats: [{ id: 'exposure', label: 'Network exposure', open: 2, worst: 'high', checked: true }, { id: 'wireless', label: 'Wireless', open: 0, worst: null, checked: false }],
  assets: { source: 'Scan authorized network', job_id: 'job-net', at: NOW - 600, total: 3, at_risk: 1, health: 67,
    groups: [{ category: 'Camera', total: 2, at_risk: 1, health: 50 }],
    nodes: [{ name: 'Router', ip: '192.168.1.1', is_gateway: true }, { name: 'Cam', ip: '192.168.1.30', risk: 'high' }, { name: 'This PC', ip: '192.168.1.5', is_self: true }] },
  coverage: [{ action: 'security', label: 'System security', state: 'fresh', last: NOW - 120, score: 70 }, { action: 'wifi', label: 'Wi-Fi security', state: 'never', last: null, score: null }],
};
const MISSION = {
  agents: [{ id: 'cyber', name: 'Cybersecurity Agent', icon: 'shield', state: 'working', running: 1, waiting: 0, done: 4, failed: 0, last: { title: 'Check open ports' } },
    { id: 'browser', name: 'Browser Automation Agent', icon: 'globe', state: 'waiting', running: 0, waiting: 1, done: 0, failed: 0, last: null }],
  totals: { completed: 4, failed: 1, running: 1, success_rate: 80, runs: 1, runs_active: 1, actions: 10 },
  approvals: { authorized_scans: 1, approved_fixes: 1, approved: 1, rejected: 0, pending: 1, decided: 3, human_rate: 30 },
  per_day: Array.from({ length: 7 }, (_, i) => ({ day: `2026-11-${16 + i}`, done: i })),
  recent_runs: [{ id: 'r1', instruction: 'Speed up my laptop', status: 'needs_approval', created_at: NOW - 60, subtasks: 3, pending: 1 }],
  note: 'Agent-team runs are kept in memory',
};

let root;
let host;
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(el));
  await act(async () => {});
}
const click = async (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

beforeEach(() => {
  Object.values(fake).forEach((f) => f.mockReset());
  fake.opsLive.mockResolvedValue(LIVE);
  fake.opsOverview.mockResolvedValue(OVERVIEW);
  fake.opsMission.mockResolvedValue(MISSION);
});
afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('formatters', () => {
  it('formats bytes and uptime', () => {
    expect(fmtBytes(1536)).toBe('1.5 KB');
    expect(fmtBytes(null)).toBe('—');
    expect(fmtUptime(90061)).toBe('1d 01:01:01');
  });
});

describe('robot mood follows real state', () => {
  it('maps offline, safe mode, running, failure and scores', () => {
    expect(robotMood({ offline: 'x', safe: false, running: [] })[0]).toBe('offline');
    expect(robotMood({ safe: true, running: [] })[0]).toBe('safe');
    expect(robotMood({ running: [{ title: 'Scan', steps: [{ label: 'ARP sweep' }] }] })).toEqual(['scanning', 'ARP sweep…']);
    expect(robotMood({ running: [], latest: { status: 'failed', title: 'Wi-Fi' } })[0]).toBe('alert');
    expect(robotMood({ running: [], latest: { status: 'done', title: 'Ports', score: 40 } })[0]).toBe('alert');
    expect(robotMood({ running: [], latest: { status: 'done', title: 'Ports', score: 95 } })[0]).toBe('happy');
  });
  it('renders the face with its caption', async () => {
    await mount(createElement(RobotCore, { mood: 'scanning', caption: 'ARP sweep…' }));
    expect(host.querySelector('.od-robot.m-scanning')).toBeTruthy();
    expect(host.textContent).toContain('ARP sweep…');
  });
});

describe('LiveMonitor', () => {
  it('shows measured CPU, GPU, RAM, disk, network and says when temperature is unavailable', async () => {
    await mount(createElement(LiveMonitor));
    const t = host.textContent;
    expect(fake.opsLive).toHaveBeenCalled();
    expect(t).toContain('Intel Core i3-1005G1');
    expect(t).toContain('1295 MHz');
    expect(t).toContain('Intel(R) UHD Graphics');
    expect(t).toContain('Temperature: not exposed by this PC');
    expect(t).toContain('python.exe');
    expect(t).toContain('1d 01:01:01'); // uptime
    expect(host.querySelectorAll('.od-cores li')).toHaveLength(4);
  });
  it('shows the error when the service is unreachable', async () => {
    fake.opsLive.mockRejectedValue(new Error('Cyber Ops runs only where Azarvis is installed on your own PC.'));
    await mount(createElement(LiveMonitor));
    expect(host.textContent).toContain('installed on your own PC');
  });
});

describe('SecurityOverview', () => {
  it('renders posture, counts, incidents, topology, assets and coverage', async () => {
    const onOpenJob = vi.fn();
    const onRun = vi.fn();
    await mount(createElement(SecurityOverview, { onOpenJob, onRun, jobsKey: 'k' }));
    const t = host.textContent;
    expect(t).toContain('72% secure');
    expect(t).toContain('Defender real-time protection is off');
    expect(t).toContain('3 devices · 1 at risk');
    expect(host.querySelectorAll('.od-topo .node')).toHaveLength(3);
    expect(host.querySelector('.od-topo .node.risk-high')).toBeTruthy();
    expect(t).toContain('not checked');
    await click([...host.querySelectorAll('.od-incidents button')][0]);
    expect(onOpenJob).toHaveBeenCalledWith('job-sec');
    await click([...host.querySelectorAll('.od-coverage button')].find((b) => b.textContent === 'Run'));
    expect(onRun).toHaveBeenCalledWith('wifi');
  });
  it('asks for a scan instead of inventing a posture', async () => {
    fake.opsOverview.mockResolvedValue({ ...OVERVIEW, posture: null, assets: null, incidents: [], alerts_total: 0 });
    const onRun = vi.fn();
    await mount(createElement(SecurityOverview, { onOpenJob: vi.fn(), onRun, jobsKey: 'k' }));
    expect(host.textContent).toContain('No device scan yet');
    await click([...host.querySelectorAll('button')].find((b) => b.textContent.includes('Generate security report')));
    expect(onRun).toHaveBeenCalledWith('report');
  });
});

describe('MissionControl', () => {
  it('shows agents with their state, totals, approvals and runs', async () => {
    const onCritical = vi.fn();
    await mount(createElement(MissionControl, { onCritical, jobsKey: 'k' }));
    const t = host.textContent;
    expect(host.querySelector('.od-pipeline .st-working')).toBeTruthy();
    expect(host.querySelector('.od-pipeline .st-waiting')).toBeTruthy();
    expect(t).toContain('Awaiting approval');
    expect(t).toContain('80%');
    expect(t).toContain('30% of 10 actions');
    expect(t).toContain('Speed up my laptop');
    await click([...host.querySelectorAll('button')].find((b) => b.textContent.includes('New critical task')));
    expect(onCritical).toHaveBeenCalled();
  });
});

const { GlobalMap, AgentBrain, brainNetwork, project } = await import('./OpsDashboards.jsx');

const GEO = {
  home: { ip: '1.2.3.4', city: 'Gurugram', country: 'IN', owner: 'AS9 ISP', lat: 28.46, lon: 77.03 },
  hosts: [
    { ip: '142.250.1.1', programs: ['chrome.exe'], ports: [443], count: 5, owner: 'AS15169 Google LLC', city: 'Mountain View', country: 'US', lat: 37.4, lon: -122.1, flagged: false, reasons: [] },
    { ip: '45.9.9.9', programs: ['x.exe'], ports: [4444], count: 1, owner: 'AS1 Example', city: 'Moscow', country: 'RU', lat: 55.75, lon: 37.6, flagged: true, reasons: ['port 4444: Metasploit default listener'] },
  ],
  local_peers: 2, flagged: 1, located: 2,
  countries: [{ country: 'RU', hosts: 1, connections: 1, flagged: 1 }, { country: 'US', hosts: 1, connections: 5, flagged: 0 }],
  owners: [{ owner: 'AS15169 Google LLC', connections: 5 }], source: 'ipinfo.io',
};

describe('GlobalMap', () => {
  it('projects coordinates onto the dot map', () => {
    const [x0, y0] = project(0, -180);
    const [x1] = project(0, 180);
    expect(x0).toBe(0);
    expect(x1).toBeGreaterThan(800);
    expect(project(84, 0)[1]).toBe(0);
    expect(y0).toBeGreaterThan(0);
  });
  it('draws home, arcs and hosts and highlights flagged ones', async () => {
    fake.opsGeo = vi.fn().mockResolvedValue(GEO);
    await mount(createElement(GlobalMap));
    expect(host.querySelectorAll('.od-map .host')).toHaveLength(2);
    expect(host.querySelectorAll('.od-map .arc')).toHaveLength(2);
    expect(host.querySelector('.od-map .host.bad')).toBeTruthy();
    expect(host.querySelector('.od-map .home')).toBeTruthy();
    expect(host.textContent).toContain('Gurugram');
    await click(host.querySelector('.od-map .host.bad'));
    expect(host.textContent).toContain('Metasploit default listener');
  });
});

describe('AgentBrain', () => {
  it('builds the same network every time', () => {
    const a = brainNetwork(10);
    expect(a.nodes).toHaveLength(130);
    expect(brainNetwork(10).nodes[7]).toEqual(a.nodes[7]);
    expect(new Set(a.nodes.map((n) => n.region)).size).toBe(10);
  });
  it('lights up working and waiting agents', async () => {
    await mount(createElement(AgentBrain, { agents: MISSION.agents }));
    expect(host.querySelector('.neu.st-working')).toBeTruthy();
    expect(host.querySelector('.neu.st-waiting')).toBeTruthy();
    expect(host.textContent).toContain('Thinking: Cybersecurity');
    expect(host.textContent).toContain('waiting for your approval: Browser Automation');
  });
});
