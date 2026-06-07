// apps/frontend/src/app/layout.tsx (DEPOIS)

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthProvider';
import { Providers } from '@/components/providers';
import { ScrollToTop } from '@/components/common/ScrollToTop';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zello — Telemedicina',
  description: 'Plataforma de telemedicina que conecta médicos e pacientes com segurança, empatia e eficiência.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="min-h-[100dvh] bg-gray-50 dark:bg-slate-900 transition-colors">
      <body className={`${inter.className} min-h-[100dvh] text-slate-900 dark:text-slate-100 transition-colors`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none"
        >
          Pular para o conteúdo principal
        </a>
        <Providers>
          <AuthProvider>
            {children}
            <ScrollToTop />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}