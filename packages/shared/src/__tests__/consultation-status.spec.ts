import { ConsultationStatus } from '../enums/consultation-status';

describe('ConsultationStatus', () => {
  it('should export all expected consultation statuses', () => {
    expect(ConsultationStatus.AGENDADA).toBe('AGENDADA');
    expect(ConsultationStatus.CANCELADA).toBe('CANCELADA');
    expect(ConsultationStatus.REALIZADA).toBe('REALIZADA');
    expect(ConsultationStatus.EM_ESPERA).toBe('EM_ESPERA');
    expect(ConsultationStatus.EM_ANDAMENTO).toBe('EM_ANDAMENTO');
    expect(ConsultationStatus.NAO_REALIZADA).toBe('NAO_REALIZADA');
  });

  it('should have exactly 6 statuses', () => {
    const values = Object.values(ConsultationStatus);
    expect(values).toHaveLength(6);
  });
});
