'use client';

import { useAuth } from "@/contexts/AuthProvider";
import { Settings, User, Shield, Camera, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

function PasswordInput({ placeholder }: { placeholder: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative">
      <input 
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
        /* Hide native edge/chrome eye icon */
        style={{ WebkitTextSecurity: show ? 'none' : 'disc' } as React.CSSProperties}
      />
      <button 
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <style jsx>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-teal-500" />
          Configurações
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Gerencie seus dados pessoais e a segurança da sua conta.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Personal Data Section - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Dados Pessoais</h2>
            </div>
            
            {/* Profile Picture */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700/50">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-teal-600 text-white rounded-full shadow-md hover:bg-teal-500 transition-colors group-hover:scale-110">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left pt-2">
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Foto de Perfil</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-sm">Recomendado: imagem quadrada (JPG, PNG) de no máximo 2MB.</p>
                <button className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">Remover foto atual</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                    defaultValue={user?.patientProfile?.name || ''} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                    defaultValue={user?.email || ''} 
                    disabled
                  />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CPF</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                    defaultValue={user?.patientProfile?.cpf || ''} 
                    disabled 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Telefone</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                    defaultValue={user?.patientProfile?.phone || ''} 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                    defaultValue={user?.patientProfile?.dateOfBirth ? new Date(user.patientProfile.dateOfBirth).toISOString().split('T')[0] : ''} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sexo</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    defaultValue={user?.patientProfile?.sex || ''}
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Feminino</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                <button className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm">
                  Salvar Dados
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Security Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Shield className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Segurança</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Senha Atual</label>
                <PasswordInput placeholder="Digite sua senha atual" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nova Senha</label>
                <PasswordInput placeholder="Digite a nova senha" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirmar Nova Senha</label>
                <PasswordInput placeholder="Repita a nova senha" />
              </div>
              <div className="pt-4 flex justify-end">
                <button className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-2.5 w-full rounded-xl text-sm transition-colors shadow-sm">
                  Alterar Senha
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
