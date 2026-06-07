'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { CertificatesListSkeleton } from './certificates-list-skeleton';

type PatientProfile = {
  name?: string | null;
};

type CertificateApi = {
  id: string;
  issueDate: string;
  patient: {
    patientProfile: PatientProfile | null;
  } | null;
};

type PrescriptionApi = {
  id: string;
  issueDate: string;
  patient: {
    patientProfile: PatientProfile | null;
  } | null;
};

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

type RecentDocument = {
  id: string;
  issueDate: string;
  patientName: string;
  type: 'certificate' | 'prescription';
};

const fetchPatientCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get('/patients/count');
  return data;
};

const fetchRecentDocuments = async (): Promise<RecentDocument[]> => {
  const limit = 50;
  const [certificateResponse, prescriptionResponse] = await Promise.all([
    api.get<PaginatedResponse<CertificateApi>>('/certificates/my-certificates', {
      params: { page: 1, limit },
    }),
    api.get<PaginatedResponse<PrescriptionApi>>('/prescriptions/my-prescriptions', {
      params: { page: 1, limit },
    }),
  ]);

  const certificates: RecentDocument[] = (certificateResponse.data?.data ?? []).map(
    (cert) => ({
      id: `certificate-${cert.id}`,
      issueDate: cert.issueDate,
      patientName:
        cert.patient?.patientProfile?.name?.trim() ?? 'Paciente não identificado',
      type: 'certificate',
    }),
  );

  const prescriptions: RecentDocument[] = (prescriptionResponse.data?.data ?? []).map(
    (prescription) => ({
      id: `prescription-${prescription.id}`,
      issueDate: prescription.issueDate,
      patientName:
        prescription.patient?.patientProfile?.name?.trim() ??
        'Paciente não identificado',
      type: 'prescription',
    }),
  );

  return [...certificates, ...prescriptions]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
};

export default function DashboardPage() {
  const { data: patientData, isLoading: isLoadingCount } = useQuery({
    queryKey: ['patientCount'],
    queryFn: fetchPatientCount,
  });

  const {
    data: recentDocuments,
    isLoading: isLoadingDocuments,
    isError: isDocumentsError,
  } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn: fetchRecentDocuments,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [recentDocuments]);

  const paginatedDocuments = useMemo(() => {
    if (!recentDocuments || recentDocuments.length === 0) {
      return [];
    }
    const start = (currentPage - 1) * itemsPerPage;
    return recentDocuments.slice(start, start + itemsPerPage);
  }, [recentDocuments, currentPage]);

  const totalPages = useMemo(() => {
    if (!recentDocuments || recentDocuments.length === 0) {
      return 1;
    }
    return Math.ceil(recentDocuments.length / itemsPerPage);
  }, [recentDocuments]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/medico/atestados/novo" className="h-full">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 h-full transition-colors">
            <PlusCircle className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-2" />
            <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 text-center">Emitir Atestado</h2>
          </div>
        </Link>
        <Link href="/medico/receitas/novo" className="h-full">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 h-full transition-colors">
            <PlusCircle className="w-12 h-12 text-green-500 dark:text-green-400 mb-2" />
            <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 text-center">Emitir Receita</h2>
          </div>
        </Link>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
          <h3 className="text-4xl font-bold text-gray-800 dark:text-slate-100">07</h3>
          <p className="text-gray-500 dark:text-slate-400">Consultas Hoje</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
          {isLoadingCount ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 dark:border-slate-600 border-t-blue-500 dark:border-t-teal-500" />
          ) : (
            <h3 className="text-4xl font-bold text-gray-800 dark:text-slate-100">{patientData?.count ?? 0}</h3>
          )}
          <p className="text-gray-500 dark:text-slate-400 mt-2">Total de Pacientes</p>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Documentos Emitidos Recentemente</h2>

        {isLoadingDocuments && <CertificatesListSkeleton />}

        {isDocumentsError && (
          <p className="text-red-500">Ocorreu um erro ao buscar os documentos.</p>
        )}

        {!isLoadingDocuments && !isDocumentsError && (
          <div className="space-y-2">
            {paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((document) => {
                const isCertificate = document.type === 'certificate';
                const accentClasses = isCertificate
                  ? 'border-l-[6px] border-l-blue-500'
                  : 'border-l-[6px] border-l-green-500';
                const badgeClasses = isCertificate
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700';
                const label = isCertificate ? 'Atestado' : 'Receita';
                const formattedDate = new Date(document.issueDate).toLocaleString(
                  'pt-BR',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                );

                return (
                  <div
                    key={document.id}
                    className={`p-3 rounded-md transition border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 ${accentClasses}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-slate-100">
                          {document.patientName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          Emitido em: {formattedDate}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClasses}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 dark:text-slate-400 p-3">Nenhum documento emitido recentemente.</p>
            )}
          </div>
        )}

        {!isLoadingDocuments && !isDocumentsError && recentDocuments && recentDocuments.length > itemsPerPage && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Página <span className="font-medium">{currentPage}</span> de{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}










