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
