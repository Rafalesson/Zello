'use client';

import Link from 'next/link';
import { CalendarDays, Calendar, User, Clock, CheckCircle2, Activity } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthProvider';
import { Modal } from '@/components/common/Modal';

type PatientProfile = {
  name?: string | null;
};

type AppointmentApi = {
  id: number;
  date: string;
  status: 'AGENDADA' | 'CANCELADA' | 'REALIZADA';
  patientProfile: {
    id: number;
    name: string;
  } | null;
};

const statusBadgeStyles: Record<string, string> = {
  AGENDADA: 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  CANCELADA: 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  REALIZADA: 'bg-green-50 text-green-700 border-green-250 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
  NAO_INICIADA: 'bg-gray-50 text-gray-700 border-gray-250 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  REAGENDADA: 'bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
};

const isAppointmentMissed = (dateString: string) => {
  const appTime = new Date(dateString).getTime();
  const now = new Date().getTime();
  const windowEnd = appTime + 15 * 60 * 1000; // 15 minutos de tolerância
  return now > windowEnd;
};

const isAppointmentStartable = (dateString: string) => {
  const appTime = new Date(dateString).getTime();
  const now = new Date().getTime();
  const windowStart = appTime - 15 * 60 * 1000; // 15 minutos antes
  const windowEnd = appTime + 15 * 60 * 1000; // 15 minutos depois
  return now >= windowStart && now <= windowEnd;
};

const getDisplayStatus = (appointment: AppointmentApi) => {
  if (appointment.status === 'AGENDADA' && isAppointmentMissed(appointment.date)) {
    return 'NAO_INICIADA';
  }
  return appointment.status;
};

const formatStatusText = (status: string) => {
  if (status === 'NAO_INICIADA') return 'NÃO INICIADA';
  return status;
};

const formatAppointmentDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });
    const timePart = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    return `${datePart} às ${timePart}`;
  } catch (e) {
    return dateString;
  }
};

const getUserInitials = (name?: string | null) => {
  if (!name) return 'U';
  const cleaned = name.replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').trim();
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDoctorGreeting = (fullName?: string | null) => {
  if (!fullName) return 'Doutor(a)';
  const isFemale = /^(Dra\.|Dra)\s*/i.test(fullName);
  const isMale = /^(Dr\.|Dr)\s*/i.test(fullName);
  const nameWithoutPrefix = fullName.replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').trim();
  const firstName = nameWithoutPrefix.split(' ')[0] || '';
  
  if (isFemale) return `Dra. ${firstName}`;
  if (isMale) return `Dr. ${firstName}`;
  return `Dr(a). ${firstName}`;
};

const fetchDoctorAppointments = async (): Promise<AppointmentApi[]> => {
  const { data } = await api.get<AppointmentApi[]>('/appointments/doctor');
  return data;
};

const AppointmentsListSkeleton = () => (
  <div className="space-y-3 animate-pulse flex-grow">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 rounded-2xl">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full" />
      </div>
    ))}
  </div>
);

const AppointmentsEmptyState = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-full my-auto flex-1">
    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full mb-3">
      <CalendarDays className="w-8 h-8 text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-md font-bold text-slate-805 dark:text-slate-200 mb-1">Nenhuma consulta hoje</h3>
    <p className="text-sm text-slate-500 dark:text-slate-450 max-w-xs">Você está sem compromissos clínicos agendados para a data de hoje.</p>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentApi | null>(null);

  const handleOpenDetails = (appointment: AppointmentApi) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    isError: isAppointmentsError,
  } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: fetchDoctorAppointments,
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const formattedDate = useMemo(() => {
    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);
  }, []);

  const todayStats = useMemo(() => {
    const stats = { total: 0, agendadas: 0, realizadas: 0, naoIniciadas: 0, canceladas: 0 };
    if (!appointments) return stats;

    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date());

    appointments.forEach((app) => {
      try {
        const appDate = new Date(app.date);
        const appStr = formatter.format(appDate);
        if (appStr === todayStr) {
          stats.total++;
          const status = getDisplayStatus(app);
          if (status === 'AGENDADA') stats.agendadas++;
          else if (status === 'REALIZADA') stats.realizadas++;
          else if (status === 'NAO_INICIADA') stats.naoIniciadas++;
          else if (status === 'CANCELADA') stats.canceladas++;
        }
      } catch (e) {
        // ignore
      }
    });

    return stats;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    if (!appointments) return null;
    return appointments
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find(app => app.status === 'AGENDADA' && !isAppointmentMissed(app.date)) || null;
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    if (!appointments) return [];
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date());

    return appointments
      .filter(app => {
        try {
          return formatter.format(new Date(app.date)) === todayStr;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Modern Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm transition-colors">
        <div>
          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-full border border-teal-100/50 dark:border-teal-900/30">
            Command Center
          </span>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-3">
            {greeting}, {getDoctorGreeting(user?.doctorProfile?.name)}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Aqui está o resumo da sua rotina clínica hoje.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 w-fit">
          <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Hoje</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Main Stats and Next Appointment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment Card */}
        {nextAppointment ? (
          <div className="p-6 bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-800 dark:to-teal-950 rounded-2xl shadow-lg shadow-teal-600/10 dark:shadow-none flex flex-col justify-between min-h-[220px] text-white relative overflow-hidden group border border-teal-500/20">
            <div className="absolute -top-10 -right-10 p-6 opacity-10 pointer-events-none transform transition-transform group-hover:scale-110 duration-500">
              <Calendar className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-teal-100/90 dark:text-teal-350 font-extrabold uppercase tracking-wider text-[10px] bg-white/10 dark:bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    Próxima Consulta
                  </span>
                  <div className="flex items-center gap-1.5 text-teal-100/90 text-xs bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatAppointmentDate(nextAppointment.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-white border border-white/10 text-lg shadow-inner">
                    {getUserInitials(nextAppointment.patientProfile?.name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight leading-none">{nextAppointment.patientProfile?.name || 'Paciente'}</h2>
                    <span className="text-xs text-teal-200/80 mt-1 block">Teleconsulta Agendada</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {isAppointmentStartable(nextAppointment.date) ? (
                  <button
                    onClick={() => alert('Consulta iniciada! Em breve redirecionaremos para a sala virtual.')}
                    className="flex-1 py-3 bg-white text-teal-800 font-bold rounded-xl shadow-md hover:bg-teal-50 active:scale-[0.98] transition-all text-sm"
                  >
                    Iniciar Atendimento
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-3 bg-teal-900/30 text-teal-300/50 font-bold rounded-xl cursor-not-allowed border border-teal-500/20 text-sm"
                  >
                    Aguarde o Horário
                  </button>
                )}
                <button
                  onClick={() => handleOpenDetails(nextAppointment)}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl active:scale-[0.98] transition-all text-sm"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[220px]">
            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Sem mais consultas hoje</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Sua agenda está livre. Aproveite para descansar ou revisar prontuários de consultas passadas.
            </p>
          </div>
        )}

        {/* Daily Stats Grid */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              Resumo do Dia
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2.5 py-1 rounded-full">
              <Activity className="w-3.5 h-3.5" />
              <span>{todayStats.total} Atendimentos</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Agendadas */}
            <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl border border-amber-100/50 dark:border-amber-900/20 flex flex-col justify-between hover:border-amber-300 transition-colors">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Agendadas</span>
              <span className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-2">{todayStats.agendadas}</span>
            </div>

            {/* Realizadas */}
            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Realizadas</span>
              <span className="text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-2">{todayStats.realizadas}</span>
            </div>

            {/* Não Iniciadas */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-700/30 flex flex-col justify-between hover:border-slate-400 transition-colors">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Não Iniciadas</span>
              <span className="text-3xl font-black text-slate-700 dark:text-slate-300 mt-2">{todayStats.naoIniciadas}</span>
            </div>

            {/* Canceladas */}
            <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl border border-rose-100/50 dark:border-rose-900/20 flex flex-col justify-between hover:border-rose-300 transition-colors">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Canceladas</span>
              <span className="text-3xl font-black text-rose-800 dark:text-rose-300 mt-2">{todayStats.canceladas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline and Pending Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Component */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Agenda de Hoje
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">
              {todayAppointments?.length || 0} Compromissos
            </span>
          </div>

          {isLoadingAppointments && <AppointmentsListSkeleton />}

          {isAppointmentsError && (
            <p className="text-red-500 text-sm">Ocorreu um erro ao buscar as consultas.</p>
          )}

          {!isLoadingAppointments && !isAppointmentsError && (
            <div className="flex-grow flex flex-col space-y-4">
              {todayAppointments && todayAppointments.length > 0 ? (
                <div className="relative border-l border-slate-100 dark:border-slate-700 pl-4 ml-3 space-y-4 my-2 flex-grow">
                  {todayAppointments.map((appointment) => {
                    const status = getDisplayStatus(appointment);
                    const appTime = new Date(appointment.date).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Sao_Paulo',
                    });
                    
                    const statusColors: Record<string, string> = {
                      AGENDADA: 'bg-amber-500',
                      REALIZADA: 'bg-emerald-500',
                      NAO_INICIADA: 'bg-slate-400',
                      CANCELADA: 'bg-rose-500',
                    };
                    const color = statusColors[status] || 'bg-teal-500';

                    return (
                      <div
                        key={appointment.id}
                        onClick={() => handleOpenDetails(appointment)}
                        className="group relative flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <div className={`absolute -left-[21px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${color} border-2 border-white dark:border-slate-900 z-10 transition-transform group-hover:scale-125`} />
                        
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-200 min-w-[45px]">
                            {appTime}
                          </span>
                          
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                            {getUserInitials(appointment.patientProfile?.name)}
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors text-sm">
                              {appointment.patientProfile?.name || 'Paciente'}
                            </h4>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">
                              Teleconsulta
                            </p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-wider border uppercase ${statusBadgeStyles[status] || ''}`}>
                          {formatStatusText(status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <AppointmentsEmptyState />
              )}
            </div>
          )}
        </div>

        {/* Action checklist widget */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col min-h-[380px] h-full">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Ações Necessárias
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl my-auto">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-full mb-3 relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
              <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 relative z-10" />
            </div>
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-1">Tudo em dia!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Você não possui prontuários pendentes, assinaturas digitais ou laudos aguardando sua revisão.
            </p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalhes da Consulta"
        maxWidth="max-w-lg"
      >
        {selectedAppointment && (
          <div className="flex flex-col gap-6 mt-4">
            {/* Patient Header */}
            <div className="flex items-center gap-4 p-4 bg-teal-50/50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 rounded-xl">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                {getUserInitials(selectedAppointment.patientProfile?.name)}
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-wider text-teal-600/80 dark:text-teal-400/80 uppercase mb-0.5">Paciente</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-none">
                  {selectedAppointment.patientProfile?.name || 'N/A'}
                </h3>
              </div>
            </div>

            {/* Demographics Card */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Idade</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">32 anos</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">CPF</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">123.456.789-00</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Sexo</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">Feminino</span>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Agendamento</span>
                    <span className="block text-sm font-bold text-gray-800 dark:text-slate-200">
                      {formatAppointmentDate(selectedAppointment.date)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Status</span>
                  <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${statusBadgeStyles[getDisplayStatus(selectedAppointment)] || ''}`}>
                    {formatStatusText(getDisplayStatus(selectedAppointment))}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-6 mt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between gap-3 items-center w-full">
              {getDisplayStatus(selectedAppointment) === 'AGENDADA' ? (
                <button
                  onClick={() => alert('Fluxo de cancelamento de consulta ainda não implementado no Backend.')}
                  className="px-4 py-2 bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap focus:outline-none"
                >
                  Cancelar Consulta
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => alert('O fluxo de reagendamento (com justificativa e notificação ao paciente) requer implementação de Backend. Recomendamos abrir uma nova Story!')}
                className="px-4 py-2 bg-amber-50 text-amber-605 dark:bg-amber-950/20 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap focus:outline-none"
              >
                Reagendar
              </button>

              {selectedAppointment.status === 'AGENDADA' && isAppointmentStartable(selectedAppointment.date) && (
                <button
                  onClick={() => alert('Consulta iniciada! Em breve redirecionaremos para a sala virtual.')}
                  className="px-4 py-2 bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap focus:outline-none"
                >
                  Iniciar Consulta
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}










