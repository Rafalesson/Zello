'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  CheckCircle2, 
  Info,
  Loader2,
  XCircle
} from 'lucide-react';
import { formatISO, formatDayMonthYear, formatWeekdayDayMonth } from '@/utils/date';
import { api } from '@/services/api';
import { CalendarStrip } from '@/components/consultation/CalendarStrip';
import { useAuth } from '@/contexts/AuthProvider';
import { AuthContextModal } from '@/components/common/AuthContextModal';

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

interface BookingWidgetProps {
  doctorId: number;
  doctorName: string;
  price: number;
  availabilities: Availability[];
}

export function BookingWidget({ doctorId, doctorName, price, availabilities = [] }: BookingWidgetProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Custom toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const formattedDateQuery = formatISO(selectedDate);

  // Fetch available slots from backend
  const { data: availableSlots = [], isLoading: isSlotsLoading } = useQuery({
    queryKey: ['available-slots', doctorId, formattedDateQuery],
    queryFn: async () => {
      const res = await api.get(`/appointments/availability/${doctorId}?date=${formattedDateQuery}`);
      return res.data;
    },
  });

  // Mutation to book appointment
  const bookMutation = useMutation({
    mutationFn: async (dateIso: string) => {
      const res = await api.post('/appointments', {
        doctorProfileId: doctorId,
        date: dateIso,
      });
      return res.data;
    },
    onSuccess: () => {
      setBookingStatus('success');
      queryClient.invalidateQueries({ queryKey: ['available-slots', doctorId, formattedDateQuery] });
      setToast({ type: 'success', message: 'Consulta agendada com sucesso!' });
      // clear toast after 3 seconds
      setTimeout(() => setToast({ type: null, message: '' }), 3000);
    },
    onError: (error: any) => {
      const errCode = error.response?.data?.code;
      let errMsg = error.response?.data?.message;
      
      if (!errMsg && errCode === 'SLOT_UNAVAILABLE') {
        errMsg = 'Este horário não está mais disponível. Por favor, escolha outro horário.';
      } else if (!errMsg && errCode === 'VALIDATION_ERROR') {
        errMsg = 'Dados inválidos fornecidos para o agendamento.';
      }

      setToast({ 
        type: 'error', 
        message: errMsg || 'Erro ao agendar consulta. O horário pode não estar mais disponível.' 
      });
      setTimeout(() => setToast({ type: null, message: '' }), 4000);
    }
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingStatus('idle');
  };

  const handleSlotSelect = (slotTime: string) => {
    setSelectedSlot(slotTime);
    setBookingStatus('idle');
  };

  const executeBooking = () => {
    if (!selectedDate || !selectedSlot) return;
    
    // Find the slot to get the full ISO date string
    const slot = availableSlots.find((s: any) => s.startTime === selectedSlot);
    if (!slot) return;
    
    bookMutation.mutate(slot.date);
  };

  const handleConfirmBooking = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    executeBooking();
  };

  const onAuthSuccess = () => {
    setIsAuthModalOpen(false);
    executeBooking();
  };

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-800 sticky top-24 transition-all relative overflow-hidden">
      <AuthContextModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={onAuthSuccess} 
      />
      
      {/* Toast Notification */}
      {toast.type && (
        <div className={`absolute top-0 left-0 w-full p-3 text-xs font-bold text-center z-10 flex items-center justify-center gap-2
          ${toast.type === 'success' ? 'bg-teal-500 text-white' : 'bg-rose-500 text-white'}
        `}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 pb-4 dark:border-slate-700 mt-2">
        Agendamento
      </h2>

      {bookingStatus === 'success' ? (
        <div className="mt-6 text-center space-y-4 py-4 animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-md font-bold text-slate-900 dark:text-white">Consulta Pré-Agendada!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            Sua solicitação de consulta com <strong>{doctorName}</strong> para o dia <strong>{selectedDate && formatDayMonthYear(selectedDate)}</strong> às <strong>{selectedSlot}</strong> foi registrada.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-left border border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Video className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <span>Link da teleconsulta será enviado por e-mail.</span>
            </div>
          </div>
          <button
            onClick={() => {
              setBookingStatus('idle');
              setSelectedSlot(null);
            }}
            className="w-full inline-flex justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Agendar Outra Consulta
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Price detail */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Valor da consulta</span>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Modalidades available */}
          <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <Video className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Teleconsulta</span>
            </div>
          </div>

          {/* Horizontal Calendar Strip Component */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Selecione a Data
            </label>
            <CalendarStrip 
              onSelectDate={handleDateSelect} 
              selectedDate={selectedDate} 
              hasSlots={(date) => availabilities.some(a => a.dayOfWeek === date.getDay() && a.isActive)}
            />
          </div>

          {/* Time Slots Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex justify-between items-center">
              <span>Horários Disponíveis</span>
              {isSlotsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </label>
            
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot: any) => {
                  const isSelected = selectedSlot === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => handleSlotSelect(slot.startTime)}
                      className={`flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/40 dark:border-teal-400 dark:text-teal-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Clock className="h-3 w-3 opacity-60" />
                      <span>{slot.startTime}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40 text-center">
                <CalendarIcon className="h-5 w-5 text-slate-400 dark:text-slate-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Sem horários neste dia</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Selecione outro dia na barra acima</p>
              </div>
            )}
          </div>

          {/* Summary / Book CTA */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
            {selectedDate && selectedSlot ? (
              <div className="bg-teal-50/50 dark:bg-teal-900/20 border border-teal-100/60 dark:border-teal-900/50 rounded-xl p-3.5 text-xs text-teal-800 dark:text-teal-300 mb-4 space-y-1 animate-fade-in">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Resumo do Agendamento
                </p>
                <p className="pl-4 mt-1 font-medium">
                  {formatWeekdayDayMonth(selectedDate)}
                </p>
                <p className="pl-4 font-bold">
                  Horário: {selectedSlot} ({availableSlots.find((s: any) => s.startTime === selectedSlot)?.slotDurationMinutes || 60} min)
                </p>
              </div>
            ) : (
              <div className="flex gap-2 p-3 rounded-xl bg-amber-50/40 border border-amber-100/40 dark:bg-amber-900/20 dark:border-amber-900/40 text-[10px] text-amber-800 dark:text-amber-300 leading-normal mb-4">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Selecione uma data e horário acima para habilitar o agendamento da consulta.</span>
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={!selectedDate || !selectedSlot || bookMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all disabled:shadow-none"
            >
              {bookMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <span>Confirmar Agendamento</span>
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
