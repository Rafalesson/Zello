import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.doctorProfile.findFirst({
    where: { name: { contains: 'Barbara' } }
  });

  if (!doctor) {
    console.log('Médico de teste não encontrado. Por favor, rode o seed padrão do projeto antes.');
    return;
  }

  // Atualiza para APPROVED
  await prisma.doctorProfile.update({
    where: { id: doctor.id },
    data: { status: 'APPROVED' }
  });
  console.log(`Médico "${doctor.name}" atualizado para APPROVED.`);

  // Adiciona horários de disponibilidade de exemplo: Segunda (1), Terça (2) e Sexta (5)
  const days = [1, 2, 5];
  for (const day of days) {
    await prisma.availability.upsert({
      where: {
        doctorProfileId_dayOfWeek_startTime: {
          doctorProfileId: doctor.id,
          dayOfWeek: day,
          startTime: '09:00'
        }
      },
      update: {
        endTime: '12:00',
        isActive: true
      },
      create: {
        doctorProfileId: doctor.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '12:00',
        isActive: true
      }
    });
  }
  console.log('Disponibilidades criadas com sucesso para a médica de teste.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
