// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Executes a callback within a Prisma interactive transaction,
   * acquiring a row-level exclusive lock (SELECT ... FOR UPDATE)
   * on the specified table row with the given ID before running the callback.
   *
   * This prevents TOCTOU race conditions by ensuring that concurrent
   * requests serialize on the same entity row.
   *
   * @param id - The row ID to lock
   * @param callback - The transactional logic to execute after acquiring the lock
   * @param table - The table to lock (defaults to 'Appointment')
   * @returns The result of the callback
   */
  async runInTransactionWithLock<T>(
    id: number,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    table: 'Appointment' | 'DoctorProfile' | 'PatientProfile' = 'Appointment',
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      if (table === 'Appointment') {
        await tx.$executeRaw`SELECT id FROM "Appointment" WHERE id = ${id} FOR UPDATE`;
      } else if (table === 'DoctorProfile') {
        await tx.$executeRaw`SELECT id FROM "DoctorProfile" WHERE id = ${id} FOR UPDATE`;
      } else if (table === 'PatientProfile') {
        await tx.$executeRaw`SELECT id FROM "PatientProfile" WHERE id = ${id} FOR UPDATE`;
      }
      return callback(tx);
    });
  }
}
