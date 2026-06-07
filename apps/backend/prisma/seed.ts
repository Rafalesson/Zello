import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Executando seed.ts v.Final.SQL ---');
  console.log('Iniciando o processo de seeding completo...');

  // Truncate tables with RESTART IDENTITY CASCADE
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "DoctorProfile", "PatientProfile", "Address", "MedicalCertificate", "CidCode" RESTART IDENTITY CASCADE;`);
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