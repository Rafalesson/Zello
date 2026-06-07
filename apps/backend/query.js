const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const availabilities = await prisma.availability.findMany();
  console.log(availabilities);
}
main().catch(console.error).finally(() => prisma.$disconnect());
