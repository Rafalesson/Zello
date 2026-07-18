'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthProvider';
import { PreTriage } from '@/components/consultation/PreTriage';
import { ConsentForm } from '@/components/consultation/ConsentForm';
import { DeviceCheckModal } from '@/components/consultation/DeviceCheckModal';
import { Button } from '@/components/common/Button';
import { ConsultationStatus } from '@imnotmedical/shared';
import {
  CheckCircle,
  ClipboardCheck,
  FileText,
  Loader2,
  Stethoscope,
  ArrowRight,
  AlertTriangle,
  Video,
} from 'lucide-react';

interface AppointmentInfo {
  id: number;
  date: string;
  status: string;
  doctorProfile: {
    name: string;
    specialty: string;
  };
}

type CheckInStep = 'loading' | 'pre-triage' | 'consent' | 'device-check' | 'completed' | 'error';

export default function ConsultationCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const appointmentId = Number(params?.id);

  const [step, setStep] = useState<CheckInStep>('loading');
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isDirectDeviceCheck, setIsDirectDeviceCheck] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'PATIENT') {
      router.push('/');
      return;
    }

    if (isNaN(appointmentId)) {
      setErrorMessage('Consulta inválida ou ID incorreto.');
      setStep('error');
      return;
    }

    let active = true;

    const loadAppointment = async () => {
      try {
        const response = await api.get('/appointments/patient');
        if (!active) return;

        const found = response.data.find(
          (a: AppointmentInfo) => a.id === appointmentId
        );

        if (!found) {
          setErrorMessage('Consulta não encontrada.');
          setStep('error');
          return;
        }

        // Validate status (prevent TOCTOU)
        if (found.status === ConsultationStatus.CANCELADA) {
          setErrorMessage('Esta consulta foi cancelada e não permite check-in.');
          setStep('error');
          return;
        }
        if (found.status === ConsultationStatus.REALIZADA) {
          setErrorMessage('Esta consulta já foi realizada.');
          setStep('error');
          return;
        }

        setAppointment(found);

        // Check pre-triage and consent status
        let hasPreTriage = false;
        let hasConsent = false;

        try {
          const triageResponse = await api.get(
            `/appointments/${appointmentId}/pre-triage`
          );
          if (!active) return;
          if (triageResponse.data) {
            hasPreTriage = true;
          }
        } catch (err: any) {
          if (!active) return;
          if (err.response?.status !== 404) {
            throw err;
          }
        }

        try {
          const consentResponse = await api.get(
            `/appointments/${appointmentId}/consent`
          );
          if (!active) return;
          if (consentResponse.data) {
            hasConsent = true;
          }
        } catch (err: any) {
          if (!active) return;
          if (err.response?.status !== 404) {
            throw err;
          }
        }

        if (!active) return;

        // Determine correct step
        if (hasPreTriage && hasConsent) {
          setIsDirectDeviceCheck(true);
          setStep('device-check');
          return;
        }

        if (!hasPreTriage) {
          setStep('pre-triage');
        } else {
          setStep('consent');
        }
      } catch {
        if (active) {
          setErrorMessage('Erro ao carregar dados da consulta. Por favor, tente novamente.');
          setStep('error');
        }
      }
    };

    loadAppointment();

    return () => {
      active = false;
    };
  }, [authLoading, user, appointmentId, router]);

  useEffect(() => {
    if (step === 'completed') {
      const progressTimer = setTimeout(() => setProgress(100), 50);
      const redirectTimer = setTimeout(() => {
        router.push(`/paciente/sala/${appointmentId}`);
      }, 3000);
      return () => {
        clearTimeout(progressTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [step, appointmentId, router]);

  const handleTriageComplete = () => {
    setStep('consent');
  };

  const handleConsentComplete = () => {
    setStep('device-check');
  };

  const handleDeviceCheckComplete = () => {
    setStep('completed');
  };

  if (authLoading || step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Carregando dados da consulta...
        </p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto mt-12 px-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center shadow-sm">
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
            onClick={() => router.push('/paciente/consultas')}
          >
            Voltar às Consultas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4 pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Check-in da Consulta
            </h1>
            {appointment && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Dr(a). {appointment.doctorProfile.name} —{' '}
                {appointment.doctorProfile.specialty}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Check-in Steps Status */}
      <div className="mb-8 flex items-center gap-3 flex-wrap">
        {/* Step 1: Pré-Triagem */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
            step === 'pre-triage'
              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {step !== 'pre-triage' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <ClipboardCheck className="w-4 h-4" />
          )}
          Pré-Triagem
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />

        {/* Step 2: Consentimento */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
            step === 'consent'
              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
              : step === 'device-check' || step === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {step === 'device-check' || step === 'completed' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Consentimento
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />

        {/* Step 3: Dispositivos */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
            step === 'device-check'
              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
              : step === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {step === 'completed' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          Dispositivos
        </div>
      </div>

      {/* Pre-triage Form */}
      {step === 'pre-triage' && (
        <PreTriage
          appointmentId={appointmentId}
          onComplete={handleTriageComplete}
          onBack={() => router.push('/paciente/consultas')}
        />
      )}

      {/* Consent Form */}
      {step === 'consent' && (
        <ConsentForm
          appointmentId={appointmentId}
          onComplete={handleConsentComplete}
          onBack={() => setStep('pre-triage')}
        />
      )}

      {/* Device Check */}
      {step === 'device-check' && (
        <DeviceCheckModal
          appointmentId={appointmentId}
          onComplete={handleDeviceCheckComplete}
          onBack={isDirectDeviceCheck ? undefined : () => setStep('consent')}
        />
      )}

      {/* Completed State */}
      {step === 'completed' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 md:p-14 text-center shadow-lg animate-fade-in max-w-2xl mx-auto mt-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
            Check-in Concluído!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
            Suas informações foram registradas com sucesso. O médico terá acesso
            ao seu questionário e termo de consentimento antes de iniciar a consulta.
          </p>
          
          <div className="mt-6 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/60 max-w-md mx-auto shadow-sm">
            <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400 font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm tracking-tight">Entrando na sala virtual...</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-[2900ms] ease-linear" 
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Você será redirecionado automaticamente em instantes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
