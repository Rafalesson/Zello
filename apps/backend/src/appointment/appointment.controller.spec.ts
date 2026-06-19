import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

describe('AppointmentController', () => {
  let controller: AppointmentController;

  const mockAppointmentService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: AppointmentService,
          useValue: mockAppointmentService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailableSlots', () => {
    it('should be publicly accessible (no AuthGuard)', () => {
      const guards = Reflect.getMetadata('__guards__', AppointmentController.prototype.getAvailableSlots);
      // We check if guards is either not set or does not contain AuthGuard
      const hasAuthGuard = guards && guards.some((guard: any) => guard === require('../auth/auth.guard').AuthGuard || guard.name === 'AuthGuard');
      expect(hasAuthGuard).toBeFalsy();
    });
  });
});
