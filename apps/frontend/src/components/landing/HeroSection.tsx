'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    const params = new URLSearchParams();
    params.append('q', query);
    router.push(`/medicos?${params.toString()}`);
  };

  return (
    <section id="inicio" className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-900 text-white">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          src="/assets/home_zello_video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover scale-105"
        />
        {/* Advanced Gradient Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-900" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-24 sm:py-32 lg:px-8">
        <div className="flex flex-col items-center text-center gap-10 sm:gap-12">
          
          <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
            <span className="inline-flex items-center justify-center rounded-full bg-teal-500/10 border border-teal-400/20 px-4 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-teal-300 backdrop-blur-md shadow-[0_0_30px_rgba(20,184,166,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-700">
              Saúde sem fronteiras
            </span>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl drop-shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
              Saúde de ponta.<br className="hidden sm:block" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400">
                Onde você estiver.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl leading-relaxed text-slate-200 font-medium max-w-2xl mx-auto drop-shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              Conecte-se instantaneamente com os melhores especialistas do país e realize sua consulta online com máxima segurança.
            </p>
          </div>

          {/* Floating Search Box */}
          <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
            <form 
              onSubmit={handleSearch} 
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 p-2 sm:p-3 rounded-3xl sm:rounded-[2rem] shadow-2xl"
            >
              <div className="relative flex-1 w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 sm:pl-6">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white/60" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Qual especialidade você busca?"
                  className="block w-full rounded-[1.5rem] sm:rounded-3xl border-0 py-4 sm:py-5 pl-12 sm:pl-16 pr-4 sm:pr-6 text-white bg-transparent placeholder:text-white/60 focus:ring-0 text-base sm:text-lg font-medium outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-teal-500 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:scale-[1.02]"
              >
                Buscar Médico
              </button>
            </form>
            
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-white/70">
              <span className="uppercase tracking-widest text-[10px] sm:text-xs mr-1 sm:mr-2 opacity-70 w-full sm:w-auto mb-2 sm:mb-0">Mais buscados:</span>
              {['Clínico Geral', 'Psicologia', 'Nutrição', 'Dermatologia'].map(tag => (
                <button 
                  key={tag} 
                  type="button" 
                  onClick={() => { setQuery(tag); }} 
                  className="hover:text-white hover:bg-white/15 px-3 sm:px-4 py-1.5 rounded-full border border-white/10 transition-all backdrop-blur-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
