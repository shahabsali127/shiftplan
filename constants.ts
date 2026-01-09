
import { GermanState, Shift, Employee } from './types';

export const DEFAULT_SHIFTS: Shift[] = [
  { id: 'early', name: 'Frühschicht', startTime: '07:30', endTime: '16:30', color: '#3b82f6', hours: 8 },
  { id: 'late', name: 'Spätschicht', startTime: '11:00', endTime: '20:00', color: '#8b5cf6', hours: 8 },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Max Mustermann', state: GermanState.BW, yearlyVacationEntitlement: 30 },
  { id: '2', name: 'Erika Musterfrau', state: GermanState.BY, yearlyVacationEntitlement: 30 },
  { id: '3', name: 'John Doe', state: GermanState.BE, yearlyVacationEntitlement: 30 },
  { id: '4', name: 'Jane Smith', state: GermanState.NW, yearlyVacationEntitlement: 30 },
  { id: '5', name: 'Hans Müller', state: GermanState.HE, yearlyVacationEntitlement: 30 },
];

export const STATES = Object.values(GermanState);

export const APP_STORAGE_KEY = 'shiftplan_pro_state';
