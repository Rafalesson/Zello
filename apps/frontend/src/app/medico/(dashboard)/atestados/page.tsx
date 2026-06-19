'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/services/api';
import Link from 'next/link';
import { Search, Download, Trash2, Loader2, AlertTriangle, Eye, PlusCircle, Calendar } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { resolvePdfUrl } from '@/utils/resolvePdfUrl';
import { useDebounce } from '@/hooks/useDebounce';

type Certificate = {
  id: string;
  issueDate: string;
  patient: {
    patientProfile: {
      name: string;
    } | null;
  } | null;
  pdfUrl: string;
};

type ApiResponse = {
  data: Certificate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function CertificateHistoryPage() {
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearchTerm = useDebounce(inputValue, 500);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['certificateHistory', page, debouncedSearchTerm],
    queryFn: async () => {
      const { data } = await api.get('/certificates/my-certificates', {
        params: {
          page,
          limit: 10,
          patientName: debouncedSearchTerm,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    setSelectedIds([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);


  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.delete('/certificates/batch/delete', { data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateHistory'] });
      setSelectedIds([]);
    },
    onError: (error) => {
      console.error("Erro ao deletar atestados em lote:", error);
      alert("Falha ao deletar os atestados selecionados.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (certificateId: string) => {
      return api.delete(`/certificates/${certificateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateHistory'] });
    },
    onError: (error) => {
      console.error("Erro ao deletar atestado:", error);
      alert("Falha ao deletar o atestado. Tente novamente.");
    }
  });

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const numSelected = selectedIds.length;
      const numItemsOnPage = data?.data.length ?? 0;
      headerCheckboxRef.current.checked = numSelected === numItemsOnPage && numItemsOnPage > 0;
      headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numItemsOnPage;
    }
  }, [selectedIds, data]);


  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIdsOnPage = data?.data.map((cert) => String(cert.id)) ?? [];
      setSelectedIds(allIdsOnPage);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string | number, isChecked: boolean) => {
    const normalizedId = String(id);
    if (isChecked) {
      setSelectedIds((prev) => (prev.includes(normalizedId) ? prev : [...prev, normalizedId]));
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== normalizedId));
    }
  };
  
  const handleOpenPreview = (pdfUrl: string) => {
    setPreviewPdfUrl(resolvePdfUrl(pdfUrl));
    setIsPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setPreviewPdfUrl(null);
  };

  const openBatchDeleteModal = () => {
    if (selectedIds.length > 0) {
      setCertificateToDelete(null); 
      setIsDeleteModalOpen(true);
    }
  };

  const openSingleDeleteModal = (certificateId: string | number) => {
    setCertificateToDelete(String(certificateId));
    setSelectedIds([]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (certificateToDelete) {
      deleteMutation.mutate(certificateToDelete);
    } 
    else if (selectedIds.length > 0) {
      batchDeleteMutation.mutate(selectedIds.map(String));
    }
    closeDeleteModal();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCertificateToDelete(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }
    if (isError) {
      return (
        <div className="text-center p-12 text-red-500 font-medium">Erro ao carregar atestados. Tente novamente.</div>
      );
    }
    if (data?.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Nenhum atestado encontrado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Não encontramos atestados com os filtros aplicados.
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
        {data?.data.map((cert) => {
          const certId = String(cert.id);
          const isSelected = selectedIds.includes(certId);
          const patientName = cert.patient?.patientProfile?.name || 'N/A';

          return (
            <div 
              key={cert.id} 
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group gap-4 sm:gap-0 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              {/* Checkbox e Paciente Info */}
              <div className="flex items-center gap-4 sm:w-2/5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectOne(cert.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:checked:bg-blue-500 cursor-pointer transition-all"
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                  {patientName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {patientName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Paciente</p>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-center gap-2 sm:w-1/4">
                <div className="p-1.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-100 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date(cert.issueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 sm:w-auto sm:justify-end">
                <button
                  onClick={() => handleOpenPreview(cert.pdfUrl)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a
                  href={resolvePdfUrl(cert.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => openSingleDeleteModal(cert.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Atestados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie, visualize e baixe os atestados emitidos para seus pacientes.</p>
        </div>
        <Link 
          href="/medico/atestados/novo"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
        >
          <PlusCircle className="w-5 h-5" />
          Emitir Atestado
        </Link>
      </div>

      {/* Controles: Busca e Batch Delete */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Buscar por nome do paciente..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-slate-200 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
           {selectedIds.length > 0 && (
             <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
               <span className="text-sm font-semibold">{selectedIds.length} selecionado(s)</span>
               <button
                 onClick={openBatchDeleteModal}
                 disabled={batchDeleteMutation.isPending}
                 className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
               >
                 <Trash2 className="w-3.5 h-3.5" />
                 Excluir
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Lista de Atestados (Estilo SaaS Moderno) */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700/60 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {/* Header da Lista */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/80">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              ref={headerCheckboxRef}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:checked:bg-blue-500 cursor-pointer transition-all"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Atestados Emitidos</span>
          </div>
        </div>

        {/* Corpo da Lista */}
        <div className="flex-1">
          {renderContent()}
        </div>
        
        {/* Pagination Footer */}
        {data && data.total > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Página <span className="text-slate-900 dark:text-white font-bold">{data.page}</span> de <span className="text-slate-900 dark:text-white font-bold">{data.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data.totalPages || isLoading}
                className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreview}
        title="Visualização do Atestado"
        maxWidth="max-w-4xl"
      >
        {previewPdfUrl ? (
          <iframe 
            src={previewPdfUrl ?? ''}
            className="w-full h-[75vh] border-0"
            title="Preview do Atestado"
          />
        ) : (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-4">Carregando preview...</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
        maxWidth="max-w-lg"
      >
        <div className="mt-2">
            <div className="flex items-start gap-4">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div>
                    <p className="text-sm text-gray-700">
                        Você tem certeza que deseja excluir <strong>{certificateToDelete ? 1 : selectedIds.length} atestado(s)</strong>?
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Esta ação é permanente e não poderá ser desfeita.
                    </p>
                </div>
            </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending || batchDeleteMutation.isPending}
          >
            {(deleteMutation.isPending || batchDeleteMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={closeDeleteModal}
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
