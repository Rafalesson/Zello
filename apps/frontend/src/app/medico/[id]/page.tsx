import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  MapPin, 
  Award, 
  Stethoscope, 
  User, 
  Star, 
  ShieldCheck, 
  Heart,
  ChevronRight,
  Shield,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Header } from '@/components/Header';
import { BookingWidget } from './booking-widget';
import Image from 'next/image';
import Link from 'next/link';

type Availability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
};

type DoctorProfile = {
  id: number;
  name: string;
  crm: string;
  specialty: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  address: {
    city: string;
    state: string;
    street: string;
    number: string;
    neighborhood: string;
  } | null;
  availabilities?: Availability[];
  consultationPrice?: number;
};

async function getDoctorProfile(id: string): Promise<DoctorProfile | null> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  try {
    const res = await fetch(`${backendUrl}/users/doctors/${id}/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctorProfile(id);
  
  const formatDoctorName = (name: string) => {
    if (name.startsWith('Dr.') || name.startsWith('Dra.') || name.startsWith('Dr(a).')) {
      return name;
    }
    return `Dr(a). ${name}`;
  };

  if (!doctor) {
    return { title: 'Médico não encontrado — Zello' };
  }
  return {
    title: `${formatDoctorName(doctor.name)} — Zello`,
    description: `Perfil profissional de ${doctor.name}. CRM: ${doctor.crm}${doctor.specialty ? ` | ${doctor.specialty}` : ''}`,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctorProfile(id);

  if (!doctor) {
    notFound();
  }

  const formatDoctorName = (name: string) => {
    if (name.startsWith('Dr.') || name.startsWith('Dra.') || name.startsWith('Dr(a).')) {
      return name;
    }
    return `Dr(a). ${name}`;
  };

  // Generate stable mock values matching the search list representation
  const rating = (4.6 + (doctor.id % 4) * 0.1).toFixed(1);
  const reviews = 45 + (doctor.id * 23) % 150;
  
  // Use the actual configured price or fallback to a default calculation
  const price = doctor.consultationPrice || (160 + (doctor.id * 70) % 200);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header />
      
      <main id="main-content" className="flex-grow pt-[72px]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Link href="/medicos" className="hover:text-teal-600 transition-colors">Encontrar Médicos</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 dark:text-slate-300">{formatDoctorName(doctor.name)}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Card */}
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800 transition-all">
                {/* Custom Gradient Cover */}
                <div className="relative h-48 bg-gradient-to-r from-teal-800 via-teal-700 to-teal-600 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(13,148,136,0.08),transparent_50%)]" />
                  <div className="absolute bottom-4 right-6 flex items-center gap-2 rounded-full bg-white/15 dark:bg-teal-500/10 px-3 py-1 text-xs font-bold text-white border border-white/20 dark:border-teal-500/20 backdrop-blur-md">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-200 dark:text-teal-400" />
                    <span>Cadastro Verificado</span>
                  </div>
                </div>

                <div className="relative px-6 pb-6">
                  {/* Photo overlap */}
                  <div className="relative -mt-16 mb-4 inline-block">
                    <div className="rounded-full border-4 border-white bg-slate-100 dark:border-slate-800 dark:bg-slate-700 shadow-md h-32 w-32 relative overflow-hidden">
                      {doctor.profilePictureUrl ? (
                        <Image
                          src={doctor.profilePictureUrl}
                          alt={doctor.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-16 w-16 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatDoctorName(doctor.name)}
                      </h1>
                      <p className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide mt-1">
                        {doctor.specialty || 'Clínico Geral'}
                      </p>
                    </div>
                    
                    {/* Rating badge */}
                    <div className="inline-flex items-center gap-1.5 self-start bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/35">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      <span className="text-sm font-black text-amber-800 dark:text-amber-400">{rating}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-500 font-bold">({reviews} avaliações)</span>
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6 dark:border-slate-700">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
                      <Award className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      CRM {doctor.crm}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
                      <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      {doctor.specialty || 'Medicina Geral'}
                    </span>
                    {doctor.address && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
                        <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        {doctor.address.city}, {doctor.address.state}
                      </span>
                    )}
                  </div>
                </div>
              </article>

              {/* Bio Section */}
              {doctor.bio && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
                    <Heart className="h-5 w-5 text-teal-600" />
                    Sobre o Profissional
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {doctor.bio}
                  </p>
                </section>
              )}

              {/* Address / Location Section */}
              {doctor.address && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-700">
                    Local de Atendimento
                  </h2>
                  <div className="mt-4 flex items-start gap-3.5">
                    <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 p-2.5 text-teal-600 dark:text-teal-400 flex-shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {doctor.address.street}, {doctor.address.number}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Bairro: {doctor.address.neighborhood}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {doctor.address.city} — {doctor.address.state}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Convenios / Planos de Saúde */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-700 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600" />
                  Convênios & Planos Atendidos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Este profissional oferece emissão de recibos e documentação completa para solicitar reembolso junto ao seu plano de saúde:
                </p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <FileText className="h-4 w-4 text-teal-600" />
                    <span>Recibo para Reembolso</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <Shield className="h-4 w-4 text-teal-600" />
                    <span>Particular / Reembolso</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <HelpCircle className="h-4 w-4 text-teal-600" />
                    <span>Nota Fiscal Eletrônica</span>
                  </div>
                </div>
              </section>

            </div>

            {/* Right Column - Booking Section */}
            <div className="lg:col-span-1">
              <BookingWidget 
                doctorId={doctor.id} 
                doctorName={doctor.name} 
                price={price} 
                availabilities={doctor.availabilities || []} 
              />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
