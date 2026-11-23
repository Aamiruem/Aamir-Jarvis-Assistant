// Bookings against a fake API: unconnected providers say so, search → select → details → review,
// nothing is confirmed until the box is ticked, the outcome shows the provider's reference, and
// partner-only categories link to the official site.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const fake = {};
vi.mock('../api.js', () => ({ api: new Proxy({}, { get: (_, k) => (...a) => fake[k](...a) }) }));
vi.mock('../ui.jsx', () => ({ toast: vi.fn() }));
const { default: Bookings } = await import('./Bookings.jsx');
const { toast } = await import('../ui.jsx');

const PROVIDERS = (connected) => ({ providers: [
  { id: 'duffel_flights', name: 'Duffel (300+ airlines)', connected, mode: connected ? 'test' : null, can: ['search', 'book'], env: 'DUFFEL_ACCESS_TOKEN', signup: 'https://app.duffel.com/join' },
  { id: 'duffel_stays', name: 'Duffel Stays (hotels)', connected, mode: connected ? 'test' : null, can: ['search'], env: 'DUFFEL_ACCESS_TOKEN', signup: 'https://duffel.com/stays' },
  { id: 'ticketmaster', name: 'Ticketmaster Discovery', connected: false, mode: null, can: ['search'], env: 'TICKETMASTER_API_KEY', signup: 'https://developer.ticketmaster.com/' },
  { id: 'razorpay', name: 'Razorpay', connected: false, mode: null, can: ['checkout'], env: 'RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET' },
  { id: 'irctc', name: 'IRCTC (Indian Railways)', connected: false, mode: null, can: [], note: 'Booking APIs are only for IRCTC-authorised agents.', link: 'https://www.irctc.co.in/nget/train-search' },
] });
const OFFER = {
  id: 'off_1', airline: 'Duffel Airways', total_amount: '120.50', total_currency: 'GBP', tags: ['cheapest', 'refundable'], minutes: 150, stops: 0, live_mode: false,
  refund: { allowed: true, penalty: '20.00', currency: 'GBP' }, change: { allowed: false }, passengers: [{ id: 'pas_1', type: 'adult' }],
  slices: [{ origin: 'DEL', destination: 'DXB', departing_at: '2027-03-01T08:00:00', arriving_at: '2027-03-01T10:30:00', minutes: 150, stops: 0, baggage: { checked: 1 },
    segments: [{ flight: 'ZZ100', from: 'DEL', to: 'DXB', departing_at: '2027-03-01T08:00:00', arriving_at: '2027-03-01T10:30:00' }] }],
};
const QUOTED = { id: 'bk1', kind: 'flight', status: 'awaiting_confirmation', live_mode: false, title: 'Duffel Airways: DEL → DXB, 2027-03-01', amount: '120.50', currency: 'GBP',
  summary: OFFER, travellers: [{ given_name: 'Aamir', family_name: 'Azad' }], contact: { email: 'a@b.co', phone: '+919876543210' }, events: [] };

let root;
let host;
async function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(Bookings, { onAsk: fake.onAsk })));
  await act(async () => {});
}
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const click = async (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const type = async (el, value) => act(async () => {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const submit = async (form) => act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

beforeEach(() => {
  for (const k of Object.keys(fake)) delete fake[k];
  Object.assign(fake, {
    onAsk: vi.fn(), bookingProviders: vi.fn().mockResolvedValue(PROVIDERS(true)), bookingList: vi.fn().mockResolvedValue({ bookings: [] }),
    bookingPlaces: vi.fn(async (q) => ({ places: [{ type: 'airport', code: q.toLowerCase().startsWith('del') ? 'DEL' : 'DXB', name: q, city: q, country: 'IN' }] })),
    bookingSearchFlights: vi.fn().mockResolvedValue({ live_mode: false, total: 1, offers: [OFFER] }),
    bookingOffer: vi.fn().mockResolvedValue(OFFER), bookingQuote: vi.fn().mockResolvedValue(QUOTED),
    bookingConfirm: vi.fn().mockResolvedValue({ ...QUOTED, status: 'confirmed', booking_reference: 'ABC123', payment_method: 'test_balance' }),
    bookingGet: vi.fn().mockResolvedValue(QUOTED),
  });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe('Bookings', () => {
  it('tells you how to connect a provider instead of showing anything made up', async () => {
    fake.bookingProviders.mockResolvedValue(PROVIDERS(false));
    await mount();
    expect(host.textContent).toContain('Connect Duffel (300+ airlines)');
    expect(host.textContent).toContain('DUFFEL_ACCESS_TOKEN');
    expect(host.querySelector('form.bk-form')).toBeNull();
  });

  it('trains: plans the journey and hands it to IRCTC, never charging for train tickets', async () => {
    await mount();
    await click(button('Trains'));
    const [from, to] = host.querySelectorAll('.bk-place input');
    await type(from, 'new delhi');
    await act(async () => from.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    await type(to, 'JP');
    await act(async () => to.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    await submit(host.querySelector('form.bk-form'));
    const plan = host.querySelector('.bk-train-plan');
    expect(plan.textContent).toContain('New Delhi (NDLS) → Jaipur Jn (JP)');
    expect(plan.querySelector('a[href="https://www.irctc.co.in/nget/train-search"]')).toBeTruthy();
    expect(host.textContent).toContain('never charges for train tickets');
    expect(fake.bookingQuote).not.toHaveBeenCalled();
  });

  it('search → select → details → review → explicit confirmation → provider reference', async () => {
    await mount();
    const [from, to] = host.querySelectorAll('.bk-place input');
    await type(from, 'Delhi');
    await act(async () => vi.advanceTimersByTime(300));
    await act(async () => host.querySelector('.bk-suggest li').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    await type(to, 'Dubai');
    await act(async () => vi.advanceTimersByTime(300));
    await act(async () => to.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))); // keyboard pick
    await submit(host.querySelector('form.bk-form'));
    expect(fake.bookingSearchFlights).toHaveBeenCalledWith(expect.objectContaining({ origin: 'DEL', destination: 'DXB', adults: 1 }));
    expect(host.textContent).toContain('TEST MODE');
    expect(host.querySelector('.bk-offer').textContent).toContain('cheapest');

    await click(button('Select'));
    expect(fake.bookingOffer).toHaveBeenCalledWith('off_1'); // re-priced before details are entered
    const inputs = host.querySelectorAll('.bk-people input');
    await type(inputs[0], 'Aamir');
    await type(inputs[1], 'Azad');
    await type(inputs[2], '1995-04-12');
    await type(host.querySelector('.bk-people input[type=email]'), 'a@b.co');
    await submit(host.querySelector('form.bk-people'));
    expect(fake.bookingQuote).toHaveBeenCalledWith(expect.objectContaining({ kind: 'flight', offer_id: 'off_1', contact: { email: 'a@b.co', phone: '+91' } }));

    const pay = button('Confirm & pay');
    expect(pay.disabled).toBe(true); // nothing without the explicit tick
    await click(host.querySelector('.bk-review input[type=checkbox]'));
    expect(button('Confirm & pay').disabled).toBe(false);
    await click(button('Confirm & pay'));
    expect(fake.bookingConfirm).toHaveBeenCalledWith('bk1');
    expect(host.textContent).toContain('Booking confirmed');
    expect(host.textContent).toContain('ABC123');
    expect(host.textContent).toContain('TEST MODE: no real ticket');
  });

  it('a price change from the airline is shown, not booked', async () => {
    fake.bookingList.mockResolvedValue({ bookings: [QUOTED] });
    fake.bookingConfirm.mockRejectedValue(new Error('The airline changed the price to 150.00 GBP. Review and confirm again.'));
    await mount();
    await click(host.querySelector('.bk-list button'));
    await click(host.querySelector('.bk-review input[type=checkbox]'));
    await click(button('Confirm & pay'));
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('150.00'), 'error');
    expect(host.textContent).not.toContain('Booking confirmed');
  });

  it('the ask bar hands the request to Jarvis', async () => {
    await mount();
    await click(button('Plan a 3-day trip'));
    expect(fake.onAsk).toHaveBeenCalledWith(expect.stringContaining('Jaipur'));
  });

  it('live payments: pick a method, see the real-money warning, Razorpay opens on that method', async () => {
    const live = { ...QUOTED, live_mode: true };
    fake.bookingProviders.mockResolvedValue({ providers: [...PROVIDERS(true).providers, { id: 'razorpay', name: 'Razorpay', connected: true, mode: 'live', can: ['checkout'] }]
      .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i || p.connected) });
    fake.bookingList.mockResolvedValue({ bookings: [live] });
    fake.bookingConfirm.mockResolvedValue({ ...live, status: 'awaiting_payment', checkout: { key: 'rzp_live_x', order_id: 'order_1', amount: 12050, currency: 'GBP', prefill: {} } });
    const opened = [];
    window.Razorpay = function Razorpay(opts) { opened.push(opts); return { on() {}, open() { opts.modal.ondismiss(); } }; };
    await mount();
    await click(host.querySelector('.bk-list button'));
    expect(host.textContent).toContain('real money will be charged');
    await click([...host.querySelectorAll('.bk-methods label')].find((l) => l.textContent.includes('Card')).querySelector('input'));
    await click(host.querySelector('.bk-review input[type=checkbox]'));
    await click(button('Confirm & pay'));
    expect(opened).toHaveLength(1);
    expect(opened[0].order_id).toBe('order_1');
    expect(opened[0].prefill.method).toBe('card');
    expect(opened[0].config.display.blocks.pref.instruments).toEqual([{ method: 'card' }]);
    delete window.Razorpay;
  });
});
