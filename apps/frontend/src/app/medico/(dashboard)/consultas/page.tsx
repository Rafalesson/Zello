'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar as CalendarIcon, User, Clock, CheckCircle2, XCircle, Video, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Modal } from '@/components/common/Modal';

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
  const windowEnd = appTime + 15 * 60 * 1000;
  return now > windowEnd;
};

const isAppointmentStartable = (dateString: string) => {
  const appTime = new Date(dateString).getTime();
  const now = new Date().getTime();
  const windowStart = appTime - 15 * 60 * 1000;
  const windowEnd = appTime + 15 * 60 * 1000;
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
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
    });
    const timePart = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
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

export default function ConsultasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  const [filterTime, setFilterTime] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentApi | null>(null);

  const {
    data: appointments,
    isLoading,
  } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: fetchDoctorAppointments,
  });

  const handleOpenDetails = (appointment: AppointmentApi) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AGENDADA': return <Clock className="w-3.5 h-3.5" />;
      case 'REALIZADA': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'CANCELADA': return <XCircle className="w-3.5 h-3.5" />;
      case 'NAO_INICIADA': return <Clock className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const filteredConsultas = useMemo(() => {
    if (!appointments) return [];

    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const todayStr = formatter.format(new Date());

    return appointments.filter(c => {
      // Patient Filter
      const patientName = c.patientProfile?.name || 'Paciente';
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status Filter
      const displayStatus = getDisplayStatus(c);
      const matchesStatus = filterStatus === 'TODAS' || displayStatus === filterStatus;

      // Time Filter
      let matchesTime = true;
      try {
        const appDateStr = formatter.format(new Date(c.date));
        if (filterTime === 'HOJE') {
          matchesTime = appDateStr === todayStr;
        } else if (filterTime === 'PASSADO') {
          matchesTime = appDateStr < todayStr;
        } else if (filterTime === 'FUTURO') {
          matchesTime = appDateStr > todayStr;
        }
      } catch (e) {}

      return matchesSearch && matchesStatus && matchesTime;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, searchTerm, filterStatus, filterTime]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header com Tabs de Tempo integradas */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Minhas Consultas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie seu histórico de atendimentos e compromissos agendados.</p>
        </div>

        {/* Tabs de Tempo */}
        <div className="flex gap-8 border-b border-gray-200 dark:border-slate-700/60 overflow-x-auto scrollbar-hide">
          {['TODOS', 'HOJE', 'PASSADO', 'FUTURO'].map(time => (
            <button
              key={time}
              onClick={() => setFilterTime(time)}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                filterTime === time 
                  ? 'text-teal-600 dark:text-teal-400' 
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300'
              }`}
            >
              {time === 'TODOS' ? 'Todos os Períodos' : time.charAt(0) + time.slice(1).toLowerCase()}
              {filterTime === time && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-t-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Controles: Busca e Filtro de Status */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar paciente por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all dark:text-slate-200 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          <Filter className="h-4 w-4 text-gray-400 dark:text-slate-500 hidden md:block mr-1" />
          {['TODAS', 'AGENDADA', 'REALIZADA', 'NAO_INICIADA', 'CANCELADA'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-all border ${
                filterStatus === status 
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {formatStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Consultas (Estilo SaaS Moderno) */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700/60 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-teal-500" />
          </div>
        ) : filteredConsultas.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {filteredConsultas.map(consulta => {
              const status = getDisplayStatus(consulta);
              const patientName = consulta.patientProfile?.name || 'Paciente';
              
              return (
                <div 
                  key={consulta.id} 
                  onClick={() => handleOpenDetails(consulta)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group gap-4 sm:gap-0"
                >
                  {/* Paciente Info */}
                  <div className="flex items-center gap-4 sm:w-1/3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {patientName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {patientName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Paciente</p>
                    </div>
                  </div>

                  {/* Data e Hora */}
                  <div className="flex items-center gap-2 sm:w-1/3 sm:justify-center">
                    <div className="p-1.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-100 dark:border-slate-700">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatAppointmentDate(consulta.date)}
                    </span>
                  </div>

                  {/* Status e Ação */}
                  <div className="flex items-center justify-between sm:w-1/3 sm:justify-end gap-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold border ${statusBadgeStyles[status] || ''}`}>
                      {getStatusIcon(status)}
                      {formatStatusText(status)}
                    </span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm border border-transparent group-hover:border-gray-200 dark:group-hover:border-slate-600 transition-all">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Nenhuma consulta encontrada</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Não encontramos nenhuma consulta que corresponda aos filtros atuais. Tente ajustar sua busca ou período.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Consulta */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Detalhes da Consulta"
        maxWidth="max-w-lg"
      >
        {selectedAppointment && (
          <div className="flex flex-col gap-6 mt-4">
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
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">Idade</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">32 anos</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">CPF</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">123.456.789-00</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl flex flex-col justify-center overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">Sexo</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">Feminino</span>
              </div>
            </div>

            {/* Informações da Consulta */}
            <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600">
                    <CalendarIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${statusBadgeStyles[getDisplayStatus(selectedAppointment)] || ''}`}>
                    {formatStatusText(getDisplayStatus(selectedAppointment))}
                  </span>
                </div>
              </div>
            </div>
             
             {/* Rodapé e Ações */}
             <div className="pt-6 mt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center w-full">
               {getDisplayStatus(selectedAppointment) === 'AGENDADA' ? (
                 <button 
                   onClick={() => alert('Fluxo de cancelamento de consulta ainda não implementado no Backend.')} 
                   className="px-5 py-2 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white rounded-lg text-sm font-bold transition-all whitespace-nowrap focus:outline-none"
                 >
                   Cancelar Consulta
                 </button>
               ) : (
                 <div>{/* Spacer para manter distribuição correta */}</div>
               )}
               
               <button 
                 onClick={() => alert('O fluxo de reagendamento (com justificativa e notificação ao paciente) requer implementação de Backend. Recomendamos abrir uma nova Story!')} 
                 className="px-5 py-2 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white rounded-lg text-sm font-bold transition-all whitespace-nowrap focus:outline-none"
               >
                 Reagendar
               </button>
               
               {selectedAppointment.status === 'AGENDADA' && isAppointmentStartable(selectedAppointment.date) && (
                 <button 
                   onClick={() => alert('Consulta iniciada! Em breve redirecionaremos para a sala virtual.')}
                   className="px-5 py-2 bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white rounded-lg text-sm font-bold transition-all whitespace-nowrap focus:outline-none"
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

