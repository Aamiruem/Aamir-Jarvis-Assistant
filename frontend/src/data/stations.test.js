import { describe, expect, it } from 'vitest';
import { STATIONS, findStations } from './stations.js';
import { receiptHtml, checkoutConfig } from '../components/Bookings.jsx';

describe('stations', () => {
  it('codes are unique and well-formed', () => {
    const codes = STATIONS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((c) => /^[A-Z]{2,5}$/.test(c))).toBe(true);
  });
  it('finds by exact code first, then name and city; a typed code is allowed', () => {
    expect(findStations('jp')[0].code).toBe('JP');
    expect(findStations('mumbai').map((s) => s.code)).toContain('CSMT');
    expect(findStations('bengaluru').map((s) => s.code)).toEqual(expect.arrayContaining(['SBC', 'YPR', 'SMVB']));
    expect(findStations('xyzq').at(-1)).toEqual({ code: 'XYZQ', name: 'Station code as typed', city: '', typed: true });
    expect(findStations('')).toEqual([]);
  });
});

describe('payments', () => {
  it('opens Razorpay on the chosen method, with the other methods still available', () => {
    const c = checkoutConfig('upi').config.display;
    expect(c.blocks.pref.instruments).toEqual([{ method: 'upi' }]);
    expect(c.preferences.show_default_blocks).toBe(true);
    expect(checkoutConfig('nope')).toEqual({});
  });
  it('receipts show masked payment details and escape everything', () => {
    const html = receiptHtml({ id: 'b1', kind: 'flight', status: 'confirmed', title: '<script>x</script> DEL → DXB', booking_reference: 'ABC123', amount: '120.50', currency: 'INR',
      live_mode: true, travellers: [{ given_name: 'Aamir', family_name: 'Azad' }], contact: { email: 'a@b.co', phone: '+91' }, created_at: '2026-11-23T10:00:00Z',
      payment_id: 'pay_1', payment_order_id: 'order_1', payment_info: { method: 'card', card_network: 'RuPay', card_type: 'debit', card_last4: '4242' }, events: [] });
    expect(html).toContain('RuPay debit •••• 4242');
    expect(html).toContain('ABC123');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
