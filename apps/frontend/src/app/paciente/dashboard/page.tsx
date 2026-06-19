'use client';

import { useAuth } from "@/contexts/AuthProvider";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  Stethoscope, 
  FileText, 
  CalendarDays, 
  Search,
  Clock,
  Video,
  ChevronRight,
  Activity
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: number;
  date: string;
  status: string;
  doctorProfile: {
    name: string;
    specialty: string;
    profilePictureUrl?: string;
  };
}

function QuickAccess() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <Link href="/paciente/consultas" className="flex-1 group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Minhas Consultas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie seus agendamentos</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-blue-500" />
      </Link>
      <Link href="/medicos" className="flex-1 group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-sm">
        <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Agendar Consulta</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Encontre especialistas na Zello</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-teal-500" />
      </Link>
      <Link href="/paciente/receitas" className="flex-1 group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Minhas Receitas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Acesse suas prescrições</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-emerald-500" />
      </Link>
      <Link href="/paciente/atestados" className="flex-1 group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Meus Atestados</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Visualize seus documentos</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-amber-500" />
      </Link>
    </div>
  );
}

const STATUS_MAP: Record<string, string> = {
  'AGENDADA': 'Agendada',
  'REALIZADA': 'Realizada',
  'CANCELADA': 'Cancelada',
  'NAO_INICIADA': 'Não iniciada',
  'REAGENDADA': 'Reagendada',
};

const STATUS_COLORS: Record<string, string> = {
  'AGENDADA': 'text-blue-500 dark:text-blue-400',
  'REALIZADA': 'text-emerald-600 dark:text-emerald-400',
  'CANCELADA': 'text-rose-600 dark:text-rose-400',
  'NAO_INICIADA': 'text-slate-500 dark:text-slate-400',
  'REAGENDADA': 'text-amber-500 dark:text-amber-400',
};

function RecentAppointments({ appointments }: { appointments: Appointment[] }) {
  const recentList = [...appointments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-8 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
         <div className="bg-white dark:bg-slate-700 p-3 rounded-full shadow-sm mb-3">
           <Activity className="w-6 h-6 text-slate-400" />
         </div>
         <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Nenhum histórico</p>
         <p className="text-xs text-slate-500 mt-1 max-w-sm">Você ainda não possui consultas na plataforma.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
      <div className="space-y-0 flex flex-col h-full justify-between">
        {recentList.map((app) => (
          <div key={app.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
              {app.doctorProfile.profilePictureUrl ? (
                 <Image src={app.doctorProfile.profilePictureUrl} alt={app.doctorProfile.name} width={40} height={40} className="object-cover" />
              ) : (
                <Stethoscope className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{app.doctorProfile.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{app.doctorProfile.specialty}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {format(new Date(app.date), "dd 'de' MMM", { locale: ptBR })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                às {format(new Date(app.date), "HH:mm", { locale: ptBR })}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${STATUS_COLORS[app.status] || 'text-slate-400'}`}>
                {STATUS_MAP[app.status] || app.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardProactiveHero({ user, appointments }: { user: any, appointments: Appointment[] }) {
  const firstName = user?.patientProfile?.name?.split(' ')[0] || 'Paciente';

  const now = new Date();
  
  // Find the next scheduled appointment
  const upcoming = appointments
    .filter(app => app.status === 'AGENDADA' && differenceInMinutes(new Date(app.date), now) >= -15)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const diffMinutes = upcoming ? differenceInMinutes(new Date(upcoming.date), now) : null;
  const isRoomOpen = diffMinutes !== null && diffMinutes <= 15 && diffMinutes >= -15;

  let heroTitle = "Sua próxima consulta";
  let heroTag = "AGENDADA";
  let helperText = "";

  if (upcoming) {
    const appDate = new Date(upcoming.date);
    const openTime = new Date(appDate.getTime() - 15 * 60000);
    const closeTime = new Date(appDate.getTime() + 15 * 60000);

    const isToday = appDate.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = appDate.toDateString() === tomorrow.toDateString();

    if (isRoomOpen) {
      heroTitle = "É hora da sua consulta";
      heroTag = "AGORA";
      helperText = `A sala ficará aberta até as ${format(closeTime, 'HH:mm')}`;
    } else if (diffMinutes !== null && diffMinutes > 15 && diffMinutes <= 120) {
      heroTitle = "Sua consulta está chegando";
      heroTag = "EM BREVE";
      helperText = `A sala abrirá às ${format(openTime, 'HH:mm')}`;
    } else if (isToday) {
      heroTitle = "Você tem uma consulta hoje";
      heroTag = "HOJE";
      helperText = `A sala abrirá às ${format(openTime, 'HH:mm')}`;
    } else if (isTomorrow) {
      heroTitle = "Você tem uma consulta amanhã";
      heroTag = "AMANHÃ";
      helperText = `A sala abrirá às ${format(openTime, 'HH:mm')}`;
    } else {
      helperText = `A sala abrirá às ${format(openTime, 'HH:mm')} do dia ${format(appDate, 'dd/MM')}`;
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 dark:from-slate-800 dark:to-slate-950 p-8 sm:p-10 shadow-lg border border-teal-700/50 dark:border-slate-700/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)]" />
      
      <div className="relative z-10">
        {upcoming ? (
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border mb-4 ${
                isRoomOpen 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {heroTag}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                {heroTitle}
              </h1>
              <p className="text-teal-100/80 text-sm max-w-md">
                Prepare-se para o seu atendimento com {upcoming.doctorProfile.name}.
              </p>
            </div>
            
            <div className="w-full sm:w-auto bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden shrink-0">
                  {upcoming.doctorProfile.profilePictureUrl ? (
                     <Image src={upcoming.doctorProfile.profilePictureUrl} alt="Médico" width={48} height={48} className="object-cover" />
                  ) : (
                    <Stethoscope className="h-6 w-6 text-teal-700" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{upcoming.doctorProfile.name}</p>
                  <p className="text-teal-200 text-xs font-medium">{upcoming.doctorProfile.specialty}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs font-bold text-teal-100 bg-black/20 w-fit px-2 py-0.5 rounded">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(upcoming.date), "dd/MM 'às' HH:mm")}
                  </div>
                </div>
              </div>
              
              <button 
                disabled={!isRoomOpen}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  isRoomOpen 
                    ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20' 
                    : 'bg-white/10 text-teal-100/50 cursor-not-allowed border border-white/5'
                }`}
              >
                <Video className="w-4 h-4" />
                {isRoomOpen ? 'Acessar Sala Virtual' : 'Sala Fechada'}
              </button>
              {helperText && (
                <p className="text-center text-[10px] text-teal-200 mt-2">
                  {helperText}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Olá, {firstName}. <br />
              Como está se sentindo hoje?
            </h1>
            <p className="text-teal-100/80 text-sm max-w-lg mb-8">
              Cuidar da saúde é um ato diário. Que tal agendar seu próximo check-up ou buscar ajuda para o que está sentindo?
            </p>
            
            <Link 
              href="/medicos"
              className="inline-flex items-center gap-2 bg-white text-teal-900 hover:bg-teal-50 py-3 px-6 rounded-xl text-sm font-bold shadow-lg shadow-black/10 transition-colors"
            >
              <Search className="w-4 h-4" />
              Encontrar Especialista
              <ChevronRight className="w-4 h-4 text-teal-500" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['patient-appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments/patient');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto mt-6 px-4 pb-12 space-y-8">
        <div className="rounded-3xl bg-slate-200 dark:bg-slate-800 p-8 animate-pulse h-64" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse h-48" />
          <div className="rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 pb-12">
      <DashboardProactiveHero user={user} appointments={appointments} />

      <div className="grid md:grid-cols-2 gap-8 mt-10 items-stretch">
        <section className="flex flex-col h-full">
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4 shrink-0">Acesso Rápido</h2>
          <div className="flex-1 min-h-0">
            <QuickAccess />
          </div>
        </section>
        
        <section className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-lg font-black text-slate-800 dark:text-white">Consultas Recentes</h2>
            <Link href="/paciente/consultas" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">Ver todas</Link>
          </div>
          <div className="flex-1 min-h-0">
            <RecentAppointments appointments={appointments} />
          </div>
        </section>
      </div>
    </div>
  );
}