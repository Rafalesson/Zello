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
import { CheckCircle, Download, Home, Loader2 } from 'lucide-react';
import { NumberStepper } from './common/NumberStepper';

type Cid = { id: string; code: string; description: string; };

const ActiveTemplatePreview = () => {
  const { data } = useAttestation();
  
  switch (data.templateId) {
    case 'modern':
      return <ModernTemplate />;
    case 'classic':
      return <ClassicTemplate />;
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
    router.push('/medico/dashboard');
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
            <div className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600">
              <p className="font-semibold text-gray-900 dark:text-slate-100">{patient.name}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">CPF: {patient.cpf}</p>
            </div>
          )}
          displayValue={(patient) => patient.name}
        />

        <div>
          <label htmlFor="purpose" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Finalidade do Atestado</label>
          <textarea 
            id="purpose" 
            rows={4} 
            value={data.purpose} 
            onChange={(e) => setData({ ...data, purpose: e.target.value })} 
            className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-600 focus:border-teal-500 dark:focus:border-teal-500" 
            placeholder="Descreva o motivo do atestado..."
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
            <div className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600">
              <p className="font-semibold text-gray-900 dark:text-slate-100">{cid.code}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">{cid.description}</p>
            </div>
          )}
          displayValue={(cid) => `${cid.code} - ${cid.description}`}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <NumberStepper
              id="durationInDays"
              label="Duração (em dias)"
              value={data.durationInDays}
              onChange={(val) => setData({ ...data, durationInDays: val })}
              min={1}
              max={365}
              required
            />
          </div>

          <div>
            <label htmlFor="templateId" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Modelo do Atestado
            </label>
            <select
              id="templateId"
              value={data.templateId}
              onChange={(e) => setData({ ...data, templateId: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-600 focus:border-teal-500 dark:focus:border-teal-500"
            >
              <option value="default">Padrão</option>
              <option value="modern">Moderno</option>
              <option value="classic">Clássico</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-teal-600 px-6 py-2 text-white font-semibold cursor-pointer hover:bg-teal-700">
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
