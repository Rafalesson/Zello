// Endereço: apps/frontend/src/app/medico/(dashboard)/agenda/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Info,
} from 'lucide-react';
import { api } from '@/services/api';
import { NumberStepper } from '@/components/common/NumberStepper';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DayRange {
  startTime: string;
  endTime: string;
}

interface GeneratedSlot {
  startTime: string;
  endTime: string;
  active: boolean;
}

interface BackendSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo', shortLabel: 'D' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda-feira', shortLabel: 'S' },
  { value: 2, label: 'Ter', fullLabel: 'Terça-feira', shortLabel: 'T' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta-feira', shortLabel: 'Q' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta-feira', shortLabel: 'Q' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta-feira', shortLabel: 'S' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado', shortLabel: 'S' },
];

type ToastType = 'success' | 'error' | null;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Generate slots from a range. */
function generateSlots(startTime: string, endTime: string, slotDuration: number): GeneratedSlot[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const slots: GeneratedSlot[] = [];

  for (let t = startMin; t + slotDuration <= endMin; t += slotDuration) {
    slots.push({
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + slotDuration),
      active: true,
    });
  }
  return slots;
}

/** Format time for display (e.g., "14:30"). */
function formatTime(time: string): string {
  return time;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AgendaPage() {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [dayRanges, setDayRanges] = useState<Record<number, DayRange>>({});
  const [daySlots, setDaySlots] = useState<Record<number, GeneratedSlot[]>>({});
  const [slotDuration, setSlotDuration] = useState<number>(60);
  const [consultationPrice, setConsultationPrice] = useState<string>('0');
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({
    type: null,
    message: '',
  });
  const [toastKey, setToastKey] = useState(0);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.type) {
      const timer = setTimeout(() => setToast({ type: null, message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.type, toastKey]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setToastKey((k) => k + 1);
  }, []);

  // Load existing availability on mount
  useEffect(() => {
    async function loadAvailability() {
      try {
        const [availRes, profileRes] = await Promise.all([
          api.get('/availability'),
          api.get('/auth/profile')
        ]);
        
        const slots: BackendSlot[] = availRes.data;
        const profile = profileRes.data?.doctorProfile;
        
        if (profile?.consultationPrice) {
          setConsultationPrice(profile.consultationPrice.toString());
        }

        if (slots.length === 0) {
          setLoading(false);
          return;
        }
        
        // Use the first slot's duration to set the global select
        setSlotDuration(slots[0].slotDurationMinutes || 60);

        // Group slots by day and reconstruct ranges
        const days = new Set<number>();
        const ranges: Record<number, DayRange> = {};
        const slotsMap: Record<number, GeneratedSlot[]> = {};

        const byDay = new Map<number, BackendSlot[]>();
        for (const slot of slots) {
          days.add(slot.dayOfWeek);
          const arr = byDay.get(slot.dayOfWeek) || [];
          arr.push(slot);
          byDay.set(slot.dayOfWeek, arr);
        }

        for (const [day, daySlotArr] of byDay) {
          const sorted = daySlotArr.sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );
          // Range is the first start to the last end
          ranges[day] = {
            startTime: sorted[0].startTime,
            endTime: sorted[sorted.length - 1].endTime,
          };
          // Map existing slots
          slotsMap[day] = sorted.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            active: s.isActive,
          }));
        }

        setSelectedDays(days);
        setDayRanges(ranges);
        setDaySlots(slotsMap);
      } catch {
        showToast(
          'error',
          'Não foi possível carregar sua agenda. Tente recarregar a página.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  // Toggle a day on/off
  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
        setDayRanges((r) => {
          const copy = { ...r };
          delete copy[day];
          return copy;
        });
        setDaySlots((s) => {
          const copy = { ...s };
          delete copy[day];
          return copy;
        });
      } else {
        next.add(day);
        const range = { startTime: '08:00', endTime: '17:00' };
        setDayRanges((r) => ({ ...r, [day]: range }));
        setDaySlots((s) => ({
          ...s,
          [day]: generateSlots('08:00', '17:00', slotDuration),
        }));
      }
      return next;
    });
  };

  // Re-generate all slots when slotDuration changes
  useEffect(() => {
    if (loading) return;
    setDaySlots((prevSlots) => {
      const newSlots = { ...prevSlots };
      for (const day of Array.from(selectedDays)) {
        const range = dayRanges[day];
        if (range) {
          newSlots[day] = generateSlots(range.startTime, range.endTime, slotDuration);
        }
      }
      return newSlots;
    });
  }, [slotDuration]);

  // Update range for a day → regenerate slots
  const updateRange = (
    day: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    setDayRanges((prev) => {
      const updated = { ...prev[day], [field]: value };
      const newSlots = generateSlots(updated.startTime, updated.endTime, slotDuration);
      setDaySlots((s) => ({ ...s, [day]: newSlots }));
      return { ...prev, [day]: updated };
    });
  };

  // Toggle individual slot on/off
  const toggleSlot = (day: number, slotIndex: number) => {
    setDaySlots((prev) => {
      const slots = [...(prev[day] || [])];
      slots[slotIndex] = { ...slots[slotIndex], active: !slots[slotIndex].active };
      return { ...prev, [day]: slots };
    });
  };

  // Count total active slots
  const totalActiveSlots = useMemo(() => {
    let count = 0;
    for (const day of selectedDays) {
      const slots = daySlots[day] || [];
      count += slots.filter((s) => s.active).length;
    }
    return count;
  }, [selectedDays, daySlots]);

  // Save
  const handleSave = async () => {
    // Validate ranges
    for (const day of selectedDays) {
      const range = dayRanges[day];
      if (!range) continue;
      if (range.endTime <= range.startTime) {
        const dayLabel =
          DAYS_OF_WEEK.find((d) => d.value === day)?.fullLabel || `Dia ${day}`;
        showToast(
          'error',
          `${dayLabel}: Horário de término deve ser após o de início.`,
        );
        return;
      }
      const slots = daySlots[day] || [];
      const activeSlots = slots.filter((s) => s.active);
      if (activeSlots.length === 0) {
        const dayLabel =
          DAYS_OF_WEEK.find((d) => d.value === day)?.fullLabel || `Dia ${day}`;
        showToast(
          'error',
          `${dayLabel}: Selecione pelo menos um horário de atendimento.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      // Build individual slots from all generated slots, including inactive ones
      const allSlots: BackendSlot[] = [];
      for (const day of Array.from(selectedDays).sort((a, b) => a - b)) {
        const slots = daySlots[day] || [];
        for (const slot of slots) {
          allSlots.push({
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDurationMinutes: slotDuration,
            isActive: slot.active,
          });
        }
      }

      await Promise.all([
        api.put('/availability', { slots: allSlots }),
        api.patch('/users/doctors/me', { consultationPrice: Number(consultationPrice) || null })
      ]);
      
      showToast('success', `Agenda salva com sucesso! ${totalActiveSlots} horários configurados 🎉`);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Erro ao salvar disponibilidade. Tente novamente.';
      showToast('error', typeof message === 'string' ? message : message[0]);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-3 text-slate-600 dark:text-slate-300">
          Carregando agenda...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Toast notification */}
      {toast.type && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-teal-600 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-950/40">
          <Calendar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Configurar Agenda
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Defina seus horários de atendimento por dia da semana
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div 
        onClick={() => setShowInfo(!showInfo)}
        className={`flex mt-6 mb-8 rounded-xl bg-teal-50/60 border border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/40 cursor-pointer transition-all hover:bg-teal-50 dark:hover:bg-teal-900/30 w-fit max-w-full
          ${showInfo ? 'items-start p-4 gap-3' : 'items-center p-3 gap-2'}
        `}
        title="Clique para ver como funciona a agenda"
      >
        <Info className={`text-teal-600 dark:text-teal-400 flex-shrink-0 ${showInfo ? 'h-5 w-5 mt-0.5' : 'h-5 w-5'}`} />
        {showInfo ? (
          <div className="text-sm text-teal-800 dark:text-teal-300 leading-relaxed animate-fade-in">
            <strong>Como funciona:</strong> Selecione os dias, defina o período
            disponível (ex: 08:00 às 17:00) e o sistema gerará automaticamente
            os horários de consulta com a duração escolhida. Você pode
            desativar horários específicos clicando sobre eles.
          </div>
        ) : (
          <span className="text-sm font-semibold text-teal-700 dark:text-teal-400 select-none pr-1">Como funciona</span>
        )}
      </div>

      {/* Configurations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div>
          <NumberStepper
            id="consultationPrice"
            label="Valor da Consulta"
            value={consultationPrice === '' ? '' : Number(consultationPrice)}
            onChange={(val) => setConsultationPrice(val === '' ? '' : String(val))}
            min={0}
            max={5000}
            prefix="R$"
            allowDecimals={true}
            stepAmount={10}
          />
          <p className="text-xs text-slate-500 mt-1.5">Defina o valor exibido aos pacientes.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tempo da Consulta
          </label>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 transition-colors"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos (1 hora)</option>
          </select>
          <p className="text-xs text-slate-500 mt-1.5">Duração de cada horário na agenda.</p>
        </div>
      </div>

      {/* Day selection toggles */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Dias de Atendimento
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Dias da semana"
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.has(day.value);
            const slotCount = (daySlots[day.value] || []).filter(
              (s) => s.active,
            ).length;
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                aria-pressed={isSelected}
                aria-label={day.fullLabel}
                className={`relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {day.label}
                {isSelected && slotCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-white text-teal-700 text-xs font-bold shadow-sm dark:bg-slate-800 dark:text-teal-400">
                    {slotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-day cards with slots */}
      {selectedDays.size > 0 && (
        <div className="space-y-5 mb-8">
          {DAYS_OF_WEEK.filter((d) => selectedDays.has(d.value)).map((day) => {
            const range = dayRanges[day.value] || {
              startTime: '08:00',
              endTime: '17:00',
            };
            const slots = daySlots[day.value] || [];
            const activeCount = slots.filter((s) => s.active).length;

            return (
              <div
                key={day.value}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700 transition-all"
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100 dark:bg-slate-800/80 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-teal-100 text-teal-700 font-bold text-sm dark:bg-teal-950/50 dark:text-teal-400">
                      {day.label.slice(0, 3)}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {day.fullLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {activeCount}{' '}
                      {activeCount === 1 ? 'horário' : 'horários'}
                    </span>
                  </div>
                </div>

                {/* Time range pickers */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    <div className="flex flex-col">
                      <label
                        htmlFor={`start-${day.value}`}
                        className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                      >
                        Início do expediente
                      </label>
                      <input
                        id={`start-${day.value}`}
                        type="time"
                        value={range.startTime}
                        onChange={(e) =>
                          updateRange(day.value, 'startTime', e.target.value)
                        }
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 transition-colors"
                      />
                    </div>

                    <span className="text-slate-400 mt-6 text-lg">→</span>

                    <div className="flex flex-col">
                      <label
                        htmlFor={`end-${day.value}`}
                        className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                      >
                        Fim do expediente
                      </label>
                      <input
                        id={`end-${day.value}`}
                        type="time"
                        value={range.endTime}
                        onChange={(e) =>
                          updateRange(day.value, 'endTime', e.target.value)
                        }
                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 transition-colors"
                      />
                    </div>

                    {/* Quick indicator */}
                    <div className="flex items-center gap-1.5 mt-6 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400">
                      <Zap className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">
                        {slots.length} {slots.length === 1 ? 'slot gerado' : 'slots gerados'}
                      </span>
                    </div>
                  </div>

                  {/* Generated slots grid */}
                  {slots.length > 0 ? (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                        Clique para ativar/desativar horários individuais:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot, idx) => (
                          <button
                            key={`${day.value}-${slot.startTime}`}
                            type="button"
                            onClick={() => toggleSlot(day.value, idx)}
                            aria-pressed={slot.active}
                            aria-label={`Horário ${formatTime(slot.startTime)} às ${formatTime(slot.endTime)}`}
                            className={`group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800 ${
                              slot.active
                                ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-950/60'
                                : 'bg-slate-50 text-slate-400 border border-slate-200 line-through hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 dark:hover:bg-slate-750'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatTime(slot.startTime)}
                            </span>
                            <span className="text-xs opacity-60">
                              – {formatTime(slot.endTime)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        Intervalo muito curto. Defina pelo menos 1 hora entre
                        início e término.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {selectedDays.size === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:bg-slate-800/50 dark:border-slate-600 mb-8">
          <Calendar className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Selecione os dias em que você atende acima para configurar seus
            horários.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            O sistema gerará os horários automaticamente com a duração selecionada.
          </p>
        </div>
      )}

      {/* Footer with save */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {totalActiveSlots > 0 && (
            <span>
              <strong className="text-slate-700 dark:text-slate-200">
                {totalActiveSlots}
              </strong>{' '}
              {totalActiveSlots === 1
                ? 'horário de consulta'
                : 'horários de consulta'}{' '}
              configurados
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || totalActiveSlots === 0}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl shadow-md hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'Salvando...' : 'Salvar Disponibilidade'}
        </button>
      </div>
    </div>
  );
}
