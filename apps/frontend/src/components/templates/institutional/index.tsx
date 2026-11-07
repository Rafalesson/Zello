// Endereço: apps/frontend/src/components/templates/institutional/index.tsx
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthProvider';
import { useAttestation, resolveSignatureImage } from '@/contexts/AttestationContext';
import styles from './style.module.css';
import { calculateAge, numberToWords } from '@/utils/date';
import Image from 'next/image';

export function InstitutionalTemplate() {
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
    <div className={styles.instPage}>
      <div className={styles.instTopBar}></div>
      <header className={styles.instHeader}>
        <div className={styles.instBrand}>
          <Image
            src="/cfm-blue-header.png"
            alt="Logotipo do Conselho Federal de Medicina"
            width={165}
            height={54}
            className={styles.cfmHeader}
          />
        </div>
        <div className={styles.instDoctorBox}>
          <span className={styles.instBoxTag}>IDENTIFICAÇÃO DO MÉDICO EMITENTE</span>
          <h2 className={styles.doctorName}>{doctorName}</h2>
          <p className={styles.doctorMeta}>{specialty || 'Clínico Geral'} &bull; CRM {doctorCrm}</p>
          <p className={styles.doctorContact}>{formattedDoctorAddress} &bull; {phone || 'Contato não informado'}</p>
        </div>
      </header>

      <div className={styles.instTitleBanner}>
        <h1>ATESTADO MÉDICO</h1>
        <span className={styles.instProtocol}>REGISTRO Nº PRÉ-VISUALIZAÇÃO</span>
      </div>

      <main className={styles.instMain}>
        <section className={styles.instSection}>
          <div className={styles.instSectionHeader}>DADOS DE IDENTIFICAÇÃO DO PACIENTE</div>
          <div className={styles.instPatientGrid}>
            <div className={styles.instCell}>
              <span className={styles.instLabel}>NOME DO(A) PACIENTE</span>
              <span className={styles.instValue}>{patient.name}</span>
            </div>
            <div className={styles.instCell}>
              <span className={styles.instLabel}>CPF</span>
              <span className={styles.instValue}>{patient.cpf}</span>
            </div>
            <div className={styles.instCell}>
              <span className={styles.instLabel}>IDADE</span>
              <span className={styles.instValue}>{patientAge} anos</span>
            </div>
            <div className={styles.instCell}>
              <span className={styles.instLabel}>SEXO</span>
              <span className={styles.instValue}>{patientSex}</span>
            </div>
            {activeLegalRep && (
              <div className={styles.instRepGrid}>
                <div className={styles.instCell}>
                  <span className={styles.instLabel}>REPRESENTANTE LEGAL / RESPONSÁVEL</span>
                  <span className={styles.instValue}>{activeLegalRep}</span>
                </div>
                <div className={styles.instCell}>
                  <span className={styles.instLabel}>CPF DO REPRESENTANTE</span>
                  <span className={styles.instValue}>{activeLegalRepCpf || 'Não informado'}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles.instSection}>
          <div className={styles.instSectionHeader}>DECLARAÇÃO MÉDICA</div>
          <div className={styles.instDeclarationBox}>
            <p>
              Atesto, para os devidos fins de comprovação junto às instâncias competentes, que o(a) paciente
              <strong> {patient.name}</strong>, portador(a) do CPF nº <strong>{patient.cpf}</strong>
              {activeLegalRep && (
                <>, representado(a) legalmente por <strong>{activeLegalRep}</strong>{activeLegalRepCpf ? `, inscrito(a) no CPF nº ` : ''}{activeLegalRepCpf && <strong>{activeLegalRepCpf}</strong>}</>
              )}
              , esteve sob avaliação e cuidados médicos sob minha responsabilidade profissional na presente data,
              necessitando de <strong>{durationInDays} ({numberToWords(durationInDays)}) dia(s)</strong> de repouso e afastamento
              de suas atividades habituais, com início a partir de <strong>{startDate}</strong>.
            </p>
          </div>
        </section>

        <section className={styles.instMetaGrid}>
          <div className={styles.instMetaCard}>
            <span className={styles.instLabel}>FINALIDADE DO ATESTADO</span>
            <p className={styles.instMetaText}>{purpose}</p>
          </div>
          <div className={styles.instMetaCard}>
            <span className={styles.instLabel}>DIAGNÓSTICO (CID-10)</span>
            <p className={styles.instMetaText}>{cid ? `${cid.code} - ${cid.description}` : 'Não informado'}</p>
          </div>
        </section>

        <section className={styles.instSignBlock}>
          <div className={styles.instSignLine}></div>
          <p className={styles.instSignName}>{doctorName}</p>
          <p className={styles.instSignMeta}>{specialty || 'Clínico Geral'} &bull; CRM {doctorCrm}</p>
          <p className={styles.instSignNote}>Médico(a) Responsável &bull; Assinatura Digital ICP-Brasil</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInfo}>
          <p className={styles.footerIssued}>Emitido em {issueDateTime} (GMT-03)</p>
          <p className={styles.footerP2}>
            Atendimento realizado conforme MP nº 2.200-2/2001,
            <br />
            Resolução Nº CFM 2.299/2021, Resolução CFM Nº 2.381/2024 e Resolução
            CFM Nº 2.382/2024.
          </p>
          <p className={styles.footerValidation}>
            Documento assinado digitalmente por {doctorName} <br />
            A autenticidade deste documento pode ser verificada via QR Code ao lado. <br />
            Código de validação do documento: <strong>PRÉ-VISUALIZAÇÃO</strong>
          </p>
        </div>
        <div className={styles.containerImg}>
          <div className={styles.signatureContainer}>
            <Image
              src={signatureImgSrc}
              alt="Imagem da assinatura eletronica"
              width={200}
              height={74}
              className={styles.icpImg}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

