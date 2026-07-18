import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Executando seed.ts v.Final.SQL ---');
  console.log('Iniciando o processo de seeding completo...');

  // Truncate tables with RESTART IDENTITY CASCADE
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "DoctorProfile", "PatientProfile", "Address", "MedicalCertificate", "CidCode", "LegalTerms" RESTART IDENTITY CASCADE;`);
  console.log('Tabelas limpas com sucesso.');

  // CID10 Seeding (keep your existing CID10 seeding logic)
  const cid10FilePath = path.join(__dirname, 'cid10.json');
  const cid10FileContent = fs.readFileSync(cid10FilePath, 'utf-8');
  const jsonData: any = JSON.parse(cid10FileContent);
  const cid10RawData: { code: string; display: string }[] = Array.isArray(jsonData) ? jsonData : jsonData.concept;
  if (!Array.isArray(cid10RawData)) { 
    throw new Error('Não foi possível encontrar uma lista (array) de CIDs.'); 
  }

  const cid10CleanData = cid10RawData.map(cid => ({
    code: cid.code,
    description: cid.display.replace(/<[^>]*>/g, '').trim(),
  }));

  const chunkSize = 1000;
  for (let i = 0; i < cid10CleanData.length; i += chunkSize) {
    const chunk = cid10CleanData.slice(i, i + chunkSize);
    const values = chunk.map(cid => `('${cid.code}', '${cid.description.replace(/'/g, "''")}')`).join(',');
    if (values) {
      await prisma.$executeRawUnsafe(`INSERT INTO "CidCode" (code, description) VALUES ${values}`);
    }
  }
  console.log(`Seeding de CIDs finalizado!`);

  console.log('Iniciando criação de usuários de teste...');
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Create Address for Doctor
  const doctorAddress = await prisma.address.create({
    data: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    }
  });

  // Create User and DoctorProfile in a single transaction
  const doctorUserWithProfile = await prisma.user.create({
    data: {
      email: 'medico@zello.com',
      phone: '11999999999',
      password: hashedPassword,
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          name: 'Dra. Barbara da Silva',
          crm: '12345SP',
          specialty: 'Cardiologia',
          status: 'APPROVED',
          addressId: doctorAddress.id
        }
      }
    }
  });
  console.log(`Médico de teste criado: ${doctorUserWithProfile.email}`);

  // Create Patient User and PatientProfile
  const patientUserWithProfile = await prisma.user.create({
    data: {
      email: 'paciente@zello.com',
      phone: '21999999999',
      password: hashedPassword,
      role: 'PATIENT',
      patientProfile: {
        create: {
          name: 'Livia Santos',
          cpf: '111.222.333-44',
          dateOfBirth: new Date('1990-05-15T00:00:00.000Z')
        }
      }
    }
  });
  console.log(`Paciente de teste criado: ${patientUserWithProfile.email}`);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@zello.com',
      phone: '00000000000',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });
  console.log(`Admin de teste criado: ${adminUser.email}`);

  // Create Initial Legal Terms (v1.0)
  const initialTermsContent = `1. Escopo do Atendimento Remoto
Este atendimento é realizado por meio de telemedicina, conforme regulamentação do Conselho Federal de Medicina (CFM). A consulta remota tem como objetivo oferecer orientação médica à distância, mas não substitui o atendimento presencial em situações de emergência ou que exijam exame físico.
O profissional de saúde poderá, a seu critério clínico, recomendar um atendimento presencial caso julgue necessário para a adequada avaliação do seu quadro.

2. Limitações da Telemedicina
A teleconsulta possui limitações inerentes, incluindo a impossibilidade de realização de exame físico direto. Por isso:
- Diagnósticos podem ser presuntivos e sujeitos a confirmação posterior.
- A qualidade da conexão de internet pode impactar a comunicação.
- Em caso de urgência ou emergência médica, procure atendimento presencial imediatamente.

3. Consentimento de Uso de Dados Sensíveis
Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD), informamos que os dados coletados durante esta consulta, incluindo dados pessoais sensíveis de saúde, serão tratados exclusivamente para:
- Prestação do atendimento médico solicitado.
- Registro em prontuário eletrônico conforme exigência legal.
- Emissão de receitas, atestados e documentos clínicos.
Seus dados não serão compartilhados com terceiros sem o seu consentimento expresso, exceto por obrigação legal ou regulatória.

4. Direitos do Paciente sob a LGPD
Você tem o direito de, a qualquer momento:
- Solicitar acesso aos seus dados pessoais armazenados.
- Solicitar a correção de dados incompletos ou incorretos.
- Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.
- Revogar o consentimento para tratamento de dados, ciente de que isso poderá impactar a continuidade do atendimento.`;

  await prisma.legalTerms.create({
    data: {
      version: 'v1.0',
      content: initialTermsContent,
      isActive: true,
    },
  });
  console.log('Termo de consentimento inicial v1.0 criado.');

  // Create active appointment for testing check-in
  const testAppointment = await prisma.appointment.create({
    data: {
      doctorProfileId: 1,
      patientProfileId: 1,
      date: new Date(), // scheduled now to allow immediate testing
      status: 'AGENDADA',
    },
  });
  console.log(`Consulta de teste criada com ID: ${testAppointment.id}`);

  console.log('Seeding completo!');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });