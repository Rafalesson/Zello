// Endereço: apps/frontend/src/app/medico/(dashboard)/layout.tsx
'use client';

import { useState, Fragment, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Dialog, Transition } from '@headlessui/react';
import { Menu, Clock, XCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'DOCTOR') {
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (user.role === 'PATIENT') {
          router.push('/paciente/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600 border-t-teal-600 dark:border-t-teal-400" />
      </div>
    );
  }

  if (!user || user.role !== 'DOCTOR') {
    return null;
  }

  // Block unapproved doctors
  const doctorStatus = user.doctorProfile?.status || 'PENDING';
  if (doctorStatus !== 'APPROVED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-900 transition-colors relative pt-20">
        {/* Simple Header Menu */}
        <header className="absolute top-0 inset-x-0 flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-6 md:px-10 transition-colors">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 select-none">Zello</span>
          <ThemeToggle />
        </header>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-750 dark:bg-slate-800 text-center my-8">
          {doctorStatus === 'PENDING' ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-450 mb-6">
                <Clock className="h-8 w-8 animate-pulse" />
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Cadastro em Análise</h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Olá, <span className="font-bold text-slate-700 dark:text-slate-200">{user.doctorProfile?.name}</span>! Sua conta está em fase de avaliação pelo administrador da plataforma.
              </p>
              <p className="mt-2.5 text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
                Estamos verificando suas credenciais e CRM. Em breve seu acesso ao painel de telemedicina será liberado.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 mb-6">
                <XCircle className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Cadastro Recusado</h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Olá, <span className="font-bold text-slate-700 dark:text-slate-200">{user.doctorProfile?.name}</span>. Infelizmente sua solicitação de cadastro não pôde ser aprovada.
              </p>
              <p className="mt-2.5 text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
                Por favor, entre em contato com o suporte da Zello para mais detalhes sobre a recusa do seu CRM.
              </p>
            </>
          )}

          <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
            <button
              onClick={() => signOut()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-transparent py-2.5 px-4 text-sm font-bold text-red-600 transition-all hover:bg-red-600 hover:text-white dark:border-red-900/30 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gray-100 dark:bg-slate-900">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as={Fragment} onClose={setSidebarOpen}>
          <div className="relative z-40 lg:hidden">
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Sidebar closeSidebar={() => setSidebarOpen(false)} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 shadow-sm sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-slate-300"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="text-lg font-bold text-teal-600">Zello</div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
