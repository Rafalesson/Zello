// Endereço: apps/frontend/src/components/PublicLayout.tsx
'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

import { Stethoscope } from 'lucide-react';

export function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Zello</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-col flex-grow">
        <div className="flex-grow flex items-center justify-center p-4">
          {children}
        </div>
      </main>
    </div>
  );
}