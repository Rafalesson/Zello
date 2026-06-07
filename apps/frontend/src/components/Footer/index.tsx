'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer id="contato" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white">Zello</span>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-200">
              Plataforma de telemedicina que aproxima médicos e pacientes com segurança, empatia e eficiência.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-teal-500/40 dark:border-teal-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">
              <span className="h-2 w-2 rounded-lg bg-teal-500 dark:bg-teal-400" aria-hidden="true" />
              Compliance LGPD
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">Termos e Políticas</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-200">
              <li>
                <Link href="/privacidade" className="transition-colors duration-200 hover:text-teal-600 dark:hover:text-teal-300">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200">Contato</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-200">
              <li>
                <a href="mailto:contato@zello.com" className="transition-colors duration-200 hover:text-teal-600 dark:hover:text-teal-300">
                  contato@zello.com
                </a>
              </li>
              <li>
                <a href="tel:+551134281939" className="transition-colors duration-200 hover:text-teal-600 dark:hover:text-teal-300">
                  (11) 3428-1939
                </a>
              </li>
            </ul>
          </div>
        </div>
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
    </footer>
  );
}
