// Endereço: apps/frontend/src/app/paciente/layout.tsx
'use client';

import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/Header";

export default function PatientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "PATIENT") {
        if (user.role === "DOCTOR") {
          router.push("/medico/dashboard");
        } else if (user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "PATIENT") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600 border-t-teal-600 dark:border-t-teal-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header />
      
      <main className="flex-grow w-full">
        {children}
      </main>
    </div>
  );
}