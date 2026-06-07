// Endereço: apps/frontend/src/app/recuperar-senha/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { api } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/password/forgot', { email });
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      setMessage({ type: 'error', text: 'Ocorreu um erro ao enviar a solicitação. Tente novamente mais tarde.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Mini header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Link href="/">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {message?.type === 'success' ? (
            /* Success state */
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 mb-6">
                <Mail className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verifique seu e-mail</h1>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed" aria-live="polite">
                {message.text}
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          ) : (
            /* Form state */
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>

              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperar sua senha</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Sem problemas! Digite seu e-mail abaixo e enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {message?.type === 'error' && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3" aria-live="polite">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{message.text}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-white font-semibold shadow-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300 dark:disabled:bg-teal-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                >
                  {isLoading ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}