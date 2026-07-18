import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { ConsentTermsController } from './consent-terms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsentController, ConsentTermsController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
