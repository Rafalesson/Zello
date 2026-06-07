// Endereço: apps/frontend/src/app/cadastro/medico/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Upload, X } from 'lucide-react';
import axios, { AxiosError } from 'axios';

interface IBGE_UF_Response {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGE_City_Response {
  id: number;
  nome: string;
}

export default function DoctorRegistrationPage() {
  const [formData, setFormData] = useState({
    name: '', crm: '', specialty: '', bio: '', email: '', phone: '', password: '',
    passwordConfirmation: '', street: '', number: '', neighborhood: '',
    city: '', state: '', zipCode: '', complement: '',
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const [states, setStates] = useState<IBGE_UF_Response[]>([]);
  const [cities, setCities] = useState<IBGE_City_Response[]>([]);

  useEffect(() => {
    axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        setStates(response.data);
      });
  }, []);

  const sanitize = (value: string) => value.replace(/<[^>]*>/g, '').trim();
  const onlyDigits = (value: string) => value.replace(/\D/g, '');
  const formatPhone = (value: string) => {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };
  const validateEmail = (email: string) => /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email.trim());

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = e.target.name;
    setTouched((t) => ({ ...t, [name]: true }));
    const fieldError = validateField(name, (formData as Record<string, string>)[name] || '');
    setFieldErrors((s) => ({ ...s, [name]: fieldError }));
  };

  const validateField = (name: string, value: string) => {
    if (name === 'email') {
      if (!value) return 'E-mail é obrigatório.';
      if (!validateEmail(value)) return 'Formato de e-mail inválido.';
      return null;
    }
    if (name === 'phone') {
      const raw = onlyDigits(value);
      if (!raw) return null;
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
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value)) return 'Nome inválido. Use apenas letras e espaços.';
      return null;
    }
    return null;
  };

  useEffect(() => {
    if (formData.state) {
      axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(response => {
          setCities(response.data);
        });
    }
  }, [formData.state]);

  const handleCepLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) return;
    setIsCepLoading(true);
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      if (response.data && !response.data.erro) {
        setFormData(prevData => ({
          ...prevData,
          street: response.data.logradouro,
          neighborhood: response.data.bairro,
          city: response.data.localidade,
          state: response.data.uf,
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let value = e.target.value;

    if (name === 'phone') {
      value = formatPhone(value);
    }

    if (name === 'name') {
      const withoutTags = value.replace(/<[^>]*>/g, '');
      value = withoutTags.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' \-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 120);
    }

    setFormData({ ...formData, [name]: value });
    if (name === 'zipCode' && value.replace(/\D/g, '').length === 8) {
      handleCepLookup(value);
    }

    const fieldError = validateField(name, value);
    setFieldErrors((s) => ({ ...s, [name]: fieldError }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A foto de perfil deve ter no máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.');
      return;
    }

    setProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }
    setProfilePicturePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    setError(null);

    let profilePictureUrl: string | undefined;

    // Step 1: Upload profile picture if present
    if (profilePicture) {
      setIsUploading(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', profilePicture);
        const uploadResponse = await api.post('/users/upload-profile-picture', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        profilePictureUrl = uploadResponse.data.url;
      } catch (err) {
        // UX-DR7: Empathetic error, form state preserved
        setError(
          'Não conseguimos enviar sua foto de perfil no momento. Você pode tentar novamente ou prosseguir sem ela.'
        );
        setIsLoading(false);
        setIsUploading(false);
        return; // Form state is preserved, user can retry
      } finally {
        setIsUploading(false);
      }
    }

    // Step 2: Create user account
    try {
      await api.post('/users', {
        ...formData,
        role: 'DOCTOR',
        profilePictureUrl,
      });
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

  const inputStyles = "mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm p-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <PublicLayout>
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700 mb-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Cadastro de Médico(a)</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-teal-600 dark:text-teal-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Dados da Conta</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div>
                <label className={labelStyles}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="seu@email.com"/>
                {touched.email && fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className={labelStyles}>Telefone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} className={inputStyles} placeholder="(00) 00000-0000"/>
                {touched.phone && fieldErrors.phone && <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className={labelStyles}>Senha</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="Mínimo 8 caracteres"/>
                {touched.password && fieldErrors.password && <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>}
              </div>
              <div>
                <label className={labelStyles}>Confirmar Senha</label>
                <input type="password" name="passwordConfirmation" value={formData.passwordConfirmation} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="Repita a senha"/>
                {touched.passwordConfirmation && fieldErrors.passwordConfirmation && <p className="text-sm text-red-600 mt-1">{fieldErrors.passwordConfirmation}</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-teal-600 dark:text-teal-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Perfil Profissional</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="md:col-span-3">
                <label className={labelStyles}>Nome Completo</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={inputStyles} placeholder="Dr(a). Nome Sobrenome"/>
                {touched.name && fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>
              <div className="md:col-span-1">
                <label className={labelStyles}>CRM</label>
                <input type="text" name="crm" value={formData.crm} onChange={handleChange} required className={inputStyles} placeholder="123456/UF"/>
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Especialidade</label>
                <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className={inputStyles} placeholder="Ex: Cardiologia"/>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className={labelStyles}>Bio / Sobre você</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Conte um pouco sobre sua experiência e áreas de atuação..."
                className={`${inputStyles} resize-none`}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formData.bio.length}/500 caracteres</p>
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label className={labelStyles}>Foto de Perfil</label>
              {profilePicturePreview ? (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={profilePicturePreview}
                    alt="Preview da foto de perfil"
                    className="h-20 w-20 rounded-full object-cover border-2 border-teal-200"
                  />
                  <button
                    type="button"
                    onClick={removeProfilePicture}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Remover
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="profile-picture-input"
                  className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-6 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:border-teal-400 hover:text-teal-600 dark:hover:border-teal-500 dark:hover:text-teal-400"
                >
                  <Upload className="h-5 w-5" />
                  <span>Clique para selecionar uma foto (máx. 5MB)</span>
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-teal-600 dark:text-teal-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Endereço do Consultório</legend>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-2">
              <div className="md:col-span-2 relative">
                <label className={labelStyles}>CEP</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} onBlur={(e) => handleCepLookup(e.target.value)} maxLength={9} className={inputStyles} placeholder="00000-000" />
                {isCepLoading && <LoaderCircle className="absolute right-3 top-[34px] h-5 w-5 animate-spin text-gray-400" />}
              </div>
              <div className="md:col-span-1">
                <label className={labelStyles}>Estado</label>
                <select name="state" value={formData.state} onChange={handleChange} className={inputStyles}>
                  <option value="">UF</option>
                  {states.map(state => (
                    <option key={state.id} value={state.sigla}>{state.sigla}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={labelStyles}>Cidade</label>
                <select name="city" value={formData.city} onChange={handleChange} disabled={!formData.state} className={`${inputStyles} disabled:bg-slate-100 dark:disabled:bg-slate-800`}>
                  <option value="">Selecione um estado</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.nome}>{city.nome}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <label className={labelStyles}>Rua / Logradouro</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} className={inputStyles} placeholder="Av. Brasil"/>
              </div>
               <div className="md:col-span-2">
                <label className={labelStyles}>Número</label>
                <input type="text" name="number" onChange={handleChange} className={inputStyles} placeholder="123"/>
              </div>
              <div className="md:col-span-3">
                <label className={labelStyles}>Bairro</label>
                <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className={inputStyles} placeholder="Centro"/>
              </div>
               <div className="md:col-span-3">
                <label className={labelStyles}>Complemento</label>
                <input type="text" name="complement" value={formData.complement} onChange={handleChange} className={inputStyles} placeholder="Sala 204, Bloco B"/>
              </div>
            </div>
          </fieldset>

          {error && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200" role="alert">
              <p className="font-medium">⚠️ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-teal-600 py-3 text-white font-semibold shadow-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Enviando foto...' : isLoading ? 'Criando conta...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}