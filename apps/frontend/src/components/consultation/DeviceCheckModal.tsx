'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Video,
  VideoOff,
  MonitorSpeaker,
  DoorOpen,
} from 'lucide-react';

interface DeviceCheckModalProps {
  onComplete: () => void;
  onBack?: () => void;
  appointmentId?: number;
}

type DeviceError = {
  title: string;
  message: string;
};

function mapMediaError(error: unknown): DeviceError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          title: 'Acesso negado',
          message:
            'Acesso negado à câmera ou microfone. Por favor, clique no ícone de cadeado na barra de endereços do navegador para liberar o acesso.',
        };
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          title: 'Dispositivo não encontrado',
          message:
            'Nenhum microfone ou dispositivo de áudio compatível foi detectado. Por favor, conecte um dispositivo e tente novamente.',
        };
      case 'NotReadableError':
      case 'TrackStartError':
        return {
          title: 'Dispositivo em uso',
          message:
            'Seu dispositivo de vídeo ou áudio parece estar em uso por outro aplicativo (ex: Teams, Zoom). Feche outros aplicativos e tente novamente.',
        };
      case 'NotSupportedError':
        return {
          title: 'Navegador incompatível ou contexto inseguro',
          message:
            'Seu navegador não oferece suporte à captura de mídia ou esta página não está sendo executada em um ambiente seguro (HTTPS).',
        };
      case 'TimeoutError':
        return {
          title: 'Tempo de solicitação esgotado',
          message:
            'A permissão de acesso à câmera ou microfone demorou muito para ser concedida. Certifique-se de que o prompt de permissão não está oculto.',
        };
      default:
        return {
          title: 'Erro de mídia',
          message:
            'Não foi possível iniciar seus dispositivos de mídia. Verifique as configurações do navegador e tente novamente.',
        };
    }
  }

  return {
    title: 'Erro inesperado',
    message:
      'Não foi possível iniciar seus dispositivos de mídia. Verifique as configurações do navegador e tente novamente.',
  };
}

export function DeviceCheckModal({
  onComplete,
  onBack,
  appointmentId,
}: DeviceCheckModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<DeviceError | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [throttledAudioLevel, setThrottledAudioLevel] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const errorRef = useRef<DeviceError | null>(null);
  errorRef.current = error;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);
  const lastThrottleTimeRef = useRef(0);

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const closeAudioContext = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (
      audioContextRef.current &&
      audioContextRef.current.state !== 'closed'
    ) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const cleanupAll = useCallback(() => {
    isCleaningUpRef.current = true;
    closeAudioContext();
    stopAllTracks();
    setAudioLevel(0);
    setThrottledAudioLevel(0);
    isCleaningUpRef.current = false;
  }, [closeAudioContext, stopAllTracks]);

  const handleTrackEnded = useCallback(() => {
    if (isCleaningUpRef.current || isCompleting) return;
    setError({
      title: 'Dispositivo desconectado',
      message: 'Sua câmera ou microfone foi desconectado. Por favor, reconecte o dispositivo e tente novamente.',
    });
    cleanupAll();
    setStream(null);
  }, [cleanupAll, isCompleting]);

  const startAudioAnalysis = useCallback((mediaStream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      const resumeContext = () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(() => {});
        }
      };

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          window.addEventListener('click', resumeContext, { once: true });
          window.addEventListener('touchstart', resumeContext, { once: true });
        });
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.length > 0
          ? dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
          : 0;

        const level = Math.min(100, Math.round((average / 128) * 100)) || 0;
        setAudioLevel(level);

        const now = Date.now();
        if (now - lastThrottleTimeRef.current > 500) {
          setThrottledAudioLevel(level);
          lastThrottleTimeRef.current = now;
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch {
      // Audio analysis is best-effort; device check can still proceed
    }
  }, []);

  const requestMediaWithTimeout = useCallback(async (options: MediaStreamConstraints, timeoutMs = 15000): Promise<MediaStream> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new DOMException('A solicitação de mídia expirou. Verifique se há permissões pendentes.', 'TimeoutError'));
      }, timeoutMs);
    });

    try {
      const mediaPromise = navigator.mediaDevices.getUserMedia(options);
      const res = await Promise.race([mediaPromise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return res;
    } catch (err) {
      clearTimeout(timeoutId!);
      throw err;
    }
  }, []);

  const acquireMedia = useCallback(async (): Promise<{ stream: MediaStream; videoAvailable: boolean }> => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new DOMException('Navegador incompatível ou contexto inseguro (HTTPS obrigatório).', 'NotSupportedError');
    }

    try {
      // Try both video and audio first
      const mediaStream = await requestMediaWithTimeout({ video: true, audio: true });
      return { stream: mediaStream, videoAvailable: true };
    } catch (err) {
      if (!isMountedRef.current) {
        throw new DOMException('Componente desmontado', 'AbortError');
      }

      // Check if video is the issue, fallback to audio-only
      const isNotFoundError = err instanceof DOMException && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError');
      const isNotReadableError = err instanceof DOMException && (err.name === 'NotReadableError' || err.name === 'TrackStartError');

      if (isNotFoundError || isNotReadableError) {
        try {
          const mediaStream = await requestMediaWithTimeout({ video: false, audio: true });
          return { stream: mediaStream, videoAvailable: false };
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      throw err;
    }
  }, [requestMediaWithTimeout]);

  const initMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { stream: mediaStream, videoAvailable } = await acquireMedia();

      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setVideoAvailable(videoAvailable);
      setIsVideoEnabled(videoAvailable);
      setIsAudioEnabled(mediaStream.getAudioTracks().length > 0);

      mediaStream.getTracks().forEach((track) => {
        track.addEventListener('ended', handleTrackEnded);
      });

      startAudioAnalysis(mediaStream);
    } catch (err) {
      if (isMountedRef.current) {
        setError(mapMediaError(err));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [acquireMedia, startAudioAnalysis, handleTrackEnded]);

  useEffect(() => {
    isMountedRef.current = true;
    initMedia();

    const handleDeviceChange = () => {
      // Automatically retry if we currently have an error (e.g. no devices found)
      if (errorRef.current && !isCompleting) {
        initMedia();
      }
    };

    if (navigator?.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      isMountedRef.current = false;
      if (navigator?.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      cleanupAll();
    };
  }, [initMedia, cleanupAll, isCompleting]);

  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node && stream && isVideoEnabled) {
      node.srcObject = stream;
      node.play().catch((err) => {
        console.warn('Falha ao reproduzir preview de vídeo:', err);
      });
    }
  }, [stream, isVideoEnabled]);

  const handleRetry = async () => {
    cleanupAll();
    setStream(null);
    setError(null);
    await initMedia();
  };

  const toggleVideo = () => {
    if (!stream || !videoAvailable) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const handleComplete = () => {
    setIsCompleting(true);

    // Persist media preferences in sessionStorage (AC: C1)
    if (appointmentId) {
      try {
        sessionStorage.setItem(
          `media-prefs-${appointmentId}`,
          JSON.stringify({ videoEnabled: isVideoEnabled, audioEnabled: isAudioEnabled }),
        );
        sessionStorage.setItem(`device-check-passed-${appointmentId}`, 'true');
      } catch (e) {
        // sessionStorage may be unavailable in some contexts; proceed anyway
      }
    }

    cleanupAll();
    setStream(null);
    onComplete();
  };

  const isDeviceReady = stream !== null && !error && !loading;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
              <MonitorSpeaker className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Verificação de Dispositivos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Teste sua câmera e microfone antes de entrar na sala
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Loading State */}
          {loading && !error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Acessando câmera e microfone...
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Permita o acesso quando solicitado pelo navegador
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2 max-w-md">
                <p className="text-base font-bold text-slate-800 dark:text-white">
                  {error.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {error.message}
                </p>
              </div>
              <Button
                data-testid="device-check-retry"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Device Preview */}
          {!loading && !error && stream && (
            <div className="space-y-5">
              {/* Video Preview Area */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                {isVideoEnabled && videoAvailable ? (
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      {!videoAvailable ? 'Câmera não disponível' : 'Câmera temporariamente desativada'}
                    </p>
                  </div>
                )}

                {/* Floating Media Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    type="button"
                    data-testid="device-check-toggle-video"
                    onClick={toggleVideo}
                    disabled={!videoAvailable}
                    aria-label={
                      isVideoEnabled
                        ? 'Desativar câmera'
                        : 'Ativar câmera'
                    }
                    aria-pressed={!isVideoEnabled}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isVideoEnabled && videoAvailable
                        ? 'bg-slate-700/80 hover:bg-slate-600/80 text-white backdrop-blur-sm'
                        : 'bg-rose-500/90 hover:bg-rose-400/90 text-white backdrop-blur-sm'
                    }`}
                  >
                    {isVideoEnabled && videoAvailable ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <VideoOff className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="device-check-toggle-audio"
                    onClick={toggleAudio}
                    aria-label={
                      isAudioEnabled
                        ? 'Desativar microfone'
                        : 'Ativar microfone'
                    }
                    aria-pressed={!isAudioEnabled}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      isAudioEnabled
                        ? 'bg-slate-700/80 hover:bg-slate-600/80 text-white backdrop-blur-sm'
                        : 'bg-rose-500/90 hover:bg-rose-400/90 text-white backdrop-blur-sm'
                    }`}
                  >
                    {isAudioEnabled ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <MicOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Audio Level Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Nível do Microfone</span>
                  </div>
                  {!isAudioEnabled && (
                    <span className="text-xs text-rose-500 font-semibold">
                      Microfone mutado
                    </span>
                  )}
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-75 ease-out ${
                      !isAudioEnabled
                        ? 'bg-slate-300 dark:bg-slate-600'
                        : audioLevel > 70
                          ? 'bg-emerald-500'
                          : audioLevel > 30
                            ? 'bg-teal-500'
                            : 'bg-teal-400'
                    }`}
                    style={{
                      width: `${isAudioEnabled ? audioLevel : 0}%`,
                    }}
                    role="meter"
                    aria-label="Nível de áudio do microfone"
                    aria-valuenow={isAudioEnabled ? throttledAudioLevel : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-live="off"
                  />
                </div>
              </div>

              {/* Status Banner */}
              {videoAvailable ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Dispositivos funcionando corretamente
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Sua câmera e microfone estão prontos para a consulta.
                      Fale no microfone para testar o áudio.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      Câmera não detectada ou desativada
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Não foi possível carregar o vídeo da sua câmera. Você prosseguirá para a consulta apenas com o áudio do microfone.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {onBack && (
            <Button
              variant="secondary"
              data-testid="device-check-back"
              onClick={onBack}
              disabled={isCompleting || loading}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          <div className={onBack ? '' : 'ml-auto'}>
            <Button
              data-testid="device-check-complete"
              onClick={handleComplete}
              disabled={!isDeviceReady || isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <DoorOpen className="w-4 h-4" />
                  Entrar na Sala de Espera
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
