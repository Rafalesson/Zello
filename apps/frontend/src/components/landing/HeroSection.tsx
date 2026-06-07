'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Video, Building2 } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();
  const [type, setType] = useState<'teleconsulta' | 'local'>('teleconsulta');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (query) params.append('q', query);
    if (location && type === 'local') params.append('location', location);
    
    router.push(`/medicos?${params.toString()}`);
  };

  return (
    <section id="inicio" className="relative flex min-h-[100dvh] w-full items-center overflow-hidden bg-slate-900 text-white">
      <div className="absolute inset-0">
        <video
          src="/assets/home_zello_video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="flex flex-col gap-12 text-center md:text-left">
          <div className="space-y-6 max-w-3xl mx-auto md:mx-0">
            <span className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide text-teal-200 backdrop-blur">
              Saúde sem Fronteiras
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Agende agora sua consulta
            </h1>
            <p className="text-lg leading-8 text-slate-100/90 sm:text-xl">
              Mais de 950 especialistas de saúde estão prontos para te atender. Agende sua consulta online com segurança e praticidade.
            </p>
          </div>

          {/* Search Box */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-2xl dark:shadow-none dark:ring-1 dark:ring-slate-700 sm:p-6 transition-colors duration-200 mx-auto w-full md:mx-0 text-left">
            {/* Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setType('local')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  type === 'local' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-800' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <Building2 className="h-4 w-4" />
                No local
              </button>
              <button
                type="button"
                onClick={() => setType('teleconsulta')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  type === 'teleconsulta' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-800' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <Video className="h-4 w-4" />
                Teleconsulta
              </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Especialidade, doença ou nome do médico"
                  className="block w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 dark:bg-slate-900 dark:text-white dark:ring-slate-700 dark:focus:ring-teal-500 sm:text-base sm:leading-6 transition-all outline-none"
                />
              </div>

              {type === 'local' && (
                <div className="relative md:w-64">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Cidade ou região"
                    className="block w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 dark:bg-slate-900 dark:text-white dark:ring-slate-700 dark:focus:ring-teal-500 sm:text-base sm:leading-6 transition-all outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-teal-500 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 md:w-auto"
              >
                <Search className="h-4 w-4" />
                Pesquisar
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
