// Endereço: apps/frontend/src/components/templates/modern/index.tsx
'use client';

import { useContext } from 'react'; 
import { AuthContext } from '@/contexts/AuthProvider';
import { useAttestation, resolveSignatureImage } from '@/contexts/AttestationContext';
import styles from './style.module.css';
import { numberToWords } from '@/utils/date';
import Image from 'next/image';

export function ModernTemplate() {
  const { data: attestationData } = useAttestation();
  const { user } = useContext(AuthContext); 

  if (!attestationData || !attestationData.patient || !user || !user.doctorProfile) {
    return <div className="p-8 text-center text-red-600">Faltam dados para gerar o preview.</div>;
  }

  const {
    patient,
    purpose,
    durationInDays,
    cid,
    hasLegalRepresentative,
    legalRepresentative,
    legalRepresentativeCpf,
    signatureStyle,
    templateId,
  } = attestationData;
  const activeLegalRep = hasLegalRepresentative && legalRepresentative.trim().length > 0 ? legalRepresentative.trim() : null;
  const activeLegalRepCpf = hasLegalRepresentative && legalRepresentativeCpf.trim().length > 0 ? legalRepresentativeCpf.trim() : null;
  const signatureImgSrc = resolveSignatureImage(signatureStyle, templateId);
  const { name: doctorName, crm: doctorCrm, specialty } = user.doctorProfile;
  const startDate = new Date().toLocaleDateString('pt-BR');
  const issueDateTime = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image 
            src="/cfm-modern-header.png" 
            alt="Logotipo do Conselho Federal de Medicina" 
            width={165} 
            height={54} 
            className={styles.signatureMark} 
          />
        </div>
        <div className={styles.doctorInfo}>
          <p className={styles.doctorName}>{doctorName}</p>
          <p className={styles.doctorSpec}>{specialty || 'Clínico Geral'}</p>
          <p className={styles.doctorCrm}>CRM {doctorCrm}</p>
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.mainTitle}>Atestado Médico</h1>
        <p className={styles.mainText}>
          Atesto, para os devidos fins, que o(a) paciente <strong>{patient.name}</strong>, portador(a) do CPF nº <strong>{patient.cpf}</strong>
          {activeLegalRep && (
            <>, representado(a) legalmente por <strong>{activeLegalRep}</strong>{activeLegalRepCpf ? `, inscrito(a) no CPF nº ` : ''}{activeLegalRepCpf && <strong>{activeLegalRepCpf}</strong>}</>
          )}
          , necessita de <strong>{durationInDays} ({numberToWords(durationInDays)}) dia(s)</strong> de afastamento de suas atividades
          a partir de <strong>{startDate}</strong>, por motivos de saúde.
        </p>
        <div className={styles.details}>
          {activeLegalRep && (
            <div className={styles.detailItem}>
              <span>Representante Legal</span>
              <p>
                {activeLegalRep}
                <span className={styles.detailInlineMeta}> &bull; CPF: {activeLegalRepCpf || 'Não informado'}</span>
              </p>
            </div>
          )}
          <div className={styles.detailItem}><span>Finalidade</span><p>{purpose}</p></div>
          <div className={styles.detailItem}><span>CID-10</span><p>{cid ? `${cid.code} - ${cid.description}` : 'Não informado'}</p></div>
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerDetails}>
          <p>Emitido em: <strong>{issueDateTime}</strong></p>
          <p>
            Atendimento realizado conforme MP nº 2.200-2/2001, Resolução Nº CFM 2.299/2021,
            Resolução CFM Nº 2.381/2024 e Resolução CFM Nº 2.382/2024.
          </p>
          <p>Documento assinado digitalmente por <strong>{doctorName}</strong></p>
          <p>A autenticidade deste documento pode ser verificada pelo QR Code ou código de validação.</p>
          <p>Código de Validação: <strong>PRÉ-VISUALIZAÇÃO</strong></p>
        </div>
        <div className={styles.signatureImages}>
          <Image 
            src={signatureImgSrc} 
            alt="Selo ICP Brasil" 
            width={220} 
            height={78} 
            className={styles.icpSeal} 
          />
        </div>
      </footer>
    </div>
  );
}