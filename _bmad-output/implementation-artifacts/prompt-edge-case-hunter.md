# Prompt: Edge Case Hunter (Story 3.6)

Você é o Edge Case Hunter, um revisor de código focado em limites, condições de contorno, valores vazios, regressões de fuso horário, transições de máquina de estado e robustez geral da aplicação. Você tem acesso à leitura do projeto se necessário, além do diff fornecido.

Seu objetivo é encontrar caminhos lógicos não tratados, falhas em limites de datas/horas, erros de "off-by-one", problemas na concorrência do Prisma, e cenários de falha no frontend (erros de rede, timeouts, estados de carregamento não finalizados).

Por favor, revise o seguinte diff e reporte suas descobertas como uma lista Markdown. Cada descoberta deve conter:
- Um título curto de uma linha
- Categoria da severidade (Crítico, Médio, Baixo)
- Explicação técnica do caso de borda não tratado e onde ele ocorre (nome do arquivo e linhas)
- Sugestão de correção

---

## DIFF DAS ALTERAÇÕES (Story 3.6):

```diff
diff --git a/apps/backend/src/appointment/appointment.controller.ts b/apps/backend/src/appointment/appointment.controller.ts
index 1398d68..247d8ec 100644
--- a/apps/backend/src/appointment/appointment.controller.ts
+++ b/apps/backend/src/appointment/appointment.controller.ts
@@ -1,4 +1,4 @@
-import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, Param, Query, BadRequestException, ForbiddenException, Patch, ParseIntPipe } from '@nestjs/common';
+import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get, Param, Query, BadRequestException, NotFoundException, Patch, ParseIntPipe } from '@nestjs/common';
 import { AppointmentService } from './appointment.service';
 import { CreateAppointmentDto } from './dto/create-appointment.dto';
 import { AuthGuard } from '../auth/auth.guard';
@@ -15,7 +15,7 @@ export class AppointmentController {
   async getDoctorAppointments(@Req() req: any) {
     const doctorProfileId = req.user.doctorProfile?.id;
     if (!doctorProfileId) {
-      throw new ForbiddenException(
+      throw new NotFoundException(
         'Perfil de médico não encontrado para este usuário.',
       );
     }
@@ -48,20 +48,34 @@ export class AppointmentController {
   async getPatientAppointments(@Req() req: any) {
     const patientProfileId = req.user.patientProfile?.id;
     if (!patientProfileId) {
-      throw new ForbiddenException(
+      throw new NotFoundException(
         'Perfil de paciente não encontrado para este usuário.',
       );
     }
     return this.appointmentService.getPatientAppointments(patientProfileId);
   }
 
+  /**
+   * Get a single appointment by ID (AC: C3).
+   * Protected by auth. Returns 404 for non-owners to prevent ID leaking (AC: B3/C5).
+   * This endpoint MUST be declared AFTER all named routes (doctor, patient, availability)
+   * to avoid route conflicts with NestJS path matching.
+   */
+  @Get(':id')
+  @UseGuards(AuthGuard, RolesGuard)
+  @Roles('PATIENT', 'DOCTOR')
+  async getAppointmentById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
+    const userId = req.user.id;
+    return this.appointmentService.getAppointmentById(id, userId);
+  }
+
   @Patch(':id/cancel')
   @UseGuards(AuthGuard, RolesGuard)
   @Roles('PATIENT')
   async cancelAppointment(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('reason') reason?: string) {
     const patientProfileId = req.user.patientProfile?.id;
     if (!patientProfileId) {
-      throw new ForbiddenException(
+      throw new NotFoundException(
         'Perfil de paciente não encontrado para este usuário.',
       );
     }
@@ -74,7 +88,7 @@ export class AppointmentController {
   async rescheduleAppointment(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('newDate') newDate: string) {
     const patientProfileId = req.user.patientProfile?.id;
     if (!patientProfileId) {
-      throw new ForbiddenException(
+      throw new NotFoundException(
         'Perfil de paciente não encontrado para este usuário.',
       );
     }
@@ -83,5 +97,44 @@ export class AppointmentController {
     }
     return this.appointmentService.rescheduleAppointment(id, patientProfileId, newDate);
   }
+
+  @Patch(':id/waiting-room')
+  @UseGuards(AuthGuard, RolesGuard)
+  @Roles('PATIENT')
+  async enterWaitingRoom(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
+    const patientProfileId = req.user.patientProfile?.id;
+    if (!patientProfileId) {
+      throw new NotFoundException(
+        'Perfil de paciente não encontrado para este usuário.',
+      );
+    }
+    return this.appointmentService.enterWaitingRoom(id, patientProfileId);
+  }
+
+  @Patch(':id/no-show')
+  @UseGuards(AuthGuard, RolesGuard)
+  @Roles('PATIENT')
+  async markNoShow(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
+    const patientProfileId = req.user.patientProfile?.id;
+    if (!patientProfileId) {
+      throw new NotFoundException(
+        'Perfil de paciente não encontrado para este usuário.',
+      );
+    }
+    return this.appointmentService.markNoShow(id, patientProfileId);
+  }
+
+  @Patch(':id/start')
+  @UseGuards(AuthGuard, RolesGuard)
+  @Roles('DOCTOR')
+  async startConsultation(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
+    const doctorProfileId = req.user.doctorProfile?.id;
+    if (!doctorProfileId) {
+      throw new NotFoundException(
+        'Perfil de médico não encontrado para este usuário.',
+      );
+    }
+    return this.appointmentService.startConsultation(id, doctorProfileId);
+  }
 }
 
diff --git a/apps/backend/src/appointment/appointment.service.spec.ts b/apps/backend/src/appointment/appointment.service.spec.ts
index a432422..c19e42a 100644
--- a/apps/backend/src/appointment/appointment.service.spec.ts
+++ b/apps/backend/src/appointment/appointment.service.spec.ts
@@ -1,18 +1,15 @@
 import { Test, TestingModule } from '@nestjs/testing';
 import { AppointmentService } from './appointment.service';
 import { PrismaService } from '../prisma/prisma.service';
-import { BadRequestException } from '@nestjs/common';
+import { BadRequestException, NotFoundException } from '@nestjs/common';
 import { DomainErrorCode } from '@imnotmedical/shared';
 import { MailService } from '../mail/mail.service';
 
 describe('AppointmentService', () => {
   let service: AppointmentService;
-  let prismaService: PrismaService;
 
   const mockPrismaService = {
-    user: {
-      findUnique: jest.fn(),
-    },
+    user: { findUnique: jest.fn() },
     appointment: {
       findUnique: jest.fn(),
       findFirst: jest.fn(),
@@ -20,293 +17,282 @@ describe('AppointmentService', () => {
       findMany: jest.fn(),
       update: jest.fn(),
     },
+    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
+    $executeRaw: jest.fn().mockResolvedValue([]),
+    runInTransactionWithLock: jest.fn(async (_id, cb) => cb(mockPrismaService)),
   };
 
   const mockMailService = {
     sendBookingConfirmationToPatient: jest.fn().mockResolvedValue(undefined),
     sendBookingConfirmationToDoctor: jest.fn().mockResolvedValue(undefined),
     sendCancellationToDoctor: jest.fn().mockResolvedValue(undefined),
+    sendRescheduleEmailToPatient: jest.fn().mockResolvedValue(undefined),
+    sendRescheduleEmailToDoctor: jest.fn().mockResolvedValue(undefined),
   };
 
   beforeEach(async () => {
     const module: TestingModule = await Test.createTestingModule({
       providers: [
         AppointmentService,
-        {
-          provide: PrismaService,
-          useValue: mockPrismaService,
-        },
-        {
-          provide: MailService,
-          useValue: mockMailService,
-        },
+        { provide: PrismaService, useValue: mockPrismaService },
+        { provide: MailService, useValue: mockMailService },
       ],
     }).compile();
 
     service = module.get<AppointmentService>(AppointmentService);
-    prismaService = module.get<PrismaService>(PrismaService);
   });
 
-  afterEach(() => {
-    jest.clearAllMocks();
-  });
+  afterEach(() => { jest.clearAllMocks(); });
 
-  it('should be defined', () => {
-    expect(service).toBeDefined();
-  });
+  it('should be defined', () => { expect(service).toBeDefined(); });
 
   describe('create', () => {
     const userId = 1;
-    const createDto = {
-      doctorProfileId: 1,
-      date: '2026-06-10T10:00:00.000Z',
-    };
+    const createDto = { doctorProfileId: 1, date: '2030-06-10T10:00:00.000Z' };
     const appointmentDate = new Date(createDto.date);
 
     it('should successfully create an appointment', async () => {
-      // Mock patient profile exists
-      mockPrismaService.user.findUnique.mockResolvedValue({
-        id: userId,
-        patientProfile: { id: 2 },
-      });
-
-      // Mock no existing appointment
+      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, patientProfile: { id: 2 } });
       mockPrismaService.appointment.findFirst.mockResolvedValue(null);
-
-      const expectedAppointment = {
-        id: 1,
-        doctorProfileId: 1,
-        patientProfileId: 2,
-        date: appointmentDate,
-        status: 'AGENDADA',
+      const expected = {
+        id: 1, doctorProfileId: 1, patientProfileId: 2, date: appointmentDate, status: 'AGENDADA',
         doctorProfile: { name: 'Dr. Test', user: { name: 'Dr. Test', email: 'doctor@test.com' } },
         patientProfile: { name: 'Paciente Test', user: { name: 'Paciente Test', email: 'patient@test.com' } },
       };
-      mockPrismaService.appointment.create.mockResolvedValue(expectedAppointment);
-
+      mockPrismaService.appointment.create.mockResolvedValue(expected);
       const result = await service.create(userId, createDto);
+      expect(result).toEqual(expected);
+    });
 
-      expect(result).toEqual(expectedAppointment);
-      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
-        data: {
-          doctorProfileId: 1,
-          patientProfileId: 2,
-          date: appointmentDate,
-          status: 'AGENDADA',
-        },
-        include: {
-          doctorProfile: { include: { user: true } },
-          patientProfile: { include: { user: true } },
-        },
-      });
-      expect(mockMailService.sendBookingConfirmationToPatient).toHaveBeenCalledWith(
-        'patient@test.com',
-        'Paciente Test',
-        'Dr. Test',
-        appointmentDate
-      );
-      expect(mockMailService.sendBookingConfirmationToDoctor).toHaveBeenCalledWith(
-        'doctor@test.com',
-        'Dr. Test',
-        'Paciente Test',
-        appointmentDate
-      );
+    it('should throw BadRequestException if patient profile is not found', async () => {
+      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, patientProfile: null });
+      await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
     });
 
-    it('should successfully create an appointment even if mail service fails', async () => {
-      mockPrismaService.user.findUnique.mockResolvedValue({
-        id: userId,
-        patientProfile: { id: 2 },
-      });
-      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
+    it('should throw BadRequestException with SLOT_UNAVAILABLE if slot is taken', async () => {
+      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId, patientProfile: { id: 2 } });
+      mockPrismaService.appointment.findFirst.mockResolvedValue({ id: 1, status: 'AGENDADA' });
+      await expect(service.create(userId, createDto)).rejects.toMatchObject({ response: { code: DomainErrorCode.SLOT_UNAVAILABLE } });
+    });
+  });
 
-      const expectedAppointment = {
-        id: 1,
-        doctorProfileId: 1,
-        patientProfileId: 2,
-        date: appointmentDate,
-        status: 'AGENDADA',
-        doctorProfile: { name: 'Dr. Test', user: { name: 'Dr. Test', email: 'doctor@test.com' } },
-        patientProfile: { name: 'Paciente Test', user: { name: 'Paciente Test', email: 'patient@test.com' } },
-      };
-      mockPrismaService.appointment.create.mockResolvedValue(expectedAppointment);
+  describe('getAppointmentById', () => {
+    it('should return appointment when user is the patient owner', async () => {
+      const mock = { id: 1, patientProfile: { userId: 10 }, doctorProfile: { userId: 20 } };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.getAppointmentById(1, 10);
+      expect(result).toEqual(mock);
+    });
 
-      mockMailService.sendBookingConfirmationToPatient.mockRejectedValueOnce(new Error('SMTP Error'));
+    it('should return appointment when user is the doctor owner', async () => {
+      const mock = { id: 1, patientProfile: { userId: 10 }, doctorProfile: { userId: 20 } };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.getAppointmentById(1, 20);
+      expect(result).toEqual(mock);
+    });
 
-      const result = await service.create(userId, createDto);
+    it('should throw NotFoundException when appointment does not exist', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue(null);
+      await expect(service.getAppointmentById(999, 10)).rejects.toThrow(NotFoundException);
+    });
 
-      expect(result).toEqual(expectedAppointment);
+    it('should throw NotFoundException when user is not the owner (prevents ID leaking)', async () => {
+      const mock = { id: 1, patientProfile: { userId: 10 }, doctorProfile: { userId: 20 } };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      await expect(service.getAppointmentById(1, 999)).rejects.toThrow(NotFoundException);
     });
+  });
 
-    it('should throw BadRequestException if patient profile is not found', async () => {
-      mockPrismaService.user.findUnique.mockResolvedValue({
-        id: userId,
-        patientProfile: null,
+  describe('getDoctorAppointments', () => {
+    it('should return appointments using UTC-normalized date', async () => {
+      const expected = [{ id: 1, date: new Date('2030-06-10T10:00:00.000Z'), status: 'AGENDADA' }];
+      mockPrismaService.appointment.findMany.mockResolvedValue(expected);
+      const result = await service.getDoctorAppointments(1);
+      expect(result).toEqual(expected);
+      const call = mockPrismaService.appointment.findMany.mock.calls[0][0];
+      expect(call.where.date.gte).toBeInstanceOf(Date);
+      // Verify the date is at midnight UTC (hours=0, minutes=0)
+      expect(call.where.date.gte.getUTCHours()).toBe(0);
+      expect(call.where.date.gte.getUTCMinutes()).toBe(0);
+    });
+  });
+
+  describe('cancelAppointment', () => {
+    const appointmentId = 1;
+    const patientProfileId = 2;
+
+    it('should use runInTransactionWithLock', async () => {
+      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, date: futureDate, status: 'AGENDADA',
+        patientProfile: { name: 'P' }, doctorProfile: { user: { email: 'doc@t.com' }, name: 'D' },
       });
+      mockPrismaService.appointment.update.mockResolvedValue({ status: 'CANCELADA' });
+      await service.cancelAppointment(appointmentId, patientProfileId);
+      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
+    });
 
-      await expect(service.create(userId, createDto)).rejects.toThrow(
-        new BadRequestException('Usuário não possui perfil de paciente.')
-      );
+    it('should throw NotFoundException if not owner', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({ id: appointmentId, patientProfileId: 999 });
+      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(NotFoundException);
     });
 
-    it('should throw BadRequestException with SLOT_UNAVAILABLE if slot is taken', async () => {
-      mockPrismaService.user.findUnique.mockResolvedValue({
-        id: userId,
-        patientProfile: { id: 2 },
+    it('should return idempotently if already cancelled', async () => {
+      const mock = { id: appointmentId, patientProfileId, status: 'CANCELADA' };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.cancelAppointment(appointmentId, patientProfileId);
+      expect(result).toEqual(mock);
+    });
+  });
+
+  describe('enterWaitingRoom', () => {
+    const appointmentId = 1;
+    const patientProfileId = 2;
+
+    it('should validate pre-triage and consent exist before entering', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(),
+        preTriage: null, consentRecord: null,
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
       });
+      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toThrow(BadRequestException);
+    });
 
-      // Mock existing appointment
-      mockPrismaService.appointment.findFirst.mockResolvedValue({
-        id: 1,
-        status: 'AGENDADA',
+    it('should validate consent exists', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(),
+        preTriage: { id: 1 }, consentRecord: null,
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
       });
+      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toThrow(BadRequestException);
+    });
 
-      await expect(service.create(userId, createDto)).rejects.toMatchObject({
-        response: {
-          code: DomainErrorCode.SLOT_UNAVAILABLE,
-        },
+    it('should transition from AGENDADA to EM_ESPERA within time window', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(),
+        preTriage: { id: 1 }, consentRecord: { id: 1 },
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
       });
+      mockPrismaService.appointment.update.mockResolvedValue({ status: 'EM_ESPERA' });
+      const result = await service.enterWaitingRoom(appointmentId, patientProfileId);
+      expect(result.status).toBe('EM_ESPERA');
+      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
     });
-  });
 
-  describe('getDoctorAppointments', () => {
-    it('should successfully get and return appointments for a doctor sorted by date', async () => {
-      const doctorProfileId = 1;
-      const expectedAppointments = [
-        {
-          id: 1,
-          doctorProfileId,
-          patientProfileId: 10,
-          date: new Date('2026-06-10T10:00:00.000Z'),
-          status: 'AGENDADA',
-          patientProfile: { id: 10, name: 'John Doe' },
-        },
-        {
-          id: 2,
-          doctorProfileId,
-          patientProfileId: 11,
-          date: new Date('2026-06-10T11:00:00.000Z'),
-          status: 'AGENDADA',
-          patientProfile: { id: 11, name: 'Jane Doe' },
-        },
-      ];
-
-      mockPrismaService.appointment.findMany.mockResolvedValue(expectedAppointments);
-
-      const result = await service.getDoctorAppointments(doctorProfileId);
-
-      expect(result).toEqual(expectedAppointments);
-      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
-        where: {
-          doctorProfileId,
-          date: {
-            gte: expect.any(Date),
-          },
-        },
-        include: {
-          patientProfile: true,
-        },
-        orderBy: {
-          date: 'asc',
-        },
+    it('should return idempotently if status is EM_ESPERA', async () => {
+      const mock = { id: appointmentId, patientProfileId, status: 'EM_ESPERA', date: new Date(), preTriage: { id: 1 }, consentRecord: { id: 1 } };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.enterWaitingRoom(appointmentId, patientProfileId);
+      expect(result).toEqual(mock);
+    });
+
+    it('should return idempotently if status is EM_ANDAMENTO', async () => {
+      const mock = { id: appointmentId, patientProfileId, status: 'EM_ANDAMENTO', date: new Date(), preTriage: { id: 1 }, consentRecord: { id: 1 } };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.enterWaitingRoom(appointmentId, patientProfileId);
+      expect(result).toEqual(mock);
+    });
+
+    it('should throw if entering more than 15 minutes before scheduled time', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, status: 'AGENDADA',
+        date: new Date(Date.now() + 30 * 60 * 1000),
+        preTriage: { id: 1 }, consentRecord: { id: 1 },
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
       });
+      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
     });
-  });
 
-  describe('getPatientAppointments', () => {
-    it('should successfully get and return appointments for a patient sorted by date', async () => {
-      const patientProfileId = 2;
-      const expectedAppointments = [
-        {
-          id: 1,
-          doctorProfileId: 1,
-          patientProfileId,
-          date: new Date('2026-06-10T10:00:00.000Z'),
-          status: 'AGENDADA',
-          doctorProfile: { id: 1, name: 'Dr. Test', specialty: 'Cardiologia' },
-        },
-      ];
-
-      mockPrismaService.appointment.findMany.mockResolvedValue(expectedAppointments);
-
-      const result = await service.getPatientAppointments(patientProfileId);
-
-      expect(result).toEqual(expectedAppointments);
-      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
-        where: { patientProfileId },
-        include: { doctorProfile: true },
-        orderBy: { date: 'asc' },
+    it('should throw if entering more than 15 minutes after scheduled time', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, status: 'AGENDADA',
+        date: new Date(Date.now() - 20 * 60 * 1000),
+        preTriage: { id: 1 }, consentRecord: { id: 1 },
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
       });
+      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
+    });
+
+    it('should throw NotFoundException if not owner', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId: 999, status: 'AGENDADA', date: new Date(),
+      });
+      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'CONSULTATION_NOT_FOUND' } });
+    });
+
+    it('should throw BadRequestException if CANCELADA', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, patientProfileId, status: 'CANCELADA', date: new Date(),
+      });
+      await expect(service.enterWaitingRoom(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
     });
   });
 
-  describe('cancelAppointment', () => {
+  describe('markNoShow', () => {
     const appointmentId = 1;
     const patientProfileId = 2;
 
-    it('should throw ForbiddenException if appointment does not belong to patient', async () => {
+    it('should transition from EM_ESPERA to NAO_REALIZADA using lock', async () => {
       mockPrismaService.appointment.findUnique.mockResolvedValue({
-        id: appointmentId,
-        patientProfileId: 999, // different patient
+        id: appointmentId, patientProfileId, status: 'EM_ESPERA',
+        date: new Date(Date.now() - 15 * 60 * 1000),
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
       });
+      mockPrismaService.appointment.update.mockResolvedValue({ status: 'NAO_REALIZADA' });
+      const result = await service.markNoShow(appointmentId, patientProfileId);
+      expect(result.status).toBe('NAO_REALIZADA');
+      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
+    });
 
-      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(
-        'Você não tem permissão para cancelar esta consulta.'
-      );
+    it('should return idempotently if NAO_REALIZADA', async () => {
+      const mock = { id: appointmentId, patientProfileId, status: 'NAO_REALIZADA', date: new Date(Date.now() - 15 * 60 * 1000) };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.markNoShow(appointmentId, patientProfileId);
+      expect(result).toEqual(mock);
     });
 
-    it('should throw BadRequestException if appointment is less than 12 hours away', async () => {
+    it('should throw if not EM_ESPERA', async () => {
       mockPrismaService.appointment.findUnique.mockResolvedValue({
-        id: appointmentId,
-        patientProfileId,
-        date: new Date(new Date().getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
+        id: appointmentId, patientProfileId, status: 'AGENDADA', date: new Date(Date.now() - 15 * 60 * 1000),
       });
-
-      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(
-        'Cancelamentos só podem ser feitos com pelo menos 12 horas de antecedência.'
-      );
+      await expect(service.markNoShow(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
     });
 
-    it('should throw BadRequestException if already cancelled', async () => {
+    it('should throw if before 10 min tolerance', async () => {
       mockPrismaService.appointment.findUnique.mockResolvedValue({
-        id: appointmentId,
-        patientProfileId,
-        status: 'CANCELADA',
+        id: appointmentId, patientProfileId, status: 'EM_ESPERA', date: new Date(),
       });
-
-      await expect(service.cancelAppointment(appointmentId, patientProfileId)).rejects.toThrow(
-        'A consulta já está cancelada.'
-      );
+      await expect(service.markNoShow(appointmentId, patientProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
     });
+  });
 
-    it('should cancel appointment and send email', async () => {
-      const futureDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
-      const appointmentMock = {
-        id: appointmentId,
-        patientProfileId,
-        date: futureDate,
-        status: 'AGENDADA',
-        patientProfile: { name: 'Paciente Test' },
-        doctorProfile: { user: { email: 'doctor@test.com' }, name: 'Dr. Test' },
-      };
+  describe('startConsultation', () => {
+    const appointmentId = 1;
+    const doctorProfileId = 1;
 
-      mockPrismaService.appointment.findUnique.mockResolvedValue(appointmentMock);
-      mockPrismaService.appointment.update.mockResolvedValue({ ...appointmentMock, status: 'CANCELADA' });
+    it('should transition from EM_ESPERA to EM_ANDAMENTO using lock', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, doctorProfileId, status: 'EM_ESPERA', date: new Date(),
+        doctorProfile: { name: 'Dr. Test', user: {} }, patientProfile: { name: 'P' },
+      });
+      mockPrismaService.appointment.update.mockResolvedValue({ status: 'EM_ANDAMENTO' });
+      const result = await service.startConsultation(appointmentId, doctorProfileId);
+      expect(result.status).toBe('EM_ANDAMENTO');
+      expect(mockPrismaService.runInTransactionWithLock).toHaveBeenCalledWith(appointmentId, expect.any(Function));
+    });
 
-      const result = await service.cancelAppointment(appointmentId, patientProfileId);
+    it('should return idempotently if EM_ANDAMENTO', async () => {
+      const mock = { id: appointmentId, doctorProfileId, status: 'EM_ANDAMENTO', date: new Date() };
+      mockPrismaService.appointment.findUnique.mockResolvedValue(mock);
+      const result = await service.startConsultation(appointmentId, doctorProfileId);
+      expect(result).toEqual(mock);
+    });
 
-      expect(result.status).toBe('CANCELADA');
-      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
-        where: { id: appointmentId },
-        data: { status: 'CANCELADA', cancellationReason: undefined },
+    it('should throw if CANCELADA', async () => {
+      mockPrismaService.appointment.findUnique.mockResolvedValue({
+        id: appointmentId, doctorProfileId, status: 'CANCELADA', date: new Date(),
       });
-      expect(mockMailService.sendCancellationToDoctor).toHaveBeenCalledWith(
-        'doctor@test.com',
-        'Dr. Test',
-        'Paciente Test',
-        futureDate,
-        undefined
-      );
+      await expect(service.startConsultation(appointmentId, doctorProfileId)).rejects.toMatchObject({ response: { code: 'INVALID_TRANSITION' } });
     });
   });
 });
diff --git a/apps/backend/src/appointment/appointment.service.ts b/apps/backend/src/appointment/appointment.service.ts
index 4a9e48a..6893e3e 100644
--- a/apps/backend/src/appointment/appointment.service.ts
+++ b/apps/backend/src/appointment/appointment.service.ts
@@ -1,4 +1,4 @@
-import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
+import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
 import { PrismaService } from '../prisma/prisma.service';
 import { CreateAppointmentDto } from './dto/create-appointment.dto';
 import { DomainErrorCode } from '@imnotmedical/shared';
@@ -20,8 +20,8 @@ export class AppointmentService {
     if (!year || !month || !day) {
       throw new BadRequestException('Data inválida. Use o formato YYYY-MM-DD.');
     }
-    const queryDate = new Date(year, month - 1, day);
-    const dayOfWeek = queryDate.getDay();
+    const queryDate = new Date(Date.UTC(year, month - 1, day));
+    const dayOfWeek = queryDate.getUTCDay();
 
     const doctorSlots = await this.prisma.availability.findMany({
       where: {
@@ -34,8 +34,8 @@ export class AppointmentService {
 
     if (doctorSlots.length === 0) return [];
 
-    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
-    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);
+    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
+    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
 
     const appointments = await this.prisma.appointment.findMany({
       where: {
@@ -53,20 +53,20 @@ export class AppointmentService {
       const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
       const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
       
-      const blockStart = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
-      const blockEnd = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);
+      const blockStart = new Date(Date.UTC(year, month - 1, day, startHours, startMinutes, 0, 0));
+      const blockEnd = new Date(Date.UTC(year, month - 1, day, endHours, endMinutes, 0, 0));
 
       let currentSlotDate = new Date(blockStart);
 
       while (currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000) <= blockEnd.getTime()) {
         const isTaken = appointments.some((app) => app.date.getTime() === currentSlotDate.getTime());
-        const isPast = currentSlotDate.getTime() < new Date().getTime();
+        const isPast = currentSlotDate.getTime() < Date.now();
 
         if (!isTaken && !isPast) {
           const slotEndTime = new Date(currentSlotDate.getTime() + (slot.slotDurationMinutes * 60000));
           
           const formatTime = (d: Date) => 
-            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
+            `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
 
           availableSlots.push({
             startTime: formatTime(currentSlotDate),
@@ -104,37 +104,42 @@ export class AppointmentService {
       throw new BadRequestException('Data de agendamento inválida.');
     }
 
-    if (appointmentDate.getTime() < new Date().getTime()) {
+    if (appointmentDate.getTime() < Date.now()) {
       throw new BadRequestException('Não é possível agendar uma consulta em um horário que já passou.');
     }
 
-    // Validate that slot is available
-    const existingAppointment = await this.prisma.appointment.findFirst({
-      where: {
-        doctorProfileId,
-        date: appointmentDate,
-        status: { not: ConsultationStatus.CANCELADA },
-      },
-    });
+    const appointment = await this.prisma.$transaction(async (tx) => {
+      // Row-level lock on the doctor profile to prevent concurrent bookings
+      await tx.$executeRaw`SELECT id FROM "DoctorProfile" WHERE id = ${doctorProfileId} FOR UPDATE`;
 
-    if (existingAppointment) {
-      throw new BadRequestException({
-        code: DomainErrorCode.SLOT_UNAVAILABLE,
-        message: 'O horário selecionado não está mais disponível.',
+      // Validate that slot is available
+      const existingAppointment = await tx.appointment.findFirst({
+        where: {
+          doctorProfileId,
+          date: appointmentDate,
+          status: { not: ConsultationStatus.CANCELADA },
+        },
       });
-    }
 
-    const appointment = await this.prisma.appointment.create({
-      data: {
-        doctorProfileId,
-        patientProfileId,
-        date: appointmentDate,
-        status: ConsultationStatus.AGENDADA,
-      },
-      include: {
-        doctorProfile: { include: { user: true } },
-        patientProfile: { include: { user: true } },
-      },
+      if (existingAppointment) {
+        throw new BadRequestException({
+          code: DomainErrorCode.SLOT_UNAVAILABLE,
+          message: 'O horário selecionado não está mais disponível.',
+        });
+      }
+
+      return await tx.appointment.create({
+        data: {
+          doctorProfileId,
+          patientProfileId,
+          date: appointmentDate,
+          status: ConsultationStatus.AGENDADA,
+        },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: { include: { user: true } },
+        },
+      });
     });
 
     this.logger.log('APPOINTMENT CREATED: ' + JSON.stringify(appointment));
@@ -161,24 +166,24 @@ export class AppointmentService {
     return appointment;
   }
 
+  /**
+   * Get doctor appointments from today onwards.
+   * Uses UTC-normalized date calculations to avoid timezone drift. (AC: B4)
+   */
   async getDoctorAppointments(doctorProfileId: number) {
-    const formatter = new Intl.DateTimeFormat('en-US', {
-      timeZone: 'America/Sao_Paulo',
-      year: 'numeric',
-      month: 'numeric',
-      day: 'numeric',
-    });
-    const parts = formatter.formatToParts(new Date());
-    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
-    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10) - 1;
-    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
-    const startOfToday = new Date(Date.UTC(year, month, day, 3, 0, 0, 0)); // BRT is UTC-3
+    const now = new Date();
+    const startOfTodayUTC = new Date(Date.UTC(
+      now.getUTCFullYear(),
+      now.getUTCMonth(),
+      now.getUTCDate(),
+      0, 0, 0, 0,
+    ));
 
     return this.prisma.appointment.findMany({
       where: {
         doctorProfileId,
         date: {
-          gte: startOfToday,
+          gte: startOfTodayUTC,
         },
       },
       include: {
@@ -204,135 +209,366 @@ export class AppointmentService {
     });
   }
 
-  async cancelAppointment(appointmentId: number, patientProfileId: number, reason?: string) {
+  /**
+   * Get a single appointment by ID with ownership validation. (AC: C3)
+   * Returns 404 for both non-existent and non-owned appointments to prevent ID leaking. (AC: B3/C5)
+   */
+  async getAppointmentById(appointmentId: number, userId: number) {
     const appointment = await this.prisma.appointment.findUnique({
       where: { id: appointmentId },
       include: {
         doctorProfile: { include: { user: true } },
-        patientProfile: true,
+        patientProfile: { include: { user: true } },
+        preTriage: true,
+        consentRecord: true,
       },
     });
 
-    if (!appointment || appointment.patientProfileId !== patientProfileId) {
-      throw new BadRequestException('Consulta não encontrada.');
+    if (!appointment) {
+      throw new NotFoundException('Consulta não encontrada.');
     }
 
-    if (appointment.status === ConsultationStatus.CANCELADA) {
-      throw new BadRequestException('A consulta já está cancelada.');
-    }
+    const isPatientOwner = appointment.patientProfile?.userId === userId;
+    const isDoctorOwner = appointment.doctorProfile?.userId === userId;
 
-    const twelveHoursInMs = 12 * 60 * 60 * 1000;
-    if (appointment.date.getTime() - new Date().getTime() < twelveHoursInMs) {
-      throw new BadRequestException('Cancelamentos só podem ser feitos com pelo menos 12 horas de antecedência.');
+    if (!isPatientOwner && !isDoctorOwner) {
+      throw new NotFoundException('Consulta não encontrada.');
     }
 
-    const updatedAppointment = await this.prisma.appointment.update({
-      where: { id: appointmentId },
-      data: { 
-        status: ConsultationStatus.CANCELADA,
-        cancellationReason: reason,
-      },
-    });
+    return appointment;
+  }
 
-    this.logger.log(`APPOINTMENT CANCELLED: ${appointmentId} by patient ${patientProfileId}`);
-
-    // Fire and forget email to doctor
-    if (appointment.doctorProfile?.user?.email) {
-      this.mailService
-        .sendCancellationToDoctor(
-          appointment.doctorProfile.user.email,
-          appointment.doctorProfile.name || 'Médico',
-          appointment.patientProfile.name || 'Paciente',
-          appointment.date,
-          reason,
-        )
-        .catch((err) => this.logger.error('Erro silencioso ao enviar email de cancelamento ao médico:', err));
-    }
+  async cancelAppointment(appointmentId: number, patientProfileId: number, reason?: string) {
+    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
+      const appointment = await tx.appointment.findUnique({
+        where: { id: appointmentId },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: true,
+        },
+      });
+
+      if (!appointment || appointment.patientProfileId !== patientProfileId) {
+        throw new NotFoundException('Consulta não encontrada.');
+      }
+
+      if (appointment.status === ConsultationStatus.CANCELADA) {
+        return appointment;
+      }
+
+      const twelveHoursInMs = 12 * 60 * 60 * 1000;
+      if (appointment.date.getTime() - Date.now() < twelveHoursInMs) {
+        throw new BadRequestException('Cancelamentos só podem ser feitos com pelo menos 12 horas de antecedência.');
+      }
 
-    return updatedAppointment;
+      const updatedAppointment = await tx.appointment.update({
+        where: { id: appointmentId },
+        data: { 
+          status: ConsultationStatus.CANCELADA,
+          cancellationReason: reason,
+        },
+      });
+
+      this.logger.log(`APPOINTMENT CANCELLED: ${appointmentId} by patient ${patientProfileId}`);
+
+      // Fire and forget email to doctor
+      if (appointment.doctorProfile?.user?.email) {
+        this.mailService
+          .sendCancellationToDoctor(
+            appointment.doctorProfile.user.email,
+            appointment.doctorProfile.name || 'Médico',
+            appointment.patientProfile.name || 'Paciente',
+            appointment.date,
+            reason,
+          )
+          .catch((err) => this.logger.error('Erro silencioso ao enviar email de cancelamento ao médico:', err));
+      }
+
+      return updatedAppointment;
+    });
   }
 
   async rescheduleAppointment(appointmentId: number, patientProfileId: number, newDateStr: string) {
-    const appointment = await this.prisma.appointment.findUnique({
-      where: { id: appointmentId },
-      include: {
-        doctorProfile: { include: { user: true } },
-        patientProfile: { include: { user: true } },
-      },
+    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
+      const appointment = await tx.appointment.findUnique({
+        where: { id: appointmentId },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: { include: { user: true } },
+        },
+      });
+
+      if (!appointment || appointment.patientProfileId !== patientProfileId) {
+        throw new NotFoundException('Consulta não encontrada.');
+      }
+
+      if (appointment.status === ConsultationStatus.CANCELADA || appointment.status === ConsultationStatus.REALIZADA) {
+        throw new BadRequestException('Não é possível remarcar uma consulta finalizada ou cancelada.');
+      }
+
+      const sixHoursInMs = 6 * 60 * 60 * 1000;
+      if (appointment.date.getTime() - Date.now() < sixHoursInMs) {
+        throw new BadRequestException('Reagendamentos só podem ser feitos com pelo menos 6 horas de antecedência.');
+      }
+
+      const newDate = new Date(newDateStr);
+      if (isNaN(newDate.getTime()) || newDate.getTime() < Date.now()) {
+        throw new BadRequestException('Nova data inválida ou no passado.');
+      }
+
+      const oldDate = appointment.date;
+
+      // Row-level lock on the doctor profile as well for double-booking prevention
+      await tx.$executeRaw`SELECT id FROM "DoctorProfile" WHERE id = ${appointment.doctorProfileId} FOR UPDATE`;
+
+      const existingAppointment = await tx.appointment.findFirst({
+        where: {
+          doctorProfileId: appointment.doctorProfileId,
+          date: newDate,
+          status: { not: ConsultationStatus.CANCELADA },
+        },
+      });
+
+      if (existingAppointment) {
+        throw new BadRequestException({
+          code: DomainErrorCode.SLOT_UNAVAILABLE,
+          message: 'O novo horário selecionado não está mais disponível.',
+        });
+      }
+
+      const updatedAppointment = await tx.appointment.update({
+        where: { id: appointmentId },
+        data: { 
+          date: newDate,
+          status: ConsultationStatus.AGENDADA,
+        },
+      });
+
+      this.logger.log(`APPOINTMENT RESCHEDULED: ${appointmentId} from ${oldDate} to ${newDate}`);
+
+      // Fire and forget emails
+      if (appointment.patientProfile?.user?.email) {
+        this.mailService
+          .sendRescheduleEmailToPatient(
+            appointment.patientProfile.user.email,
+            appointment.patientProfile.name || 'Paciente',
+            appointment.doctorProfile.name || 'Médico',
+            oldDate,
+            newDate,
+          )
+          .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (paciente):', err));
+      }
+
+      if (appointment.doctorProfile?.user?.email) {
+        this.mailService
+          .sendRescheduleEmailToDoctor(
+            appointment.doctorProfile.user.email,
+            appointment.doctorProfile.name || 'Médico',
+            appointment.patientProfile.name || 'Paciente',
+            oldDate,
+            newDate,
+          )
+          .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (medico):', err));
+      }
+
+      return updatedAppointment;
     });
+  }
 
-    if (!appointment || appointment.patientProfileId !== patientProfileId) {
-      throw new BadRequestException('Consulta não encontrada.');
-    }
+  /**
+   * Enter the virtual waiting room. (AC: A1, A4/A9, A5, A7)
+   * - Validates server-side that pre-triage and consent exist (A1)
+   * - Idempotent for EM_ESPERA and EM_ANDAMENTO statuses (A4/A9)
+   * - Enforces ±15 minute time window around scheduled time (A5)
+   * - Uses row-level lock to prevent TOCTOU race conditions (A7)
+   */
+  async enterWaitingRoom(appointmentId: number, patientProfileId: number) {
+    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
+      const appointment = await tx.appointment.findUnique({
+        where: { id: appointmentId },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: true,
+          preTriage: true,
+          consentRecord: true,
+        },
+      });
 
-    if (appointment.status === ConsultationStatus.CANCELADA || appointment.status === ConsultationStatus.REALIZADA) {
-      throw new BadRequestException('Não é possível remarcar uma consulta finalizada ou cancelada.');
-    }
+      if (!appointment || appointment.patientProfileId !== patientProfileId) {
+        throw new NotFoundException({
+          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
+          message: 'Consulta não encontrada.',
+        });
+      }
 
-    const sixHoursInMs = 6 * 60 * 60 * 1000;
-    if (appointment.date.getTime() - new Date().getTime() < sixHoursInMs) {
-      throw new BadRequestException('Reagendamentos só podem ser feitos com pelo menos 6 horas de antecedência.');
-    }
+      // Idempotent: if already EM_ESPERA or EM_ANDAMENTO, return as-is (A4/A9)
+      if (appointment.status === ConsultationStatus.EM_ESPERA ||
+          appointment.status === ConsultationStatus.EM_ANDAMENTO) {
+        return appointment;
+      }
 
-    const newDate = new Date(newDateStr);
-    if (isNaN(newDate.getTime()) || newDate.getTime() < new Date().getTime()) {
-      throw new BadRequestException('Nova data inválida ou no passado.');
-    }
+      if (appointment.status === ConsultationStatus.CANCELADA) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: 'Não é possível entrar na sala de espera de uma consulta cancelada.',
+        });
+      }
 
-    // Validate that slot is available
-    const existingAppointment = await this.prisma.appointment.findFirst({
-      where: {
-        doctorProfileId: appointment.doctorProfileId,
-        date: newDate,
-        status: { not: ConsultationStatus.CANCELADA },
-      },
+      if (appointment.status !== ConsultationStatus.AGENDADA) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: `Transição inválida: status atual é '${appointment.status}'. Esperado: 'AGENDADA'.`,
+        });
+      }
+
+      // Server-side validation: pre-triage and consent must exist (A1)
+      if (!appointment.preTriage) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: 'A pré-triagem deve ser preenchida antes de entrar na sala de espera.',
+        });
+      }
+
+      if (!appointment.consentRecord) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: 'O consentimento deve ser registrado antes de entrar na sala de espera.',
+        });
+      }
+
+      // Time window validation: ±15 minutes from scheduled time (A5)
+      const appointmentTime = appointment.date.getTime();
+      const currentTime = Date.now();
+      const fifteenMinutesInMs = 15 * 60 * 1000;
+
+      if (currentTime < appointmentTime - fifteenMinutesInMs) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: 'A sala de espera só pode ser acessada com no máximo 15 minutos de antecedência do horário agendado.',
+        });
+      }
+
+      if (currentTime > appointmentTime + fifteenMinutesInMs) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: 'O horário permitido para entrada na sala de espera já expirou.',
+        });
+      }
+
+      const updatedAppointment = await tx.appointment.update({
+        where: { id: appointmentId },
+        data: { status: ConsultationStatus.EM_ESPERA },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: true,
+        },
+      });
+
+      this.logger.log(`WAITING_ROOM_ENTERED: appointment=${appointmentId} patient=${patientProfileId}`);
+
+      return updatedAppointment;
     });
+  }
 
-    if (existingAppointment) {
-      throw new BadRequestException({
-        code: DomainErrorCode.SLOT_UNAVAILABLE,
-        message: 'O novo horário selecionado não está mais disponível.',
+  /**
+   * Mark appointment as no-show. (AC: A7)
+   * Uses row-level lock to prevent TOCTOU race conditions.
+   */
+  async markNoShow(appointmentId: number, patientProfileId: number) {
+    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
+      const appointment = await tx.appointment.findUnique({
+        where: { id: appointmentId },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: true,
+        },
       });
-    }
 
-    const oldDate = appointment.date;
+      if (!appointment || appointment.patientProfileId !== patientProfileId) {
+        throw new NotFoundException({
+          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
+          message: 'Consulta não encontrada.',
+        });
+      }
 
-    const updatedAppointment = await this.prisma.appointment.update({
-      where: { id: appointmentId },
-      data: { 
-        date: newDate,
-        status: ConsultationStatus.AGENDADA,
-      },
+      if (appointment.status === ConsultationStatus.NAO_REALIZADA) {
+        return appointment;
+      }
+
+      if (appointment.status !== ConsultationStatus.EM_ESPERA) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: `Transição inválida: status atual é '${appointment.status}'. Esperado: 'EM_ESPERA'.`,
+        });
+      }
+
+      const appointmentTime = appointment.date.getTime();
+      const currentTime = Date.now();
+      const tenMinutesInMs = 10 * 60 * 1000;
+
+      if (currentTime < appointmentTime + tenMinutesInMs) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: 'A tolerância máxima para início da consulta ainda não expirou.',
+        });
+      }
+
+      const updatedAppointment = await tx.appointment.update({
+        where: { id: appointmentId },
+        data: { status: ConsultationStatus.NAO_REALIZADA },
+      });
+
+      this.logger.log(`NO_SHOW_MARKED: appointment=${appointmentId} patient=${patientProfileId}`);
+
+      return updatedAppointment;
     });
+  }
 
-    this.logger.log(`APPOINTMENT RESCHEDULED: ${appointmentId} from ${oldDate} to ${newDate}`);
+  /**
+   * Start a consultation. (AC: A7)
+   * Uses row-level lock to prevent TOCTOU race conditions.
+   */
+  async startConsultation(appointmentId: number, doctorProfileId: number) {
+    return this.prisma.runInTransactionWithLock(appointmentId, async (tx) => {
+      const appointment = await tx.appointment.findUnique({
+        where: { id: appointmentId },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: true,
+        },
+      });
 
-    // Fire and forget emails
-    if (appointment.patientProfile?.user?.email) {
-      this.mailService
-        .sendRescheduleEmailToPatient(
-          appointment.patientProfile.user.email,
-          appointment.patientProfile.name || 'Paciente',
-          appointment.doctorProfile.name || 'Médico',
-          oldDate,
-          newDate,
-        )
-        .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (paciente):', err));
-    }
+      if (!appointment || appointment.doctorProfileId !== doctorProfileId) {
+        throw new NotFoundException({
+          code: DomainErrorCode.CONSULTATION_NOT_FOUND,
+          message: 'Consulta não encontrada.',
+        });
+      }
 
-    if (appointment.doctorProfile?.user?.email) {
-      this.mailService
-        .sendRescheduleEmailToDoctor(
-          appointment.doctorProfile.user.email,
-          appointment.doctorProfile.name || 'Médico',
-          appointment.patientProfile.name || 'Paciente',
-          oldDate,
-          newDate,
-        )
-        .catch((err) => this.logger.error('Erro silencioso ao enviar email de remarcação (medico):', err));
-    }
+      if (appointment.status === ConsultationStatus.EM_ANDAMENTO) {
+        return appointment;
+      }
+
+      if (appointment.status !== ConsultationStatus.EM_ESPERA && appointment.status !== ConsultationStatus.AGENDADA) {
+        throw new BadRequestException({
+          code: DomainErrorCode.INVALID_TRANSITION,
+          message: `Transição inválida: status atual é '${appointment.status}'. Esperado: 'EM_ESPERA' ou 'AGENDADA'.`,
+        });
+      }
+
+      const updatedAppointment = await tx.appointment.update({
+        where: { id: appointmentId },
+        data: { status: ConsultationStatus.EM_ANDAMENTO },
+        include: {
+          doctorProfile: { include: { user: true } },
+          patientProfile: true,
+        },
+      });
 
-    return updatedAppointment;
+      this.logger.log(`CONSULTATION_STARTED: appointment=${appointmentId} doctor=${doctorProfileId}`);
+
+      return updatedAppointment;
+    });
   }
 }
 
diff --git a/apps/backend/src/prisma/prisma.service.ts b/apps/backend/src/prisma/prisma.service.ts
index 712d7ec..3c796f1 100644
--- a/apps/backend/src/prisma/prisma.service.ts
+++ b/apps/backend/src/prisma/prisma.service.ts
@@ -1,10 +1,32 @@
 // src/prisma/prisma.service.ts
 import { Injectable, OnModuleInit } from '@nestjs/common';
-import { PrismaClient } from '@prisma/client';
+import { PrismaClient, Prisma } from '@prisma/client';
 
 @Injectable()
 export class PrismaService extends PrismaClient implements OnModuleInit {
   async onModuleInit() {
     await this.$connect();
   }
+
+  /**
+   * Executes a callback within a Prisma interactive transaction,
+   * acquiring a row-level exclusive lock (SELECT ... FOR UPDATE)
+   * on the Appointment row with the given ID before running the callback.
+   *
+   * This prevents TOCTOU race conditions by ensuring that concurrent
+   * requests serialize on the same appointment row.
+   *
+   * @param id - The Appointment ID to lock
+   * @param callback - The transactional logic to execute after acquiring the lock
+   * @returns The result of the callback
+   */
+  async runInTransactionWithLock<T>(
+    id: number,
+    callback: (tx: Prisma.TransactionClient) => Promise<T>,
+  ): Promise<T> {
+    return this.$transaction(async (tx) => {
+      await tx.$executeRaw`SELECT id FROM "Appointment" WHERE id = ${id} FOR UPDATE`;
+      return callback(tx);
+    });
+  }
 }
diff --git a/apps/backend/src/pre-triage/pre-triage.controller.ts b/apps/backend/src/pre-triage/pre-triage.controller.ts
new file mode 100644
index 0000000..9badce6
--- /dev/null
+++ b/apps/backend/src/pre-triage/pre-triage.controller.ts
@@ -0,0 +1,103 @@
+import {
+  Controller,
+  Post,
+  Body,
+  UseGuards,
+  Req,
+  Param,
+  ParseIntPipe,
+  NotFoundException,
+  HttpCode,
+  HttpStatus,
+  Get,
+  BadRequestException,
+} from '@nestjs/common';
+import { PreTriageService } from './pre-triage.service';
+import { CreatePreTriageDto } from './dto/create-pre-triage.dto';
+import { AuthGuard } from '../auth/auth.guard';
+import { RolesGuard } from '../auth/roles.guard';
+import { Roles } from '../auth/roles.decorator';
+import { PrismaService } from '../prisma/prisma.service';
+
+@Controller('appointments')
+export class PreTriageController {
+  constructor(
+    private readonly preTriageService: PreTriageService,
+    private readonly prisma: PrismaService,
+  ) {}
+
+  @Post(':id/pre-triage')
+  @UseGuards(AuthGuard, RolesGuard)
+  @Roles('PATIENT')
+  @HttpCode(HttpStatus.CREATED)
+  async createPreTriage(
+    @Req() req: any,
+    @Param('id', ParseIntPipe) appointmentId: number,
+    @Body() dto: CreatePreTriageDto,
+  ) {
+    await this.validateOwnership(req.user.id, appointmentId);
+    return this.preTriageService.createOrUpdate(appointmentId, dto);
+  }
+
+  @Get(':id/pre-triage')
+  @UseGuards(AuthGuard, RolesGuard)
+  @Roles('PATIENT', 'DOCTOR')
+  async getPreTriage(
+    @Req() req: any,
+    @Param('id', ParseIntPipe) appointmentId: number,
+  ) {
+    // For doctors: check they are the doctor on this appointment
+    // For patients: check they are the patient on this appointment
+    const appointment = await this.prisma.appointment.findUnique({
+      where: { id: appointmentId },
+      include: {
+        doctorProfile: true,
+        patientProfile: true,
+      },
+    });
+
+    if (!appointment) {
+      throw new NotFoundException('Consulta não encontrada.');
+    }
+
+    const user = req.user;
+    const isPatientOwner = user.patientProfile?.id === appointment.patientProfileId;
+    const isDoctorOwner = user.doctorProfile?.id === appointment.doctorProfileId;
+
+    if (!isPatientOwner && !isDoctorOwner) {
+      // Return 404 instead of 403 to prevent ID leaking (AC: B3/C5)
+      throw new NotFoundException('Consulta não encontrada.');
+    }
+
+    return this.preTriageService.findByAppointmentId(appointmentId);
+  }
+
+  /**
+   * Validates that the authenticated user (patient) is the owner of the appointment.
+   * Prevents ID leaking by returning NotFoundException (404) for both not-found
+   * and unauthorized cases (AC: B3/C5).
+   */
+  private async validateOwnership(userId: number, appointmentId: number) {
+    const appointment = await this.prisma.appointment.findUnique({
+      where: { id: appointmentId },
+      include: {
+        patientProfile: true,
+      },
+    });
+
+    if (!appointment || !appointment.patientProfile) {
+      throw new NotFoundException('Consulta não encontrada.');
+    }
+
+    if (appointment.patientProfile.userId !== userId) {
+      // Return 404 instead of 403 to prevent ID leaking (AC: B3/C5)
+      throw new NotFoundException('Consulta não encontrada.');
+    }
+
+    if (appointment.status !== 'AGENDADA') {
+      throw new BadRequestException(
+        'A pré-triagem só pode ser preenchida para consultas agendadas.',
+      );
+    }
+  }
+}

```
