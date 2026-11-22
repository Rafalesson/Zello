import { CertificateService } from './certificate.service';

describe('CertificateService', () => {
  let service: CertificateService;

  beforeEach(() => {
    service = new CertificateService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should format date-time using Sao Paulo timezone', () => {
    const result = (service as any).formatDateToSaoPaulo(
      '2026-03-14T01:42:26.000Z',
    );

    expect(result).toBe('13/03/2026');
  });

  it('should keep yyyy-mm-dd date strings without timezone shift', () => {
    const result = (service as any).formatDateToSaoPaulo('2026-03-14');

    expect(result).toBe('14/03/2026');
  });

  it('should format cpf with dots and dash', () => {
    const result = (service as any).formatCpf('16757248735');

    expect(result).toBe('167.572.487-35');
  });

  it('should keep original cpf value when it is invalid length', () => {
    const result = (service as any).formatCpf('12345');

    expect(result).toBe('12345');
  });

  describe('custom certificate dates', () => {
    const originalEnv = process.env.ALLOW_CUSTOM_CERTIFICATE_DATE;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.ALLOW_CUSTOM_CERTIFICATE_DATE;
      } else {
        process.env.ALLOW_CUSTOM_CERTIFICATE_DATE = originalEnv;
      }
    });

    it('should accept custom issueDateTime by default', () => {
      delete process.env.ALLOW_CUSTOM_CERTIFICATE_DATE;
      const resolved: Date = (service as any).resolveIssueDate(
        '2026-01-10T09:15:00-03:00',
      );

      expect(resolved.toISOString()).toBe('2026-01-10T12:15:00.000Z');
    });

    it('should ignore custom issueDateTime when ALLOW_CUSTOM_CERTIFICATE_DATE is false', () => {
      process.env.ALLOW_CUSTOM_CERTIFICATE_DATE = 'false';
      const before = Date.now();
      const resolved: Date = (service as any).resolveIssueDate(
        '2020-01-10T09:15:00-03:00',
      );
      const after = Date.now();

      expect(resolved.getTime()).toBeGreaterThanOrEqual(before - 10);
      expect(resolved.getTime()).toBeLessThanOrEqual(after + 10);
    });

    it('should parse yyyy-mm-dd startDate for persistence without timezone day shift', () => {
      const parsed: Date | undefined = (
        service as any
      ).parseStartDateForPersistence('2026-01-10');

      expect(parsed).toBeInstanceOf(Date);
      expect((service as any).formatDateToSaoPaulo(parsed)).toBe('10/01/2026');
    });

    it('should persist custom issueDate/startDate, pass them to PDF template, and return them on validation', async () => {
      delete process.env.ALLOW_CUSTOM_CERTIFICATE_DATE;

      const createdRecord: any = {};
      const prismaMock = {
        medicalCertificate: {
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (where.code && createdRecord.code === where.code) {
              return Promise.resolve({
                ...createdRecord,
                doctor: {
                  doctorProfile: { name: 'Dr. Teste', crm: '12345-SP' },
                },
                patient: {
                  patientProfile: { name: 'Paciente Teste' },
                },
              });
            }
            return Promise.resolve(null);
          }),
          create: jest.fn().mockImplementation(({ data }) => {
            Object.assign(createdRecord, { id: 1, ...data });
            return Promise.resolve(createdRecord);
          }),
          update: jest.fn().mockImplementation(({ data }) => {
            Object.assign(createdRecord, data);
            return Promise.resolve(createdRecord);
          }),
        },
        user: {
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (where.id === 10) {
              return Promise.resolve({
                id: 10,
                doctorProfile: {
                  name: 'Dr. Teste',
                  crm: '12345-SP',
                  specialty: 'Clínico Geral',
                  phone: '11999999999',
                  address: null,
                },
              });
            }
            return Promise.resolve({
              id: 20,
              patientProfile: {
                name: 'Paciente Teste',
                cpf: '12345678901',
                dateOfBirth: new Date('1990-05-01T00:00:00.000Z'),
                sex: 'MALE',
              },
            });
          }),
        },
        cidCode: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      const templatesMock = {
        getPopulatedCertificateHtml: jest.fn().mockResolvedValue('<html />'),
      };
      const pdfMock = {
        generatePdfFromHtml: jest
          .fn()
          .mockResolvedValue(Buffer.from('fake-pdf')),
      };
      const cloudinaryMock = {
        isEnabled: jest.fn().mockReturnValue(true),
        uploadCertificatePdf: jest
          .fn()
          .mockResolvedValue({ secure_url: 'https://example.com/cert.pdf' }),
      };

      const testService = new CertificateService(
        prismaMock as any,
        pdfMock as any,
        templatesMock as any,
        cloudinaryMock as any,
      );

      await testService.create(
        {
          patientId: 20,
          purpose: 'Repouso médico',
          durationInDays: 2,
          issueDateTime: '2026-01-10T09:15:00-03:00',
          startDate: '2026-01-11',
          templateId: 'default',
        },
        10,
      );

      expect(prismaMock.medicalCertificate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issueDate: new Date('2026-01-10T12:15:00.000Z'),
            startDate: new Date('2026-01-11T15:00:00.000Z'),
          }),
        }),
      );

      expect(templatesMock.getPopulatedCertificateHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          issueDateTime: '2026-01-10T12:15:00.000Z',
          startDate: '11/01/2026',
        }),
        'default',
      );

      const validation = await testService.validateCertificate(
        createdRecord.code,
      );
      expect(validation.issuedAt).toEqual(new Date('2026-01-10T12:15:00.000Z'));
      expect(validation.startDate).toEqual(
        new Date('2026-01-11T15:00:00.000Z'),
      );
    });
  });
});
