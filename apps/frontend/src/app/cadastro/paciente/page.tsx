// Endereço: apps/frontend/src/app/cadastro/paciente/page.tsx (versão com import corrigido)
"use client";

import { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';

export default function PatientRegistrationPage() {
  // O estado do formulário
  const [formData, setFormData] = useState({
    name: '', cpf: '', dateOfBirth: '', sex: '', email: '', phone: '', 
    password: '', passwordConfirmation: '', street: '', number: '', 
    neighborhood: '', city: '', state: '', zipCode: '', complement: '',
  });

  // helpers
  const sanitize = (value: string) => {
    // basic sanitization: trim and remove script-like characters
    return value.replace(/<[^>]*>/g, '').trim();
  };

  const onlyDigits = (value: string) => value.replace(/\D/g, '');

  const formatCPF = (value: string) => {
    const d = onlyDigits(value).slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
      .slice(0, 14);
  };

  const validateCPF = (cpf: string) => {
    const str = onlyDigits(cpf);
    if (str.length !== 11) return false;
    // invalid known sequences
    if (/^(\d)\1{10}$/.test(str)) return false;

    const calc = (t: number) => {
      let sum = 0;
      for (let i = 0; i < t - 1; i++) sum += parseInt(str[i]) * (t - i);
      const mod = (sum * 10) % 11;
      return mod === 10 ? 0 : mod;
    };
    const v1 = calc(10);
    const v2 = calc(11);
    return v1 === parseInt(str[9]) && v2 === parseInt(str[10]);
  };

  const formatPhone = (value: string) => {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 10) {
      // fixed or short
      return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateEmail = (email: string) => {
    // simple RFC-ish regex
    return /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email.trim());
  };

  const isValidDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    // normalize
    const input = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return input <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
   const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAgeConfirm, setShowAgeConfirm] = useState(false);
  const [pendingAge, setPendingAge] = useState<number | null>(null);
  const router = useRouter();
  
  // Age helpers
  const parseDateOnly = (value: string) => {
    // Ensure date parsing is done at midnight local time to avoid timezone shifts
    const parts = value.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null as unknown as Date;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const ageInDays = (value: string) => {
    const dob = parseDateOnly(value);
    if (!dob) return null;
    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dobMid = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = todayMid.getTime() - dobMid.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const ageInYears = (value: string) => {
    const dob = parseDateOnly(value);
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // return a human-friendly age description (days, months, months+days, or years)
  const formatAttemptedAge = (value: string) => {
    const dob = parseDateOnly(value);
    if (!dob) return '';
    const today = new Date();
    // normalize
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dDob = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const totalDays = Math.floor((dToday.getTime() - dDob.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays < 1) return '0 dias';

    // if at least 1 year, show years
    const years = ageInYears(value);
    if (years !== null && years >= 1) return `${years} ${years === 1 ? 'ano' : 'anos'}`;

    if (totalDays < 30) return `${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`;

    // months and days for under 1 year
    let months = (dToday.getFullYear() - dDob.getFullYear()) * 12 + (dToday.getMonth() - dDob.getMonth());
    const dayDiff = dToday.getDate() - dDob.getDate();
    if (dayDiff < 0) {
      months -= 1;
      // calculate days by subtracting dob + months from today
      const shifted = new Date(dDob.getFullYear(), dDob.getMonth() + months, dDob.getDate());
      const days = Math.floor((dToday.getTime() - shifted.getTime()) / (1000 * 60 * 60 * 24));
      if (months <= 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
      if (days === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
      return `${months} ${months === 1 ? 'mês' : 'meses'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }

    // dayDiff >= 0
    const days = dayDiff;
    if (months <= 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    if (days === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    return `${months} ${months === 1 ? 'mês' : 'meses'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
  };

  // side-effects for modal: lock scroll and handle Esc
  useEffect(() => {
    if (showAgeConfirm) {
      // lock body scroll
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape' || ev.key === 'Esc') {
          setShowAgeConfirm(false);
          setPendingAge(null);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [showAgeConfirm]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name;
    let value = e.target.value;

    if (name === 'cpf') {
      value = formatCPF(value);
    }

    if (name === 'phone') {
      // accept only digits and format
      value = formatPhone(value);
    }

    if (name === 'name') {
      // allow letters (including accents), spaces, hyphen and apostrophe; strip numbers and other symbols
      // IMPORTANT: do not trim here so user can type a space and continue typing without cursor reposition issues
      const withoutTags = value.replace(/<[^>]*>/g, '');
      const cleaned = withoutTags.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' \-]/g, '');
      // collapse multiple spaces but preserve a single trailing space while typing
      value = cleaned.replace(/\s{2,}/g, ' ').slice(0, 120);
    }

    if (name === 'email') {
      value = value.trim();
    }

    setFormData(prevData => ({ ...prevData, [name]: value }));
     // validate field inline
     const fieldError = validateField(name, value);
     setFieldErrors((s) => ({ ...s, [name]: fieldError }));
  };

   const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
     const name = e.target.name;
     setTouched((t) => ({ ...t, [name]: true }));
     const fieldError = validateField(name, formData[name as keyof typeof formData] as string);
     setFieldErrors((s) => ({ ...s, [name]: fieldError }));
   };

   const validateField = (name: string, value: string) => {
     if (name === 'email') {
       if (!value) return 'E-mail é obrigatório.';
       if (!validateEmail(value)) return 'Formato de e-mail inválido.';
       return null;
     }

     if (name === 'cpf') {
       const raw = onlyDigits(value);
       if (!raw) return 'CPF é obrigatório.';
       if (raw.length !== 11) return 'CPF deve ter 11 dígitos.';
       if (!validateCPF(value)) return 'CPF inválido.';
       return null;
     }

     if (name === 'phone') {
       const raw = onlyDigits(value);
       if (!raw) return null; // optional
       if (raw.length > 11) return 'Telefone inválido. Máx 11 dígitos.';
       return null;
     }

     if (name === 'password') {
       if (!value) return 'Senha é obrigatória.';
       if (value.length < 8) return 'Senha deve ter ao menos 8 caracteres.';
       return null;
     }

     if (name === 'passwordConfirmation') {
       if (!value) return 'Confirmação de senha é obrigatória.';
       if (value !== formData.password) return 'As senhas não coincidem.';
       return null;
     }

     if (name === 'name') {
       if (!value) return 'Nome é obrigatório.';
       if (value.length > 120) return 'Nome muito longo.';
      // disallow digits or symbols
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value)) return 'Nome inválido. Use apenas letras e espaços.';
      return null;
     }

     if (name === 'dateOfBirth') {
      if (!value) return 'Data de nascimento é obrigatória.';
      if (!isValidDate(value)) return 'Data inválida ou no futuro.';
      // check age limits here for inline feedback
      const days = ageInDays(value);
      if (days !== null && days < 1) return 'Paciente deve ter ao menos 1 dia de vida.';
      const years = ageInYears(value);
      if (years !== null && years > 120) return 'Idade máxima permitida é 120 anos.';
      return null;
     }

     return null;
   };

   const isFormValid = () => {
     const required = ['name','email','cpf','dateOfBirth','password','passwordConfirmation'];
     for (const k of required) {
       const v = (formData as any)[k];
       if (!v) return false;
       const err = validateField(k, v);
       if (err) return false;
     }
     return true;
   };

  // separate submit so we can call it after confirmation
  const submitToServer = async () => {
    setIsLoading(true);
    setError(null);
    const rawCpf = formData.cpf.replace(/\D/g, '');
    const rawPhone = formData.phone.replace(/\D/g, '');

    const payload = {
      ...formData,
      name: sanitize(formData.name),
      email: formData.email.trim(),
      cpf: rawCpf,
      phone: rawPhone,
      street: sanitize(formData.street),
      neighborhood: sanitize(formData.neighborhood),
      city: sanitize(formData.city),
      state: sanitize(formData.state),
      complement: sanitize(formData.complement),
      zipCode: onlyDigits(formData.zipCode || ''),
    };

    try {
      await api.post('/users', { ...payload, role: 'PATIENT' });
      router.push('/login?status=success');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string | string[] }>;
        const errorMessage = axiosError.response?.data?.message || 'Ocorreu um erro ao criar a conta.';
        setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      } else {
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // basic validations
    if (formData.password !== formData.passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Formato de e-mail inválido.');
      return;
    }

    const rawCpf = formData.cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      setError('CPF deve conter 11 dígitos.');
      return;
    }

    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido.');
      return;
    }

    const rawPhone = formData.phone.replace(/\D/g, '');
    if (rawPhone && rawPhone.length > 11) {
      setError('Telefone inválido. Máximo 11 dígitos.');
      return;
    }

    if (!isValidDate(formData.dateOfBirth)) {
      setError('Data de nascimento inválida ou no futuro.');
      return;
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    // age strict bounds: reject if <1 day or >120 years
    const days = ageInDays(formData.dateOfBirth);
    const years = ageInYears(formData.dateOfBirth);
    if (days === null || years === null) {
      setError('Erro ao calcular a idade.');
      return;
    }
    if (days < 1) {
      setError('Paciente deve ter ao menos 1 dia de vida.');
      return;
    }
    if (years > 120) {
      setError('Idade máxima permitida é 120 anos.');
      return;
    }

    // if age is uncommon (less than 1 year old or greater than 99) ask for confirmation
    if (years < 1 || years > 99) {
      setPendingAge(years);
      setShowAgeConfirm(true);
      return;
    }

    // Optional: attempt to check uniqueness via backend endpoints (if available)
    try {
      // check email uniqueness if endpoint available
      try {
        const res = await api.get(`/users/check-email?email=${encodeURIComponent(formData.email)}`);
        if (res?.data?.exists) {
          setError('Email já cadastrado.');
          return;
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response && err.response.status === 409) {
          setError('Email já cadastrado.');
          return;
        }
        // ignore other errors (endpoint may not exist) and let server validate
      }

      try {
        const resCpf = await api.get(`/users/check-cpf?cpf=${encodeURIComponent(rawCpf)}`);
        if (resCpf?.data?.exists) {
          setError('CPF já cadastrado.');
          return;
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response && err.response.status === 409) {
          setError('CPF já cadastrado.');
          return;
        }
        // ignore other errors
      }
    } catch (uniqError: any) {
      setError(uniqError?.message || 'Email ou CPF já cadastrado.');
      return;
    }

    // finally submit
    await submitToServer();
  };
  
  const inputStyles = "mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <PublicLayout>
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700 mb-10">
  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Cadastro de paciente</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-teal-600 dark:text-teal-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Dados da Conta</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className={labelStyles}>Email</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="seu@email.com"/>
                {touched.email && fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className={labelStyles}>Telefone</label>
                <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} className={inputStyles} placeholder="(00) 00000-0000"/>
                {touched.phone && fieldErrors.phone && <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label htmlFor="password" className={labelStyles}>Senha</label>
                <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="Mínimo 8 caracteres"/>
                {touched.password && fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <label htmlFor="passwordConfirmation" className={labelStyles}>Confirmar Senha</label>
                <input id="passwordConfirmation" type="password" name="passwordConfirmation" value={formData.passwordConfirmation} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="Repita a senha"/>
                {touched.passwordConfirmation && fieldErrors.passwordConfirmation && <p className="text-sm text-red-600 mt-1">{fieldErrors.passwordConfirmation}</p>}
              </div>
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-teal-600 dark:text-teal-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Dados Pessoais</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className={labelStyles}>Nome Completo</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="Nome completo do paciente"/>
                {touched.name && fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="cpf" className={labelStyles}>CPF</label>
                <input id="cpf" type="text" inputMode="numeric" maxLength={14} name="cpf" value={formData.cpf} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="000.000.000-00"/>
                {touched.cpf && fieldErrors.cpf && <p className="text-sm text-red-600 mt-1">{fieldErrors.cpf}</p>}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className={labelStyles}>Data de Nascimento</label>
                <input id="dateOfBirth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} onBlur={handleBlur} required className={inputStyles}/>
                {touched.dateOfBirth && fieldErrors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{fieldErrors.dateOfBirth}</p>}
              </div>

              <div>
                <label htmlFor="sex" className={labelStyles}>Sexo</label>
                <select id="sex" name="sex" onChange={handleChange} onBlur={handleBlur} className={inputStyles} value={formData.sex}>
                  <option value="">Selecione...</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            </div>
          </fieldset>
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-teal-600 py-3 text-white font-semibold shadow-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300 dark:disabled:bg-teal-800 disabled:cursor-not-allowed">
            {isLoading ? 'Criando conta...' : 'Finalizar Cadastro'}
          </button>
        </form>
        {/* Age confirmation modal */}
        {showAgeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => { setShowAgeConfirm(false); setPendingAge(null); }} />
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl z-10 max-w-lg w-full mx-4 p-6 ring-1 ring-slate-900/5 dark:ring-slate-700" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="age-confirm-title">
              <div className="flex items-start justify-between">
                <h3 id="age-confirm-title" className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {/* importance icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l5.454 9.688c.75 1.334-.213 2.963-1.742 2.963H4.545c-1.53 0-2.492-1.629-1.742-2.963L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L8.89 7.5v3a1 1 0 001.993.117L10.89 10.5v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Confirmação de Idade
                </h3>
                <button aria-label="Fechar" className="text-slate-500 dark:text-slate-400 hover:text-red-600 cursor-pointer" onClick={() => { setShowAgeConfirm(false); setPendingAge(null); }}>
                  {/* simple X icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Você está cadastrando um paciente com idade fora da faixa comum <span className="font-bold text-slate-900 dark:text-white">{formatAttemptedAge(formData.dateOfBirth)}</span>. Deseja confirmar essa informação?</p>
              <div className="mt-6 flex justify-center gap-3">
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer transition" onClick={() => { setShowAgeConfirm(false); setPendingAge(null); }}>Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 cursor-pointer transition" onClick={async () => { setShowAgeConfirm(false); setPendingAge(null); await submitToServer(); }}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}