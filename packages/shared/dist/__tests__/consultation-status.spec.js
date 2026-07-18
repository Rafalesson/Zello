"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consultation_status_1 = require("../enums/consultation-status");
describe('ConsultationStatus', () => {
    it('should export all expected consultation statuses', () => {
        expect(consultation_status_1.ConsultationStatus.AGENDADA).toBe('AGENDADA');
        expect(consultation_status_1.ConsultationStatus.CANCELADA).toBe('CANCELADA');
        expect(consultation_status_1.ConsultationStatus.REALIZADA).toBe('REALIZADA');
        expect(consultation_status_1.ConsultationStatus.EM_ESPERA).toBe('EM_ESPERA');
        expect(consultation_status_1.ConsultationStatus.EM_ANDAMENTO).toBe('EM_ANDAMENTO');
        expect(consultation_status_1.ConsultationStatus.NAO_REALIZADA).toBe('NAO_REALIZADA');
    });
    it('should have exactly 6 statuses', () => {
        const values = Object.values(consultation_status_1.ConsultationStatus);
        expect(values).toHaveLength(6);
    });
});
//# sourceMappingURL=consultation-status.spec.js.map