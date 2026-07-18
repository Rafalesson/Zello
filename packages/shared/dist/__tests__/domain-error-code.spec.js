"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domain_error_code_1 = require("../errors/domain-error-code");
describe('DomainErrorCode', () => {
    it('should export all expected error codes', () => {
        expect(domain_error_code_1.DomainErrorCode.INVALID_TRANSITION).toBe('INVALID_TRANSITION');
        expect(domain_error_code_1.DomainErrorCode.CONSULTATION_NOT_FOUND).toBe('CONSULTATION_NOT_FOUND');
        expect(domain_error_code_1.DomainErrorCode.SLOT_UNAVAILABLE).toBe('SLOT_UNAVAILABLE');
        expect(domain_error_code_1.DomainErrorCode.DEVICE_PERMISSION_DENIED).toBe('DEVICE_PERMISSION_DENIED');
        expect(domain_error_code_1.DomainErrorCode.UNAUTHORIZED_ROOM_ACCESS).toBe('UNAUTHORIZED_ROOM_ACCESS');
    });
    it('should have exactly 5 error codes', () => {
        const values = Object.values(domain_error_code_1.DomainErrorCode);
        expect(values).toHaveLength(5);
    });
    it('should use string values matching the key names', () => {
        for (const [key, value] of Object.entries(domain_error_code_1.DomainErrorCode)) {
            expect(key).toBe(value);
        }
    });
});
//# sourceMappingURL=domain-error-code.spec.js.map