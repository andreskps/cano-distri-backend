/** Calendar dates for the business, independent of the device/server timezone. */
export function getBogotaDate(offsetDays = 0, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  const date = new Date(Date.UTC(Number(value('year')), Number(value('month')) - 1, Number(value('day')) + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function isPastDeliveryDate(value: string, now = new Date()): boolean {
  return value.split('T')[0] < getBogotaDate(0, now);
}

/** ISO weekday (1 = Monday ... 7 = Sunday) and minutes since midnight of an instant in Bogota time. */
export function getBogotaWeekdayAndMinutes(instant: Date): { isoDow: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  const isoDow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(value('weekday')) + 1;
  return { isoDow, minutes: Number(value('hour')) * 60 + Number(value('minute')) };
}
