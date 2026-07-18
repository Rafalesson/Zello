'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  AlertTriangle,
  Check,
  FileText,
  Loader2,
  Shield,
} from 'lucide-react';

interface ConsentFormProps {
  appointmentId: number;
  onComplete: () => void;
  onBack?: () => void;
}

export function ConsentForm({
  appointmentId,
  onComplete,
  onBack,
}: ConsentFormProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for dynamic terms fetching
  const [terms, setTerms] = useState<{ version: string; content: string } | null>(null);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchActiveTerms = async () => {
    setIsLoadingTerms(true);
    setFetchError(null);
    try {
      const response = await api.get('/consent/active-terms');
      setTerms(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setFetchError(
          'Sua sessão expirou ou você não está autenticado. Por favor, faça login novamente para assinar os termos.',
        );
      } else {
        setFetchError(
          'Não foi possível carregar os termos de consentimento mais recentes. Verifique sua conexão e tente novamente.',
        );
      }
    } finally {
      setIsLoadingTerms(false);
    }
  };

  useEffect(() => {
    fetchActiveTerms();
  }, []);

  const handleSubmit = async () => {
    if (!accepted || !terms) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/appointments/${appointmentId}/consent`, {
        accepted: true,
        termsVersion: terms.version,
      });
      onComplete();
    } catch (err: any) {
      if (err.response?.status === 409) {
        onComplete();
        return;
      }
      const message =
        err.response?.data?.message ||
        'Erro ao registrar o consentimento. Tente novamente.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isCheckbox = target?.id === 'consent-checkbox';
    const isButton = target?.tagName === 'BUTTON';
    if (e.key === 'Enter' && accepted && !isSubmitting && !isCheckbox && !isButton) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Termo de Consentimento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Telemedicina &amp; Política de Privacidade (LGPD)
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingTerms && (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Carregando os termos de consentimento mais recentes...
            </p>
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-800 dark:text-white">
                Falha ao carregar termos legais
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                {fetchError}
              </p>
            </div>
            <Button
              onClick={fetchActiveTerms}
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Loaded State */}
        {terms && (
          <>
            {/* Terms Content */}
            <div className="p-6">
              <div
                className="max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg"
                tabIndex={0}
                aria-label="Conteúdo dos Termos de Consentimento e Privacidade"
              >
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {terms.content}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Versão ativa dos termos: {terms.version}
                </span>
              </div>
            </div>

            {/* Acceptance Checkbox */}
            <div className="mx-6 mb-4">
              <label
                htmlFor="consent-checkbox"
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all outline-none ${
                  accepted
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all peer-focus:ring-2 peer-focus:ring-teal-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-slate-800 ${
                      accepted
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {accepted && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Li, compreendi e aceito os Termos de Consentimento Digital e a
                  Política de Privacidade/LGPD para esta consulta.
                </span>
              </label>
            </div>

            {/* Error feedback */}
            {error && (
              <div className="mx-6 mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-700 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="px-6 pb-6 flex items-center justify-between">
              {onBack && (
                <Button
                  id="consent-back"
                  variant="secondary"
                  onClick={onBack}
                >
                  Voltar
                </Button>
              )}
              <div className={onBack ? '' : 'ml-auto'}>
                <Button
                  id="consent-submit"
                  onClick={handleSubmit}
                  disabled={!accepted || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Confirmar e Prosseguir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

