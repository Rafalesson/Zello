// Endereço: apps/frontend/src/components/PublicLayout.tsx
'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Link href="/">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
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