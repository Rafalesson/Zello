'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { AutocompleteSearch } from './AutocompleteSearch';
import { usePrescription, PrescriptionItem } from '@/contexts/PrescriptionContext';
import { Patient } from '@/contexts/AttestationContext';
import { Modal } from './common/Modal';
import { resolvePdfUrl } from '@/utils/resolvePdfUrl';
import {
  CheckCircle,
  Download,
  Home,
  Loader2,
  PlusCircle,
  Trash2,
} from 'lucide-react';

const generateId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Math.random().toString(36).slice(2, 8)}`);

type SubmissionResult = {
  pdfUrl: string;
};

const hasEmptyTitle = (items: PrescriptionItem[]) =>
  items.some((item) => item.title.trim().length === 0);

export function PrescriptionForm() {
  const router = useRouter();
  const { data, setData, clearData } = usePrescription();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

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

  const updateItems = (updater: (items: PrescriptionItem[]) => PrescriptionItem[]) => {
    const nextItems = updater(data.items);
    setData({ ...data, items: nextItems });
  };

  const handleItemChange = (
    itemId: string,
    field: keyof Pick<PrescriptionItem, 'title' | 'description' | 'observation'>,
    value: string,
  ) => {
    updateItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddItem = () => {
    updateItems((items) => [
      ...items,
      { id: generateId(), title: '', description: '', observation: '' },
    ]);
  };

  const handleRemoveItem = (itemId: string) => {
    updateItems((items) => {
      if (items.length === 1) {
        return [{ id: generateId(), title: '', description: '', observation: '' }];
      }
      return items.filter((item) => item.id !== itemId);
    });
  };

  const handlePreview = (event: React.FormEvent) => {
    event.preventDefault();

    if (!data.patient) {
      alert('Por favor, selecione um paciente da lista.');
      return;
    }

    if (hasEmptyTitle(data.items)) {
      alert('Informe o nome de todos os medicamentos ou orientações.');
      return;
    }

    setSubmissionResult(null);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleConfirmAndIssue = async () => {
    if (!data.patient) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: data.patient.userId,
        items: data.items.map(({ title, description, observation }) => ({
          title: title.trim(),
          description: description.trim(),
          observation: observation.trim(),
        })),
        generalGuidance: data.generalGuidance.trim() || undefined,
        additionalNotes: data.additionalNotes.trim() || undefined,
      };

      const response = await api.post('/prescriptions', payload);
      const result = response.data;

      if (!result?.pdfUrl) {
        throw new Error('A resposta da API não retornou a URL do PDF.');
      }

      setSubmissionResult({ pdfUrl: result.pdfUrl });
      clearData();
    } catch (error) {
      console.error('Erro ao emitir receita:', error);
      alert('Ocorreu um erro ao emitir a receita. Tente novamente.');
      setSubmissionResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/medico/dashboard');
  };

  const previewContent = useMemo(() => {
    if (!data.patient) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Paciente</h3>
          <p className="text-sm text-gray-600">{data.patient.name}</p>
          <p className="text-sm text-gray-500">CPF: {data.patient.cpf}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800">Prescrição</h3>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-700">
            {data.items.map((item, index) => (
              <li key={item.id}>
                <p className="font-medium text-gray-900">
                  {index + 1}. {item.title}
                </p>
                {item.description && (
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {item.description}
                  </p>
                )}
                {item.observation && (
                  <p className="text-gray-500 whitespace-pre-wrap">
                    {item.observation}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        {data.generalGuidance && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Orientações Gerais
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {data.generalGuidance}
            </p>
          </div>
        )}

        {data.additionalNotes && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Observações ao Paciente
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {data.additionalNotes}
            </p>
          </div>
        )}
      </div>
    );
  }, [data]);

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">Medicamentos e Orientações</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar item
            </button>
          </div>

          {data.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 dark:border-slate-600 p-4 space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Nome do medicamento ou orientação
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        handleItemChange(item.id, 'title', event.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-2 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-600 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="Ex: CALMAN — 1 cx"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Posologia / Detalhes
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(event) =>
                        handleItemChange(item.id, 'description', event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-2 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-600 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="Ex: Tomar 1 comprimido a cada 12 horas"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Observações adicionais
                    </label>
                    <textarea
                      value={item.observation}
                      onChange={(event) =>
                        handleItemChange(item.id, 'observation', event.target.value)
                      }
                      rows={2}
                      className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-2 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-600 placeholder-gray-400 dark:placeholder-slate-500"
                      placeholder="Ex: Reforçar ingestão de água, evitar cafeína."
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="rounded-md border border-gray-200 dark:border-slate-600 p-2 text-gray-500 dark:text-slate-400 hover:text-red-600 hover:border-red-200 dark:hover:text-red-400 dark:hover:border-red-800"
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Orientações gerais
          </label>
          <textarea
            value={data.generalGuidance}
            onChange={(event) =>
              setData({ ...data, generalGuidance: event.target.value })
            }
            rows={4}
            className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-600 placeholder-gray-400 dark:placeholder-slate-500"
            placeholder="Ex: Evitar bebidas estimulantes, praticar atividade física 3x por semana"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Observações ao paciente
          </label>
          <textarea
            value={data.additionalNotes}
            onChange={(event) =>
              setData({ ...data, additionalNotes: event.target.value })
            }
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-600 placeholder-gray-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-teal-600 px-6 py-2 text-white font-semibold hover:bg-teal-700"
          >
            Gerar pré-visualização
          </button>
        </div>
      </form>

      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={submissionResult ? 'Receita emitida com sucesso' : 'Pré-visualização da receita'}
        maxWidth="max-w-3xl"
      >
        {!submissionResult ? (
          <>
            {previewContent}
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
                {isSubmitting ? 'Emitindo...' : 'Confirmar e emitir'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Receita gerada!</h2>
            <p className="mt-2 text-gray-600">O documento foi salvo e está pronto para download.</p>
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-4 sm:space-y-0">
              <a
                href={resolvePdfUrl(submissionResult.pdfUrl)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700"
              >
                <Download className="mr-2" size={20} /> Baixar Receita
              </a>
              <button
                onClick={handleGoToDashboard}
                className="flex items-center justify-center rounded-md bg-gray-600 px-6 py-3 text-white font-semibold hover:bg-gray-700"
              >
                <Home className="mr-2" size={20} /> Voltar para o início
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

