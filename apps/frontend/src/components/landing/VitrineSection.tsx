'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthProvider';
import { AuthContextModal } from '@/components/common/AuthContextModal';
import { DoctorPublicCard } from '@/components/common/DoctorPublicCard';
import Link from 'next/link';
import { Sparkles, ChevronRight, ChevronLeft, Star, Coins, ArrowRight } from 'lucide-react';

const POPULAR_SPECIALTIES = ['Todas', 'Cardiologia', 'Clínica Geral', 'Pediatria', 'Dermatologia', 'Ortopedia'];

export function VitrineSection() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ doctorId: number; date: Date } | null>(null);

  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');
  const [sortBy, setSortBy] = useState('Recomendados');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/users/doctors');
        // Add mock data for the UI
        const enhanced = response.data.map((doc: any) => ({
          ...doc,
          rating: (4.6 + (doc.id % 4) * 0.1).toFixed(1),
          reviews: 45 + (doc.id * 23) % 150,
          price: doc.consultationPrice || (160 + (doc.id * 70) % 200),
          tags: doc.id % 2 === 0 ? ['Teleconsulta', 'Presencial'] : ['Teleconsulta'],
        }));
        setAllDoctors(enhanced);
        setDoctors(enhanced);
      } catch (err) {
        console.error('Error fetching doctors', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    let filtered = [...allDoctors];
    if (selectedSpecialty !== 'Todas') {
      filtered = filtered.filter(d => d.specialty === selectedSpecialty);
    }

    if (sortBy === 'Maior avaliação') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'Menor preço') {
      filtered.sort((a, b) => a.price - b.price);
    }

    setDoctors(filtered);
  }, [selectedSpecialty, sortBy, allDoctors]);

  const handleSlotClick = (doctorId: number, date: Date) => {
    if (!isAuthenticated) {
      setPendingSlot({ doctorId, date });
      setIsAuthModalOpen(true);
    } else {
      router.push(`/paciente/consultas/nova?doctor=${doctorId}&date=${date.toISOString()}`);
    }
  };

  const onAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingSlot) {
      router.push(`/paciente/consultas/nova?doctor=${pendingSlot.doctorId}&date=${pendingSlot.date.toISOString()}`);
    } else if (user?.role === 'PATIENT') {
      router.push('/paciente/dashboard');
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -420, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 420, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <AuthContextModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={onAuthSuccess} 
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Header & Main Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/50 dark:bg-teal-900/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-teal-800 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/60 shadow-sm w-fit">
            <Sparkles className="w-4 h-4" />
            Nossos Especialistas
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
               <select 
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer appearance-none min-w-[160px]"
               >
                  {POPULAR_SPECIALTIES.map(spec => (
                    <option key={spec} value={spec}>{spec === 'Todas' ? 'Todas Especialidades' : spec}</option>
                  ))}
               </select>

               <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer appearance-none min-w-[160px]"
               >
                  <option>Recomendados</option>
                  <option>Maior avaliação</option>
                  <option>Menor preço</option>
               </select>
            </div>

            <Link 
              href="/medicos"
              className="group flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Ver catálogo completo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Carousel Area */}
        <div className="relative group/carousel mt-4">
           {/* Navigation Arrow (Left) */}
           <button 
             onClick={scrollLeft}
             className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-110 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 dark:hover:border-teal-600 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
             aria-label="Rolar para a esquerda"
           >
             <ChevronLeft className="w-6 h-6 mr-0.5" />
           </button>

           {/* Carousel Container */}
           <div 
             ref={scrollContainerRef}
             className="flex overflow-x-auto gap-6 snap-x snap-mandatory no-scrollbar pb-8 pt-4 px-1"
           >
             {loading ? (
                // Loading Skeletons
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[320px] md:min-w-[420px] h-[320px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl border border-slate-300 dark:border-slate-700 shrink-0 snap-center shadow-sm"></div>
                ))
             ) : doctors.length > 0 ? (
                doctors.map((doc) => (
                  <div key={doc.id} className="min-w-[320px] md:min-w-[420px] shrink-0 snap-center">
                    <DoctorPublicCard 
                      doctor={doc} 
                      onSlotClick={handleSlotClick} 
                    />
                  </div>
                ))
             ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                   <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">
                     Nenhum profissional encontrado com os filtros selecionados.
                   </p>
                   <button 
                     onClick={() => { setSelectedSpecialty('Todas'); setSortBy('Recomendados'); }}
                     className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                   >
                     Limpar Filtros
                   </button>
                </div>
             )}
           </div>

           {/* Navigation Arrow (Right) */}
           <button 
             onClick={scrollRight}
             className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-110 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 dark:hover:border-teal-600 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
             aria-label="Rolar para a direita"
           >
             <ChevronRight className="w-6 h-6 ml-0.5" />
           </button>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
