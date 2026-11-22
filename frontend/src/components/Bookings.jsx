import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import './Bookings.css';

// Bookings: one place to search, compare and book real travel (backend app/booking).
// Everything shown comes from a provider: Duffel (flights + hotels), Ticketmaster (events, search only),
// Razorpay (payment). A provider without a key says "not connected"; trains, buses and movies have no
// public booking API, so they link to the official sites. Nothing is reserved or charged until you tick
// the confirmation on the full summary, and "Confirmed" appears only after the provider confirmed it.

const CATS = [
  { id: 'flights', label: 'Flights', sub: 'Search & book', icon: 'plane', hue: 245 },
  { id: 'hotels', label: 'Hotels', sub: 'Find stays', icon: 'bed', hue: 215 },
  { id: 'events', label: 'Events', sub: 'Concerts & shows', icon: 'ticket', hue: 330 },
  { id: 'trains', label: 'Trains', sub: 'IRCTC', icon: 'train', hue: 200, partner: 'irctc' },
  { id: 'buses', label: 'Buses', sub: 'Operators', icon: 'bus', hue: 30, partner: 'buses' },
  { id: 'movies', label: 'Movies', sub: 'Cinemas', icon: 'film', hue: 0, partner: 'movies' },
];
const STATUS = {
  awaiting_confirmation: ['Needs your confirmation', 'warn'], awaiting_payment: ['Awaiting payment', 'warn'], paid: ['Paid, booking…', 'info'],
  booking: ['Booking with provider…', 'info'], confirmed: ['Confirmed', 'ok'], failed: ['Failed: not charged', 'bad'], refunded: ['Failed: refunded', 'bad'],
  refund_failed: ['Failed: refund needed', 'bad'], needs_review: ['Needs review', 'warn'], expired: ['Expired', 'muted'], cancelled: ['Cancelled', 'muted'],
};
const ASK_EXAMPLES = [
  'Plan a 3-day trip from Delhi to Jaipur for two people under ₹15,000',
  'Find the cheapest flight from Delhi to Dubai next Friday',
  'Find a 4-star hotel in Goa for 12–15 Jan',
];

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d, n) => new Date(new Date(d).getTime() + n * 864e5).toISOString().slice(0, 10);
const money = (a, c) => {
  if (a == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: c || 'USD', maximumFractionDigits: 2 }).format(Number(a));
  } catch {
    return `${a} ${c || ''}`;
  }
};
const hm = (m) => (m == null ? '' : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`);
const time = (iso) => (iso ? iso.slice(11, 16) : '');
const day = (iso) => (iso ? new Date(iso.slice(0, 10)).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

// ---------- small pieces ----------

function PlaceInput({ label, value, onChange, kind = 'airport', disabled }) {
  const [q, setQ] = useState(value?.label || '');
  const [opts, setOpts] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef(0);
  useEffect(() => setQ(value?.label || ''), [value]);
  const search = (text) => {
    setQ(text);
    onChange(null);
    clearTimeout(timer.current);
    if (text.trim().length < 2) return setOpts([]);
    timer.current = setTimeout(() => {
      api.bookingPlaces(text.trim()).then((d) => {
        setOpts((d.places || []).filter((p) => (kind === 'city' ? p.lat != null : p.code)).slice(0, 8));
        setActive(0);
        setOpen(true);
      }).catch((e) => setOpts([{ error: e.message }]));
    }, 250);
  };
  const pick = (p) => {
    onChange({ ...p, label: kind === 'city' ? `${p.city || p.name}${p.country ? `, ${p.country}` : ''}` : `${p.city || p.name} (${p.code})` });
    setOpen(false);
  };
  const onKey = (e) => {
    const real = opts.filter((o) => !o.error);
    if (!open || !real.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : real.length - 1)) % real.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(real[active] || real[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };
  return (
    <label className="bk-field bk-place">
      <span>{label}</span>
      <input value={q} onChange={(e) => search(e.target.value)} onFocus={() => opts.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey}
        placeholder={kind === 'city' ? 'City' : 'City or airport'} disabled={disabled} autoComplete="off" role="combobox" aria-expanded={open} />
      {open && opts.length > 0 && (
        <ul className="bk-suggest" role="listbox">
          {opts.map((p, i) => (p.error ? <li key={i} className="err">{p.error}</li> : (
            <li key={`${p.code}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'act' : ''} onMouseDown={() => pick(p)}>
              <Icon name={p.type === 'city' ? 'globe' : 'plane'} size="1em" /> <b>{p.code}</b> {p.name}{p.city && p.city !== p.name ? `, ${p.city}` : ''} <small>{p.country}</small>
            </li>
          )))}
        </ul>
      )}
    </label>
  );
}

function Badge({ status }) {
  const [label, tone] = STATUS[status] || [status, 'muted'];
  return <span className={`bk-badge t-${tone}`}>{label}</span>;
}

function ModeChip({ live }) {
  return live ? <span className="bk-chip live">LIVE</span> : <span className="bk-chip test" title="Provider sandbox: real API, no real ticket or charge">TEST MODE</span>;
}

// ---------- flights ----------

function FlightSearch({ disabled, onResults }) {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [dep, setDep] = useState(plusDays(today(), 14));
  const [ret, setRet] = useState('');
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState('economy');
  const [direct, setDirect] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    if (!from || !to) return toast('Pick the departure and destination from the suggestions.', 'error');
    setBusy(true);
    try {
      const r = await api.bookingSearchFlights({ origin: from.code, destination: to.code, departure_date: dep, return_date: ret || null, adults, cabin_class: cabin, max_connections: direct ? 0 : null });
      onResults({ ...r, query: { from, to, dep, ret, adults } });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="bk-form" onSubmit={go}>
      <PlaceInput label="From" value={from} onChange={setFrom} disabled={disabled} />
      <button type="button" className="bk-swap" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap from and to"><Icon name="refresh" size="1em" /></button>
      <PlaceInput label="To" value={to} onChange={setTo} disabled={disabled} />
      <label className="bk-field"><span>Depart</span><input type="date" value={dep} min={today()} onChange={(e) => setDep(e.target.value)} required disabled={disabled} /></label>
      <label className="bk-field"><span>Return (optional)</span><input type="date" value={ret} min={dep} onChange={(e) => setRet(e.target.value)} disabled={disabled} /></label>
      <label className="bk-field sm"><span>Adults</span><input type="number" min="1" max="9" value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} disabled={disabled} /></label>
      <label className="bk-field"><span>Cabin</span>
        <select value={cabin} onChange={(e) => setCabin(e.target.value)} disabled={disabled}>
          <option value="economy">Economy</option><option value="premium_economy">Premium economy</option><option value="business">Business</option><option value="first">First</option>
        </select>
      </label>
      <label className="bk-check"><input type="checkbox" checked={direct} onChange={(e) => setDirect(e.target.checked)} disabled={disabled} /> Direct only</label>
      <button className="bk-btn primary" disabled={disabled || busy}>{busy ? <><span className="bk-spin" /> Searching airlines…</> : <><Icon name="search" size="1em" /> Search flights</>}</button>
    </form>
  );
}

function FlightCard({ o, onPick }) {
  return (
    <article className="bk-offer">
      <header>
        {o.airline_logo ? <img src={o.airline_logo} alt="" className="bk-logo" /> : <span className="bk-logo ph"><Icon name="plane" size="1em" /></span>}
        <b>{o.airline}</b>
        <span className="bk-tags">{o.tags.map((t) => <i key={t} className={`tag-${t.replace(' ', '-')}`}>{t}</i>)}</span>
      </header>
      {o.slices.map((s, i) => (
        <div key={i} className="bk-leg">
          <div><b>{time(s.departing_at)}</b><small>{s.origin} · {day(s.departing_at)}</small></div>
          <div className="bk-line"><small>{hm(s.minutes)}</small><i /><small>{s.stops ? `${s.stops} stop${s.stops > 1 ? 's' : ''}` : 'Direct'}</small></div>
          <div><b>{time(s.arriving_at)}</b><small>{s.destination} · {day(s.arriving_at)}</small></div>
        </div>
      ))}
      <footer>
        <span className="bk-rules">
          {o.slices[0]?.baggage?.checked ? `${o.slices[0].baggage.checked} checked bag` : 'No checked bag'} · {o.refund?.allowed ? `Refundable${o.refund.penalty && Number(o.refund.penalty) > 0 ? ` (fee ${money(o.refund.penalty, o.refund.currency)})` : ''}` : 'Non-refundable'}
        </span>
        <b className="bk-price">{money(o.total_amount, o.total_currency)}</b>
        <button type="button" className="bk-btn primary" onClick={() => onPick(o)}>Select</button>
      </footer>
    </article>
  );
}

function FlightResults({ res, onPick }) {
  const [sort, setSort] = useState('best');
  const [refundOnly, setRefundOnly] = useState(false);
  const list = useMemo(() => {
    let l = res.offers.filter((o) => !refundOnly || o.refund?.allowed);
    if (sort === 'fastest') l = [...l].sort((a, b) => (a.minutes || 1e9) - (b.minutes || 1e9));
    if (sort === 'best') l = [...l].sort((a, b) => (b.tags.includes('best value') - a.tags.includes('best value')) || Number(a.total_amount) - Number(b.total_amount));
    return l;
  }, [res, sort, refundOnly]);
  return (
    <section className="bk-panel">
      <header className="bk-results-head">
        <h3>{res.query.from.code} → {res.query.to.code} <small>{res.total} offers</small> <ModeChip live={res.live_mode} /></h3>
        <div className="bk-seg" role="group" aria-label="Sort">
          {['best', 'cheapest', 'fastest'].map((s) => <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>{s}</button>)}
        </div>
        <label className="bk-check"><input type="checkbox" checked={refundOnly} onChange={(e) => setRefundOnly(e.target.checked)} /> Refundable only</label>
      </header>
      {list.length === 0 ? <p className="muted">No offers match. Try other dates or allow connections.</p> : list.slice(0, 25).map((o) => <FlightCard key={o.id} o={o} onPick={onPick} />)}
      <p className="bk-source">Live offers from Duffel. Prices are held for minutes; the price is re-checked before you pay.</p>
    </section>
  );
}

// ---------- hotels ----------

function HotelSearch({ disabled, onResults }) {
  const [city, setCity] = useState(null);
  const [ci, setCi] = useState(plusDays(today(), 14));
  const [co, setCo] = useState(plusDays(today(), 16));
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    if (!city) return toast('Pick the city from the suggestions.', 'error');
    setBusy(true);
    try {
      const r = await api.bookingSearchStays({ lat: city.lat, lng: city.lng, check_in: ci, check_out: co, adults, rooms });
      onResults({ ...r, query: { city, ci, co, adults, rooms } });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="bk-form" onSubmit={go}>
      <PlaceInput label="Destination" value={city} onChange={setCity} kind="city" disabled={disabled} />
      <label className="bk-field"><span>Check-in</span><input type="date" value={ci} min={today()} onChange={(e) => { setCi(e.target.value); if (co <= e.target.value) setCo(plusDays(e.target.value, 1)); }} required disabled={disabled} /></label>
      <label className="bk-field"><span>Check-out</span><input type="date" value={co} min={plusDays(ci, 1)} onChange={(e) => setCo(e.target.value)} required disabled={disabled} /></label>
      <label className="bk-field sm"><span>Guests</span><input type="number" min="1" max="16" value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))} disabled={disabled} /></label>
      <label className="bk-field sm"><span>Rooms</span><input type="number" min="1" max="8" value={rooms} onChange={(e) => setRooms(Math.max(1, Number(e.target.value) || 1))} disabled={disabled} /></label>
      <button className="bk-btn primary" disabled={disabled || busy}>{busy ? <><span className="bk-spin" /> Searching hotels…</> : <><Icon name="search" size="1em" /> Search hotels</>}</button>
    </form>
  );
}

function HotelResults({ res, onPickRate }) {
  const [open, setOpen] = useState(null); // {stay, rates}
  const [busy, setBusy] = useState('');
  const rates = async (s) => {
    setBusy(s.id);
    try {
      setOpen(await api.bookingStayRates(s.id));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  if (open) {
    return (
      <section className="bk-panel">
        <button type="button" className="bk-link" onClick={() => setOpen(null)}>← All hotels</button>
        <h3>{open.stay.name} <small>{open.stay.address}</small></h3>
        {open.rates.length === 0 ? <p className="muted">No bookable rooms for these dates.</p> : (
          <ul className="bk-rates">
            {open.rates.map((r) => (
              <li key={r.id}>
                <div><b>{r.room}</b><small>{[r.beds, r.board && r.board.replace(/_/g, ' '), r.refundable ? `Free cancellation${r.free_cancel_until ? ` until ${day(r.free_cancel_until)}` : ''}` : 'Non-refundable'].filter(Boolean).join(' · ')}</small>
                  {r.conditions.length > 0 && <small className="muted">{r.conditions.join(' · ')}</small>}</div>
                <b className="bk-price">{money(r.total_amount, r.total_currency)}</b>
                <button type="button" className="bk-btn primary" onClick={() => onPickRate(open.stay, r)}>Choose</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  return (
    <section className="bk-panel">
      <h3>{res.query.city.label} <small>{res.total} hotels · {day(res.query.ci)} – {day(res.query.co)}</small></h3>
      <div className="bk-hotels">
        {res.results.map((s) => (
          <article key={s.id} className="bk-hotel">
            <div className="ph" style={s.photo ? { backgroundImage: `url("${s.photo}")` } : undefined}>{!s.photo && <Icon name="bed" size="2em" />}</div>
            <div className="body">
              <b>{s.name}</b>
              <small>{s.rating ? `${'★'.repeat(Math.round(s.rating))} · ` : ''}{s.review_score ? `${s.review_score}/10 · ` : ''}{s.address}</small>
              <small className="muted">{s.amenities.slice(0, 3).join(' · ')}</small>
              <div className="row"><span>from <b className="bk-price">{money(s.from_amount, s.from_currency)}</b></span>
                <button type="button" className="bk-btn" onClick={() => rates(s)} disabled={busy === s.id}>{busy === s.id ? <span className="bk-spin" /> : 'See rooms'}</button></div>
            </div>
          </article>
        ))}
      </div>
      {res.results.length === 0 && <p className="muted">No hotels found there for these dates.</p>}
    </section>
  );
}

// ---------- events ----------

function Events({ disabled }) {
  const [f, setF] = useState({ keyword: '', city: '', country: 'IN', start: today() });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setRes(await api.bookingEvents(f));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <form className="bk-form" onSubmit={go}>
        <label className="bk-field"><span>Artist, team or show</span><input value={f.keyword} onChange={(e) => setF({ ...f, keyword: e.target.value })} placeholder="e.g. Coldplay" disabled={disabled} /></label>
        <label className="bk-field"><span>City</span><input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} disabled={disabled} /></label>
        <label className="bk-field sm"><span>Country</span><input value={f.country} maxLength={2} onChange={(e) => setF({ ...f, country: e.target.value.toUpperCase() })} disabled={disabled} /></label>
        <label className="bk-field"><span>From</span><input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} disabled={disabled} /></label>
        <button className="bk-btn primary" disabled={disabled || busy}>{busy ? <span className="bk-spin" /> : <><Icon name="search" size="1em" /> Find events</>}</button>
      </form>
      {res && (
        <section className="bk-panel">
          <h3>{res.total} events <small>from Ticketmaster</small></h3>
          <div className="bk-hotels">
            {res.events.map((ev) => (
              <article key={ev.id} className="bk-hotel">
                <div className="ph" style={ev.image ? { backgroundImage: `url("${ev.image}")` } : undefined}>{!ev.image && <Icon name="ticket" size="2em" />}</div>
                <div className="body">
                  <b>{ev.name}</b>
                  <small>{ev.date}{ev.time ? ` · ${ev.time.slice(0, 5)}` : ''} · {ev.venue}, {ev.city}</small>
                  <small className="muted">{[ev.segment, ev.genre].filter(Boolean).join(' · ')}{ev.status && ev.status !== 'onsale' ? ` · ${ev.status}` : ''}</small>
                  <div className="row"><span>{ev.price_min != null ? <>from <b className="bk-price">{money(ev.price_min, ev.currency)}</b></> : 'Price on Ticketmaster'}</span>
                    {ev.url && <a className="bk-btn" href={ev.url} target="_blank" rel="noreferrer">Tickets <Icon name="external" size="0.9em" /></a>}</div>
                </div>
              </article>
            ))}
          </div>
          {res.events.length === 0 && <p className="muted">No events found.</p>}
          <p className="bk-source">Search only: Ticketmaster sells the tickets on its own site.</p>
        </section>
      )}
    </>
  );
}

// ---------- traveller details, review, payment ----------

const emptyTraveller = { title: 'mr', gender: 'm', given_name: '', family_name: '', born_on: '' };

function TravellerForm({ item, onBack, onQuoted }) {
  const flight = item.kind === 'flight';
  const count = flight ? item.offer.passengers.length : 1;
  const [people, setPeople] = useState(() => Array.from({ length: count }, () => ({ ...emptyTraveller })));
  const [contact, setContact] = useState({ email: '', phone: '+91' });
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(flight ? item.offer : null);
  useEffect(() => {
    if (!flight) return;
    api.bookingOffer(item.offer.id).then(setFresh).catch((e) => toast(`Could not re-price: ${e.message}`, 'error'));
  }, [flight, item]);
  const set = (i, k, v) => setPeople((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const b = await api.bookingQuote(flight ? { kind: 'flight', offer_id: item.offer.id, travellers: people, contact }
        : { kind: 'stay', rate_id: item.rate.id, travellers: people, contact, stay: item.stay, rate: item.rate });
      onQuoted(b);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="bk-panel">
      <button type="button" className="bk-link" onClick={onBack}>← Back to results</button>
      <h3>{flight ? 'Traveller details' : 'Guest details'}</h3>
      {flight && fresh && (
        <div className="bk-fare">
          <b>{fresh.airline} · {money(fresh.total_amount, fresh.total_currency)}</b>
          {fresh.total_amount !== item.offer.total_amount && <span className="t-warn"> (price updated by the airline)</span>}
          <small>{fresh.refund?.allowed ? `Refund before departure allowed${fresh.refund.penalty ? `, fee ${money(fresh.refund.penalty, fresh.refund.currency)}` : ''}` : 'No refund'} · {fresh.change?.allowed ? `Changes allowed${fresh.change.penalty ? `, fee ${money(fresh.change.penalty, fresh.change.currency)}` : ''}` : 'No changes'}
            {fresh.conditions_url && <> · <a href={fresh.conditions_url} target="_blank" rel="noreferrer">conditions of carriage</a></>}</small>
          {fresh.id_documents_required && <small className="t-warn">This airline needs passport details at check-in.</small>}
        </div>
      )}
      <form onSubmit={submit} className="bk-people">
        {people.map((p, i) => (
          <fieldset key={i}>
            <legend>{flight ? `Traveller ${i + 1} (${item.offer.passengers[i].type})` : 'Lead guest'}: names exactly as on the ID</legend>
            {flight && (
              <>
                <label className="bk-field sm"><span>Title</span><select value={p.title} onChange={(e) => set(i, 'title', e.target.value)}>{['mr', 'ms', 'mrs', 'miss', 'dr'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select></label>
                <label className="bk-field sm"><span>Gender</span><select value={p.gender} onChange={(e) => set(i, 'gender', e.target.value)}><option value="m">M</option><option value="f">F</option></select></label>
              </>
            )}
            <label className="bk-field"><span>First name</span><input value={p.given_name} onChange={(e) => set(i, 'given_name', e.target.value)} required autoComplete="given-name" /></label>
            <label className="bk-field"><span>Last name</span><input value={p.family_name} onChange={(e) => set(i, 'family_name', e.target.value)} required autoComplete="family-name" /></label>
            {flight && <label className="bk-field"><span>Date of birth</span><input type="date" value={p.born_on} max={today()} onChange={(e) => set(i, 'born_on', e.target.value)} required /></label>}
          </fieldset>
        ))}
        <fieldset>
          <legend>Contact for the confirmation</legend>
          <label className="bk-field"><span>Email</span><input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required autoComplete="email" /></label>
          <label className="bk-field"><span>Phone (international)</span><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required placeholder="+919876543210" autoComplete="tel" /></label>
        </fieldset>
        <p className="bk-source">Dates of birth go to the airline and are deleted from Jarvis once the booking is confirmed. Card/UPI details are entered on Razorpay, never here.</p>
        <button className="bk-btn primary" disabled={busy}>{busy ? <span className="bk-spin" /> : 'Review booking'}</button>
      </form>
    </section>
  );
}

let razorpayLoading = null;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  razorpayLoading ??= new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = ok;
    s.onerror = () => {
      razorpayLoading = null;
      fail(new Error('Razorpay Checkout could not load (offline or blocked).'));
    };
    document.head.appendChild(s);
  });
  return razorpayLoading;
}

export function Review({ booking, onDone }) {
  const [b, setB] = useState(booking);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const flight = b.kind === 'flight';
  const s = b.summary || {};
  const pay = async (checkout) => {
    await loadRazorpay();
    await new Promise((resolve) => {
      const rp = new window.Razorpay({
        ...checkout,
        theme: { color: '#5b5bf7' },
        handler: async (resp) => {
          try {
            setB(await api.bookingPay(b.id, resp));
          } catch (e) {
            toast(e.message, 'error');
          }
          resolve();
        },
        modal: { ondismiss: () => { toast('Payment window closed: nothing was charged or booked.'); resolve(); } },
      });
      rp.on('payment.failed', (r) => toast(`Payment failed: ${r.error?.description || 'declined'}. Nothing was booked.`, 'error'));
      rp.open();
    });
  };
  const confirm = async () => {
    setBusy(true);
    try {
      const r = await api.bookingConfirm(b.id);
      setB(r);
      if (r.checkout) await pay(r.checkout);
    } catch (e) {
      toast(e.message, 'error');
      api.bookingGet(b.id).then(setB).catch(() => {});
    } finally {
      setBusy(false);
    }
  };
  if (['confirmed', 'failed', 'refunded', 'refund_failed', 'needs_review'].includes(b.status)) {
    return (
      <section className={`bk-panel bk-outcome o-${b.status}`}>
        <Icon name={b.status === 'confirmed' ? 'check' : 'alert'} size="2.4em" />
        <h3>{b.status === 'confirmed' ? 'Booking confirmed' : STATUS[b.status]?.[0]}</h3>
        <p>{b.title}</p>
        {b.booking_reference && <p className="bk-ref">{flight ? 'Airline reference (PNR)' : 'Hotel reference'}: <b>{b.booking_reference}</b></p>}
        {b.status === 'confirmed' && <p className="muted small">Confirmed by the provider and re-verified{b.live_mode ? '' : ' in TEST MODE: no real ticket was issued and nothing was charged'}.</p>}
        {b.error && <p className="t-warn">{b.error}</p>}
        <button type="button" className="bk-btn primary" onClick={() => onDone(b)}>Done</button>
      </section>
    );
  }
  return (
    <section className="bk-panel bk-review">
      <h3>Review and confirm <ModeChip live={b.live_mode} /></h3>
      <dl>
        <div><dt>{flight ? 'Flight' : 'Hotel'}</dt><dd>{b.title}</dd></div>
        {flight && (s.slices || []).map((x, i) => (
          <div key={i}><dt>{i ? 'Return' : 'Outbound'}</dt><dd>{x.segments.map((g) => `${g.flight} ${g.from} ${time(g.departing_at)} → ${g.to} ${time(g.arriving_at)}`).join(' · ')} ({hm(x.minutes)}, {x.baggage?.checked ? `${x.baggage.checked} checked bag` : 'cabin bag only'})</dd></div>
        ))}
        {!flight && <div><dt>Room</dt><dd>{s.rate?.room} · {s.rate?.board?.replace(/_/g, ' ')} · {s.rate?.refundable ? `free cancellation${s.rate.free_cancel_until ? ` until ${day(s.rate.free_cancel_until)}` : ''}` : 'non-refundable'}</dd></div>}
        <div><dt>{flight ? 'Travellers' : 'Guest'}</dt><dd>{b.travellers.map((t) => `${t.given_name} ${t.family_name}`).join(', ')}</dd></div>
        <div><dt>Confirmation to</dt><dd>{b.contact.email} · {b.contact.phone}</dd></div>
        {flight && <div><dt>Fare rules</dt><dd>{s.refund?.allowed ? `Refundable${s.refund.penalty ? ` (fee ${money(s.refund.penalty, s.refund.currency)})` : ''}` : 'Non-refundable'} · {s.change?.allowed ? 'changes allowed' : 'no changes'}</dd></div>}
        <div className="total"><dt>Total</dt><dd>{money(b.amount, b.currency)}</dd></div>
      </dl>
      <label className="bk-check big"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        I checked the names, dates and price, and agree to the {flight ? 'fare rules' : 'rate conditions'}. Book it and charge {money(b.amount, b.currency)}{b.live_mode ? '' : ' (test mode: no charge)'}.</label>
      <button type="button" className="bk-btn primary big" disabled={!ok || busy} onClick={confirm}>
        {busy ? <><span className="bk-spin" /> {b.status === 'awaiting_payment' ? 'Waiting for payment…' : 'Booking…'}</> : <><Icon name="card" size="1em" /> Confirm &amp; pay</>}
      </button>
      <p className="bk-source">The price is re-checked with the provider first. If the provider rejects the booking after payment, the payment is refunded automatically.</p>
    </section>
  );
}

// ---------- my bookings ----------

function BookingDetail({ b: initial, onClose, onChange }) {
  const [b, setB] = useState(initial);
  const [cq, setCq] = useState(null);
  const [busy, setBusy] = useState('');
  const run = async (what, fn) => {
    setBusy(what);
    try {
      await fn();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };
  const refresh = () => run('refresh', async () => { const r = await api.bookingGet(b.id, true); setB(r); onChange(r); });
  const quote = () => run('quote', async () => setCq(await api.bookingCancelQuote(b.id)));
  const cancel = () => run('cancel', async () => { const r = await api.bookingCancel(b.id, cq?.id); setB(r); setCq(null); onChange(r); toast('Cancelled with the provider.'); });
  return (
    <div className="bk-modal" role="dialog" aria-modal="true" aria-labelledby="bk-detail-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="bk-modal-card">
        <header><h3 id="bk-detail-title">{b.title}</h3><button type="button" className="bk-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button></header>
        <p><Badge status={b.status} /> <ModeChip live={b.live_mode} /> {b.booking_reference && <>· Ref <b>{b.booking_reference}</b></>} · {money(b.amount, b.currency)}</p>
        {b.error && <p className="t-warn small">{b.error}</p>}
        <ol className="bk-timeline">{b.events.map((ev, i) => <li key={i}><small>{new Date(ev.t * 1000).toLocaleString()}</small>{ev.what}</li>)}</ol>
        <div className="bk-actions">
          {b.provider_ref && <button type="button" className="bk-btn" onClick={refresh} disabled={!!busy}>{busy === 'refresh' ? <span className="bk-spin" /> : 'Check with provider'}</button>}
          {b.status === 'confirmed' && !cq && <button type="button" className="bk-btn danger" onClick={quote} disabled={!!busy}>{busy === 'quote' ? <span className="bk-spin" /> : 'Cancel booking…'}</button>}
        </div>
        {cq && (
          <div className="bk-cancel">
            {cq.kind === 'stay' ? <p>{cq.note}{cq.free_cancel_until ? ` Free cancellation until ${day(cq.free_cancel_until)}.` : ''}</p>
              : <p>The airline will refund <b>{money(cq.refund_amount, cq.refund_currency)}</b> ({cq.refund_to?.replace(/_/g, ' ')}). This quote expires {cq.expires_at ? new Date(cq.expires_at).toLocaleTimeString() : 'soon'}.</p>}
            <button type="button" className="bk-btn danger" onClick={cancel} disabled={!!busy}>{busy === 'cancel' ? <span className="bk-spin" /> : 'Yes, cancel it'}</button>
            <button type="button" className="bk-btn" onClick={() => setCq(null)}>Keep booking</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- the screen ----------

export default function Bookings({ onAsk }) {
  const [providers, setProviders] = useState(null);
  const [cat, setCat] = useState('flights');
  const [results, setResults] = useState(null);
  const [picked, setPicked] = useState(null); // {kind, offer} | {kind:'stay', stay, rate}
  const [review, setReview] = useState(null); // booking awaiting confirmation
  const [bookings, setBookings] = useState([]);
  const [detail, setDetail] = useState(null);
  const [ask, setAsk] = useState('');
  const [error, setError] = useState('');

  const loadBookings = useCallback(() => api.bookingList().then((d) => setBookings(d.bookings)).catch(() => {}), []);
  useEffect(() => {
    api.bookingProviders().then((d) => setProviders(d.providers)).catch((e) => setError(e.message));
    loadBookings();
  }, [loadBookings]);
  const prov = Object.fromEntries((providers || []).map((p) => [p.id, p]));
  const need = { flights: 'duffel_flights', hotels: 'duffel_stays', events: 'ticketmaster' }[cat];
  const connected = need ? prov[need]?.connected : false;
  const partner = CATS.find((c) => c.id === cat)?.partner;
  const upcoming = bookings.find((b) => b.status === 'confirmed');
  const switchCat = (c) => {
    setCat(c);
    setResults(null);
    setPicked(null);
    setReview(null);
  };
  const submitAsk = (text) => {
    const t = (text ?? ask).trim();
    if (!t) return;
    onAsk?.(t);
    setAsk('');
  };

  return (
    <div className="bk">
      <header className="bk-head">
        <div>
          <h1>Where to next?</h1>
          <p>Real flights, hotels and events, compared and booked with your approval. Jarvis never invents a price or a booking.</p>
        </div>
        <form className="bk-ask" onSubmit={(e) => { e.preventDefault(); submitAsk(); }}>
          <Icon name="sparkles" size="1.1em" />
          <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Ask Jarvis: plan my trip to Jaipur for two under ₹15,000" aria-label="Ask Jarvis to plan or find travel" />
          <button className="bk-btn primary" disabled={!ask.trim()}>Ask</button>
        </form>
      </header>
      <div className="bk-examples">{ASK_EXAMPLES.map((x) => <button type="button" key={x} onClick={() => submitAsk(x)}>{x}</button>)}</div>

      <nav className="bk-cats" aria-label="Booking type">
        {CATS.map((c) => (
          <button key={c.id} type="button" className={cat === c.id ? 'on' : ''} style={{ '--h': c.hue }} onClick={() => switchCat(c.id)} aria-pressed={cat === c.id}>
            <span className="ic"><Icon name={c.icon} size="1.3em" /></span>
            <span><b>{c.label}</b><small>{c.sub}</small></span>
          </button>
        ))}
      </nav>

      {error && <p className="bk-error"><Icon name="alert" size="1em" /> {error}</p>}

      <div className="bk-main">
        <div className="bk-col">
          {partner ? (
            <section className="bk-panel bk-partner">
              <Icon name={CATS.find((c) => c.id === cat).icon} size="2em" />
              <h3>{prov[partner]?.name || cat}</h3>
              <p>{prov[partner]?.note}</p>
              {prov[partner]?.link && <a className="bk-btn primary" href={prov[partner].link} target="_blank" rel="noreferrer">Book on the official site <Icon name="external" size="0.9em" /></a>}
              <button type="button" className="bk-btn" onClick={() => submitAsk(cat === 'trains' ? 'Find trains from Delhi to Jaipur and help me plan the journey' : `Help me plan ${cat} for my trip`)}>Ask Jarvis to plan around it</button>
            </section>
          ) : !connected && providers ? (
            <section className="bk-panel bk-connect">
              <h3><Icon name="plug" size="1em" /> Connect {prov[need]?.name}</h3>
              <p>Add <code>{prov[need]?.env}</code> to the <code>.env</code> file of the AI service and restart it. {prov[need]?.note || ''}</p>
              <ol>
                <li>Sign up: <a href={prov[need]?.signup} target="_blank" rel="noreferrer">{prov[need]?.signup}</a></li>
                <li>{need === 'ticketmaster' ? 'Copy the Consumer Key of your app.' : 'Create a test access token first (sandbox: real API, no real tickets), then a live one when Duffel approves you.'}</li>
                <li>Restart Jarvis: this card turns into the search.</li>
              </ol>
            </section>
          ) : (
            <section className="bk-panel">
              {cat === 'flights' && <FlightSearch disabled={!providers} onResults={(r) => { setResults(r); setPicked(null); setReview(null); }} />}
              {cat === 'hotels' && <HotelSearch disabled={!providers} onResults={(r) => { setResults(r); setPicked(null); setReview(null); }} />}
              {cat === 'events' && <Events disabled={!providers} />}
            </section>
          )}

          {review ? <Review booking={review} onDone={(b) => { setReview(null); setPicked(null); loadBookings(); setDetail(b); }} />
            : picked ? <TravellerForm item={picked} onBack={() => setPicked(null)} onQuoted={(b) => { setReview(b); loadBookings(); }} />
              : results && cat === 'flights' ? <FlightResults res={results} onPick={(o) => setPicked({ kind: 'flight', offer: o })} />
                : results && cat === 'hotels' ? <HotelResults res={results} onPickRate={(stay, rate) => setPicked({ kind: 'stay', stay, rate })} /> : null}
        </div>

        <aside className="bk-side">
          {upcoming && (
            <section className="bk-panel bk-upcoming">
              <header><h3>Upcoming</h3></header>
              <button type="button" onClick={() => setDetail(upcoming)}>
                <Icon name={upcoming.kind === 'flight' ? 'plane' : 'bed'} size="1.4em" />
                <span><b>{upcoming.title}</b><small>Ref {upcoming.booking_reference} · <Badge status={upcoming.status} /></small></span>
              </button>
            </section>
          )}
          <section className="bk-panel">
            <header><h3>My bookings</h3></header>
            {bookings.length === 0 ? <p className="muted small">No bookings yet.</p> : (
              <ul className="bk-list">
                {bookings.slice(0, 20).map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => (b.status === 'awaiting_confirmation' || b.status === 'awaiting_payment' ? setReview(b) : setDetail(b))}>
                      <Icon name={b.kind === 'flight' ? 'plane' : 'bed'} size="1.1em" />
                      <span><b>{b.title}</b><small>{money(b.amount, b.currency)} · {new Date(b.created_at).toLocaleDateString()}</small></span>
                      <Badge status={b.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="bk-panel">
            <header><h3>Providers</h3></header>
            <ul className="bk-provs">
              {(providers || []).map((p) => (
                <li key={p.id}>
                  <i className={`dot ${p.connected ? 'on' : p.can.length ? 'off' : 'na'}`} />
                  <span><b>{p.name}</b><small>{p.connected ? `${p.mode === 'test' ? 'Test mode' : p.mode === 'live' ? 'Live' : 'Connected'} · ${p.can.join(', ')}` : p.can.length ? `Not connected · ${p.env}` : 'Partner-only: official site'}</small></span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {detail && <BookingDetail b={detail} onClose={() => setDetail(null)} onChange={() => loadBookings()} />}
    </div>
  );
}
