'use client';

import Link from 'next/link';
import { CalendarDays, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';
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

const statusBadgeStyles = {
  AGENDADA: 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  CANCELADA: 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  REALIZADA: 'bg-green-50 text-green-700 border-green-250 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
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



const fetchDoctorAppointments = async (): Promise<AppointmentApi[]> => {
  const { data } = await api.get<AppointmentApi[]>('/appointments/doctor');
  return data;
};



const AppointmentsListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700 rounded-lg">
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
  <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-lg h-full my-auto">
    <CalendarDays className="w-12 h-12 text-gray-400 dark:text-slate-500 mb-3" />
    <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-1">Nenhuma consulta agendada</h3>
    <p className="text-sm text-gray-500 dark:text-slate-400">Você não tem novas consultas no momento.</p>
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

  const todayAppointmentsCount = useMemo(() => {
    if (!appointments) return 0;
    
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(new Date());
    
    return appointments.filter((app) => {
      try {
        const appDate = new Date(app.date);
        const appStr = formatter.format(appDate);
        return appStr === todayStr;
      } catch (e) {
        return false;
      }
    }).length;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    if (!appointments) return null;
    return appointments.find(app => app.status === 'AGENDADA') || null;
  }, [appointments]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            {greeting}, Dr(a). {user?.doctorProfile?.name?.split(' ')[0] || ''}!
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Aqui está o resumo da sua rotina clínica hoje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
          {isLoadingAppointments ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 dark:border-slate-600 border-t-teal-500" />
          ) : (
            <h3 className="text-5xl font-bold text-gray-800 dark:text-slate-100">
              {todayAppointmentsCount}
            </h3>
          )}
          <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium">Consultas Hoje</p>
        </div>
        
        {nextAppointment ? (
          <div className="lg:col-span-2 p-6 bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-900/80 dark:to-teal-800/60 dark:border dark:border-teal-500/40 dark:shadow-[0_0_25px_rgba(20,184,166,0.15)] rounded-lg shadow-md flex flex-col justify-center h-full text-white relative overflow-hidden">
             <div className="absolute -top-4 -right-4 p-6 opacity-10 dark:opacity-10 dark:text-teal-400 pointer-events-none">
               <Calendar className="w-48 h-48" />
             </div>
             <div className="relative z-10">
               <h3 className="text-teal-100 dark:text-teal-300 font-medium mb-1">Próxima Consulta</h3>
               <h2 className="text-2xl font-bold mb-2 dark:text-white">{nextAppointment.patientProfile?.name || 'Paciente'}</h2>
               <div className="flex items-center gap-2 text-teal-50 dark:text-teal-50/90">
                 <Clock className="w-4 h-4" />
                 <span>{formatAppointmentDate(nextAppointment.date)}</span>
               </div>
               <div className="mt-5 flex gap-3">
                 <button className="px-4 py-2 bg-white dark:bg-teal-400 text-teal-700 dark:text-teal-950 font-bold rounded-md shadow-sm hover:bg-teal-50 dark:hover:bg-teal-300 dark:shadow-[0_0_15px_rgba(45,212,191,0.3)] transition-all">
                   Iniciar Atendimento
                 </button>
                 <button 
                   onClick={() => handleOpenDetails(nextAppointment)}
                   className="px-4 py-2 bg-teal-700/50 dark:bg-teal-900/40 hover:bg-teal-700 dark:hover:bg-teal-800/60 border border-teal-400/30 dark:border-teal-500/40 text-white dark:text-teal-100 font-semibold rounded-md transition-colors"
                 >
                   Detalhes
                 </button>
               </div>
             </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center h-full border border-dashed border-gray-200 dark:border-slate-700">
             <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-1">Agenda Livre</h3>
             <p className="text-sm text-gray-500 dark:text-slate-400">Você não tem próximas consultas pendentes.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Consultas */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col h-[520px]">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-650 dark:text-teal-400" />
            Próximas Consultas
          </h2>

          {isLoadingAppointments && <AppointmentsListSkeleton />}

          {isAppointmentsError && (
            <p className="text-red-500">Ocorreu um erro ao buscar as consultas.</p>
          )}

          {!isLoadingAppointments && !isAppointmentsError && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar flex flex-col">
              {appointments && appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={() => handleOpenDetails(appointment)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-150 dark:border-slate-700 hover:border-teal-500/30 dark:hover:border-teal-400/30 hover:bg-teal-50/30 dark:hover:bg-teal-900/20 cursor-pointer transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded-lg text-teal-600 dark:text-teal-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-slate-100">
                          {appointment.patientProfile?.name || 'Paciente'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatAppointmentDate(appointment.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusBadgeStyles[appointment.status] || ''
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <AppointmentsEmptyState />
              )}
            </div>
          )}
        </div>

        {/* Tarefas Pendentes */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col h-[520px]">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-650 dark:text-teal-400" />
            Tarefas Pendentes
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-500 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-1">Tudo em dia!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Você não tem prontuários pendentes ou assinaturas aguardando.</p>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalhes da Consulta"
        maxWidth="max-w-md"
      >
        {selectedAppointment && (
          <div className="flex flex-col gap-5 mt-2">
            {/* Paciente Header */}
            <div className="flex items-center gap-4 p-4 bg-teal-50/50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-xl">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-teal-600/80 dark:text-teal-400/80 uppercase mb-0.5">Paciente</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-none">
                  {selectedAppointment.patientProfile?.name || 'N/A'}
                </h3>
              </div>
            </div>

            {/* Dados Demográficos */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1 p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">Idade</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">32 anos</span>
              </div>
              <div className="col-span-2 p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">CPF</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 whitespace-nowrap tracking-tight">123.456.789-00</span>
              </div>
              <div className="col-span-1 p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">Sexo</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">Feminino</span>
              </div>
            </div>

            {/* Informações da Consulta */}
            <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600">
                    <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 font-medium mb-0.5">Agendamento</span>
                    <span className="block text-sm font-bold text-gray-800 dark:text-slate-200">
                      {formatAppointmentDate(selectedAppointment.date)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">Status</span>
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${statusBadgeStyles[selectedAppointment.status] || ''}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>
            </div>
             
             {/* Rodapé e Ações */}
             <div className="pt-4 mt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center gap-3">
               <button 
                 onClick={() => alert('O fluxo de reagendamento (com justificativa e notificação ao paciente) requer implementação de Backend. Recomendamos abrir uma nova Story!')} 
                 className="px-4 py-2 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none"
               >
                 Reagendar
               </button>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setIsModalOpen(false)} 
                   className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-gray-400 focus:outline-none"
                 >
                   Fechar
                 </button>
                 {selectedAppointment.status === 'AGENDADA' && (
                   <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-teal-600/30 transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900">
                     Iniciar Consulta
                   </button>
                 )}
               </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}










