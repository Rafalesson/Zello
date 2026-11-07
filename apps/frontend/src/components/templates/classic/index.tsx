// Endereço: apps/frontend/src/components/templates/classic/index.tsx
'use client';

import { useContext } from 'react'; 
import { AuthContext } from '@/contexts/AuthProvider';
import { useAttestation, resolveSignatureImage } from '@/contexts/AttestationContext';
import styles from './style.module.css';
import { numberToWords } from '@/utils/date';
import Image from 'next/image';

export function ClassicTemplate() {
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
        <Image
          src="/cfm-header.png"
          alt="Logotipo do Conselho Federal de Medicina"
          width={145}
          height={50}
          className={styles.cfmHeader}
        />
        <div className={styles.doctorBlock}>
          <p className={styles.doctorName}>Dr(a). {doctorName}</p>
          <p className={styles.doctorDetails}>{specialty || 'Clínico Geral'}</p>
          <p className={styles.doctorDetails}>CRM {doctorCrm}</p>
        </div>
      </header>

      <h1 className={styles.mainTitle}>ATESTADO MÉDICO</h1>

      <main className={styles.mainContent}>
        <p>
          Atesto, para os devidos e legais fins, que o(a) paciente 
          <strong> {patient.name}</strong>, inscrito(a) no CPF sob o nº 
          <strong> {patient.cpf}</strong>
          {activeLegalRep && (
            <>, representado(a) legalmente por <strong>{activeLegalRep}</strong>{activeLegalRepCpf ? `, inscrito(a) no CPF nº ` : ''}{activeLegalRepCpf && <strong>{activeLegalRepCpf}</strong>}</>
          )}
          , encontra-se sob meus cuidados 
          profissionais, sendo-lhe necessário o afastamento de suas atividades 
          habituais por um período de <strong> {durationInDays} ({numberToWords(durationInDays)})</strong> dia(s), 
          a contar de <strong>{startDate}</strong>.
        </p>
        {activeLegalRep && (
          <p className={styles.detailLine}>
            <strong>Representante Legal:</strong> {activeLegalRep} &nbsp;|&nbsp; <strong>CPF:</strong> {activeLegalRepCpf || 'Não informado'}
          </p>
        )}
        <p className={styles.detailLine}><strong>Finalidade:</strong> {purpose}</p>
        <p className={styles.detailLine}><strong>CID-10:</strong> {cid ? `${cid.code} - ${cid.description}` : 'Não informado'}</p>
      </main>

      <footer className={styles.footer}>
        <div>
          <p>Emitido em {issueDateTime}</p>
          <p className={styles.footerP2}>
            Atendimento realizado conforme MP nº 2.200-2/2001,
            <br />
            Resolução Nº CFM 2.299/2021, Resolução CFM Nº 2.381/2024 e Resolução
            CFM Nº 2.382/2024.
          </p>
          <p>
            Documento assinado digitalmente por {doctorName} <br />
            A autenticidade deste documento pode ser verificada via QR Code ou endereço de validação. <br />
            Código de validação do documento: <strong>PRÉ-VISUALIZAÇÃO</strong>
          </p>
        </div>
        <div className={styles.containerImg}>
          <Image
            src={signatureImgSrc}
            alt="Imagem da assinatura eletronica"
            width={220}
            height={78}
            className={styles.icpImg}
          />
        </div>
      </footer>
    </div>
  );
}