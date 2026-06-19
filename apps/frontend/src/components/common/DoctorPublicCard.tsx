import Image from 'next/image';
import Link from 'next/link';
import { Star, Video, Calendar as CalendarIcon } from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80';

export interface AvailabilityRule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface Doctor {
  id: number;
  name: string;
  crm?: string;
  specialty?: string;
  profilePictureUrl?: string;
  rating: number;
  reviews: number;
  price: number;
  tags: string[];
  availabilities: AvailabilityRule[];
}

interface DoctorPublicCardProps {
  doctor: Doctor;
  onSlotClick?: (doctorId: number, slotDate: Date) => void;
}

function calculateNextSlots(availabilities: AvailabilityRule[], count: number = 3): Date[] {
  if (!availabilities || availabilities.length === 0) return [];
  
  const now = new Date();
  const slots: Date[] = [];
  const currentDay = now.getDay();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeString = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

  // We look ahead up to 14 days to find slots
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + dayOffset);
    const targetDayOfWeek = targetDate.getDay();

    const rulesForDay = availabilities.filter(a => a.isActive && a.dayOfWeek === targetDayOfWeek);
    
    for (const rule of rulesForDay) {
      const [startH, startM] = rule.startTime.split(':').map(Number);
      const [endH, endM] = rule.endTime.split(':').map(Number);
      
      let currentMinutesStart = startH * 60 + startM;
      const endMinutesTotal = endH * 60 + endM;

      while (currentMinutesStart + rule.slotDurationMinutes <= endMinutesTotal) {
        const slotH = Math.floor(currentMinutesStart / 60);
        const slotM = currentMinutesStart % 60;
        const slotTimeString = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;

        if (dayOffset === 0 && slotTimeString <= currentTimeString) {
          // Slot is in the past for today
        } else {
          const slotDate = new Date(targetDate);
          slotDate.setHours(slotH, slotM, 0, 0);
          slots.push(slotDate);
        }

        currentMinutesStart += rule.slotDurationMinutes;
      }
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
}

function formatSlotDate(date: Date): { label: string; time: string } {
  const today = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = target.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  if (diffDays === 0) return { label: 'Hoje', time: timeStr };
  if (diffDays === 1) return { label: 'Amanhã', time: timeStr };
  
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayStr = String(date.getDate()).padStart(2, '0');
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  return { label: `${weekdays[date.getDay()]}, ${dayStr}/${monthStr}`, time: timeStr };
}

export function DoctorPublicCard({ doctor, onSlotClick }: DoctorPublicCardProps) {
  const nextSlots = calculateNextSlots(doctor.availabilities, 3);

  const handleSlotClick = (e: React.MouseEvent, slot: Date) => {
    e.preventDefault(); // Prevent navigating to /medico/[id]
    if (onSlotClick) {
      onSlotClick(doctor.id, slot);
    }
  };

  return (
    <Link href={`/medico/${doctor.id}`} className="group relative flex flex-col rounded-2xl bg-white p-5 border border-slate-200 shadow-sm dark:bg-slate-800/80 dark:border-slate-700/60 dark:shadow-none hover:border-teal-500/40 dark:hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex gap-4">
        <div className="relative h-[72px] w-[72px] flex-shrink-0">
          <Image
            src={doctor.profilePictureUrl || DEFAULT_AVATAR}
            alt={doctor.name}
            fill
            className="rounded-2xl object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
            sizes="72px"
          />
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
        </div>
        
        <div className="flex-grow pt-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-tight">
            {doctor.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 line-clamp-1">
            <span className="text-teal-600 dark:text-teal-400">{doctor.specialty || 'Clínico Geral'}</span>
            <span className="opacity-50">•</span>
            <span>{doctor.crm || 'CRM N/A'}</span>
          </div>
          
          <div className="mt-2.5 flex items-center gap-2">
            <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-800/30">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{doctor.rating}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {doctor.reviews} avaliações
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {doctor.tags?.map((tag: string) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-700/60">
            {tag === 'Teleconsulta' && <Video className="h-3 w-3 text-teal-600 dark:text-teal-500" />}
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex-grow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Próximos Horários
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            R$ {(Number(doctor.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {nextSlots.length > 0 ? (
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory hide-scrollbar gap-2">
            {nextSlots.map((slot, index) => {
              const formatted = formatSlotDate(slot);
              return (
                <button
                  key={index}
                  onClick={(e) => handleSlotClick(e, slot)}
                  className="snap-start flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 rounded-xl py-2 px-3 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-500 transition-colors group/slot"
                >
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 group-hover/slot:text-white mb-0.5">
                    {formatted.label}
                  </span>
                  <span className="text-sm font-black text-teal-800 dark:text-teal-300 group-hover/slot:text-white">
                    {formatted.time}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            Sem horários disponíveis em breve
          </div>
        )}
      </div>
      
      <div className="mt-2 w-full bg-slate-50 dark:bg-slate-700/30 group-hover:bg-teal-600 dark:group-hover:bg-teal-600 text-slate-600 dark:text-slate-300 group-hover:text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all duration-300 border border-slate-200 dark:border-slate-700 group-hover:border-transparent">
        Ver perfil completo
      </div>
    </Link>
  );
}
