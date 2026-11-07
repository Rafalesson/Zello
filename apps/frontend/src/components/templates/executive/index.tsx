// Endereço: apps/frontend/src/components/templates/executive/index.tsx
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthProvider';
import { useAttestation, resolveSignatureImage } from '@/contexts/AttestationContext';
import styles from './style.module.css';
import { calculateAge, numberToWords } from '@/utils/date';
import Image from 'next/image';

export function ExecutiveTemplate() {
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
  const { name: doctorName, crm: doctorCrm, specialty, address, phone } = user.doctorProfile;

  const patientAge = patient.patientProfile?.dateOfBirth
    ? calculateAge(patient.patientProfile.dateOfBirth)
    : 'N/A';

  const getDisplaySex = (sex: 'MALE' | 'FEMALE' | 'OTHER' | null | undefined) => {
    if (!sex) return 'Não informado';
    switch (sex) {
      case 'MALE':
        return 'Masculino';
      case 'FEMALE':
        return 'Feminino';
      default:
        return 'Outro';
    }
  };

  const patientSex = getDisplaySex(patient.patientProfile?.sex);

  const formattedDoctorAddress = address
    ? `${address.street}, ${address.number} - ${address.city}, ${address.state}`
    : 'Endereço não informado';

  const issueDateTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const startDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div className={styles.execContainer}>
      <header className={styles.execHeader}>
        <div className={styles.execBrand}>
          <Image
            src="/cfm-executive-header.png"
            alt="Logotipo do Conselho Federal de Medicina"
            width={185}
            height={62}
            className={styles.cfmHeader}
          />
        </div>
        <div className={styles.execDoctor}>
          <h2 className={styles.doctorName}>{doctorName}</h2>
          <p className={styles.doctorSpec}>{specialty || 'Clínico Geral'} &bull; CRM {doctorCrm}</p>
          <p className={styles.doctorContact}>{formattedDoctorAddress} | {phone || 'Contato não informado'}</p>
        </div>
      </header>

      <main className={styles.execMain}>
        <div className={styles.execTitleBlock}>
          <h1 className={styles.execTitle}>ATESTADO MÉDICO</h1>
          <p className={styles.execSubtitle}>Certificação Clínica de Atendimento e Recomendação de Afastamento</p>
        </div>

        <section className={styles.execCard}>
          <div className={styles.execCardHeader}>DADOS DE IDENTIFICAÇÃO DO(A) PACIENTE</div>
          <div className={styles.execPatientGrid}>
            <div className={styles.execCell}>
              <span className={styles.execLabel}>Nome do(a) Paciente</span>
              <span className={styles.execVal}>{patient.name}</span>
            </div>
            <div className={styles.execCell}>
              <span className={styles.execLabel}>CPF</span>
              <span className={styles.execVal}>{patient.cpf}</span>
            </div>
            <div className={styles.execCell}>
              <span className={styles.execLabel}>Idade</span>
              <span className={styles.execVal}>{patientAge} anos</span>
            </div>
            <div className={styles.execCell}>
              <span className={styles.execLabel}>Sexo</span>
              <span className={styles.execVal}>{patientSex}</span>
            </div>
          </div>
        </section>

        {activeLegalRep && (
          <section className={styles.execCard}>
            <div className={styles.execCardHeader}>DADOS DO REPRESENTANTE LEGAL / RESPONSÁVEL</div>
            <div className={styles.execPatientGrid}>
              <div className={styles.execCell}>
                <span className={styles.execLabel}>Representante Legal</span>
                <span className={styles.execVal}>{activeLegalRep}</span>
              </div>
              <div className={styles.execCell}>
                <span className={styles.execLabel}>CPF do Representante</span>
                <span className={styles.execVal}>{activeLegalRepCpf || 'Não informado'}</span>
              </div>
            </div>
          </section>
        )}

        <section className={styles.execStatementBox}>
          <div className={styles.execStatementHeader}>DECLARAÇÃO CLÍNICA</div>
          <p className={styles.execStatement}>
            Atesto, para os devidos fins, que o(a) paciente <strong>{patient.name}</strong>,
            portador(a) do CPF nº <strong>{patient.cpf}</strong>
            {activeLegalRep && (
              <>, representado(a) legalmente por <strong>{activeLegalRep}</strong>{activeLegalRepCpf ? `, inscrito(a) no CPF sob o nº ` : ''}{activeLegalRepCpf && <strong>{activeLegalRepCpf}</strong>}</>
            )}
            , esteve sob meus cuidados profissionais nesta data, necessitando de
            <strong> {durationInDays} ({numberToWords(durationInDays)}) dia(s)</strong> de afastamento
            de suas atividades laborais/habituais, a partir de <strong>{startDate}</strong>, por motivos de saúde.
          </p>
        </section>

        <section className={styles.execCard}>
          <div className={styles.execCardHeader}>SÍNTESE E ESPECIFICAÇÕES DO ATENDIMENTO</div>
          <div className={styles.execPatientGrid}>
            <div className={styles.execCell}>
              <span className={styles.execLabel}>Período de Afastamento</span>
              <span className={styles.execVal}>
                {durationInDays} ({numberToWords(durationInDays)}) dia(s) &mdash; Início: {startDate}
              </span>
            </div>
            <div className={styles.execCell}>
              <span className={styles.execLabel}>Codificação CID-10</span>
              <span className={styles.execVal}>{cid ? `${cid.code} - ${cid.description}` : 'Não informado'}</span>
            </div>
            <div className={`${styles.execCell} ${styles.execCellFull}`}>
              <span className={styles.execLabel}>Finalidade do Documento</span>
              <span className={styles.execVal}>{purpose}</span>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.execFooterText}>
          <p className={styles.execIssued}>Emitido em {issueDateTime} (GMT-03)</p>
          <p className={styles.footerP2}>
            Atendimento realizado conforme MP nº 2.200-2/2001,
            <br />
            Resolução Nº CFM 2.299/2021, Resolução CFM Nº 2.381/2024 e Resolução
            CFM Nº 2.382/2024.
          </p>
          <p>
            Documento assinado digitalmente por {doctorName} <br />
            A autenticidade deste documento pode ser verificada no endereço de validação ou lendo o QR Code abaixo. <br />
            Código de validação do documento: <strong>PRÉ-VISUALIZAÇÃO</strong>
          </p>
        </div>
        <div className={styles.containerImg}>
          <div className={styles.signatureContainer}>
            <Image
              src={signatureImgSrc}
              alt="Imagem da assinatura eletronica"
              width={210}
              height={76}
              className={styles.icpImg}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

