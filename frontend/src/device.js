// "Your device": live details about the computer or phone the app is open on, plus the AI/ML
// that turns raw readings into answers (when will the battery be full? is the internet getting
// worse? what needs attention?).
//
// Two sources, merged (see useDevice.js):
//  * the browser, everywhere: battery level + charger plugged in, network type/speed, online
//    state, CPU threads, memory, CPU pressure, screen, GPU, and a latency probe;
//  * the PC itself, when the Azarvis AI service runs on it (http://127.0.0.1:8001/local/device,
//    backend/fastapi-ai/app/routers/local_bridge.py): CPU %, RAM %, disk, wired vs Wi-Fi, traffic.
// This file is pure (no browser APIs), so it is unit-tested in device.test.js.

// ---------- Statistics / ML ----------

/** Least-squares line through [{x, y}]: { slope, intercept, r2 } (null with < 2 distinct x). */
export function linearFit(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
    syy += (p.y - my) ** 2;
  }
  if (!sxx) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx, r2: syy ? (sxy * sxy) / (sxx * syy) : 1 };
}

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const quantile = (xs, q) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

/**
 * Battery forecast from level samples [{t: ms, level: 0..1}] while the charger state stayed
 * the same: a straight line through the readings tells when it reaches 100% (charging) or 0%.
 * The browser's own estimate (seconds, often Infinity) is used when it has one.
 */
export function batteryForecast(samples, charging, browserSeconds = Infinity) {
  if (Number.isFinite(browserSeconds) && browserSeconds > 0) {
    return { minutes: Math.round(browserSeconds / 60), to: charging ? 'full' : 'empty', method: 'browser', confidence: 1 };
  }
  const recent = samples.filter((s) => s.t >= (samples.at(-1)?.t ?? 0) - 45 * 60_000);
  if (recent.length < 3 || recent.at(-1).t - recent[0].t < 90_000) return null;
  const fit = linearFit(recent.map((s) => ({ x: (s.t - recent[0].t) / 60_000, y: s.level * 100 })));
  if (!fit) return null;
  const perMin = fit.slope; // % per minute
  if ((charging && perMin <= 0.02) || (!charging && perMin >= -0.01)) return null;
  const now = recent.at(-1).level * 100;
  const minutes = Math.round(charging ? (100 - now) / perMin : now / -perMin);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 48 * 60) return null;
  return { minutes, to: charging ? 'full' : 'empty', method: 'regression', confidence: Math.round(fit.r2 * 100) / 100, perHour: Math.round(perMin * 60 * 10) / 10 };
}

/** Latency samples (ms, null = failed): average, median, p95, jitter, loss and the spikes. */
export function latencyStats(samples) {
  const ok = samples.filter((v) => v != null);
  const loss = samples.length ? (samples.length - ok.length) / samples.length : 0;
  if (!ok.length) return { count: 0, loss, spikes: [] };
  const med = median(ok);
  const mad = median(ok.map((v) => Math.abs(v - med))) || 1;
  // Robust z-score (median / MAD): one slow reply doesn't hide the next one.
  const spikes = samples.map((v, i) => (v != null && (0.6745 * (v - med)) / mad > 3.5 && v - med > 40 ? i : -1)).filter((i) => i >= 0);
  let jitter = 0;
  for (let i = 1; i < ok.length; i++) jitter += Math.abs(ok[i] - ok[i - 1]);
  jitter = ok.length > 1 ? jitter / (ok.length - 1) : 0;
  return {
    count: ok.length,
    mean: Math.round(ok.reduce((s, v) => s + v, 0) / ok.length),
    median: Math.round(med),
    p95: Math.round(quantile(ok, 0.95)),
    jitter: Math.round(jitter),
    loss,
    spikes,
    last: ok.at(-1),
  };
}

/**
 * Network quality 0-100 from latency, jitter, loss and bandwidth: a small weighted model
 * (each input squashed to 0..1 by a logistic curve around a "this starts to hurt" point).
 */
export function networkQuality({ latency, jitter = 0, loss = 0, downlink = null, online = true }) {
  if (!online) return { score: 0, label: 'Offline' };
  if (latency == null) return { score: null, label: 'Measuring…' };
  const sig = (x, mid, k) => 1 / (1 + Math.exp((x - mid) / k));
  const parts = [
    [sig(latency, 180, 45), 0.45],
    [sig(jitter, 60, 18), 0.2],
    [sig(loss * 100, 8, 2.5), 0.25],
    [downlink == null ? 0.8 : 1 - sig(downlink, 2, 0.8), 0.1],
  ];
  const score = Math.round(100 * parts.reduce((s, [v, w]) => s + v * w, 0));
  return { score, label: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor' };
}

/** Bytes per second between two traffic readings ({bytes_recv, bytes_sent, time: seconds}). */
export function throughput(prev, next) {
  if (!prev || !next) return null;
  const dt = next.time - prev.time;
  if (dt <= 0) return null;
  const down = (next.bytes_recv - prev.bytes_recv) / dt;
  const up = (next.bytes_sent - prev.bytes_sent) / dt;
  return down < 0 || up < 0 ? null : { down, up };
}

export function fmtRate(bytesPerSec) {
  if (bytesPerSec == null) return '—';
  const bits = bytesPerSec * 8;
  if (bits >= 1e9) return `${(bits / 1e9).toFixed(1)} Gb/s`;
  if (bits >= 1e6) return `${(bits / 1e6).toFixed(1)} Mb/s`;
  if (bits >= 1e3) return `${Math.round(bits / 1e3)} kb/s`;
  return `${Math.round(bits)} b/s`;
}

export const fmtMinutes = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`);

// ---------- Reading the browser ----------

const PRESSURE = { nominal: 15, fair: 45, serious: 75, critical: 95 };

/** OS and browser from the user agent (Client Hints first, when the browser has them). */
export function parseAgent(ua = '', hints = null) {
  const os =
    hints?.platform && hints.platform !== 'Unknown'
      ? `${hints.platform === 'macOS' ? 'macOS' : hints.platform}${hints.platformVersion && hints.platform === 'Windows' ? (Number(hints.platformVersion.split('.')[0]) >= 13 ? ' 11' : ' 10') : ''}`
      : /Windows NT 10/.test(ua)
        ? 'Windows'
        : /Android ([\d.]+)/.test(ua)
          ? `Android ${ua.match(/Android ([\d.]+)/)[1]}`
          : /iPhone|iPad/.test(ua)
            ? 'iOS'
            : /Mac OS X/.test(ua)
              ? 'macOS'
              : /Linux/.test(ua)
                ? 'Linux'
                : 'Unknown';
  const m =
    ua.match(/Edg\/(\d+)/) ? ['Edge', ua.match(/Edg\/(\d+)/)[1]] : ua.match(/OPR\/(\d+)/) ? ['Opera', ua.match(/OPR\/(\d+)/)[1]] : ua.match(/Chrome\/(\d+)/) ? ['Chrome', ua.match(/Chrome\/(\d+)/)[1]] : ua.match(/Firefox\/(\d+)/) ? ['Firefox', ua.match(/Firefox\/(\d+)/)[1]] : ua.match(/Version\/(\d+).*Safari/) ? ['Safari', ua.match(/Version\/(\d+)/)[1]] : ['Browser', ''];
  const mobile = hints?.mobile ?? /Mobi|Android|iPhone/.test(ua);
  return { os, browser: `${m[0]}${m[1] ? ` ${m[1]}` : ''}`, mobile, model: hints?.model || '' };
}

/**
 * One merged picture of the device from the browser reading (b) and the PC reading (pc, or null).
 * Every field says where it came from, so the card can show "from your PC" vs "from the browser".
 */
export function mergeDevice(b, pc) {
  const battery = pc?.battery
    ? { level: pc.battery.percent / 100, charging: pc.battery.plugged, minutesLeft: pc.battery.minutes_left, source: 'pc' }
    : b.battery
      ? { ...b.battery, source: 'browser' }
      : null;
  const conn = b.connection || {};
  const net = pc?.network;
  const type = net?.type || (conn.type && conn.type !== 'unknown' ? conn.type : null);
  return {
    source: pc ? 'pc' : 'browser',
    os: pc ? { windows: 'Windows', mac: 'macOS', linux: 'Linux' }[pc.os] + (pc.os === 'windows' && pc.os_version ? ` ${pc.os_version}` : '') : b.agent.os,
    browser: b.agent.browser,
    mobile: b.agent.mobile,
    cpu: {
      percent: pc ? pc.cpu.percent : b.pressure ? PRESSURE[b.pressure] : null,
      pressure: b.pressure || null,
      threads: pc?.cpu.threads ?? b.threads ?? null,
      cores: pc?.cpu.cores ?? null,
      ghz: pc?.cpu.ghz ?? null,
    },
    memory: pc ? { percent: pc.memory.percent, totalGb: pc.memory.total_gb, usedGb: pc.memory.used_gb } : { percent: null, totalGb: b.memoryGb ?? null, approx: true },
    disk: pc ? { percent: pc.disk.percent, totalGb: pc.disk.total_gb, freeGb: pc.disk.free_gb } : null,
    battery,
    network: {
      online: b.online && (net ? net.online : true),
      type, // 'ethernet' | 'wifi' | 'cellular' | null
      wired: net ? net.wired : type === 'ethernet',
      generation: conn.effectiveType || null, // '4g', '3g'… (the browser's speed class)
      downlink: conn.downlink ?? null,
      rtt: conn.rtt ?? null,
      linkMbps: net?.speed_mbps ?? null,
      saveData: Boolean(conn.saveData),
    },
    screen: b.screen,
    gpu: b.gpu,
    uptimeHours: pc?.uptime_hours ?? null,
    processes: pc?.processes ?? null,
  };
}

// ---------- AI insights ----------

/**
 * What deserves attention, worst first: [{ tone: 'bad' | 'warn' | 'ok' | 'info', icon, text }],
 * and an overall health score 0-100.
 */
export function insights(d, { forecast = null, latency = null, quality = null } = {}) {
  const out = [];
  const add = (tone, icon, text) => out.push({ tone, icon, text });
  if (!d.network.online) add('bad', 'wifi', 'You are offline. Azarvis will reconnect by itself when the internet is back.');
  const b = d.battery;
  if (b) {
    const pct = Math.round(b.level * 100);
    if (!b.charging && pct <= 15) add('bad', 'zap', `Battery at ${pct}%. Plug in the charger soon${forecast?.to === 'empty' ? `: about ${fmtMinutes(forecast.minutes)} left` : ''}.`);
    else if (!b.charging && pct <= 30) add('warn', 'zap', `Battery at ${pct}% and not charging.`);
    else if (b.charging && pct >= 95) add('ok', 'zap', 'Charger connected and the battery is almost full. You can unplug to save battery health.');
    else if (b.charging) add('ok', 'zap', `Charger connected${forecast?.to === 'full' ? `: full in about ${fmtMinutes(forecast.minutes)}` : ''}.`);
  }
  if (d.cpu.percent != null && d.cpu.percent >= 85) add('warn', 'cpu', `The processor is very busy (${d.source === 'pc' ? `${d.cpu.percent}%` : d.cpu.pressure}). Close heavy apps or browser tabs.`);
  if (d.memory.percent != null && d.memory.percent >= 88) add('warn', 'cpu', `Memory is ${d.memory.percent}% full. Closing a few apps will speed things up.`);
  if (d.disk && d.disk.percent >= 90) add('bad', 'folder', `The disk is ${d.disk.percent}% full (${d.disk.freeGb} GB free). Clear downloads or the recycle bin.`);
  if (latency?.spikes?.length >= 2) add('warn', 'pulse', `The internet slowed down ${latency.spikes.length} times in the last few minutes (spikes found by anomaly detection).`);
  if (quality?.score != null && quality.score < 50 && d.network.online) add('warn', 'wifi', `Connection quality is ${quality.label.toLowerCase()} (${quality.score}/100).${d.network.type === 'wifi' ? ' Moving closer to the router or using a cable helps.' : ''}`);
  if (latency?.loss >= 0.2 && d.network.online) add('warn', 'wifi', `${Math.round(latency.loss * 100)}% of checks got no reply: the connection is dropping.`);
  if (d.network.wired) add('ok', 'wifi', `Network cable connected${d.network.linkMbps ? ` (${d.network.linkMbps >= 1000 ? `${d.network.linkMbps / 1000} Gb/s` : `${d.network.linkMbps} Mb/s`} link)` : ''}.`);
  if (d.uptimeHours != null && d.uptimeHours >= 24 * 7) add('info', 'refresh', `Your PC has been on for ${Math.round(d.uptimeHours / 24)} days. A restart clears memory and installs updates.`);
  if (!out.some((i) => i.tone === 'bad' || i.tone === 'warn')) add('ok', 'check', 'Everything looks healthy.');

  let score = 100;
  for (const i of out) score -= i.tone === 'bad' ? 30 : i.tone === 'warn' ? 12 : 0;
  if (quality?.score != null) score = Math.min(score, 40 + Math.round(quality.score * 0.6));
  const order = { bad: 0, warn: 1, ok: 2, info: 3 };
  return { items: out.sort((a, b) => order[a.tone] - order[b.tone]), score: Math.max(0, Math.min(100, score)) };
}
