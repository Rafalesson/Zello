'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Testimonial = {
  name: string;
  role: string;
  message: string;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    name: 'Dra. Helena Sampaio',
    role: 'Cardiologista',
    message:
      'O Zello me permite atender pacientes à distância com a segurança e o acolhimento que ofereço no consultório.',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'Dr. Marcelo Nunes',
    role: 'Clínico Geral',
    message:
      'Centralizei todos os documentos e prontuários. Minha rotina ficou mais ágil e os pacientes, mais confiantes.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'Dra. Bruna Costa',
    role: 'Dermatologista',
    message:
      'Experiência intuitiva e próxima. Consigo manter o acompanhamento mesmo fora do consultório.',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'Ana Ribeiro',
    role: 'Paciente',
    message:
      'Resolvi meus atendimentos sem sair de casa. Recebi atestados e receitas em minutos pelo Zello.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'Carlos Mendes',
    role: 'Paciente',
    message:
      'As consultas são claras e seguras. Tudo chega no meu e-mail na hora e posso acompanhar cada passo.',
    avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=320&q=80',
  },
  {
    name: 'Luiza Teixeira',
    role: 'Paciente',
    message:
      'Fui atendida por vídeo com toda a atenção. A plataforma é simples e me passa muita confiança.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80',
  },
];

const AUTO_SCROLL_INTERVAL = 5000;

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const totalSlides = testimonials.length;

  useScrollReveal(sectionRef);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const items = container.querySelectorAll<HTMLElement>('[data-carousel-item]');
    const target = items[index];

    if (!target) {
      return;
    }

    container.scrollTo({
      left: target.offsetLeft,
      behavior,
    });
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    scrollToIndex(activeIndex);
  }, [activeIndex, isDesktop, scrollToIndex]);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isDesktop, totalSlides]);

  const handlePrev = () => {
    const previousIndex = (activeIndex - 1 + totalSlides) % totalSlides;
    setActiveIndex(previousIndex);
    if (!isDesktop) {
      scrollToIndex(previousIndex);
    }
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % totalSlides;
    setActiveIndex(nextIndex);
    if (!isDesktop) {
      scrollToIndex(nextIndex);
    }
  };

  return (
    <section ref={sectionRef} id="depoimentos" className="bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-teal-50 dark:bg-teal-900/30 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">
            Depoimentos
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:whitespace-nowrap">
            O que dizem nossos usuários
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-300">
            Médicos e pacientes compartilham como o Zello transformou sua experiência de saúde digital no dia a dia.
          </p>
        </div>

        <div className="relative mt-12">
          <div
            ref={containerRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 transition-all duration-300 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          >
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                data-carousel-item
                className="snap-start flex min-h-full w-[280px] flex-none flex-col gap-6 rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:ring-teal-500/20 sm:w-[320px] md:w-[340px] lg:w-[360px]"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={testimonial.avatar}
                    alt={`Foto de ${testimonial.name}`}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-500/20"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-teal-600 dark:text-teal-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">&ldquo;{testimonial.message}&rdquo;</p>
              </article>
            ))}
          </div>

          <div className="pointer-events-none absolute top-1/2 left-[-2.5rem] hidden -translate-y-1/2 items-center lg:flex">
            <button
              type="button"
              onClick={handlePrev}
              className="pointer-events-auto inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:ring-2 hover:ring-teal-500/20 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Depoimento anterior"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="pointer-events-none absolute top-1/2 right-[-2.5rem] hidden -translate-y-1/2 items-center lg:flex">
            <button
              type="button"
              onClick={handleNext}
              className="pointer-events-auto inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:ring-2 hover:ring-teal-500/20 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Próximo depoimento"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
