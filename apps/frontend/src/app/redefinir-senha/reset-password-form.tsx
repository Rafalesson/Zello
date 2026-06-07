// Endereço: apps/frontend/src/app/redefinir-senha/reset-password-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import axios, { AxiosError } from 'axios';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [token, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!token) {
      setError('Token de redefinição inválido ou ausente.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/password/reset', {
        token,
        password,
        passwordConfirmation,
      });
      setSuccess(response.data.message);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string | string[] }>;
        const errorMessage = axiosError.response?.data?.message || 'Ocorreu um erro. Tente novamente.';
        setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      } else {
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Token invalid state
  if (!token) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Link href="/">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 mb-6">
              <ShieldAlert className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Token Inválido</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed" aria-live="polite">
              O link de redefinição de senha é inválido ou expirou. Você será redirecionado em breve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Link href="/">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Senha Redefinida!</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed" aria-live="polite">{success}</p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-teal-700 transition-colors"
            >
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Link href="/">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crie sua nova senha</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">Escolha uma senha forte e segura.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nova Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              <div>
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3" aria-live="polite">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-teal-600 py-3 text-white font-semibold shadow-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300 dark:disabled:bg-teal-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                {isLoading ? 'Salvando...' : 'Redefinir Senha'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}