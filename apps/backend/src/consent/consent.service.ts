import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    appointmentId: number,
    accepted: boolean,
    termsVersion: string,
    ipAddress: string | null,
    userAgent: string | null,
  ) {
    const consentRecord = await this.prisma.consentRecord.create({
      data: {
        appointmentId,
        accepted,
        termsVersion,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(
      `CONSENT recorded for appointment ${appointmentId} with version ${termsVersion}`,
    );
    return consentRecord;
  }

  async findByAppointmentId(appointmentId: number) {
    return this.prisma.consentRecord.findUnique({
      where: { appointmentId },
    });
  }

  async getActiveTerms() {
    return this.prisma.legalTerms.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
