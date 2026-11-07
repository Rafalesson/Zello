// Endereço: apps/frontend/src/components/templates/default/index.tsx
'use-client';

import { useContext } from 'react'; 
import { AuthContext } from '@/contexts/AuthProvider';
import { useAttestation, resolveSignatureImage } from '@/contexts/AttestationContext';
import styles from './style.module.css';
import { calculateAge, numberToWords } from '@/utils/date';
import Image from 'next/image';

export function DefaultTemplate() {
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
  
  // MODIFICAÇÃO: Adicionada verificação para evitar passar 'undefined' para a função
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
    
  const issueDateTime = new Date().toLocaleString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const startDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div className={styles.certificateBody}>
      <header className={styles.header}>
        <Image
          src="/cfm-header.png"
          alt="Logotipo do Conselho Federal de Medicina"
          width={150}
          height={52}
          className={styles.cfmHeader}
        />
        <div className={styles.headerDoctor}>
          <h2 className={styles.doctorName}>{doctorName}</h2>
          <p className={styles.doctorDetails}>{specialty || 'Clínico Geral'} | CRM {doctorCrm}</p>
          <p className={styles.doctorDetails}>{formattedDoctorAddress} | {phone || 'Contato não informado'}</p>
        </div>
      </header>
      <main>
        <section className={styles.title}>
          <h1 className={styles.titleText}>ATESTADO MÉDICO</h1>
        </section>
        <section className={styles.patientInfo}>
          <div className={styles.patientDetailGroup}>
            <span><strong>Paciente:</strong> {patient.name}</span>
            <span><strong>CPF:</strong> {patient.cpf}</span>
          </div>
          <div className={styles.patientDetailGroup}>
            <span><strong>Idade:</strong> {patientAge} anos</span>
            <span><strong>Sexo:</strong> {patientSex}</span>
          </div>
        </section>
        {activeLegalRep && (
          <section className={`${styles.patientInfo} ${styles.legalRepBox}`}>
            <div className={styles.patientDetailGroup}>
              <span><strong>Representante Legal:</strong> {activeLegalRep}</span>
            </div>
            <div className={styles.patientDetailGroup}>
              <span><strong>CPF do Representante:</strong> {activeLegalRepCpf || 'Não informado'}</span>
            </div>
          </section>
        )}
        <section className={styles.content}>
          <p>
            Atesto, para os devidos fins, que o(a) paciente
            <strong> {patient.name}</strong>, portador(a) do CPF nº
            <strong> {patient.cpf}</strong>
            {activeLegalRep && (
              <>, representado(a) legalmente por <strong>{activeLegalRep}</strong>{activeLegalRepCpf ? `, inscrito(a) no CPF nº ` : ''}{activeLegalRepCpf && <strong>{activeLegalRepCpf}</strong>}</>
            )}
            , esteve sob meus cuidados
            profissionais na presente data, necessitando de
            <strong> {durationInDays} ({numberToWords(durationInDays)}) dia(s)</strong> de
            afastamento de suas atividades laborais/outras, a partir de
            <strong> {startDate}</strong>.
          </p>
          <p><strong>Finalidade:</strong> {purpose}</p>
          <p><strong>CID-10:</strong> {cid ? `${cid.code} - ${cid.description}` : 'Não informado'}</p>
        </section>
      </main>
      <footer className={styles.footer}>
        <div>
          <p>Emitido em {issueDateTime}</p>
          <p className={styles.footerP2}>
            Atendimento realizado via telemedicina, conforme MP nº 2.200-2/2001,
            <br />
            Resolução Nº CFM 2.299/2021, Resolução CFM Nº 2.381/2024 e Resolução
            CFM Nº 2.382/2024.
          </p>
          <p>
            Documento assinado digitalmente por {doctorName} <br />
            A validade deste documento pode ser verificada em www.validadordedocs.com.br <br />
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