// Endereço: apps/frontend/src/app/paciente/sala/[id]/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthProvider';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/common/Button';
import {
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CalendarClock,
  Stethoscope,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ConsultationStatus } from '@imnotmedical/shared';

interface AppointmentInfo {
  id: number;
  date: string;
  status: ConsultationStatus;
  doctorProfile: {
    name: string;
    specialty: string;
  };
}

const NARRATIVE_MESSAGES = [
  'Conectando ao servidor médico seguro…',
  'Estabelecendo canal criptografado…',
  'Notificando Dr(a). {doctorName}…',
  'Aguardando liberação da sala pelo profissional…',
  'Verificando disponibilidade da sala de atendimento…',
  'Sua consulta está na fila de espera segura…',
];

const MESSAGE_CYCLE_MS = 8000; // 8 seconds

type WaitingRoomState = 'loading' | 'waiting' | 'no-show' | 'no-show-error' | 'error';

export default function VirtualWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const appointmentId = Number(params?.id);

  const [state, setState] = useState<WaitingRoomState>('loading');
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [narrativeIndex, setNarrativeIndex] = useState(0);

  // Refs to prevent double-execution and ensure cleanup
  const hasEnteredWaitingRoom = useRef(false);
  const noShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageCycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup all timers on unmount
  const cleanupTimers = useCallback(() => {
    if (noShowTimeoutRef.current) {
      clearTimeout(noShowTimeoutRef.current);
      noShowTimeoutRef.current = null;
    }
    if (messageCycleRef.current) {
      clearInterval(messageCycleRef.current);
      messageCycleRef.current = null;
    }
  }, []);

  // Initialize: load appointment and enter waiting room
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'PATIENT') { router.push('/'); return; }
    if (isNaN(appointmentId)) {
      setErrorMessage('ID de consulta inválido.');
      setState('error');
      return;
    }

    let active = true;

    const initWaitingRoom = async () => {
      try {
        // 1. Fetch appointment details via individual endpoint (AC: A3)
        const response = await api.get(`/appointments/${appointmentId}`);
        if (!active) return;
        const found: AppointmentInfo = response.data;

        // If consultation has already started, redirect to call room
        if (found.status === ConsultationStatus.EM_ANDAMENTO) {
          router.push(`/paciente/consulta/${appointmentId}/chamada`);
          return;
        }

        if (found.status === ConsultationStatus.CANCELADA) {
          setErrorMessage('Esta consulta foi cancelada.');
          setState('error');
          return;
        }
        if (found.status === ConsultationStatus.REALIZADA) {
          setErrorMessage('Esta consulta já foi realizada.');
          setState('error');
          return;
        }
        if (found.status === ConsultationStatus.NAO_REALIZADA) {
          setErrorMessage('Esta consulta não foi realizada.');
          setState('error');
          return;
        }

        // 1.5. Validate check-in completion - redirect if missing triage/consent (AC: A1)
        let hasPreTriage = false;
        let hasConsent = false;

        try {
          const triageResponse = await api.get(`/appointments/${appointmentId}/pre-triage`);
          if (triageResponse.data) hasPreTriage = true;
        } catch (err: any) {
          if (err.response?.status !== 404) throw err;
        }

        try {
          const consentResponse = await api.get(`/appointments/${appointmentId}/consent`);
          if (consentResponse.data) hasConsent = true;
        } catch (err: any) {
          if (err.response?.status !== 404) throw err;
        }

        if (!hasPreTriage || !hasConsent) {
          router.push(`/paciente/consulta/${appointmentId}`);
          return;
        }

        // 1.6. Validate device check was completed (AC: A1 - hardware check)
        const deviceCheckKey = `device-check-passed-${appointmentId}`;
        if (!sessionStorage.getItem(deviceCheckKey)) {
          router.push(`/paciente/consulta/${appointmentId}`);
          return;
        }

        setAppointment(found);

        // 2. Enter waiting room (PATCH) — only if not already in EM_ESPERA/EM_ANDAMENTO (AC: A4/A9)
        if (!hasEnteredWaitingRoom.current &&
            found.status !== ConsultationStatus.EM_ESPERA) {
          hasEnteredWaitingRoom.current = true;
          try {
            await api.patch(`/appointments/${appointmentId}/waiting-room`);
          } catch (err: any) {
            if (!active) return;
            setErrorMessage(err.response?.data?.message || 'Erro ao entrar na sala de espera.');
            setState('error');
            return;
          }
        }

        if (!active) return;
        setState('waiting');
      } catch {
        if (active) {
          setErrorMessage('Erro ao carregar dados da consulta.');
          setState('error');
        }
      }
    };

    initWaitingRoom();
    return () => { active = false; };
  }, [authLoading, user, appointmentId, router]);

  // Narrative message cycling
  useEffect(() => {
    if (state !== 'waiting') return;
    messageCycleRef.current = setInterval(() => {
      setNarrativeIndex((prev) => (prev + 1) % NARRATIVE_MESSAGES.length);
    }, MESSAGE_CYCLE_MS);
    return () => {
      if (messageCycleRef.current) {
        clearInterval(messageCycleRef.current);
        messageCycleRef.current = null;
      }
    };
  }, [state]);

  // Polling via individual endpoint GET /appointments/:id (AC: A3)
  useEffect(() => {
    if (state !== 'waiting') return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/appointments/${appointmentId}`);
        if (!active) return;
        if (response.data.status === ConsultationStatus.EM_ANDAMENTO) {
          router.push(`/paciente/consulta/${appointmentId}/chamada`);
        }
      } catch (err) {
        console.error('Erro ao verificar status da consulta:', err);
      }
    }, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [state, appointmentId, router]);

  // Dynamic no-show timeout based on scheduledTime + 10min (AC: A6)
  useEffect(() => {
    if (state !== 'waiting' || !appointment) return;

    const scheduledTime = new Date(appointment.date).getTime();
    const noShowDeadline = scheduledTime + 10 * 60 * 1000;
    const remainingMs = noShowDeadline - Date.now();

    // No-show trigger with error handling (AC: A8)
    const triggerNoShow = async () => {
      try {
        await api.patch(`/appointments/${appointmentId}/no-show`);
        setState('no-show');
      } catch (err) {
        console.error('Erro ao marcar no-show:', err);
        setState('no-show-error');
      }
    };

    if (remainingMs <= 0) {
      triggerNoShow();
      return;
    }

    noShowTimeoutRef.current = setTimeout(triggerNoShow, remainingMs);
    return () => {
      if (noShowTimeoutRef.current) {
        clearTimeout(noShowTimeoutRef.current);
        noShowTimeoutRef.current = null;
      }
    };
  }, [state, appointment, appointmentId]);

  // Cleanup all timers on unmount
  useEffect(() => { return cleanupTimers; }, [cleanupTimers]);

  const doctorName = appointment?.doctorProfile?.name || 'Médico';
  const specialty = appointment?.doctorProfile?.specialty || '';

  const getCurrentNarrativeMessage = () => {
    return NARRATIVE_MESSAGES[narrativeIndex].replace('{doctorName}', doctorName);
  };

  const appointmentDate = appointment
    ? new Date(appointment.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

  // Retry no-show handler (AC: A8)
  const retryNoShow = async () => {
    try {
      await api.patch(`/appointments/${appointmentId}/no-show`);
      setState('no-show');
    } catch (err) {
      console.error('Erro ao marcar no-show (retry):', err);
    }
  };

  // --- LOADING ---
  if (authLoading || state === 'loading') {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Preparando sala de espera…
        </p>
      </main>
    );
  }

  // --- ERROR ---
  if (state === 'error') {
    return (
      <main className="max-w-lg mx-auto mt-12 px-4">
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Erro
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {errorMessage}
          </p>
          <Button
            id="btn-back-to-appointments"
            onClick={() => router.push('/paciente/consultas')}
          >
            Voltar às Consultas
          </Button>
        </section>
      </main>
    );
  }

  // --- NO-SHOW ERROR (AC: A8) ---
  if (state === 'no-show-error') {
    return (
      <main className="max-w-lg mx-auto mt-12 px-4">
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 md:p-10 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
            Falha na Comunicação
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
            Não foi possível registrar o encerramento da espera. Por favor, tente novamente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              id="btn-retry-no-show"
              onClick={retryNoShow}
            >
              <RefreshCw className="w-5 h-5" />
              Tentar Novamente
            </Button>
            <Button
              id="btn-back-to-appointments-error"
              variant="secondary"
              onClick={() => router.push('/paciente/consultas')}
            >
              Voltar às Consultas
            </Button>
          </div>
        </section>
      </main>
    );
  }

  // --- NO-SHOW (Doctor absence timeout) (AC: A12) ---
  if (state === 'no-show') {
    return (
      <main className="max-w-lg mx-auto mt-12 px-4">
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 md:p-10 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shadow-inner">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
            Consulta Não Iniciada
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
            O médico não pôde iniciar a consulta no momento. Deseja reagendar?
          </p>
          <Button
            id="btn-reschedule-appointment"
            onClick={() => router.push('/paciente/consultas')}
          >
            <CalendarClock className="w-5 h-5" />
            Reagendar Consulta
          </Button>
        </section>
      </main>
    );
  }

  // --- WAITING --- (AC: A10 - Semantic landmarks and aria-live)
  return (
    <main className="max-w-2xl mx-auto mt-6 px-4 pb-12">
      {/* Page Header */}
      <section className="mb-8" aria-label="Informações da sala de espera">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Sala de Espera Virtual
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aguardando início da consulta
            </p>
          </div>
        </div>
      </section>

      {/* Doctor Info Card */}
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm mb-6" aria-label="Informações do médico">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Dr(a). {doctorName}
            </h2>
            {specialty && (
              <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                {specialty}
              </p>
            )}
          </div>
        </div>

        {appointmentDate && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800/60">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <span>{appointmentDate}</span>
          </div>
        )}
      </section>

      {/* Waiting Status Card */}
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm mb-6" aria-label="Status de espera">
        {/* Spinner + Narrative Loading */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
              <Spinner />
            </div>
            {/* Pulse ring animation */}
            <div className="absolute inset-0 rounded-full border-2 border-teal-400/30 animate-ping" />
          </div>

          {/* Narrative Loading Message (AC: A10) */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="text-center min-h-[2rem] flex items-center justify-center"
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-opacity duration-500">
              {getCurrentNarrativeMessage()}
            </p>
          </div>
        </div>
      </section>

      {/* Status Indicators */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Indicadores de status">
        {/* Doctor Notified */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Médico Notificado
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Dr(a). {doctorName} foi informado(a)
              </p>
            </div>
          </div>
        </div>

        {/* Secure Queue */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Fila Segura
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Sua posição na fila está garantida
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
