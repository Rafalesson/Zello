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
import { differenceInMinutes } from 'date-fns';
import { formatTime, formatDayMonth, formatDayMonthTime } from '@/utils/date';

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
  const items = [
    {
      name: 'Minhas Consultas',
      desc: 'Gerencie seus agendamentos',
      href: '/paciente/consultas',
      icon: CalendarDays,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      hoverBorder: 'hover:border-blue-500/40 dark:hover:border-blue-500/30',
      hoverGlow: 'hover:shadow-blue-500/5',
    },
    {
      name: 'Agendar Consulta',
      desc: 'Encontre especialistas',
      href: '/medicos',
      icon: Search,
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-50 dark:bg-teal-900/20',
      hoverBorder: 'hover:border-teal-500/40 dark:hover:border-teal-500/30',
      hoverGlow: 'hover:shadow-teal-500/5',
    },
    {
      name: 'Minhas Receitas',
      desc: 'Prescrições médicas',
      href: '/paciente/receitas',
      icon: FileText,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      hoverBorder: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/30',
      hoverGlow: 'hover:shadow-emerald-500/5',
    },
    {
      name: 'Meus Atestados',
      desc: 'Visualize seus laudos',
      href: '/paciente/atestados',
      icon: Activity,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      hoverBorder: 'hover:border-amber-500/40 dark:hover:border-amber-500/30',
      hoverGlow: 'hover:shadow-amber-500/5',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      {items.map((item) => (
        <Link 
          key={item.name} 
          href={item.href} 
          className={`group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 ${item.hoverBorder} ${item.hoverGlow} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 relative overflow-hidden`}
        >
          <div className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center transition-transform group-hover:scale-105 duration-300`}>
            <item.icon className="w-5 h-5" />
          </div>
          
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight flex items-center gap-1">
              {item.name}
              <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
          </div>
        </Link>
      ))}
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

const STATUS_BADGE_STYLE: Record<string, string> = {
  'AGENDADA': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  'REALIZADA': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  'CANCELADA': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  'NAO_INICIADA': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  'REAGENDADA': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
};

function RecentAppointments({ appointments }: { appointments: Appointment[] }) {
  const now = Date.now();
  const fifteenMinsInMs = 15 * 60 * 1000;

  const processedAppointments = appointments.map(app => {
    const timeDiff = new Date(app.date).getTime() - now;
    let effectiveStatus = app.status;
    if ((effectiveStatus === 'AGENDADA' || effectiveStatus === 'REAGENDADA') && timeDiff < -fifteenMinsInMs) {
      effectiveStatus = 'NAO_INICIADA';
    }
    return { ...app, status: effectiveStatus };
  });

  const recentList = processedAppointments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-8 text-center flex flex-col items-center justify-center h-full min-h-[220px]">
         <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm mb-3 border border-slate-100 dark:border-slate-700">
           <Activity className="w-5 h-5 text-slate-400" />
         </div>
         <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Nenhum histórico</p>
         <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">Você ainda não possui consultas registradas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm h-full flex flex-col justify-center">
      <div className="flex flex-col gap-3">
        {recentList.map((app) => (
          <div 
            key={app.id} 
            className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all duration-200 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/50 dark:border-slate-600/50">
              {app.doctorProfile.profilePictureUrl ? (
                 <Image src={app.doctorProfile.profilePictureUrl} alt={app.doctorProfile.name} width={40} height={40} className="object-cover" />
              ) : (
                <Stethoscope className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{app.doctorProfile.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{app.doctorProfile.specialty}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formatDayMonth(app.date)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                às {formatTime(app.date)}
              </p>
              <div className="mt-1 flex justify-end">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE_STYLE[app.status] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_MAP[app.status] || app.status}
                </span>
              </div>
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
    .sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime())[0];

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
      helperText = `A sala ficará aberta até as ${formatTime(closeTime)}`;
    } else if (diffMinutes !== null && diffMinutes > 15 && diffMinutes <= 120) {
      heroTitle = "Sua consulta está chegando";
      heroTag = "EM BREVE";
      helperText = `A sala abrirá às ${formatTime(openTime)}`;
    } else if (isToday) {
      heroTitle = "Você tem uma consulta hoje";
      heroTag = "HOJE";
      helperText = `A sala abrirá às ${formatTime(openTime)}`;
    } else if (isTomorrow) {
      heroTitle = "Você tem uma consulta amanhã";
      heroTag = "AMANHÃ";
      helperText = `A sala abrirá às ${formatTime(openTime)}`;
    } else {
      helperText = `A sala abrirá às ${formatTime(openTime)} do dia ${formatDayMonth(appDate)}`;
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 dark:from-slate-800 dark:to-slate-950 p-8 sm:p-10 shadow-lg border border-teal-700/50 dark:border-slate-700/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)]" />
      
      <div className="relative z-10">
        {upcoming ? (
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
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
            
            <div className="w-full md:w-auto bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0">
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
                    {formatDayMonthTime(upcoming.date)}
                  </div>
                </div>
              </div>
              
              {isRoomOpen ? (
                <Link 
                  href={`/paciente/consulta/${upcoming.id}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20 text-center"
                >
                  <Video className="w-4 h-4" />
                  Acessar Sala Virtual
                </Link>
              ) : (
                <button 
                  disabled
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors bg-white/10 text-teal-100/50 cursor-not-allowed border border-white/5"
                >
                  <Video className="w-4 h-4" />
                  Sala Fechada
                </button>
              )}
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