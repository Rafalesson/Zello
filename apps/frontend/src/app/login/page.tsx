// Endereço: apps/frontend/src/app/login/page.tsx
"use client";

import { useContext, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthProvider";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Shield,
  Zap,
  Heart,
  Stethoscope,
  FileText,
  Clock,
  Users,
  Smartphone,
  Lock,
} from "lucide-react";

/* ─── Slide data ─── */
const slides = [
  {
    badge: "Zello",
    title: (
      <>
        A saúde digital
        <br />
        ao seu alcance.
      </>
    ),
    subtitle:
      "Gerencie consultas, emita documentos e conecte-se com seus pacientes de forma segura e moderna.",
    features: [
      { icon: Shield, text: "Dados protegidos com criptografia ponta a ponta" },
      { icon: Zap, text: "Emissão de documentos em segundos" },
      { icon: Heart, text: "Cuidado centrado no paciente" },
    ],
    gradient: "from-teal-600 via-teal-700 to-slate-800",
    gradientDark: "dark:from-teal-800 dark:via-slate-800 dark:to-slate-900",
    orbColors: [
      "bg-teal-400/20 dark:bg-teal-500/10",
      "bg-white/10 dark:bg-teal-400/10",
      "bg-teal-300/15 dark:bg-teal-600/15",
    ],
  },
  {
    badge: "📋",
    title: (
      <>
        Documentos digitais
        <br />
        com validade legal.
      </>
    ),
    subtitle:
      "Atestados e receitas com assinatura digital e QR Code para validação instantânea.",
    features: [
      { icon: FileText, text: "Atestados e receitas com assinatura digital" },
      { icon: Stethoscope, text: "Prontuário integrado e acessível" },
      { icon: Clock, text: "Histórico completo sempre disponível" },
    ],
    gradient: "from-indigo-600 via-indigo-700 to-slate-800",
    gradientDark: "dark:from-indigo-800 dark:via-slate-800 dark:to-slate-900",
    orbColors: [
      "bg-indigo-400/20 dark:bg-indigo-500/10",
      "bg-white/10 dark:bg-indigo-400/10",
      "bg-indigo-300/15 dark:bg-indigo-600/15",
    ],
  },
  {
    badge: "🤝",
    title: (
      <>
        Conexão direta
        <br />
        médico e paciente.
      </>
    ),
    subtitle:
      "Uma plataforma pensada para aproximar profissionais de saúde e seus pacientes com segurança.",
    features: [
      { icon: Users, text: "Comunicação direta e segura" },
      { icon: Smartphone, text: "Acesse de qualquer dispositivo" },
      { icon: Lock, text: "Conformidade total com a LGPD" },
    ],
    gradient: "from-emerald-600 via-emerald-700 to-slate-800",
    gradientDark: "dark:from-emerald-800 dark:via-slate-800 dark:to-slate-900",
    orbColors: [
      "bg-emerald-400/20 dark:bg-emerald-500/10",
      "bg-white/10 dark:bg-emerald-400/10",
      "bg-emerald-300/15 dark:bg-emerald-600/15",
    ],
  },
];

const SLIDE_INTERVAL = 6000;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { signIn } = useContext(AuthContext);
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "session_expired") {
      setError(
        "Sua sessão expirou ou é inválida. Por favor, faça o login novamente."
      );
    }
  }, [searchParams]);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  // Auto-rotation
  useEffect(() => {
    const timer = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [nextSlide]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signIn({ email, password });
    } catch {
      setError("E-mail ou senha incorretos...");
    } finally {
      setIsLoading(false);
    }
  }

  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Link href="/">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            Zello
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex flex-1">
        {/* ─── Left panel: Dynamic branding carousel ─── */}
        <div
          className={`hidden lg:flex w-1/2 relative overflow-hidden cursor-pointer bg-gradient-to-br ${slide.gradient} ${slide.gradientDark} transition-all duration-700`}
          onClick={nextSlide}
          title="Clique para avançar"
        >
          {/* Animated orbs */}
          <div
            className={`absolute -top-20 -left-20 w-72 h-72 rounded-full ${slide.orbColors[0]} blur-3xl animate-pulse transition-colors duration-700`}
          />
          <div
            className={`absolute top-1/2 -right-16 w-56 h-56 rounded-full ${slide.orbColors[1]} blur-2xl animate-pulse transition-colors duration-700`}
            style={{ animationDelay: "1s" }}
          />
          <div
            className={`absolute -bottom-10 left-1/3 w-44 h-44 rounded-full ${slide.orbColors[2]} blur-2xl animate-pulse transition-colors duration-700`}
            style={{ animationDelay: "2s" }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Center content */}
          <div
            className={`relative z-10 flex flex-col items-center justify-center w-full px-12 text-white transition-all duration-300 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
          >
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-8 ring-1 ring-white/20">
                <span className="text-2xl font-bold">{slide.badge}</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight">{slide.title}</h2>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">
                {slide.subtitle}
              </p>

              {/* Features mini */}
              <div className="mt-10 flex flex-col gap-4 text-left">
                {slide.features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                        <Icon className="h-4 w-4 text-white/80" />
                      </div>
                      <span className="text-sm text-white/80">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-2 mt-12">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(i);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right panel: Login form ─── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Acesse sua conta
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Bem-vindo(a) de volta! Entre com suas credenciais.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Senha
                    </label>
                    <Link
                      href="/recuperar-senha"
                      className="text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
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

                {error && (
                  <div
                    className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3"
                    aria-live="polite"
                  >
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-teal-600 py-3 text-white font-semibold shadow-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300 dark:disabled:bg-teal-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Não tem uma conta?{" "}
                <Link
                  href="/cadastro"
                  className="font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  Cadastre-se agora
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
