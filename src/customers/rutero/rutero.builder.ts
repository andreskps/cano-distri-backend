import * as XLSX from 'xlsx';
import { getBogotaWeekdayAndMinutes } from '../../common/business-date';

/** Cliente activo con la dirección que se usará en ruta. */
export interface RuteroCustomer {
  id: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  address: string | null;
  city: string | null;
}

export interface RuteroOrder {
  customerId: string;
  createdAt: Date | string;
  status?: string;
}

export interface RuteroDay {
  /** ISO weekday 1 (lunes) ... 7 (domingo); null cuando no hay pedidos válidos. */
  dow: number | null;
  /** Mediana de la hora (minutos desde medianoche, Bogotá) de los pedidos en ese día. */
  visitMinutes: number | null;
}

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const NO_ORDERS_SHEET = 'Sin pedidos';
export const ALL_SHEET = 'Todos';

const HEADERS = ['#', 'Cliente', 'Teléfono', 'Persona de contacto', 'Dirección', 'Ciudad', 'NIT', 'Correo', 'Observaciones'];
const WIDTHS = [5, 36, 15, 26, 42, 16, 15, 30, 40];

/**
 * Día de visita: el día de la semana (hora Bogotá) con más pedidos no cancelados;
 * en empate gana el día del pedido más reciente.
 */
export function assignRuteroDay(orders: Omit<RuteroOrder, 'customerId'>[]): RuteroDay {
  const byDow = new Map<number, { count: number; latest: number; minutes: number[] }>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const instant = new Date(order.createdAt);
    const { isoDow, minutes } = getBogotaWeekdayAndMinutes(instant);
    const entry = byDow.get(isoDow) ?? { count: 0, latest: 0, minutes: [] };
    entry.count += 1;
    entry.latest = Math.max(entry.latest, instant.getTime());
    entry.minutes.push(minutes);
    byDow.set(isoDow, entry);
  }

  let best: { dow: number; count: number; latest: number; minutes: number[] } | null = null;
  for (const [dow, entry] of byDow) {
    if (!best || entry.count > best.count || (entry.count === best.count && entry.latest > best.latest)) {
      best = { dow, ...entry };
    }
  }

  if (!best) return { dow: null, visitMinutes: null };
  return { dow: best.dow, visitMinutes: median(best.minutes) };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** NIT compuesto solo por ceros ("00000") se considera vacío. */
export function cleanTaxId(taxId: string | null): string {
  const value = (taxId ?? '').trim();
  return /^0+$/.test(value) ? '' : value;
}

/** ITAGUI -> Itagui, SAN PEDRO -> San Pedro. */
export function toTitleCase(value: string | null): string {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase('es-CO')
    .replace(/(^|[\s\-.(/])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase('es-CO'));
}

interface RuteroRow {
  day: RuteroDay;
  name: string;
  phone: string;
  contactPerson: string;
  address: string;
  city: string;
  taxId: string;
  email: string;
}

const compareText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });
const byPlace = (a: RuteroRow, b: RuteroRow) =>
  compareText(a.city, b.city) || compareText(a.address, b.address) || compareText(a.name, b.name);
const byVisit = (a: RuteroRow, b: RuteroRow) => {
  const ta = a.day.visitMinutes ?? Number.POSITIVE_INFINITY;
  const tb = b.day.visitMinutes ?? Number.POSITIVE_INFINITY;
  return ta - tb || byPlace(a, b);
};

/** Agrupa clientes por hoja (7 días + Sin pedidos) ya ordenados en orden de visita. */
export function groupRutero(customers: RuteroCustomer[], orders: RuteroOrder[]): Map<string, RuteroRow[]> {
  const ordersByCustomer = new Map<string, RuteroOrder[]>();
  for (const order of orders) {
    const list = ordersByCustomer.get(order.customerId) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customerId, list);
  }

  const groups = new Map<string, RuteroRow[]>([...DAY_NAMES, NO_ORDERS_SHEET].map((name) => [name, []]));
  for (const customer of customers) {
    const day = assignRuteroDay(ordersByCustomer.get(customer.id) ?? []);
    const row: RuteroRow = {
      day,
      name: (customer.name ?? '').trim(),
      phone: (customer.phone ?? '').trim(),
      contactPerson: (customer.contactPerson ?? '').trim(),
      address: (customer.address ?? '').trim(),
      city: toTitleCase(customer.city),
      taxId: cleanTaxId(customer.taxId),
      email: (customer.email ?? '').trim(),
    };
    groups.get(day.dow ? DAY_NAMES[day.dow - 1] : NO_ORDERS_SHEET)!.push(row);
  }

  for (const [name, rows] of groups) rows.sort(name === NO_ORDERS_SHEET ? byPlace : byVisit);
  return groups;
}

function rowCells(row: RuteroRow, index: number): (string | number)[] {
  return [index + 1, row.name, row.phone, row.contactPerson, row.address, row.city, row.taxId, row.email, ''];
}

function buildSheet(header: string[], widths: number[], rows: (string | number)[][], textCols: number[]): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet['!cols'] = widths.map((wch) => ({ wch }));
  sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };

  // Teléfono y NIT como texto (evita notación científica y pérdida de ceros iniciales).
  for (let r = 1; r <= rows.length; r++) {
    for (const c of textCols) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell) {
        cell.t = 's';
        cell.v = String(cell.v);
        cell.z = '@';
      }
    }
  }
  return sheet;
}

/** Genera el .xlsx del rutero: Todos, Lunes..Domingo y Sin pedidos. */
export function buildRuteroWorkbook(customers: RuteroCustomer[], orders: RuteroOrder[]): Buffer {
  const groups = groupRutero(customers, orders);
  const workbook = XLSX.utils.book_new();
  const phoneCol = HEADERS.indexOf('Teléfono');
  const taxCol = HEADERS.indexOf('NIT');

  const allRows: (string | number)[][] = [];
  for (const [name, rows] of groups) {
    rows.forEach((row, i) => allRows.push([name, ...rowCells(row, i)]));
  }
  XLSX.utils.book_append_sheet(
    workbook,
    buildSheet(['Día', ...HEADERS], [12, ...WIDTHS], allRows, [phoneCol + 1, taxCol + 1]),
    ALL_SHEET,
  );

  for (const [name, rows] of groups) {
    XLSX.utils.book_append_sheet(
      workbook,
      buildSheet(HEADERS, WIDTHS, rows.map(rowCells), [phoneCol, taxCol]),
      name,
    );
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', cellStyles: true }) as Buffer;
}
