'use client';

import { Header } from '@/components/Header';
import { Suspense, useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Calendar as CalendarIcon, 
  Video, 
  SlidersHorizontal,
  Coins,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthProvider';
import { AuthContextModal } from '@/components/common/AuthContextModal';
import { DoctorPublicCard } from '@/components/common/DoctorPublicCard';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80';

const POPULAR_SPECIALTIES = [
  { id: 'all', label: 'Todas as especialidades', value: '' },
  { id: 'cardio', label: 'Cardiologia', value: 'Cardiologia' },
  { id: 'clinico', label: 'Clínica Geral', value: 'Clínica Geral' },
  { id: 'pediatria', label: 'Pediatria', value: 'Pediatria' },
  { id: 'dermato', label: 'Dermatologia', value: 'Dermatologia' },
  { id: 'ortopedia', label: 'Ortopedia', value: 'Ortopedia' }
];

const AVAILABLE_LOCATIONS = [
  { label: 'Todas as cidades', city: '', state: '' },
  { label: 'São Paulo, SP', city: 'São Paulo', state: 'SP' },
  { label: 'Rio de Janeiro, RJ', city: 'Rio de Janeiro', state: 'RJ' },
  { label: 'Belo Horizonte, MG', city: 'Belo Horizonte', state: 'MG' },
];

function MedicosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const query = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ doctorId: number; date: Date } | null>(null);

  // Filter states
  const [selectedSpecialty, setSelectedSpecialty] = useState(query);
  const [selectedLocation, setSelectedLocation] = useState(location);
  const [onlyTelehealth, setOnlyTelehealth] = useState(false);
  const [onlyInPerson, setOnlyInPerson] = useState(false);

  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('Recomendados');

  // Sync inputs with URL if they change externally (e.g. going back/forward)
  useEffect(() => {
    setSelectedSpecialty(query);
    setSelectedLocation(location);
  }, [query, location]);

  useEffect(() => {
    let active = true;
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        let cityParam = selectedLocation;
        let stateParam = '';
        if (selectedLocation.includes(',')) {
          const parts = selectedLocation.split(',');
          cityParam = parts[0].trim();
          stateParam = parts[1].trim();
        }

        const params: any = {};
        if (selectedSpecialty) params.specialty = selectedSpecialty;
        if (cityParam) params.city = cityParam;
        if (stateParam) params.state = stateParam;

        const response = await api.get('/users/doctors', { params });
        if (active) {
          // Map backend results to include UI mock properties like rating/price
          const mapped = response.data.map((doc: any) => {
            const rating = (4.6 + (doc.id % 4) * 0.1).toFixed(1);
            const reviews = 45 + (doc.id * 23) % 150;
            // Generate stable mock prices and tags
            const price = doc.consultationPrice || (160 + (doc.id * 70) % 200);
            const tags = doc.id % 2 === 0 ? ['Teleconsulta', 'Presencial'] : ['Teleconsulta'];
            return {
              ...doc,
              rating: parseFloat(rating),
              reviews,
              price,
              tags,
            };
          });
          setDoctors(mapped);
        }
      } catch (err: any) {
        console.error('Error fetching doctors:', err);
        if (active) {
          setError('Erro ao buscar médicos. Por favor, tente novamente mais tarde.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDoctors();
    return () => {
      active = false;
    };
  }, [selectedSpecialty, selectedLocation]);

  // Handle URL updates when filtering changes
  const updateURL = (specialty: string, locationVal: string) => {
    const params = new URLSearchParams();
    if (specialty) params.set('q', specialty);
    if (locationVal) params.set('location', locationVal);
    router.push(`/medicos?${params.toString()}`);
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);
    updateURL(value, selectedLocation);
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    updateURL(selectedSpecialty, value);
  };

  // Client-side filtering logic
  const filteredDoctors = doctors.filter((doc) => {
    if (onlyTelehealth && !doc.tags.includes('Teleconsulta')) {
      return false;
    }
    if (onlyInPerson && !doc.tags.includes('Presencial')) {
      return false;
    }
    if (maxPrice && doc.price > maxPrice) {
      return false;
    }

    return true;
  });

  // Sort doctors dynamically
  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortBy === 'Maior avaliação') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Menor preço') {
      return a.price - b.price;
    }
    return 0; // Default: Recommended
  });

  const clearFilters = () => {
    setSelectedSpecialty('');
    setSelectedLocation('');
    setOnlyTelehealth(false);
    setOnlyInPerson(false);

    setMaxPrice(null);
    updateURL('', '');
  };

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

  return (
    <>
      <Header />
      <AuthContextModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={onAuthSuccess} 
      />
      
      <main className="flex-grow pt-[72px]">
        {/* Theme-dependent header banner (teal-gradient in light mode, slate-gradient in dark mode) */}
        <div className="relative bg-gradient-to-r from-teal-800 to-teal-600 dark:from-slate-800 dark:to-slate-900 py-12 text-white border-b border-slate-200 dark:border-slate-800/60 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(13,148,136,0.08),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 dark:bg-teal-500/10 px-3 py-1 text-xs font-semibold text-white dark:text-teal-400 mb-3 border border-white/20 dark:border-teal-500/20">
                <Sparkles className="h-3.5 w-3.5 text-teal-200 dark:text-teal-400" />
                <span>Agendamento Inteligente</span>
              </div>
              <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text">
                Encontre o Médico Ideal
              </h1>
              <p className="mt-2 text-sm text-teal-50 dark:text-slate-300 max-w-xl">
                Selecione especialidades e localizações no painel de filtros abaixo para encontrar horários disponíveis hoje mesmo.
              </p>
            </div>
          </div>
        </div>

        {/* Search Results and Filters Container */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700">
                  <span className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    Filtros de Busca
                  </span>
                  <button 
                    onClick={clearFilters} 
                    className="text-xs font-bold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  {/* Specialty Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Especialidade Médica
                    </label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <select
                        value={selectedSpecialty}
                        onChange={(e) => handleSpecialtyChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-teal-400 appearance-none transition-all cursor-pointer"
                      >
                        {POPULAR_SPECIALTIES.map((spec) => (
                          <option key={spec.id} value={spec.value}>
                            {spec.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Location Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Cidade e Região
                    </label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <select
                        value={selectedLocation}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-teal-400 appearance-none transition-all cursor-pointer"
                      >
                        {AVAILABLE_LOCATIONS.map((loc) => (
                          <option key={loc.label} value={loc.city ? `${loc.city}, ${loc.state}` : ''}>
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Consultation Type checkboxes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Modalidade de Atendimento
                    </label>
                    <div className="mt-3 space-y-2.5">
                      <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={onlyTelehealth}
                          onChange={(e) => setOnlyTelehealth(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                        />
                        <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Teleconsulta (Online)</span>
                      </label>
                      <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={onlyInPerson}
                          onChange={(e) => setOnlyInPerson(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                        />
                        <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Atendimento Presencial</span>
                      </label>
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Valor Limite (Consulta)
                    </label>
                    <div className="relative mt-2">
                      <Coins className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <select
                        value={maxPrice || ''}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-teal-400 appearance-none transition-all cursor-pointer"
                      >
                        <option value="">Qualquer valor</option>
                        <option value="200">Até R$ 200</option>
                        <option value="250">Até R$ 250</option>
                        <option value="300">Até R$ 300</option>
                        <option value="400">Até R$ 400</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Section */}
            <div className="flex-grow">
              {/* Header result actions */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {loading ? 'Buscando profissionais...' : `${sortedDoctors.length} especialistas encontrados`}
                </h2>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordenar por</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-all"
                  >
                    <option>Recomendados</option>
                    <option>Maior avaliação</option>
                    <option>Menor preço</option>
                  </select>
                </div>
              </div>

              {/* Doctors Content List */}
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-700">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
                        </div>
                      </div>
                      <div className="mt-6 h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
                      <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700 flex justify-between">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
                      </div>
                      <div className="mt-6 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-200 dark:bg-red-950/10 dark:ring-red-900/30">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">{error}</p>
                  <button 
                    onClick={() => router.refresh()} 
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : sortedDoctors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800/40">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nenhum médico encontrado</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Experimente alterar ou limpar os filtros na barra lateral para encontrar outros profissionais disponíveis.
                  </p>
                  <button 
                    onClick={clearFilters}
                    className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-teal-500 hover:shadow-teal-500/20 transition-all"
                  >
                    Ver todos os médicos
                  </button>
                </div>

              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {sortedDoctors.map((doc) => (
                    <DoctorPublicCard 
                      key={doc.id} 
                      doctor={doc} 
                      onSlotClick={handleSlotClick} 
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

export default function MedicosPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      }>
        <MedicosContent />
      </Suspense>
    </div>
  );
}
