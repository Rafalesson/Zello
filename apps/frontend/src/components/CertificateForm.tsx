// Endereço: apps/frontend/src/components/CertificateForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { AutocompleteSearch } from './AutocompleteSearch';
import { useAttestation, Patient } from '@/contexts/AttestationContext';
import { Modal } from './common/Modal';
import { resolvePdfUrl } from '@/utils/resolvePdfUrl';
import { DefaultTemplate } from './templates/default';
import { ModernTemplate } from './templates/modern'; 
import { ClassicTemplate } from './templates/classic';
import { InstitutionalTemplate } from './templates/institutional';
import { ExecutiveTemplate } from './templates/executive';
import { CheckCircle, Download, Home, Loader2, UserCheck } from 'lucide-react';

type Cid = { id: string; code: string; description: string; };

const ActiveTemplatePreview = () => {
  const { data } = useAttestation();
  
  switch (data.templateId) {
    case 'modern':
      return <ModernTemplate />;
    case 'classic':
      return <ClassicTemplate />;
    case 'institutional':
      return <InstitutionalTemplate />;
    case 'executive':
      return <ExecutiveTemplate />;
    default:
      return <DefaultTemplate />;
  }
};

export function CertificateForm() {
  const router = useRouter();
  const { data, setData, clearData } = useAttestation();
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ pdfUrl: string } | null>(null);

  const searchPatients = async (query: string): Promise<Patient[]> => {
    try {
      const response = await api.get(`/patients/search?name=${query}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      return [];
    }
  };

  const handleSelectPatient = (patient: Patient | null) => {
    setData({ ...data, patient });
  };

  const searchCids = async (query: string): Promise<Cid[]> => {
    try {
      const response = await api.get(`/cids/search?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar CIDs:', error);
      return [];
    }
  };

  const handleSelectCid = (cid: Cid | null) => {
    setData({ ...data, cid });
  };

  function handlePreview(event: React.FormEvent) {
    event.preventDefault();
    if (!data.patient) {
      alert('Por favor, selecione um paciente da lista.');
      return;
    }
    setSubmissionResult(null); 
    setIsPreviewOpen(true);
  }

  function handleClosePreview() {
    setIsPreviewOpen(false);
  }

  async function handleConfirmAndIssue() {
    if (!data.patient) return;

    setIsSubmitting(true);
    try {
      const dto = {
        patientId: data.patient?.userId,
        purpose: data.purpose,
        durationInDays: Number(data.durationInDays),
        cidCode: data.cid?.code,
        templateId: data.templateId,
        legalRepresentative:
          data.hasLegalRepresentative && data.legalRepresentative.trim().length > 0
            ? data.legalRepresentative.trim()
            : undefined,
        legalRepresentativeCpf:
          data.hasLegalRepresentative && data.legalRepresentativeCpf.trim().length > 0
            ? data.legalRepresentativeCpf.trim()
            : undefined,
        signatureStyle:
          data.signatureStyle && data.signatureStyle !== 'auto'
            ? data.signatureStyle
            : undefined,
      };

      const response = await api.post('/certificates', dto);
      const result = response.data;

      if (result && result.pdfUrl) {
        setSubmissionResult({ pdfUrl: result.pdfUrl });
        clearData(); 
      } else {
        throw new Error("A resposta da API não incluiu uma URL para o PDF.");
      }

    } catch (error) {
      console.error("Erro ao emitir atestado final:", error);
      alert("Ocorreu um erro ao emitir o atestado. Tente novamente.");
      setSubmissionResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoToDashboard() {
    router.push('/dashboard');
  }

  function formatCpfMask(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  return (
    <>
      <form onSubmit={handlePreview} className="space-y-6">
        <AutocompleteSearch<Patient>
          label="Buscar Paciente"
          placeholder="Digite o nome do paciente..."
          onSearch={searchPatients}
          onSelect={handleSelectPatient}
          initialValue={data.patient} 
          renderOption={(patient) => (
            <div className="p-3 cursor-pointer hover:bg-gray-100">
              <p className="font-semibold text-gray-900">{patient.name}</p>
              <p className="text-sm text-gray-500">CPF: {patient.cpf}</p>
            </div>
          )}
          displayValue={(patient) => patient.name}
        />

        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 transition-colors">
          <div className="flex items-center justify-between">
            <label
              htmlFor="hasLegalRepresentative"
              className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Incluir Representante Legal no Atestado</span>
            </label>
            <button
              type="button"
              id="hasLegalRepresentative"
              role="switch"
              aria-checked={data.hasLegalRepresentative}
              onClick={() =>
                setData({
                  ...data,
                  hasLegalRepresentative: !data.hasLegalRepresentative,
                  legalRepresentative: !data.hasLegalRepresentative ? data.legalRepresentative : '',
                  legalRepresentativeCpf: !data.hasLegalRepresentative ? data.legalRepresentativeCpf : '',
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                data.hasLegalRepresentative ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  data.hasLegalRepresentative ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="legalRepresentative"
                className={`mb-1.5 block text-xs font-medium ${
                  data.hasLegalRepresentative ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                Nome completo do Representante Legal / Responsável
              </label>
              <input
                type="text"
                id="legalRepresentative"
                disabled={!data.hasLegalRepresentative}
                required={data.hasLegalRepresentative}
                placeholder={
                  data.hasLegalRepresentative
                    ? 'Digite o nome completo do representante legal...'
                    : 'Ative a opção acima caso o paciente possua representante legal'
                }
                value={data.legalRepresentative}
                onChange={(e) => setData({ ...data, legalRepresentative: e.target.value })}
                className={`w-full rounded-md border p-3 text-sm transition-colors focus:outline-none ${
                  data.hasLegalRepresentative
                    ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="legalRepresentativeCpf"
                className={`mb-1.5 block text-xs font-medium ${
                  data.hasLegalRepresentative ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                CPF do Representante Legal
              </label>
              <input
                type="text"
                id="legalRepresentativeCpf"
                disabled={!data.hasLegalRepresentative}
                required={data.hasLegalRepresentative}
                maxLength={14}
                placeholder={data.hasLegalRepresentative ? '000.000.000-00' : 'CPF desativado'}
                value={data.legalRepresentativeCpf}
                onChange={(e) =>
                  setData({ ...data, legalRepresentativeCpf: formatCpfMask(e.target.value) })
                }
                className={`w-full rounded-md border p-3 text-sm transition-colors focus:outline-none ${
                  data.hasLegalRepresentative
                    ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="purpose" className="mb-2 block text-sm font-medium text-gray-700">Finalidade do Atestado</label>
          <textarea 
            id="purpose" 
            rows={4} 
            value={data.purpose} 
            onChange={(e) => setData({ ...data, purpose: e.target.value })} 
            className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500" 
            required 
          />
        </div>

        <AutocompleteSearch<Cid>
          label="CID-10 (Opcional)"
          placeholder="Digite o código ou descrição..."
          onSearch={searchCids}
          onSelect={handleSelectCid}
          initialValue={data.cid}
          renderOption={(cid) => (
            <div className="p-3 cursor-pointer hover:bg-gray-100">
              <p className="font-semibold text-gray-900">{cid.code}</p>
              <p className="text-sm text-gray-500">{cid.description}</p>
            </div>
          )}
          displayValue={(cid) => `${cid.code} - ${cid.description}`}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="durationInDays" className="mb-2 block text-sm font-medium text-gray-700">Duração (em dias)</label>
            <input 
              type="number" 
              id="durationInDays" 
              value={data.durationInDays} 
              onChange={(e) => setData({ ...data, durationInDays: e.target.value === '' ? '' : Number(e.target.value) })} 
              className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500" 
              required
            />
          </div>

          <div>
            <label htmlFor="templateId" className="mb-2 block text-sm font-medium text-gray-700">
              Modelo do Atestado
            </label>
            <select
              id="templateId"
              value={data.templateId}
              onChange={(e) => setData({ ...data, templateId: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            >
              <option value="default">Padrão</option>
              <option value="modern">Moderno</option>
              <option value="classic">Clássico</option>
              <option value="institutional">Institucional (Hospitalar)</option>
              <option value="executive">Executivo (Clínico)</option>
            </select>
          </div>

          <div>
            <label htmlFor="signatureStyle" className="mb-2 block text-sm font-medium text-gray-700">
              Selo de Assinatura Eletrônica
            </label>
            <select
              id="signatureStyle"
              value={data.signatureStyle}
              onChange={(e) => setData({ ...data, signatureStyle: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            >
              <option value="auto">Automático (Padrão do Modelo)</option>
              <option value="icp_cfm">Selo Institucional ICP-Brasil | e-CRM</option>
              <option value="rubrica_crm">Rubrica Médica + Selo ICP-Brasil / CFM</option>
              <option value="gov_iti">Selo Criptográfico Escuro (ITI • CFM)</option>
              <option value="classic_icp">Selo Clássico Azul ICP-Brasil</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-white font-semibold cursor-pointer hover:bg-blue-700">
            Gerar Pré-visualização
          </button>
        </div>
      </form>

      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={submissionResult ? "Atestado Emitido com Sucesso" : "Pré-visualização do Atestado"}
        maxWidth="max-w-3xl"
      >
        {!submissionResult ? (
          <>
            <ActiveTemplatePreview />
            <div className="mt-8 flex justify-end space-x-4 border-t pt-4">
              <button 
                type="button"
                onClick={handleClosePreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Editar
              </button>
              <button 
                type="button"
                onClick={handleConfirmAndIssue}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Emitindo...' : 'Confirmar e Emitir'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Atestado Gerado!</h2>
            <p className="mt-2 text-gray-600">O documento foi salvo e está pronto para download.</p>
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-4 sm:space-y-0">
               <a
                href={resolvePdfUrl(submissionResult.pdfUrl)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700"
              >
                <Download className="mr-2" size={20} /> Baixar Atestado
              </a>
              <button
                onClick={handleGoToDashboard}
                className="flex items-center justify-center rounded-md bg-gray-600 px-6 py-3 text-white font-semibold hover:bg-gray-700"
              >
                <Home className="mr-2" size={20} /> Voltar para o Início
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
