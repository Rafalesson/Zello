'use client';

import { useAuth } from "@/contexts/AuthProvider";
import { api } from "@/services/api";
import { Settings, User, Shield, Camera, Eye, EyeOff, Stethoscope, Lock, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

function PasswordInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function DoctorSettingsPage() {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [crmState, setCrmState] = useState('');
  const [emailState, setEmailState] = useState('');
  const [loginState, setLoginState] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user?.doctorProfile) {
      setName(user.doctorProfile.name || '');
      setPhone(user.doctorProfile.phone || '');
      setSpecialty(user.doctorProfile.specialty || '');
      setCrmState(user.doctorProfile.crm || '');
      setEmailState(user.email || '');
      setLoginState(user.email ? user.email.split('@')[0] : '');
    }
  }, [user]);

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U';
    const cleaned = name.replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').trim();
    const parts = cleaned.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await api.patch('/users/doctors/me', {
        name,
        phone,
        specialty,
        bio,
        crm: crmState,
        email: emailState,
        login: loginState,
      });
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Erro ao salvar as alterações.',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const crm = user?.doctorProfile?.crm || '';
  const email = user?.email || '';

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-teal-500" />
          Configurações de Perfil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Gerencie suas informações e credenciais de acesso.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 shadow-sm transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
            : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-medium text-sm">{feedback.message}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column — Profile Card + Access Level */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Photo Card */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm text-center">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Foto de Perfil</h2>
            </div>

            <div className="relative group mx-auto w-fit mb-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg border-4 border-white dark:border-slate-800">
                {getUserInitials(name)}
              </div>
              <button className="absolute bottom-1 right-1 p-2.5 bg-teal-600 text-white rounded-full shadow-md hover:bg-teal-500 transition-all group-hover:scale-110 border-2 border-white dark:border-slate-800">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{name || 'Médico(a)'}</h3>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-full border border-teal-100/50 dark:border-teal-900/30">
                Médico(a)
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">@{email.split('@')[0]}</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Alterar
              </button>
              <button className="px-4 py-2 border border-rose-200 dark:border-rose-900/30 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors font-bold text-rose-500 dark:text-rose-400">
                Remover
              </button>
            </div>
          </section>

          {/* Access Level Card */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nível de Acesso</h2>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Acesso Médico</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Painel clínico completo</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Gerenciar agenda e disponibilidade
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Emitir atestados e receitas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Realizar teleconsultas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Sem permissão administrativa
              </li>
            </ul>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">CRM: <strong className="text-slate-600 dark:text-slate-300">{crm}</strong></span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/30">
                Ativo
              </span>
            </div>
          </section>
        </div>

        {/* Right Column — Info + Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Informações Pessoais</h2>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CRM</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={crmState}
                    onChange={(e) => setCrmState(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input
                    type="email"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={emailState}
                    onChange={(e) => setEmailState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Login</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={loginState}
                    onChange={(e) => setLoginState(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Especialidade</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Cardiologia"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Biografia</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Uma breve descrição sobre sua formação e experiência..."
                />
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Shield className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Segurança e Senha</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Informe a senha atual para autorizar alterações de credenciais.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Senha Atual</label>
                <PasswordInput placeholder="Informe sua senha atual" value={currentPassword} onChange={setCurrentPassword} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nova Senha</label>
                  <PasswordInput placeholder="Nova senha" value={newPassword} onChange={setNewPassword} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Confirmar Nova Senha</label>
                  <PasswordInput placeholder="Confirme nova senha" value={confirmPassword} onChange={setConfirmPassword} />
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
