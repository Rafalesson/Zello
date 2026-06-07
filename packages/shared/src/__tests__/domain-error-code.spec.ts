import { DomainErrorCode } from '../errors/domain-error-code';

describe('DomainErrorCode', () => {
  it('should export all expected error codes', () => {
    expect(DomainErrorCode.INVALID_TRANSITION).toBe('INVALID_TRANSITION');
    expect(DomainErrorCode.CONSULTATION_NOT_FOUND).toBe('CONSULTATION_NOT_FOUND');
    expect(DomainErrorCode.SLOT_UNAVAILABLE).toBe('SLOT_UNAVAILABLE');
    expect(DomainErrorCode.DEVICE_PERMISSION_DENIED).toBe('DEVICE_PERMISSION_DENIED');
    expect(DomainErrorCode.UNAUTHORIZED_ROOM_ACCESS).toBe('UNAUTHORIZED_ROOM_ACCESS');
  });

  it('should have exactly 5 error codes', () => {
    const values = Object.values(DomainErrorCode);
    expect(values).toHaveLength(5);
  });

  it('should use string values matching the key names', () => {
    for (const [key, value] of Object.entries(DomainErrorCode)) {
      expect(key).toBe(value);
    }
  });
});
