import { calculateNextAvailableSlot, formatNextAvailableSlot } from './date.utils';

describe('Date Utils', () => {
  describe('calculateNextAvailableSlot', () => {
    it('should return null if availabilities are empty', () => {
      expect(calculateNextAvailableSlot([])).toBeNull();
    });

    it('should calculate the next available slot for the same day in the future', () => {
      // Setup: "now" is Friday (day 5)
      // Note: Date.getDay() uses local time. We construct local Dates to ensure consistency in testing environment.
      const now = new Date(2026, 5, 5, 10, 0, 0); // 2026-06-05 (Friday) 10:00
      expect(now.getDay()).toBe(5);

      const availabilities = [
        { dayOfWeek: 5, startTime: '14:30', isActive: true }, // Today later
      ];

      const nextSlot = calculateNextAvailableSlot(availabilities, now);
      expect(nextSlot).not.toBeNull();
      expect(nextSlot?.getDay()).toBe(5); // Friday
      expect(nextSlot?.getHours()).toBe(14);
      expect(nextSlot?.getMinutes()).toBe(30);
    });

    it('should calculate the next available slot for a future day in the week', () => {
      const now = new Date(2026, 5, 5, 10, 0, 0); // 2026-06-05 (Friday) 10:00
      const availabilities = [
        { dayOfWeek: 1, startTime: '09:00', isActive: true }, // Monday next week
        { dayOfWeek: 6, startTime: '11:00', isActive: true }, // Saturday tomorrow
      ];

      const nextSlot = calculateNextAvailableSlot(availabilities, now);
      expect(nextSlot).not.toBeNull();
      expect(nextSlot?.getDay()).toBe(6); // Saturday tomorrow
      expect(nextSlot?.getHours()).toBe(11);
      expect(nextSlot?.getMinutes()).toBe(0);
    });
  });

  describe('formatNextAvailableSlot', () => {
    it('should return "Sem horários" if date is null', () => {
      expect(formatNextAvailableSlot(null)).toBe('Sem horários');
    });

    it('should format as "Hoje, HH:MM" if date is today', () => {
      const now = new Date(2026, 5, 5, 10, 0, 0);
      const slot = new Date(2026, 5, 5, 14, 30, 0);
      expect(formatNextAvailableSlot(slot, now)).toContain('Hoje, 14:30');
    });

    it('should format as "Amanhã, HH:MM" if date is tomorrow', () => {
      const now = new Date(2026, 5, 5, 10, 0, 0);
      const slot = new Date(2026, 5, 6, 9, 0, 0);
      expect(formatNextAvailableSlot(slot, now)).toContain('Amanhã, 09:00');
    });

    it('should format as "Weekday, HH:MM" for other days', () => {
      const now = new Date(2026, 5, 5, 10, 0, 0); // Friday
      const slot = new Date(2026, 5, 8, 10, 15, 0); // Monday
      const formatted = formatNextAvailableSlot(slot, now);
      expect(formatted).toContain('Segunda-feira');
      expect(formatted).toContain('10:15');
    });
  });
});
