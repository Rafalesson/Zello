// apps/frontend/src/hooks/useCertificatePreview.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAttestation } from '@/contexts/AttestationContext';
import { api } from '@/services/api';
import { AxiosError } from 'axios';

export function useCertificatePreview() {
  const router = useRouter();
  const { data: formData } = useAttestation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!formData) {
      router.replace('/medico/atestados/novo');
      return;
    }

    const fetchPreview = async () => {
      setIsLoading(true);
      try {
        const response = await api.post('/certificates/preview', formData, {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(response.data);
        setPdfUrl(url);
      } catch (error: unknown) {
        console.error('Erro ao gerar preview do PDF:', error);
        
        if (error instanceof AxiosError && error.response?.data instanceof Blob) {
          error.response.data.text().then((text: string) => {
            try {
              const parsedError = JSON.parse(text);
              alert(`Erro: ${parsedError.message || 'Não foi possível gerar a pré-visualização.'}`);
            } catch { 
              alert('Não foi possível gerar a pré-visualização. Ocorreu um erro inesperado.');
            }
          });
        } else {
          // MODIFICAÇÃO: Adicionada asserção de tipo para garantir que 'message' existe
          const errorMessage = ((error as AxiosError)?.response?.data as { message?: string })?.message || 'Não foi possível gerar a pré-visualização.';
          alert(`Erro: ${errorMessage}`);
        }

        router.push('/medico/atestados/novo');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [formData, router, pdfUrl]); 

  return { isLoading, pdfUrl, formData };
}