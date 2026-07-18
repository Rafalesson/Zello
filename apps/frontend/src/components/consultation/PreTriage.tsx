'use client';

import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Loader2,
  Phone,
} from 'lucide-react';

interface PreTriageProps {
  appointmentId: number;
  onComplete: () => void;
  onBack?: () => void;
}

const DURATION_OPTIONS = [
  { value: 'HOJE', label: 'Hoje' },
  { value: 'ONTEM', label: 'Ontem' },
  { value: 'ESTA_SEMANA', label: 'Esta semana' },
  { value: 'MAIS_DE_UMA_SEMANA', label: 'Mais de uma semana' },
] as const;

const INTENSITY_LABELS = [
  'Quase imperceptível',
  'Muito leve',
  'Leve',
  'Suportável',
  'Moderada',
  'Incômoda',
  'Forte',
  'Muito forte',
  'Intensa',
  'Insuportável'
] as const;

export function PreTriage({ appointmentId, onComplete, onBack }: PreTriageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(0);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return symptoms.trim().length > 0;
      case 2:
        return duration !== '';
      case 3:
        return intensity >= 1 && intensity <= 10;
      default:
        return false;
    }
  }, [currentStep, symptoms, duration, intensity]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canGoNext()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/appointments/${appointmentId}/pre-triage`, {
        symptoms: symptoms.trim(),
        duration,
        intensity,
      });
      onComplete();
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Erro ao enviar o questionário. Tente novamente.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    if (e.key === 'Enter' && canGoNext()) {
      e.preventDefault();
      if (currentStep < totalSteps) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto"
      onKeyDown={handleKeyDown}
    >
      {/* Emergency Warning Banner */}
      <div
        id="pre-triage-emergency-banner"
        className="mb-6 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-5 flex items-start gap-4"
        role="alert"
      >
        <div className="shrink-0 w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-1">
            Atenção — Situação de Emergência
          </p>
          <p className="text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
            Se você estiver apresentando sintomas graves como falta de ar ou dor
            no peito, por favor, procure atendimento de emergência presencial
            imediatamente ou ligue para o{' '}
            <a
              href="tel:192"
              className="inline-flex items-center gap-1 font-bold underline decoration-2 underline-offset-2 hover:text-rose-900 dark:hover:text-rose-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              192
            </a>
            .
          </p>
        </div>
      </div>

      {/* Card Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Header with progress */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Pré-Triagem
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Passo {currentStep} de {totalSteps}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < currentStep
                    ? 'bg-teal-500'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 min-h-[260px] flex flex-col">
          {/* Step 1: Symptoms */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <label
                htmlFor="pre-triage-symptoms"
                className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2"
              >
                Descreva seus sintomas e queixas principais
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Seja o mais detalhado possível para que o médico tenha contexto
                clínico antes da consulta.
              </p>
              <textarea
                id="pre-triage-symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Ex: Dor de cabeça persistente há 3 dias, acompanhada de náusea leve..."
                className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 resize-none outline-none transition-all focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                autoFocus
              />
              <div className="mt-2 flex justify-end">
                <span
                  className={`text-xs font-medium ${
                    symptoms.length >= 480
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {symptoms.length}/500
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Duration */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                Há quanto tempo você apresenta esses sintomas?
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Selecione a opção que melhor descreve a duração.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    id={`pre-triage-duration-${option.value}`}
                    onClick={() => setDuration(option.value)}
                    className={`px-5 py-4 rounded-xl text-sm font-bold transition-all border-2 text-left outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                      duration === option.value
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          duration === option.value
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {duration === option.value && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Intensity */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                Qual a intensidade da dor ou desconforto?
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Selecione o nível que melhor descreve o que você sente agora.
              </p>
              <div className="grid grid-cols-5 gap-2.5 max-w-md mx-auto mb-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <button
                    key={level}
                    type="button"
                    id={`pre-triage-intensity-${level}`}
                    onClick={() => setIntensity(level)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-black transition-all border-2 outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                      intensity === level
                        ? level <= 3
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md scale-105'
                          : level <= 6
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-md scale-105'
                          : 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 shadow-md scale-105'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between px-1 sm:px-2">
                <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Muito leve
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-rose-600 dark:text-rose-400">
                  Muito forte
                </span>
              </div>
              {intensity > 0 && (
                <div className="mt-4 text-center">
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                      intensity <= 3
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : intensity <= 6
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}
                  >
                    {INTENSITY_LABELS[intensity - 1]}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error feedback */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-700 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <Button
            id="pre-triage-back"
            variant="secondary"
            onClick={currentStep === 1 ? onBack : handlePrev}
            disabled={currentStep === 1 && !onBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          {currentStep < totalSteps ? (
            <Button
              id="pre-triage-next"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              id="pre-triage-submit"
              onClick={handleSubmit}
              disabled={!canGoNext() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Enviar Pré-Triagem
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
