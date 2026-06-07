export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateNextAvailableSlot(availabilities: any[], now: Date = new Date()): Date | null {
  if (!availabilities || availabilities.length === 0) return null;
  
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeString = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
  
  let nextSlotDate: Date | null = null;
  
  for (const slot of availabilities) {
    if (slot.isActive === false) continue;
    
    // Calculate days until this dayOfWeek
    let daysDiff = slot.dayOfWeek - currentDay;
    if (daysDiff < 0) {
      daysDiff += 7;
    } else if (daysDiff === 0) {
      // If same day, check if slot start time is in the future
      if (slot.startTime <= currentTimeString) {
        daysDiff = 7; // Next week
      }
    }
    
    // Create candidate date
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + daysDiff);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    candidate.setHours(hours, minutes, 0, 0);
    
    if (!nextSlotDate || candidate < nextSlotDate) {
      nextSlotDate = candidate;
    }
  }
  
  return nextSlotDate;
}

export function formatNextAvailableSlot(date: Date | null, now: Date = new Date()): string {
  if (!date) return 'Sem horários';
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  if (diffDays === 0) {
    return `Hoje, ${timeStr}`;
  } else if (diffDays === 1) {
    return `Amanhã, ${timeStr}`;
  } else {
    const weekdays = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];
    return `${weekdays[date.getDay()]}, ${timeStr}`;
  }
}

