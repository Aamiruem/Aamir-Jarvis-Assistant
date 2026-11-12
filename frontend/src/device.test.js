import { describe, expect, it } from 'vitest';
import { batteryForecast, fmtRate, insights, latencyStats, linearFit, mergeDevice, networkQuality, parseAgent, throughput } from './device.js';

const browser = (over = {}) => ({
  agent: { os: 'Windows', browser: 'Chrome 140', mobile: false },
  online: true,
  threads: 8,
  memoryGb: 8,
  connection: { type: undefined, effectiveType: '4g', downlink: 10, rtt: 50 },
  battery: { level: 0.5, charging: false },
  pressure: 'nominal',
  screen: { width: 1920, height: 1080, ratio: 1 },
  gpu: 'Intel UHD',
  ...over,
});
const pcReading = (over = {}) => ({
  source: 'pc',
  os: 'windows',
  os_version: '11',
  cpu: { percent: 23, cores: 4, threads: 8, ghz: 2.4 },
  memory: { percent: 61, total_gb: 15.8, used_gb: 9.6 },
  disk: { percent: 72, total_gb: 476, free_gb: 133.2 },
  battery: { percent: 80, plugged: true, minutes_left: null },
  network: { online: true, type: 'ethernet', wired: true, wifi: true, speed_mbps: 1000, bytes_sent: 1000, bytes_recv: 5000 },
  uptime_hours: 5,
  processes: 250,
  time: 100,
  ...over,
});

describe('linearFit', () => {
  it('finds the line through the points', () => {
    const fit = linearFit([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }]);
    expect(fit.slope).toBe(2);
    expect(fit.intercept).toBe(1);
    expect(fit.r2).toBe(1);
    expect(linearFit([{ x: 1, y: 1 }])).toBeNull();
  });
});

describe('batteryForecast', () => {
  const samples = (perMin, minutes, start) => Array.from({ length: minutes + 1 }, (_, i) => ({ t: i * 60_000, level: (start + perMin * i) / 100 }));
  it('predicts when charging finishes from the trend (regression)', () => {
    const f = batteryForecast(samples(1, 10, 50), true); // +1 %/min, now at 60%
    expect(f).toEqual({ minutes: 40, to: 'full', method: 'regression', confidence: 1, perHour: 60 });
  });
  it('predicts when the battery runs out', () => {
    const f = batteryForecast(samples(-0.5, 10, 40), false); // −0.5 %/min, now at 35%
    expect(f.to).toBe('empty');
    expect(f.minutes).toBe(70);
  });
  it('prefers the browser estimate, and waits for enough readings', () => {
    expect(batteryForecast([], true, 1800)).toMatchObject({ minutes: 30, method: 'browser' });
    expect(batteryForecast(samples(1, 1, 50), true)).toBeNull();
    expect(batteryForecast(samples(0, 10, 50), true)).toBeNull(); // not actually charging
  });
});

describe('latencyStats', () => {
  it('summarises replies and finds the spikes', () => {
    const s = latencyStats([40, 42, 39, 41, 400, 40, null, 43, 38, 380]);
    expect(s.median).toBe(41);
    expect(s.loss).toBe(0.1);
    expect(s.spikes).toEqual([4, 9]);
    expect(s.last).toBe(380);
  });
  it('handles no replies', () => {
    expect(latencyStats([null, null])).toEqual({ count: 0, loss: 1, spikes: [] });
  });
});

describe('networkQuality', () => {
  it('scores fast, slow and dead connections', () => {
    expect(networkQuality({ latency: 30, jitter: 5, loss: 0, downlink: 20 }).label).toBe('Excellent');
    expect(networkQuality({ latency: 450, jitter: 120, loss: 0.2, downlink: 0.5 }).label).toBe('Poor');
    expect(networkQuality({ latency: 30, online: false })).toEqual({ score: 0, label: 'Offline' });
    expect(networkQuality({ latency: null }).score).toBeNull();
  });
});

describe('throughput and formatting', () => {
  it('computes speed between two readings', () => {
    expect(throughput({ bytes_recv: 0, bytes_sent: 0, time: 0 }, { bytes_recv: 1_250_000, bytes_sent: 125_000, time: 1 })).toEqual({ down: 1_250_000, up: 125_000 });
    expect(throughput({ bytes_recv: 10, bytes_sent: 0, time: 0 }, { bytes_recv: 0, bytes_sent: 0, time: 1 })).toBeNull(); // counter reset
    expect(fmtRate(1_250_000)).toBe('10.0 Mb/s');
    expect(fmtRate(500)).toBe('4 kb/s');
  });
});

describe('parseAgent', () => {
  it('reads OS and browser', () => {
    const edge = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0';
    expect(parseAgent(edge)).toMatchObject({ os: 'Windows', browser: 'Edge 140', mobile: false });
    expect(parseAgent(edge, { platform: 'Windows', platformVersion: '15.0.0', mobile: false }).os).toBe('Windows 11');
    const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
    expect(parseAgent(android)).toMatchObject({ os: 'Android 14', browser: 'Chrome 140', mobile: true });
  });
});

describe('mergeDevice', () => {
  it('uses the browser alone', () => {
    const d = mergeDevice(browser(), null);
    expect(d.source).toBe('browser');
    expect(d.cpu.percent).toBe(15); // "nominal" pressure
    expect(d.memory).toEqual({ percent: null, totalGb: 8, approx: true });
    expect(d.battery).toMatchObject({ level: 0.5, charging: false, source: 'browser' });
    expect(d.disk).toBeNull();
  });
  it('prefers the PC reading: cable, CPU %, memory, disk, charger', () => {
    const d = mergeDevice(browser(), pcReading());
    expect(d.source).toBe('pc');
    expect(d.os).toBe('Windows 11');
    expect(d.cpu).toMatchObject({ percent: 23, cores: 4, threads: 8 });
    expect(d.network).toMatchObject({ online: true, type: 'ethernet', wired: true, linkMbps: 1000 });
    expect(d.battery).toMatchObject({ level: 0.8, charging: true, source: 'pc' });
    expect(d.disk.freeGb).toBe(133.2);
  });
});

describe('insights', () => {
  it('warns about a low battery, a full disk and slowdowns, worst first', () => {
    const d = mergeDevice(browser({ battery: { level: 0.1, charging: false } }), pcReading({ battery: null, disk: { percent: 95, total_gb: 256, free_gb: 12 } }));
    const { items, score } = insights(d, { latency: { spikes: [1, 5, 9], loss: 0 }, quality: { score: 80, label: 'Good' } });
    expect(items[0].tone).toBe('bad');
    expect(items.map((i) => i.text).join(' ')).toMatch(/Battery at 10%.*/);
    expect(items.some((i) => /disk is 95% full/.test(i.text))).toBe(true);
    expect(items.some((i) => /slowed down 3 times/.test(i.text))).toBe(true);
    expect(score).toBeLessThan(50);
  });
  it('says the charger and cable are connected, and that all is well', () => {
    const d = mergeDevice(browser(), pcReading());
    const { items, score } = insights(d, { forecast: { minutes: 25, to: 'full' }, quality: { score: 95, label: 'Excellent' } });
    const text = items.map((i) => i.text).join(' ');
    expect(text).toMatch(/Charger connected: full in about 25 min/);
    expect(text).toMatch(/Network cable connected \(1 Gb\/s link\)/);
    expect(text).toMatch(/Everything looks healthy/);
    expect(score).toBeGreaterThan(90);
  });
  it('notices being offline', () => {
    const { items } = insights(mergeDevice(browser({ online: false }), null));
    expect(items[0]).toMatchObject({ tone: 'bad', icon: 'wifi' });
  });
});
