// src/app.module.ts (versÃ£o final com servidor de arquivos estÃ¡ticos)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CertificateModule } from './certificate/certificate.module';
import { PrescriptionModule } from './prescription/prescription.module';
import { PatientModule } from './patient/patient.module';
import { PdfModule } from './pdf/pdf.module';
import { TemplatesModule } from './templates/templates.module';
import { CidsModule } from './cids/cids.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentModule } from './appointment/appointment.module';
import { PreTriageModule } from './pre-triage/pre-triage.module';
import { ConsentModule } from './consent/consent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env'), '.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'storage'),
      serveRoot: '/storage',
    }),
    UserModule,
    PrismaModule,
    AuthModule,
    CertificateModule,
    PrescriptionModule,
    PatientModule,
    PdfModule,
    TemplatesModule,
    CidsModule,
    MailModule,
    AdminModule,
    AvailabilityModule,
    AppointmentModule,
    PreTriageModule,
    ConsentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
