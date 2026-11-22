// Endereço: apps/frontend/src/utils/date.ts

export function calculateAge(dateOfBirth: string | Date): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function numberToWords(num: number | ''): string {
  const n = Number(num) || 0;
  const numbers: Record<number, string> = {
    0: 'zero',
    1: 'um',
    2: 'dois',
    3: 'três',
    4: 'quatro',
    5: 'cinco',
    6: 'seis',
    7: 'sete',
    8: 'oito',
    9: 'nove',
    10: 'dez',
    11: 'onze',
    12: 'doze',
    13: 'treze',
    14: 'quatorze',
    15: 'quinze',
    20: 'vinte',
    30: 'trinta',
  };
  return numbers[n] || n.toString();
}

const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

export function getCurrentSaoPauloDateTimeLocal(): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour') === '24' ? '00' : get('hour');
  const minute = get('minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function toSaoPauloIsoString(dateTimeLocal?: string): string | undefined {
  if (!dateTimeLocal) {
    return undefined;
  }

  const trimmed = dateTimeLocal.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00-03:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}-03:00`;
  }

  return trimmed;
}

export function formatSaoPauloDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const day = get('day');
  const month = get('month');
  const year = get('year');
  const hour = get('hour') === '24' ? '00' : get('hour');
  const minute = get('minute');
  const second = get('second');

  return `${day}/${month}/${year} - ${hour}:${minute}:${second} (GMT-03)`;
}

export function formatCertificatePreviewDates(options: {
  useCustomDate?: boolean;
  customIssueDateTime?: string;
  customStartDate?: string;
}): { startDate: string; issueDateTime: string } {
  const isoIssue = options.useCustomDate
    ? toSaoPauloIsoString(options.customIssueDateTime)
    : undefined;
  const parsedIssue = isoIssue ? new Date(isoIssue) : new Date();
  const issueDate = Number.isNaN(parsedIssue.getTime()) ? new Date() : parsedIssue;

  let startDate: string;
  if (
    options.useCustomDate &&
    options.customStartDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(options.customStartDate.trim())
  ) {
    const [year, month, day] = options.customStartDate.trim().split('-');
    startDate = `${day}/${month}/${year}`;
  } else {
    startDate = new Intl.DateTimeFormat('pt-BR', {
      timeZone: SAO_PAULO_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(issueDate);
  }

  return {
    startDate,
    issueDateTime: formatSaoPauloDateTime(issueDate),
  };
}