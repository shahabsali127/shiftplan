
export enum GermanState {
  BW = 'Baden-Württemberg',
  BY = 'Bayern',
  BE = 'Berlin',
  BB = 'Brandenburg',
  HB = 'Bremen',
  HH = 'Hamburg',
  HE = 'Hessen',
  MV = 'Mecklenburg-Vorpommern',
  NI = 'Niedersachsen',
  NW = 'Nordrhein-Westfalen',
  RP = 'Rheinland-Pfalz',
  SL = 'Saarland',
  SN = 'Sachsen',
  ST = 'Sachsen-Anhalt',
  SH = 'Schleswig-Holstein',
  TH = 'Thüringen'
}

export enum AbsenceType {
  NONE = 'NONE',
  VACATION = 'Urlaub',
  SICK = 'Krank'
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  color: string;
  hours: number;
}

export interface Employee {
  id: string;
  name: string;
  state: GermanState;
  yearlyVacationEntitlement: number;
}

export interface ScheduleEntry {
  employeeId: string;
  date: string; // ISO format "YYYY-MM-DD"
  shiftId?: string;
  absence?: AbsenceType;
  actualHours?: number; // For deviations
}

export interface AppState {
  employees: Employee[];
  shifts: Shift[];
  entries: ScheduleEntry[];
}
