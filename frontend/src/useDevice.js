import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { batteryForecast, insights, latencyStats, mergeDevice, networkQuality, parseAgent, throughput } from './device.js';

// Live device details (see device.js). Browser readings start at once; the PC bridge
// (http://127.0.0.1:8001/local/device, the Azarvis AI service on this computer) only after the
// user presses "Connect my PC" (remembered), because Chrome asks permission for a website to
// reach this computer. Events like "charger connected" are reported through onEvent.

export const BRIDGE_URL = 'http://127.0.0.1:8001/local/device';
const BRIDGE_KEY = 'azarvis-pc-bridge';
// Another port for the AI service: localStorage 'azarvis-pc-bridge-url' (this computer only).
const bridgeUrl = () => {
  try {
    const custom = localStorage.getItem('azarvis-pc-bridge-url') || '';
    return /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}\/local\/device$/.test(custom) ? custom : BRIDGE_URL;
  } catch {
    return BRIDGE_URL;
  }
};
const PING_MS = 6000;
const PC_MS = 3000;
const KEEP = 60; // latency samples kept (about 6 minutes)

const isLocalPage = () => /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const readBridgeChoice = () => {
  try {
    return localStorage.getItem(BRIDGE_KEY) === 'on';
  } catch {
    return false;
  }
};

function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    return String(name || '')
      .replace(/^ANGLE \((.*)\)$/, '$1')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !/^(Google|Direct3D|D3D11|vs_|ps_|0x)/i.test(s))
      .slice(0, 1)
      .join('')
      .replace(/\s*\(0x[0-9A-F]+\)/i, '')
      .replace(/ Direct3D.*$/, '');
  } catch {
    return '';
  }
}

function readBrowser(extra) {
  const nav = navigator;
  const c = nav.connection;
  return {
    agent: parseAgent(nav.userAgent, extra.hints),
    online: nav.onLine,
    threads: nav.hardwareConcurrency || null,
    memoryGb: nav.deviceMemory || null,
    connection: c ? { type: c.type, effectiveType: c.effectiveType, downlink: c.downlink, rtt: c.rtt, saveData: c.saveData } : null,
    battery: extra.battery,
    pressure: extra.pressure,
    screen: { width: window.screen.width, height: window.screen.height, ratio: window.devicePixelRatio || 1 },
    gpu: extra.gpu,
  };
}

export function useDevice({ onEvent } = {}) {
  const [battery, setBattery] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [hints, setHints] = useState(null);
  const [tick, setTick] = useState(0); // re-read navigator.* (online, connection) on change events
  const [pings, setPings] = useState([]);
  const [pc, setPc] = useState(null);
  const [pcState, setPcState] = useState(() => (readBridgeChoice() || isLocalPage() ? 'connecting' : 'off')); // off | connecting | on | failed
  const [rate, setRate] = useState(null);
  const batterySamples = useRef([]);
  const prevPc = useRef(null);
  const eventRef = useRef(onEvent);
  eventRef.current = onEvent;
  const gpu = useMemo(gpuName, []);
  const emit = useCallback((kind, text) => eventRef.current?.({ kind, text, at: Date.now() }), []);

  // Battery: level and charger plugged in, with events when either changes.
  useEffect(() => {
    let bat;
    let alive = true;
    const read = () => {
      if (!alive || !bat) return;
      const b = { level: bat.level, charging: bat.charging, chargingTime: bat.chargingTime, dischargingTime: bat.dischargingTime };
      const last = batterySamples.current.at(-1);
      if (last && last.charging !== b.charging) batterySamples.current = []; // new trend
      batterySamples.current = [...batterySamples.current, { t: Date.now(), level: b.level, charging: b.charging }].slice(-120);
      setBattery(b);
    };
    const onCharging = () => {
      read();
      emit('power', bat.charging ? 'Charger connected' : 'Charger disconnected: running on battery');
    };
    navigator.getBattery?.().then((b) => {
      bat = b;
      read();
      b.addEventListener('levelchange', read);
      b.addEventListener('chargingchange', onCharging);
      b.addEventListener('chargingtimechange', read);
      b.addEventListener('dischargingtimechange', read);
    }).catch(() => {});
    return () => {
      alive = false;
      if (bat) {
        bat.removeEventListener('levelchange', read);
        bat.removeEventListener('chargingchange', onCharging);
        bat.removeEventListener('chargingtimechange', read);
        bat.removeEventListener('dischargingtimechange', read);
      }
    };
  }, [emit]);

  // Online / offline and network changes (Wi-Fi to mobile data, speed class…).
  useEffect(() => {
    const up = () => {
      setTick((t) => t + 1);
      emit('network', 'Back online');
    };
    const down = () => {
      setTick((t) => t + 1);
      emit('network', 'Connection lost: you are offline');
    };
    const change = () => setTick((t) => t + 1);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    navigator.connection?.addEventListener?.('change', change);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      navigator.connection?.removeEventListener?.('change', change);
    };
  }, [emit]);

  // CPU pressure (Chrome/Edge 125+): nominal, fair, serious, critical.
  useEffect(() => {
    if (!('PressureObserver' in window)) return;
    let obs;
    try {
      obs = new window.PressureObserver((records) => setPressure(records.at(-1)?.state ?? null));
      obs.observe('cpu', { sampleInterval: 2000 })?.catch?.(() => {});
    } catch {}
    return () => {
      try {
        obs?.disconnect();
      } catch {}
    };
  }, []);

  // OS version and device model (Client Hints, Chromium browsers).
  useEffect(() => {
    navigator.userAgentData?.getHighEntropyValues?.(['platformVersion', 'model']).then((h) => setHints({ ...h, platform: h.platform || navigator.userAgentData.platform, mobile: navigator.userAgentData.mobile })).catch(() => {});
  }, []);

  // Latency probe: a tiny request to this website every few seconds (paused when hidden).
  useEffect(() => {
    let stop = false;
    let timer;
    const ping = async () => {
      if (stop) return;
      if (document.visibilityState === 'visible') {
        const started = performance.now();
        let ms = null;
        try {
          if (navigator.onLine) {
            await fetch(`/favicon.ico?ping=${Date.now()}`, { cache: 'no-store', method: 'HEAD' });
            ms = Math.round(performance.now() - started);
          }
        } catch {}
        setPings((p) => [...p, ms].slice(-KEEP));
      }
      timer = setTimeout(ping, PING_MS);
    };
    ping();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, []);

  // The PC bridge.
  useEffect(() => {
    if (pcState === 'off') return;
    let stop = false;
    let timer;
    let fails = 0;
    const read = async () => {
      if (stop) return;
      try {
        const r = await fetch(bridgeUrl(), { cache: 'no-store', targetAddressSpace: 'loopback' });
        if (!r.ok) throw new Error(String(r.status));
        const info = await r.json();
        const before = prevPc.current;
        if (before) {
          setRate(throughput(before.network, { ...info.network, time: info.time }));
          if (before.network.wired !== info.network.wired) emit('network', info.network.wired ? 'Network cable connected' : 'Network cable unplugged');
          else if (before.network.type !== info.network.type && info.network.type) emit('network', `Now on ${info.network.type === 'wifi' ? 'Wi-Fi' : 'Ethernet'}`);
          if (before.battery && info.battery && before.battery.plugged !== info.battery.plugged && !navigator.getBattery) emit('power', info.battery.plugged ? 'Charger connected' : 'Charger disconnected: running on battery');
        }
        prevPc.current = { ...info, network: { ...info.network, time: info.time } };
        fails = 0;
        setPc(info);
        setPcState('on');
      } catch {
        fails += 1;
        if (fails >= 2) {
          setPc(null);
          setPcState((s) => (s === 'off' ? s : 'failed'));
        }
      }
      timer = setTimeout(read, fails ? Math.min(30_000, PC_MS * 2 ** fails) : PC_MS);
    };
    read();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [pcState === 'off', emit]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectPc = useCallback(() => {
    try {
      localStorage.setItem(BRIDGE_KEY, 'on');
    } catch {}
    setPcState('connecting');
  }, []);
  const disconnectPc = useCallback(() => {
    try {
      localStorage.setItem(BRIDGE_KEY, 'off');
    } catch {}
    prevPc.current = null;
    setPc(null);
    setRate(null);
    setPcState('off');
  }, []);

  const device = useMemo(() => mergeDevice(readBrowser({ hints, battery, pressure, gpu }), pc), [hints, battery, pressure, gpu, pc, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const latency = useMemo(() => latencyStats(pings), [pings]);
  const quality = useMemo(
    () => networkQuality({ latency: latency.median ?? null, jitter: latency.jitter, loss: latency.loss, downlink: device.network.downlink, online: device.network.online }),
    [latency, device.network.downlink, device.network.online],
  );
  const forecast = useMemo(() => {
    const b = device.battery;
    if (!b) return null;
    if (b.source === 'pc' && b.minutesLeft && !b.charging) return { minutes: b.minutesLeft, to: 'empty', method: 'os', confidence: 1 };
    return batteryForecast(batterySamples.current, b.charging, b.charging ? battery?.chargingTime : battery?.dischargingTime);
  }, [device.battery, battery]);
  const health = useMemo(() => insights(device, { forecast, latency, quality }), [device, forecast, latency, quality]);

  return { device, latency, pings, quality, forecast, health, rate, pc: { state: pcState, connect: connectPc, disconnect: disconnectPc } };
}
