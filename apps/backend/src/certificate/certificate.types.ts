export interface CertificateData {
  doctorName: string;
  doctorCrm: string;
  doctorSpecialty?: string | null;
  doctorAddress?: string | null;
  doctorPhone?: string | null;
  patientName: string;
  patientCpf: string;
  patientAge: string;
  patientSex?: string | null;
  legalRepresentative?: string | null;
  legalRepresentativeCpf?: string | null;
  signatureStyle?: string | null;
  durationInDays: number;
  durationInWords: string;
  startDate: string;
  purpose: string;
  cidCode?: string | null;
  cidDescription?: string | null;
  issueDateTime: string;
  certificateId: string;
  qrCodeImage?: string | null;
  signatureImage?: string | null;
  signaturePngImage?: string | null;
}
