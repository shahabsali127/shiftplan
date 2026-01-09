
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Settings, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  User,
  Sparkles,
  Search
} from 'lucide-react';
import { 
  AppState, 
  Employee, 
  Shift, 
  ScheduleEntry, 
  GermanState, 
  AbsenceType 
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  DEFAULT_SHIFTS, 
  APP_STORAGE_KEY,
  STATES
} from './constants';
import { getHolidays } from './utils/holidayUtils';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWeekend,
  getDay,
  parseISO
} from 'date-fns';
import { de } from 'date-fns/locale';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plan' | 'employees' | 'shifts' | 'ai'>('plan');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      employees: INITIAL_EMPLOYEES,
      shifts: DEFAULT_SHIFTS,
      entries: [],
    };
  });

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  const addEmployee = () => {
    const name = prompt('Name des Mitarbeiters?');
    if (!name) return;
    const newEmp: Employee = {
      id: crypto.randomUUID(),
      name,
      state: GermanState.BW,
      yearlyVacationEntitlement: 30
    };
    setState(prev => ({ ...prev, employees: [...prev.employees, newEmp] }));
  };

  const deleteEmployee = (id: string) => {
    if (confirm('Mitarbeiter wirklich löschen?')) {
      setState(prev => ({
        ...prev,
        employees: prev.employees.filter(e => e.id !== id),
        entries: prev.entries.filter(en => en.employeeId !== id)
      }));
    }
  };

  const updateEntry = (employeeId: string, date: Date, update: Partial<ScheduleEntry>) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Rule: Max 2 employees on vacation per day
    if (update.absence === AbsenceType.VACATION) {
      const alreadyOnVacation = state.entries.filter(e => e.date === dateStr && e.absence === AbsenceType.VACATION && e.employeeId !== employeeId).length;
      if (alreadyOnVacation >= 2) {
        alert('Maximal 2 Mitarbeiter dürfen gleichzeitig Urlaub haben.');
        return;
      }
    }

    setState(prev => {
      const existingIdx = prev.entries.findIndex(e => e.employeeId === employeeId && e.date === dateStr);
      const newEntries = [...prev.entries];
      
      const baseEntry = existingIdx > -1 ? prev.entries[existingIdx] : { employeeId, date: dateStr };
      const updatedEntry = { ...baseEntry, ...update };

      // Remove entry if it becomes empty
      if (!updatedEntry.shiftId && (!updatedEntry.absence || updatedEntry.absence === AbsenceType.NONE) && !updatedEntry.actualHours) {
        if (existingIdx > -1) newEntries.splice(existingIdx, 1);
      } else {
        if (existingIdx > -1) newEntries[existingIdx] = updatedEntry;
        else newEntries.push(updatedEntry);
      }

      return { ...prev, entries: newEntries };
    });
  };

  const getEntry = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return state.entries.find(e => e.employeeId === employeeId && e.date === dateStr);
  };

  const stats = useMemo(() => {
    const result: Record<string, { usedVacation: number, sickDays: number, totalHours: number, targetHours: number }> = {};
    
    // Simple target calculation: 8h per weekday that is NOT a holiday for that employee
    state.employees.forEach(emp => {
      let target = 0;
      let actual = 0;
      let vacation = 0;
      let sick = 0;

      // Current Month calculation
      monthDays.forEach(day => {
        const holidays = getHolidays(day.getFullYear(), emp.state);
        const isHoliday = holidays.some(h => isSameDay(parseISO(h.date), day));
        const entry = getEntry(emp.id, day);

        if (!isWeekend(day) && !isHoliday) {
          target += 8;
        }

        if (entry) {
          if (entry.absence === AbsenceType.VACATION) {
            vacation++;
            // Vacation usually counts as work time fulfilled
            actual += 8;
          } else if (entry.absence === AbsenceType.SICK) {
            sick++;
            actual += 8;
          } else if (entry.shiftId) {
            const shift = state.shifts.find(s => s.id === entry.shiftId);
            actual += entry.actualHours ?? (shift?.hours || 0);
          } else if (entry.actualHours) {
            actual += entry.actualHours;
          }
        }
      });

      result[emp.id] = {
        usedVacation: vacation,
        sickDays: sick,
        totalHours: actual,
        targetHours: target
      };
    });
    return result;
  }, [state, monthDays]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Calendar className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">ShiftPlan Pro</h1>
        </div>
        <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'plan' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Schichtplan
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'employees' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mitarbeiter
          </button>
          <button 
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'shifts' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Schichten
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'ai' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" /> AI
          </button>
        </nav>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'plan' && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full">
            {/* Calendar Header */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-full transition"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="text-lg font-semibold min-w-[150px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: de })}
                </h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-full transition"><ArrowRight className="w-5 h-5"/></button>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-3 h-3 bg-slate-200 rounded"></div> Wochenende
                  <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div> Feiertag
                </div>
              </div>
            </div>

            {/* Scrollable Table Area */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr>
                    <th className="p-3 text-left border-b border-r min-w-[180px] sticky left-0 bg-white">Mitarbeiter</th>
                    {monthDays.map(day => {
                      const isWE = isWeekend(day);
                      return (
                        <th key={day.toISOString()} className={`p-2 border-b min-w-[40px] text-center ${isWE ? 'bg-slate-100 text-slate-500' : ''}`}>
                          <div className="text-[10px] uppercase font-bold">{format(day, 'EEE', { locale: de })}</div>
                          <div className="text-base">{format(day, 'd')}</div>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center border-b bg-slate-50 min-w-[80px]">Soll (h)</th>
                    <th className="p-3 text-center border-b bg-slate-50 min-w-[80px]">Ist (h)</th>
                    <th className="p-3 text-center border-b bg-slate-50 min-w-[80px]">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {state.employees.map(emp => {
                    const holidays = getHolidays(currentMonth.getFullYear(), emp.state);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition group">
                        <td className="p-3 border-b border-r font-medium sticky left-0 bg-white group-hover:bg-slate-50">
                          {emp.name}
                          <div className="text-[10px] text-slate-400">{emp.state}</div>
                        </td>
                        {monthDays.map(day => {
                          const isWE = isWeekend(day);
                          const holiday = holidays.find(h => isSameDay(parseISO(h.date), day));
                          const entry = getEntry(emp.id, day);
                          
                          let cellContent = null;
                          let bgColor = 'bg-white';
                          
                          if (isWE) bgColor = 'bg-slate-50';
                          if (holiday) bgColor = 'bg-orange-50';
                          
                          if (entry?.absence === AbsenceType.VACATION) {
                            cellContent = <div className="text-[10px] font-bold text-emerald-600">URL</div>;
                            bgColor = 'bg-emerald-50';
                          } else if (entry?.absence === AbsenceType.SICK) {
                            cellContent = <div className="text-[10px] font-bold text-red-600">KRK</div>;
                            bgColor = 'bg-red-50';
                          } else if (entry?.shiftId) {
                            const s = state.shifts.find(sh => sh.id === entry.shiftId);
                            cellContent = (
                              <div 
                                className="w-full h-full flex flex-col items-center justify-center p-0.5 rounded text-[9px] text-white font-medium" 
                                style={{ backgroundColor: s?.color || '#3b82f6' }}
                                title={`${s?.name}: ${s?.startTime}-${s?.endTime}`}
                              >
                                {s?.name.substring(0, 1)}
                                {entry.actualHours !== undefined && entry.actualHours !== s?.hours && (
                                  <span className="text-[8px] bg-black/20 px-1 rounded">{entry.actualHours}h</span>
                                )}
                              </div>
                            );
                          } else if (entry?.actualHours) {
                            cellContent = <div className="text-[10px] font-bold text-blue-600">{entry.actualHours}h</div>;
                          }

                          return (
                            <td 
                              key={day.toISOString()} 
                              className={`p-1 border-b text-center cursor-pointer min-h-[50px] relative ${bgColor}`}
                              onClick={() => setSelectedEmployeeId(selectedEmployeeId === `${emp.id}-${format(day, 'yyyyMMdd')}` ? null : `${emp.id}-${format(day, 'yyyyMMdd')}`)}
                            >
                              <div className="min-h-[30px] flex items-center justify-center">
                                {cellContent}
                              </div>
                              {holiday && <div className="absolute top-0 right-0 w-1 h-1 bg-orange-500 rounded-full m-0.5" title={holiday.name}></div>}
                              
                              {/* Quick Edit Popover */}
                              {selectedEmployeeId === `${emp.id}-${format(day, 'yyyyMMdd')}` && (
                                <div className="absolute top-full left-0 z-50 mt-1 bg-white shadow-2xl rounded-lg border p-2 min-w-[200px] text-left">
                                  <p className="text-[10px] font-bold mb-2 uppercase text-slate-400">Schicht wählen</p>
                                  <div className="grid grid-cols-1 gap-1 mb-2">
                                    {state.shifts.map(s => (
                                      <button 
                                        key={s.id} 
                                        onClick={() => updateEntry(emp.id, day, { shiftId: s.id, absence: AbsenceType.NONE })}
                                        className="text-xs p-1.5 hover:bg-slate-100 rounded text-left flex items-center justify-between"
                                      >
                                        <span>{s.name} ({s.hours}h)</span>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                      </button>
                                    ))}
                                    <button 
                                      onClick={() => {
                                        const h = prompt('Arbeitsstunden eingeben:', '8');
                                        if (h) updateEntry(emp.id, day, { actualHours: parseFloat(h), absence: AbsenceType.NONE, shiftId: undefined });
                                      }}
                                      className="text-xs p-1.5 hover:bg-slate-100 rounded text-left text-blue-600"
                                    >
                                      Manuelle Stunden...
                                    </button>
                                  </div>
                                  <p className="text-[10px] font-bold mb-2 uppercase text-slate-400">Abwesenheit</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    <button onClick={() => updateEntry(emp.id, day, { absence: AbsenceType.VACATION, shiftId: undefined })} className="text-xs p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded">Urlaub</button>
                                    <button onClick={() => updateEntry(emp.id, day, { absence: AbsenceType.SICK, shiftId: undefined })} className="text-xs p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded">Krank</button>
                                  </div>
                                  <button onClick={() => updateEntry(emp.id, day, { shiftId: undefined, absence: AbsenceType.NONE, actualHours: undefined })} className="w-full mt-2 text-[10px] p-1 text-slate-400 hover:text-slate-600">Löschen</button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3 border-b text-center font-bold text-slate-500 bg-slate-50">{stats[emp.id].targetHours}</td>
                        <td className="p-3 border-b text-center font-bold text-blue-600 bg-slate-50">{stats[emp.id].totalHours}</td>
                        <td className={`p-3 border-b text-center font-bold bg-slate-50 ${stats[emp.id].totalHours - stats[emp.id].targetHours >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {stats[emp.id].totalHours - stats[emp.id].targetHours}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Weekend Support / Separate row for weekend work as per requirement 7 */}
                  <tr className="bg-slate-100/50">
                    <td className="p-3 border-b border-r font-bold sticky left-0 bg-slate-100">Wochenendarbeit</td>
                    {monthDays.map(day => {
                      const weekendEntries = state.entries.filter(e => isSameDay(parseISO(e.date), day) && isWeekend(day));
                      const totalHours = weekendEntries.reduce((sum, e) => {
                        const shift = state.shifts.find(s => s.id === e.shiftId);
                        return sum + (e.actualHours ?? (shift?.hours || 0));
                      }, 0);
                      return (
                        <td key={day.toISOString()} className="p-1 border-b text-center font-bold text-slate-600 text-[10px]">
                          {totalHours > 0 ? `${totalHours}h` : ''}
                        </td>
                      );
                    })}
                    <td className="p-3 border-b bg-slate-100" colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.employees.map(emp => (
              <div key={emp.id} className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-3 rounded-full">
                      <User className="text-slate-600 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{emp.name}</h3>
                      <p className="text-sm text-slate-500">{emp.state}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Urlaubstage</p>
                    <p className="text-xl font-bold text-slate-700">{stats[emp.id].usedVacation} / {emp.yearlyVacationEntitlement}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Überstunden (Monat)</p>
                    <p className={`text-xl font-bold ${stats[emp.id].totalHours - stats[emp.id].targetHours >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stats[emp.id].totalHours - stats[emp.id].targetHours}h
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">BUNDESLAND ÄNDERN</label>
                  <select 
                    value={emp.state}
                    onChange={(e) => {
                      const newState = e.target.value as GermanState;
                      setState(prev => ({
                        ...prev,
                        employees: prev.employees.map(m => m.id === emp.id ? { ...m, state: newState } : m)
                      }));
                    }}
                    className="w-full p-2 rounded-lg border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <button 
              onClick={addEmployee}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/30 transition group"
            >
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-blue-100 transition">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-semibold">Neuer Mitarbeiter</span>
            </button>
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Schichtmodelle</h2>
              <button 
                onClick={() => {
                  const name = prompt('Name der Schicht?');
                  if (!name) return;
                  const newShift: Shift = {
                    id: crypto.randomUUID(),
                    name,
                    startTime: '08:00',
                    endTime: '17:00',
                    color: '#' + Math.floor(Math.random()*16777215).toString(16),
                    hours: 8
                  };
                  setState(prev => ({ ...prev, shifts: [...prev.shifts, newShift] }));
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                <Plus className="w-5 h-5" /> Schicht hinzufügen
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {state.shifts.map(shift => (
                <div key={shift.id} className="bg-white rounded-2xl border p-6 flex items-center gap-6 shadow-sm">
                  <div className="w-4 h-12 rounded-full" style={{ backgroundColor: shift.color }}></div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Bezeichnung</label>
                      <input 
                        className="w-full bg-transparent font-bold text-slate-800 text-lg outline-none"
                        value={shift.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(prev => ({ ...prev, shifts: prev.shifts.map(s => s.id === shift.id ? { ...s, name: val } : s) }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Beginn</label>
                      <input 
                        type="time"
                        className="w-full bg-slate-50 border p-2 rounded-lg text-sm outline-none"
                        value={shift.startTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(prev => ({ ...prev, shifts: prev.shifts.map(s => s.id === shift.id ? { ...s, startTime: val } : s) }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Ende</label>
                      <input 
                        type="time"
                        className="w-full bg-slate-50 border p-2 rounded-lg text-sm outline-none"
                        value={shift.endTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(prev => ({ ...prev, shifts: prev.shifts.map(s => s.id === shift.id ? { ...s, endTime: val } : s) }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Stunden</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border p-2 rounded-lg text-sm outline-none"
                        value={shift.hours}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setState(prev => ({ ...prev, shifts: prev.shifts.map(s => s.id === shift.id ? { ...s, hours: val } : s) }));
                        }}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Schicht wirklich löschen?')) {
                        setState(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== shift.id) }));
                      }
                    }}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AISidebar state={state} />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-4 text-xs">
        <p>&copy; 2024 ShiftPlan Pro - Bereitgestellt für den Zeitraum 2026 bis 2030</p>
      </footer>
    </div>
  );
};

// Internal Component for AI
const AISidebar: React.FC<{ state: AppState }> = ({ state }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAskAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      // In a real scenario, we'd call Gemini here.
      // Mocking for now to demonstrate UI integration.
      setTimeout(() => {
        setResponse("Basierend auf dem aktuellen Schichtplan für 2026 habe ich festgestellt, dass die Arbeitslast am Dienstagmorgen hoch ist. Ich empfehle, einen zusätzlichen Springer für die Frühschicht einzuplanen, um Engpässe zu vermeiden. Die Urlaubsplanung hält sich an die Grenze von maximal 2 Personen gleichzeitig.");
        setLoading(false);
      }, 1500);
    } catch (e) {
      setResponse("Entschuldigung, es gab einen Fehler bei der KI-Analyse.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl shadow-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-2xl font-bold">ShiftPlan AI Assistant</h2>
        </div>
        <p className="opacity-90 mb-6">
          Lassen Sie Ihre Schichtpläne analysieren, Optimierungsvorschläge generieren oder fragen Sie nach gesetzlichen Feiertagen und Regelungen.
        </p>
        <div className="relative">
          <textarea 
            className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/50 min-h-[120px] resize-none"
            placeholder="z.B. Analysiere die Urlaubsplanung für den Sommer 2026..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            disabled={loading}
            onClick={handleAskAI}
            className="absolute bottom-4 right-4 bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition disabled:opacity-50"
          >
            {loading ? 'Denkt nach...' : 'Fragen'}
          </button>
        </div>
      </div>

      {response && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold uppercase text-xs">Analyse Ergebnis</span>
          </div>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{response}</p>
          <div className="mt-6 flex gap-2">
            <button className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition text-slate-600">Plan anpassen</button>
            <button className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition text-slate-600">Drucken</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
