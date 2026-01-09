
import { GermanState } from '../types';

interface Holiday {
  date: string;
  name: string;
}

export function getEasterSunday(year: number): Date {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

export function getHolidays(year: number, state: GermanState): Holiday[] {
  const easter = getEasterSunday(year);
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: formatDate(addDays(easter, -2)), name: 'Karfreitag' },
    { date: formatDate(addDays(easter, 1)), name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: formatDate(addDays(easter, 39)), name: 'Christi Himmelfahrt' },
    { date: formatDate(addDays(easter, 50)), name: 'Pfingstmontag' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag' },
  ];

  // State specific
  if ([GermanState.BW, GermanState.BY, GermanState.ST].includes(state)) {
    holidays.push({ date: `${year}-01-06`, name: 'Heilige Drei Könige' });
  }
  if ([GermanState.BW, GermanState.BY, GermanState.HE, GermanState.NW, GermanState.RP, GermanState.SL].includes(state)) {
    holidays.push({ date: formatDate(addDays(easter, 60)), name: 'Fronleichnam' });
  }
  if ([GermanState.BY, GermanState.SL].includes(state)) {
    holidays.push({ date: `${year}-08-15`, name: 'Mariä Himmelfahrt' });
  }
  if ([GermanState.BB, GermanState.MV, GermanState.SN, GermanState.ST, GermanState.TH, GermanState.NI, GermanState.SH, GermanState.HH, GermanState.HB].includes(state)) {
    holidays.push({ date: `${year}-10-31`, name: 'Reformationstag' });
  }
  if ([GermanState.BW, GermanState.BY, GermanState.NW, GermanState.RP, GermanState.SL].includes(state)) {
    holidays.push({ date: `${year}-11-01`, name: 'Allerheiligen' });
  }
  if (state === GermanState.SN) {
    // Buß- und Bettag: Wednesday before Nov 23
    const nov23 = new Date(year, 10, 23);
    let day = nov23.getDay();
    let diff = day >= 3 ? day - 3 : 7 - (3 - day);
    holidays.push({ date: formatDate(addDays(nov23, -diff)), name: 'Buß- und Bettag' });
  }

  return holidays;
}
