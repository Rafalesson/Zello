import { Module } from '@nestjs/common';
import { PreTriageService } from './pre-triage.service';
import { PreTriageController } from './pre-triage.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreTriageController],
  providers: [PreTriageService],
  exports: [PreTriageService],
})
export class PreTriageModule {}
