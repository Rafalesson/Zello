'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '@/components/common/Modal';
import { CalendarX, CheckCircle, Clock, Info, CalendarDays, User, Video, SearchX, AlertTriangle, Loader2, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DoctorProfile {
  id: number;
  name: string;
  specialty: string;
}

interface Appointment {
  id: number;
  date: string;
  status: 'AGENDADA' | 'CANCELADA' | 'REALIZADA' | 'NAO_INICIADA' | 'REAGENDADA';
  doctorProfile: DoctorProfile;
}

const STATUS_MAP: Record<string, string> = {
  'AGENDADA': 'Agendada',
  'REALIZADA': 'Realizada',
  'CANCELADA': 'Cancelada',
  'NAO_INICIADA': 'Não iniciada',
  'REAGENDADA': 'Reagendada',
};

const STATUS_COLORS: Record<string, string> = {
  'AGENDADA': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'REALIZADA': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'CANCELADA': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'NAO_INICIADA': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  'REAGENDADA': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const ITEMS_PER_PAGE = 4;

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string, date: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-refresh now every minute to update the "Acessar Sala" button dynamically
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    fetchAppointments();

    // Update current time every minute
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isRescheduleModalOpen && appointmentToReschedule) {
      fetchAvailableSlots();
    }
  }, [isRescheduleModalOpen, appointmentToReschedule, rescheduleDate]);

  const fetchAvailableSlots = async () => {
    if (!appointmentToReschedule) return;
    try {
      setIsLoadingSlots(true);
      const dateStr = format(rescheduleDate, 'yyyy-MM-dd');
      const response = await api.get(`/appointments/availability/${appointmentToReschedule.doctorProfile.id}?date=${dateStr}`);
      setAvailableSlots(response.data);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to fetch slots', error);
      setFeedback({ type: 'error', message: 'Erro ao buscar horários disponíveis.' });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Reset page to 1 when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments/patient');
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments', error);
      setFeedback({ type: 'error', message: 'Erro ao carregar as consultas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setRescheduleDate(new Date());
    setIsRescheduleModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (!appointmentToCancel) return;
    setCancellingId(appointmentToCancel.id);
    try {
      await api.patch(`/appointments/${appointmentToCancel.id}/cancel`, { reason: cancelReason });
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === appointmentToCancel.id ? { ...app, status: 'CANCELADA' } : app
        )
      );
      setFeedback({ type: 'success', message: 'Consulta cancelada com sucesso.' });
      setIsCancelModalOpen(false);
    } catch (error) {
      console.error('Failed to cancel appointment', error);
      setFeedback({ type: 'error', message: 'Erro ao cancelar a consulta. Verifique as regras de horário.' });
    } finally {
      setCancellingId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const confirmReschedule = async () => {
    if (!appointmentToReschedule || !selectedSlot) return;
    const selectedSlotData = availableSlots.find(s => s.startTime === selectedSlot);
    if (!selectedSlotData) return;

    try {
      setIsRescheduling(true);
      await api.patch(`/appointments/${appointmentToReschedule.id}/reschedule`, {
        newDate: selectedSlotData.date
      });
      setFeedback({ type: 'success', message: 'Consulta reagendada com sucesso!' });
      setIsRescheduleModalOpen(false);
      fetchAppointments();
    } catch (error: any) {
      console.error('Failed to reschedule appointment', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Erro ao reagendar consulta.'
      });
    } finally {
      setIsRescheduling(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const renderStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status] || STATUS_COLORS['NAO_INICIADA'];
    const label = STATUS_MAP[status] || status;
    return (
      <span className={`text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full font-bold w-max shadow-sm ${colorClass}`}>
        {label}
      </span>
    );
  };

  const upcomingAppointments: Appointment[] = [];
  const historyAppointments: Appointment[] = [];

  appointments.forEach(a => {
    const timeDiff = new Date(a.date).getTime() - (now ? now.getTime() : Date.now());
    const fifteenMinsInMs = 15 * 60 * 1000;

    // Se a consulta está agendada mas já passou dos 15 minutos de tolerância, consideramos "NÃO INICIADA"
    let effectiveStatus = a.status;
    if ((effectiveStatus === 'AGENDADA' || effectiveStatus === 'REAGENDADA') && timeDiff < -fifteenMinsInMs) {
      effectiveStatus = 'NAO_INICIADA';
    }

    const processedApp = { ...a, status: effectiveStatus };

    // Se ainda está agendada ou reagendada, vai para "Próximas"
    if (effectiveStatus === 'AGENDADA' || effectiveStatus === 'REAGENDADA') {
      upcomingAppointments.push(processedApp);
    } else {
      historyAppointments.push(processedApp);
    }
  });

  upcomingAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  historyAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(displayedAppointments.length / ITEMS_PER_PAGE));
  const paginatedAppointments = displayedAppointments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 pb-12">
      <div className="mb-8 sm:flex sm:justify-between sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-teal-500" />
            Minhas Consultas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Acompanhe seus próximos agendamentos e seu histórico médico.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Próximas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Histórico
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 shadow-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'}`}>
          <Info className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">{feedback.message}</span>
        </div>
      )}

      {loading || !now ? (
        <div className="flex flex-col justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Buscando suas consultas...</p>
        </div>
      ) : displayedAppointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Nenhuma consulta {activeTab === 'upcoming' ? 'agendada' : 'no histórico'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
            {activeTab === 'upcoming'
              ? 'Você não possui nenhum agendamento futuro. Que tal marcar uma nova consulta agora mesmo?'
              : 'Você ainda não realizou ou cancelou nenhuma consulta conosco.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link href="/medicos" className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm">
              Agendar Nova Consulta
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
          {/* List Content */}
          <div className="grid gap-4 flex-1 content-start">
            {paginatedAppointments.map((appointment) => {
              const appointmentDate = new Date(appointment.date);
              const timeDiff = appointmentDate.getTime() - now.getTime();

              const twelveHoursInMs = 12 * 60 * 60 * 1000;
              const sixHoursInMs = 6 * 60 * 60 * 1000;
              const fifteenMinsInMs = 15 * 60 * 1000;

              const isUpcomingState = appointment.status === 'AGENDADA' || appointment.status === 'REAGENDADA';

              const canCancel = isUpcomingState && timeDiff >= twelveHoursInMs;
              const canReschedule = isUpcomingState && timeDiff >= sixHoursInMs;

              // Only allow room access between (Appointment Time - 15m) and (Appointment Time + 15m)
              const isRoomOpen = isUpcomingState && timeDiff <= fifteenMinsInMs && timeDiff >= -fifteenMinsInMs;
              const isRoomExpired = isUpcomingState && timeDiff < -fifteenMinsInMs;
              const isRoomTooEarly = isUpcomingState && timeDiff > fifteenMinsInMs;

              return (
                <div key={appointment.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 relative overflow-hidden">
                  {/* Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${appointment.status === 'AGENDADA' ? 'bg-blue-500' : appointment.status === 'REALIZADA' ? 'bg-emerald-500' : appointment.status === 'CANCELADA' ? 'bg-rose-500' : appointment.status === 'REAGENDADA' ? 'bg-amber-500' : 'bg-slate-300'}`} />

                  <div className="flex-1 pl-2 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                      <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4" />
                          {format(appointmentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-teal-500" />
                          {format(appointmentDate, "HH:mm")}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dr(a). {appointment.doctorProfile.name}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{appointment.doctorProfile.specialty}</p>
                    </div>
                  </div>

                  <div className={`flex flex-col sm:items-end gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/50 ${activeTab === 'upcoming' ? 'justify-between' : 'justify-center'}`}>
                    <div className="w-full flex justify-start sm:justify-end">
                      {renderStatusBadge(appointment.status)}
                    </div>
                    {/* Action Buttons for active appointments */}
                    {activeTab === 'upcoming' && (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          {canCancel && (
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                          {canReschedule && (
                            <button
                              onClick={() => handleRescheduleClick(appointment)}
                              className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 rounded-xl transition-colors"
                            >
                              Remarcar
                            </button>
                          )}
                        </div>

                        {/* Room Access logic */}
                        {isRoomOpen && (
                          <button
                            onClick={() => router.push('/paciente/sala/' + appointment.id)}
                            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            Acessar Sala Virtual
                          </button>
                        )}
                        {!canReschedule && isUpcomingState && isRoomTooEarly && (
                          <span className="text-[10px] font-medium text-slate-400 text-center sm:text-right max-w-[200px] leading-tight">
                            Alterações só são permitidas com antecedência mínima.
                          </span>
                        )}
                      </>
                    )}


                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Consulta"
        maxWidth="max-w-lg"
      >
        <div className="mt-2">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800 dark:text-rose-300">
              Tem certeza que deseja cancelar sua consulta com <strong>Dr(a). {appointmentToCancel?.doctorProfile.name}</strong> agendada para o dia <strong>{appointmentToCancel && format(new Date(appointmentToCancel.date), "dd/MM/yyyy 'às' HH:mm")}</strong>?
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Motivo do cancelamento (opcional)</label>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              rows={3}
              placeholder="Ex: Imprevisto no trabalho, mudança de planos..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-medium">
            * Esta ação não pode ser desfeita. O horário será imediatamente liberado para outros pacientes e o médico será notificado.
          </p>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-6 py-2.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors"
              disabled={cancellingId !== null}
            >
              Manter Consulta
            </button>
            <button
              onClick={confirmCancellation}
              disabled={cancellingId !== null}
              className="px-6 py-2.5 text-white bg-rose-600 hover:bg-rose-500 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {cancellingId !== null ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, cancelar consulta'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Remarcar Consulta"
        maxWidth="max-w-md"
      >
        <div className="mt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Escolha uma nova data e horário para a consulta com{' '}
            <strong className="text-slate-800 dark:text-white">
              Dr(a). {appointmentToReschedule?.doctorProfile.name}
            </strong>.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Selecione a Data
            </label>
            <input
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              value={format(rescheduleDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  setRescheduleDate(new Date(year, month - 1, day));
                }
              }}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Horários Disponíveis
            </label>
            {isLoadingSlots ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <CalendarX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum horário disponível nesta data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${selectedSlot === slot.startTime
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500'
                      }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-6 py-2.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors"
              disabled={isRescheduling}
            >
              Cancelar
            </button>
            <button
              onClick={confirmReschedule}
              disabled={isRescheduling || !selectedSlot}
              className="px-6 py-2.5 text-white bg-amber-500 hover:bg-amber-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Reagendando...
                </>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
