import * as XLSX from 'xlsx';
import {
  ALL_SHEET,
  assignRuteroDay,
  buildRuteroWorkbook,
  cleanTaxId,
  DAY_NAMES,
  groupRutero,
  NO_ORDERS_SHEET,
  RuteroCustomer,
  toTitleCase,
} from './rutero.builder';

// Bogotá es UTC-5 todo el año: hora local = UTC - 5h.
// 2026-11-23 es lunes.
const MON_10 = '2026-11-23T15:00:00Z'; // lunes 10:00
const TUE_10 = '2026-11-24T15:00:00Z'; // martes 10:00
const WED_10 = '2026-11-25T15:00:00Z'; // miércoles 10:00

const customer = (id: string, extra: Partial<RuteroCustomer> = {}): RuteroCustomer => ({
  id,
  name: `Cliente ${id}`,
  taxId: null,
  phone: null,
  email: null,
  contactPerson: null,
  address: null,
  city: null,
  ...extra,
});

describe('assignRuteroDay', () => {
  it('assigns the weekday with most orders', () => {
    const day = assignRuteroDay([
      { createdAt: MON_10 },
      { createdAt: '2026-11-16T15:00:00Z' }, // otro lunes
      { createdAt: TUE_10 },
    ]);
    expect(day.dow).toBe(1);
  });

  it('breaks ties with the day of the most recent order', () => {
    const day = assignRuteroDay([
      { createdAt: '2026-11-17T15:00:00Z' }, // martes antiguo
      { createdAt: MON_10 },
      { createdAt: TUE_10 }, // martes más reciente
      { createdAt: '2026-11-16T15:00:00Z' }, // lunes antiguo
    ]);
    expect(day.dow).toBe(2);
  });

  it('ignores cancelled orders', () => {
    const day = assignRuteroDay([
      { createdAt: MON_10, status: 'cancelled' },
      { createdAt: '2026-11-16T15:00:00Z', status: 'cancelled' },
      { createdAt: WED_10, status: 'pending' },
    ]);
    expect(day.dow).toBe(3);
  });

  it('returns no day when every order is cancelled or there are none', () => {
    expect(assignRuteroDay([])).toEqual({ dow: null, visitMinutes: null });
    expect(assignRuteroDay([{ createdAt: MON_10, status: 'cancelled' }]).dow).toBeNull();
  });

  it('uses Bogota time: Monday 21:00 local (Tuesday 02:00 UTC) counts as Monday', () => {
    const day = assignRuteroDay([{ createdAt: '2026-11-24T02:00:00Z' }]);
    expect(day).toEqual({ dow: 1, visitMinutes: 21 * 60 });
  });

  it('uses the median time of the orders in the assigned day', () => {
    const day = assignRuteroDay([
      { createdAt: '2026-11-23T13:00:00Z' }, // lun 08:00
      { createdAt: '2026-11-16T14:00:00Z' }, // lun 09:00
      { createdAt: '2026-11-09T20:00:00Z' }, // lun 15:00
      { createdAt: TUE_10 },
    ]);
    expect(day).toEqual({ dow: 1, visitMinutes: 9 * 60 });
  });
});

describe('field normalization', () => {
  it('blanks NITs made only of zeros', () => {
    expect(cleanTaxId('00000')).toBe('');
    expect(cleanTaxId('000000')).toBe('');
    expect(cleanTaxId(null)).toBe('');
    expect(cleanTaxId('900123456-7')).toBe('900123456-7');
  });

  it('title-cases cities', () => {
    expect(toTitleCase('ITAGUI')).toBe('Itagui');
    expect(toTitleCase('san pedro de los milagros')).toBe('San Pedro De Los Milagros');
    expect(toTitleCase('MEDELLÍN')).toBe('Medellín');
    expect(toTitleCase(null)).toBe('');
  });
});

describe('groupRutero', () => {
  it('orders a day by usual visit time, then city/address/name', () => {
    const customers = [
      customer('late', { city: 'A' }),
      customer('early', { city: 'Z' }),
      customer('noTimeB', { city: 'B' }),
    ];
    const orders = [
      { customerId: 'late', createdAt: '2026-11-23T19:00:00Z' }, // lun 14:00
      { customerId: 'early', createdAt: '2026-11-23T13:30:00Z' }, // lun 08:30
    ];
    const groups = groupRutero(customers, orders);
    expect(groups.get('Lunes')!.map((r) => r.name)).toEqual(['Cliente early', 'Cliente late']);
    expect(groups.get(NO_ORDERS_SHEET)!.map((r) => r.name)).toEqual(['Cliente noTimeB']);
  });
});

describe('buildRuteroWorkbook', () => {
  const customers = [
    customer('1', { name: 'Tienda Uno', city: 'ITAGUI', taxId: '00000', phone: '3001234567' }),
    customer('2', { name: 'Tienda Dos', city: 'MEDELLIN' }),
    customer('3', { name: 'Tienda Tres' }),
    customer('4', { name: 'Tienda Cuatro' }),
  ];
  const orders = [
    { customerId: '1', createdAt: MON_10 },
    { customerId: '2', createdAt: TUE_10 },
    { customerId: '2', createdAt: WED_10, status: 'cancelled' },
    { customerId: '3', createdAt: WED_10, status: 'cancelled' },
  ];
  const workbook = XLSX.read(buildRuteroWorkbook(customers, orders), { type: 'buffer' });
  const rows = (name: string) => XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' });

  it('creates the 9 sheets, empty ones with headers only', () => {
    expect(workbook.SheetNames).toEqual([ALL_SHEET, ...DAY_NAMES, NO_ORDERS_SHEET]);
    const sunday = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets['Domingo'], { header: 1 });
    expect(sunday).toEqual([['#', 'Cliente', 'Teléfono', 'Persona de contacto', 'Dirección', 'Ciudad', 'NIT', 'Correo', 'Observaciones']]);
  });

  it('puts each customer in exactly one day sheet and the totals match "Todos"', () => {
    const perSheet = [...DAY_NAMES, NO_ORDERS_SHEET].flatMap((name) => rows(name).map((r) => r['Cliente']));
    expect(new Set(perSheet).size).toBe(perSheet.length);
    expect(perSheet.length).toBe(rows(ALL_SHEET).length);
    expect(rows(NO_ORDERS_SHEET).map((r) => r['Cliente']).sort()).toEqual(['Tienda Cuatro', 'Tienda Tres']);
  });

  it('writes normalized values and the day column in "Todos"', () => {
    const [first] = rows(ALL_SHEET);
    expect(first).toMatchObject({ 'Día': 'Lunes', '#': 1, Cliente: 'Tienda Uno', Ciudad: 'Itagui', NIT: '', Teléfono: '3001234567' });
    const phoneCell = workbook.Sheets['Lunes']['C2'];
    expect(phoneCell.t).toBe('s');
  });
});
