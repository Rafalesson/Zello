import { Star, ShieldCheck, Users } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="bg-slate-900 border-b border-slate-800/50 py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          <div className="flex items-center justify-center gap-4 py-4 md:py-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-900/20 text-amber-500">
              <Star className="h-6 w-6 fill-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">4.9/5</p>
              <p className="text-sm font-medium text-slate-400">Avaliação Média</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-4 md:py-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-900/20 text-teal-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">+500</p>
              <p className="text-sm font-medium text-slate-400">Especialistas de Ponta</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-4 md:py-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/20 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">100%</p>
              <p className="text-sm font-medium text-slate-400">Seguro e Privado (LGPD)</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
