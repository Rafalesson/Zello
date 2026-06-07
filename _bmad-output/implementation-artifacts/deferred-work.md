# Trabalho Diferido

## Deferred from: code review of story-1.7 (2026-06-04)

- `aria-live="polite"` em conteúdo renderizado imediatamente (token inválido no `reset-password-form.tsx`) — não-dinâmico, semanticamente impreciso. Funcional mas não ideal para screen readers.
- Race condition `initializeTransporter` fire-and-forget no `mail.service.ts` — Ethereal-only (dev). Em produção com SMTP real, considerar `onModuleInit` com await ou lazy initialization com queue.

## Deferred from: code review of story-2.1 (2026-06-05)

- Sem validação de sobreposição de slots no mesmo dia (`availability.service.ts`) — Será necessário no Epic 2 Story 2-3 (Appointment Booking) para evitar double-booking.
- Cross-midnight schedules rejeitados pela comparação lexicográfica de strings (`availability.service.ts:27`) — Plantonistas fora do escopo do MVP. Necessário se o produto expandir para UTI/PS.
- Sem `onDelete` cascade na relação Availability → DoctorProfile (`schema.prisma`) — Pattern consistente com o projeto. Avaliar quando implementar deleção de contas.
- IDs de Availability regenerados a cada save (delete+create pattern) — Aceitável enquanto nada referencia `availabilityId`. Reavaliar antes de Story 2-3 que criará bookings.

## Deferred from: code review of 2-3-appointment-booking-with-calendar-strip.md (2026-06-06)

- **Potential timezone drift in slot date construction**: `new Date(year, month - 1, day, hours, minutes, 0, 0)` relies on the Node process timezone. Since dates are stored as UTC, if the server timezone changes, `getTime()` comparison com compromissos UTC pode falhar. Deferred porque o projeto inteiro roda com o fuso de Brasília.

## Deferred from: code review of 2-4-booking-confirmation-notifications.md (2026-06-06)

- **Restrição Única ao Reagendar Horários Cancelados**: A restrição única do Prisma `@@unique([doctorProfileId, date])` impede a criação de registros na mesma data e hora para o mesmo médico, mesmo que a consulta anterior esteja como `CANCELADA`, inviabilizando o reaproveitamento do slot.

