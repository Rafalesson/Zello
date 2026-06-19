import { CalendarCheck, Video, FileText } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="bg-white dark:bg-[#0f172a] py-24 sm:py-32 border-t border-slate-100 dark:border-slate-800/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-teal-600 dark:text-teal-400 uppercase tracking-widest">Por que escolher a Zello?</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Sua saúde em primeiro lugar, sem complicações.
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Reimaginamos a experiência médica para que você tenha acesso rápido, seguro e eficiente aos melhores tratamentos do país.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-teal-200 dark:ring-teal-800/50">
                <CalendarCheck className="h-8 w-8" />
              </div>
              <dt className="text-xl font-bold leading-7 text-slate-900 dark:text-white">
                Agendamento Imediato
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Esqueça as ligações e filas de espera. Encontre o horário ideal e confirme sua consulta em menos de 1 minuto, 100% online.</p>
              </dd>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-teal-200 dark:ring-teal-800/50">
                <Video className="h-8 w-8" />
              </div>
              <dt className="text-xl font-bold leading-7 text-slate-900 dark:text-white">
                Telemedicina de Alta Qualidade
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Consultas por vídeo com tecnologia de ponta, conexão estável e ambiente virtual seguro para você conversar com seu médico com total privacidade.</p>
              </dd>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-teal-200 dark:ring-teal-800/50">
                <FileText className="h-8 w-8" />
              </div>
              <dt className="text-xl font-bold leading-7 text-slate-900 dark:text-white">
                Receitas e Atestados Digitais
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                <p className="flex-auto">Receba todos os seus documentos médicos com assinatura digital oficial logo após a consulta, aceitos em qualquer farmácia do Brasil.</p>
              </dd>
            </div>

          </dl>
        </div>
      </div>
    </section>
  );
}
