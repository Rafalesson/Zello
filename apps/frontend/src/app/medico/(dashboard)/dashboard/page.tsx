'use client';

import Link from 'next/link';
import { PlusCircle, CalendarDays, Calendar, User, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">{greeting}, Dr(a).</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Aqui está o resumo da sua rotina clínica hoje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
          {isLoadingAppointments ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 dark:border-slate-600 border-t-teal-500" />
          ) : (
            <h3 className="text-4xl font-bold text-gray-800 dark:text-slate-100">
              {String(todayAppointmentsCount).padStart(2, '0')}
            </h3>
          )}
          <p className="text-gray-500 dark:text-slate-400 mt-2">Consultas Hoje</p>
        </div>
        {/* Placeholder para uma futura métrica mais acionável */}
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
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-150 dark:border-slate-700 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-all duration-200 shadow-sm"
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
                      {appointment.status === 'AGENDADA' && (
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors shadow-sm">
                          Iniciar Consulta
                        </button>
                      )}
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
              <PlusCircle className="w-8 h-8 text-green-500 dark:text-green-400 rotate-45" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-1">Tudo em dia!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Você não tem prontuários pendentes ou assinaturas aguardando.</p>
          </div>
        </div>
      </div>
    </div>
  );
}










