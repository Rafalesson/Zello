'use client';

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthProvider";

export default function PrivacidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();

  const getLogoHref = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'PATIENT') return '/paciente/dashboard';
    if (user.role === 'DOCTOR') return '/medico/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Link href={getLogoHref()}>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex-grow">
        {children}
      </div>
      {/* Academic Disclaimer — News Ticker Bar */}
      <div
        className="w-full overflow-hidden border-t border-slate-200/60 dark:border-white/5 bg-slate-50 dark:bg-slate-900/80 py-2"
        aria-label="Aviso acadêmico"
        role="marquee"
      >
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="ticker-content text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500"
              aria-hidden={i === 1}
            >
              Este é um projeto acadêmico desenvolvido para fins de portfólio — nenhum dado médico real é processado.
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              Este é um projeto acadêmico desenvolvido para fins de portfólio — nenhum dado médico real é processado.
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
