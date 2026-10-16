import { getBogotaDate, isPastDeliveryDate } from './business-date';

describe('business calendar dates in America/Bogota', () => {
  it.each([
    ['2026-10-16T00:01:00Z', '2026-10-15'],
    ['2026-10-16T04:59:59Z', '2026-10-15'],
    ['2026-10-16T05:00:00Z', '2026-10-16'],
  ])('uses the Colombian date at %s', (instant, expected) => {
    expect(getBogotaDate(0, new Date(instant))).toBe(expected);
  });

  it.each([
    ['2026-12-31T23:00:00Z', '2027-01-01'],
    ['2028-02-28T23:00:00Z', '2028-02-29'],
  ])('advances calendar dates across month/year boundaries', (instant, expected) => {
    expect(getBogotaDate(1, new Date(instant))).toBe(expected);
  });

  it('accepts today and tomorrow but rejects yesterday late at night', () => {
    const now = new Date('2026-10-16T04:59:59Z');
    expect(isPastDeliveryDate('2026-10-14', now)).toBe(true);
    expect(isPastDeliveryDate('2026-10-15', now)).toBe(false);
    expect(isPastDeliveryDate('2026-10-16', now)).toBe(false);
  });
});
