import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplatesService],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render dynamic startDate and issueDateTime in modern template', async () => {
    const html = await service.getPopulatedCertificateHtml(
      {
        doctorName: 'Dr. Teste',
        doctorCrm: '12345',
        doctorSpecialty: 'Clínica Médica',
        doctorAddress: 'Rua A, 100 - Rio de Janeiro, RJ',
        doctorPhone: '(21) 99999-9999',
        patientName: 'Paciente Teste',
        patientCpf: '12345678900',
        patientAge: '30',
        patientSex: 'Masculino',
        durationInDays: 1,
        durationInWords: 'um',
        startDate: '13/03/2026',
        purpose: 'Repouso',
        cidCode: 'B34.9',
        cidDescription: 'Infecção viral não especificada',
        issueDateTime: '13/03/2026 - 22:42:26 (GMT-03)',
        certificateId: 'ABC12345',
      },
      'modern',
    );

    expect(html).toContain('a partir de <strong>13/03/2026</strong>');
    expect(html).toContain('Emitido em 13/03/2026 - 22:42:26 (GMT-03)');
    expect(html).not.toContain('14/03/2026 às 04:18:34');
    expect(html).not.toContain('Representante Legal');
  });

  it.each(['default', 'modern', 'classic', 'institutional', 'executive'])(
    'should render template "%s" with legalRepresentative + CPF and preserve footer data',
    async (templateId) => {
      const html = await service.getPopulatedCertificateHtml(
        {
          doctorName: 'Dra. Helena Costa',
          doctorCrm: '54321-SP',
          doctorSpecialty: 'Pediatria',
          doctorAddress: 'Av. Paulista, 1000 - São Paulo, SP',
          doctorPhone: '(11) 98888-7777',
          patientName: 'Lucas Andrade',
          patientCpf: '111.222.333-44',
          patientAge: '8',
          patientSex: 'Masculino',
          legalRepresentative: 'Mariana Andrade',
          legalRepresentativeCpf: '999.888.777-66',
          signatureStyle: 'rubrica_crm',
          durationInDays: 3,
          durationInWords: 'três',
          startDate: '15/03/2026',
          purpose: 'Afastamento escolar',
          cidCode: 'J06.9',
          cidDescription: 'Infecção aguda das vias aéreas superiores',
          issueDateTime: '15/03/2026 - 10:30:00 (GMT-03)',
          certificateId: 'VAL99887',
        },
        templateId,
      );

      expect(html).toContain('Dra. Helena Costa');
      expect(html).toContain('Lucas Andrade');
      expect(html).toContain('Mariana Andrade');
      expect(html).toContain('999.888.777-66');
      expect(html).toContain(
        'representado(a) legalmente por <strong>Mariana Andrade</strong>, inscrito(a) no CPF sob o nº <strong>999.888.777-66</strong>',
      );
      if (templateId === 'default') {
        expect(html).toContain('class="patient-info legal-rep-box"');
      }
      if (templateId === 'executive') {
        const footerTextIdx = html.indexOf('<div class="exec-footer-text">');
        const containerImgIdx = html.indexOf('<div class="container_img">');
        expect(footerTextIdx).toBeGreaterThan(-1);
        expect(containerImgIdx).toBeGreaterThan(footerTextIdx);
      }
      expect(html).toContain('Emitido em 15/03/2026 - 10:30:00 (GMT-03)');
      expect(html).toContain('MP nº 2.200-2/2001');
      expect(html).toContain('Resolução Nº CFM 2.299/2021');
      expect(html).toContain('Resolução CFM Nº 2.381/2024');
      expect(html).toContain('Resolução');
      expect(html).toContain('2.382/2024');
      expect(html).toContain('VAL99887');
    },
  );
});
