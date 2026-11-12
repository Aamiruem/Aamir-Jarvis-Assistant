import { useCallback, useState } from 'react';
import { fmtMinutes, fmtRate } from '../device.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import { useDevice } from '../useDevice.js';
import './DeviceCard.css';

// "Your device": live battery and charger, network (cable / Wi-Fi / mobile), CPU, memory, disk,
// plus the AI insights from device.js. compact: just the meters and the top insight (Home).

const NET_NAME = { ethernet: 'Ethernet (cable)', wifi: 'Wi-Fi', cellular: 'Mobile data', bluetooth: 'Bluetooth', wimax: 'WiMAX' };

function Meter({ label, value, text, sub, hue, warn = false, icon }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`dv-meter ${warn ? 'warn' : ''}`} style={{ '--p': pct, '--hue': hue }}>
      <div className="dv-ring" role="img" aria-label={`${label}: ${text}`}>
        <span>{icon ? <Icon name={icon} size="1.05em" /> : null}{text}</span>
      </div>
      <strong>{label}</strong>
      <small>{sub}</small>
    </div>
  );
}

function Sparkline({ values }) {
  const ok = values.filter((v) => v != null);
  if (ok.length < 2) return <div className="dv-spark dv-spark--empty">Measuring…</div>;
  const max = Math.max(...ok, 50);
  const w = 160;
  const h = 36;
  const step = w / Math.max(1, values.length - 1);
  let d = '';
  values.forEach((v, i) => {
    if (v == null) return;
    d += `${d ? 'L' : 'M'}${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`;
  });
  return (
    <svg className="dv-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function DeviceCard({ compact = false, onOpen }) {
  const [events, setEvents] = useState([]);
  const onEvent = useCallback((e) => {
    setEvents((list) => [e, ...list].slice(0, 6));
    toast(e.text);
  }, []);
  const { device: d, latency, pings, quality, forecast, health, rate, pc } = useDevice({ onEvent });
  const b = d.battery;
  const batteryPct = b ? Math.round(b.level * 100) : null;
  const netName = d.network.online ? NET_NAME[d.network.type] || (d.network.generation ? `Online · ${d.network.generation.toUpperCase()} speed` : 'Online') : 'Offline';

  const meters = (
    <div className="dv-meters">
      <Meter
        label="Battery"
        hue={b?.charging ? 150 : batteryPct != null && batteryPct <= 20 ? 0 : 45}
        value={batteryPct}
        text={batteryPct == null ? '—' : `${batteryPct}%`}
        icon={b?.charging ? 'zap' : null}
        warn={batteryPct != null && batteryPct <= 20 && !b?.charging}
        sub={b ? (b.charging ? 'Charger connected' : 'On battery') : 'No battery found'}
      />
      <Meter
        label="CPU"
        hue={190}
        value={d.cpu.percent}
        text={d.cpu.percent == null ? `${d.cpu.threads ?? '—'}` : d.source === 'pc' ? `${d.cpu.percent}%` : d.cpu.pressure.charAt(0).toUpperCase() + d.cpu.pressure.slice(1)}
        warn={d.cpu.percent >= 85}
        sub={d.source === 'pc' ? `${d.cpu.cores ?? '?'} cores · ${d.cpu.threads ?? '?'} threads` : d.cpu.pressure ? 'Load (browser)' : `${d.cpu.threads ?? '?'} threads`}
      />
      <Meter
        label="Memory"
        hue={265}
        value={d.memory.percent}
        text={d.memory.percent != null ? `${d.memory.percent}%` : d.memory.totalGb ? `${d.memory.totalGb}${d.memory.totalGb >= 8 ? '+' : ''} GB` : '—'}
        warn={d.memory.percent >= 88}
        sub={d.memory.percent != null ? `${d.memory.usedGb} of ${d.memory.totalGb} GB` : 'Total (browser)'}
      />
      <Meter
        label="Network"
        hue={quality.score == null ? 210 : quality.score >= 70 ? 150 : quality.score >= 50 ? 40 : 0}
        value={quality.score}
        text={latency.median != null ? `${latency.median} ms` : d.network.online ? '…' : 'Off'}
        icon={d.network.wired ? 'wifi' : null}
        warn={quality.score != null && quality.score < 50}
        sub={netName}
      />
    </div>
  );

  const top = health.items[0];
  if (compact) {
    return (
      <div className="dv dv--compact">
        {meters}
        {top && (
          <p className={`dv-insight dv-insight--${top.tone}`}>
            <Icon name={top.icon} size="1em" /> {top.text}
          </p>
        )}
        {onOpen && (
          <button type="button" className="btn ghost sm dv-more" onClick={onOpen}>
            All device details <Icon name="chevron" size="0.9em" />
          </button>
        )}
      </div>
    );
  }

  const facts = [
    ['monitor', 'System', `${d.os}${d.mobile ? ' (mobile)' : ''}`],
    ['globe', 'Browser', d.browser],
    ['cpu', 'Processor', [d.cpu.cores && `${d.cpu.cores} cores`, d.cpu.threads && `${d.cpu.threads} threads`, d.cpu.ghz && `${d.cpu.ghz} GHz`].filter(Boolean).join(' · ') || '—'],
    ['folder', 'Disk', d.disk ? `${d.disk.freeGb} GB free of ${d.disk.totalGb} GB (${d.disk.percent}% used)` : 'Connect your PC to see it'],
    ['wifi', 'Connection', [netName, d.network.linkMbps && `${d.network.linkMbps} Mb/s link`, d.network.downlink && `~${d.network.downlink} Mb/s`].filter(Boolean).join(' · ')],
    ['download', 'Traffic now', rate ? `↓ ${fmtRate(rate.down)} · ↑ ${fmtRate(rate.up)}` : 'Connect your PC to see it'],
    ['screenshot', 'Screen', `${d.screen.width} × ${d.screen.height}${d.screen.ratio !== 1 ? ` @${Math.round(d.screen.ratio * 100) / 100}x` : ''}`],
    ['sparkles', 'Graphics', d.gpu || '—'],
    ...(d.uptimeHours != null ? [['clock', 'Turned on', d.uptimeHours >= 48 ? `${Math.round(d.uptimeHours / 24)} days ago` : `${d.uptimeHours} hours ago`]] : []),
  ];

  return (
    <div className="dv">
      <div className="dv-top">
        <div className={`dv-score ${health.score >= 80 ? 'ok' : health.score >= 55 ? 'mid' : 'bad'}`} style={{ '--p': health.score }}>
          <span>{health.score}</span>
          <small>health</small>
        </div>
        <div className="grow">
          <div className="dv-source">
            {d.source === 'pc' ? (
              <span className="dv-badge on"><i /> Live from your PC</span>
            ) : (
              <span className="dv-badge"><i /> Live from your browser</span>
            )}
            {pc.state === 'on' ? (
              <button type="button" className="link-btn" onClick={pc.disconnect}>Disconnect PC</button>
            ) : pc.state === 'connecting' ? (
              <span className="muted small">Connecting to your PC…</span>
            ) : (
              <button type="button" className="btn sm" onClick={pc.connect}><Icon name="cpu" size="0.95em" /> Connect my PC</button>
            )}
          </div>
          <p className="muted small dv-explain">
            {d.source === 'pc'
              ? 'CPU, memory, disk, cable and Wi-Fi come from the Azarvis service on this computer, every 3 seconds.'
              : pc.state === 'failed'
                ? 'Your PC did not answer. Start Azarvis on this computer (npm run dev), allow "local network access" if the browser asks, and it connects by itself.'
                : 'Battery, charger, network and CPU load come from your browser. Connect your PC to also see CPU %, memory, disk and whether a network cable is plugged in.'}
          </p>
        </div>
      </div>

      {meters}

      <div className="dv-grid">
        <section className="dv-box">
          <h4><Icon name="sparkles" size="1em" /> AI insights</h4>
          <ul className="dv-insights">
            {health.items.map((i, n) => (
              <li key={n} className={`dv-insight dv-insight--${i.tone}`}><Icon name={i.icon} size="1em" /> {i.text}</li>
            ))}
          </ul>
          <div className="dv-ml">
            <div>
              <span>Battery forecast</span>
              <strong>{forecast ? `${forecast.to === 'full' ? 'Full' : 'Empty'} in ${fmtMinutes(forecast.minutes)}` : b ? 'Learning your usage…' : '—'}</strong>
              <small>{forecast ? (forecast.method === 'regression' ? `Linear regression · fit ${Math.round(forecast.confidence * 100)}%${forecast.perHour ? ` · ${forecast.perHour > 0 ? '+' : ''}${forecast.perHour}%/h` : ''}` : forecast.method === 'os' ? 'Estimate from Windows' : 'Estimate from the browser') : 'Needs a few minutes of readings'}</small>
            </div>
            <div>
              <span>Connection quality</span>
              <strong>{quality.score == null ? quality.label : `${quality.score}/100 · ${quality.label}`}</strong>
              <small>Weighted model: latency, jitter, loss, speed</small>
            </div>
            <div>
              <span>Slowdowns detected</span>
              <strong>{latency.count ? latency.spikes.length : '—'}</strong>
              <small>Anomaly detection (robust z-score)</small>
            </div>
          </div>
        </section>

        <section className="dv-box">
          <h4><Icon name="pulse" size="1em" /> Internet response time</h4>
          <Sparkline values={pings} />
          <dl className="dv-stats">
            <div><dt>Now</dt><dd>{latency.last != null ? `${latency.last} ms` : '—'}</dd></div>
            <div><dt>Typical</dt><dd>{latency.median != null ? `${latency.median} ms` : '—'}</dd></div>
            <div><dt>Slowest 5%</dt><dd>{latency.p95 != null ? `${latency.p95} ms` : '—'}</dd></div>
            <div><dt>Jitter</dt><dd>{latency.jitter != null ? `${latency.jitter} ms` : '—'}</dd></div>
          </dl>
          <h4 className="dv-sub"><Icon name="bell" size="1em" /> Live events</h4>
          {events.length ? (
            <ul className="dv-events">
              {events.map((e) => (
                <li key={e.at}><Icon name={e.kind === 'power' ? 'zap' : 'wifi'} size="0.95em" /> <span className="grow">{e.text}</span> <small className="muted">{new Date(e.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</small></li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Plug or unplug the charger{d.source === 'pc' ? ' or network cable' : ''}, or turn Wi-Fi off and on: it shows up here at once.</p>
          )}
        </section>
      </div>

      <dl className="dv-facts">
        {facts.map(([icon, label, value]) => (
          <div key={label}>
            <dt><Icon name={icon} size="0.95em" /> {label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="lab-note dv-privacy"><Icon name="shield" size="0.95em" /> Read on this device only. Nothing about your device is sent to a server.</p>
    </div>
  );
}
