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

- ~~**Potential timezone drift in slot date construction**~~ *(Resolvido na Story 3.6 — getDoctorAppointments agora usa UTC puro)*

## Deferred from: code review of 2-4-booking-confirmation-notifications.md (2026-06-06)

- **Restrição Única ao Reagendar Horários Cancelados**: A restrição única do Prisma `@@unique([doctorProfileId, date])` impede a criação de registros na mesma data e hora para o mesmo médico, mesmo que a consulta anterior esteja como `CANCELADA`, inviabilizando o reaproveitamento do slot.

## Deferred from: Epic 2 Retrospective (2026-06-19)

- ~~**TOCTOU / Race Conditions no Agendamento**~~ *(Resolvido na Story 3.6 — runInTransactionWithLock com row-level lock implementado)*
- ~~**Timezones e Fuso Horário Hardcoded**~~ *(Resolvido na Story 3.6 — getDoctorAppointments usa UTC normalizado)*
- **Validação de DTOs Frágil**: Passes de parâmetros `NaN` geram erro 500 fatal no Prisma. Necessário adotar globalmente `ValidationPipe` e `ParseIntPipe`.
- ~~**Falta de Idempotência em Cancelamentos**~~ *(Resolvido na Story 3.6 — transições idempotentes implementadas)*
- ~~**Vazamento de IDs via Erros HTTP (Security Leaking)**~~ *(Resolvido na Story 3.6 — ForbiddenException substituído por NotFoundException)*
- **Ausência de Error Boundaries no React**: Erros de JS isolados quebram a renderização inteira do dashboard de paciente/médico.

## Deferred from: code review of 3-1-pre-consultation-triage-questionnaire.md (2026-07-07)

- ~~**Inconsistência na verificação de propriedade do paciente**~~ *(Resolvido na Story 3.6 — PreTriageController padronizado com NotFoundException)*

## Deferred from: code review of 3-3-device-check-in-modal.md (2026-07-08)

- ~~**Escalabilidade Deficiente e Risco de Truncamento de Paginação na Busca da Consulta (GET /appointments/patient)**~~ *(Resolvido na Story 3.6 — Frontend agora usa GET /appointments/:id individual)*
- ~~**Perda de preferências de mudo/vídeo desativado na transição para a sala virtual**~~ *(Resolvido na Story 3.6 — Media prefs persistidas em sessionStorage)*

## Deferred from: code review of 3-4-virtual-waiting-room-dynamic-status.md (2026-07-08)

- **Reset do Timer de No-Show Através de Reload da Página**: O temporizador de no-show reside em memória no frontend; recarregar reinicia a contagem. Um cron job em background no servidor deve expirar as consultas para maior robustez. [apps/frontend/src/app/paciente/sala/[id]/page.tsx]
- ~~**Falta de Validação de Limite no Campo de Intensidade da Pré-Triagem**~~ *(Já existia no DTO — @Min(1) @Max(10) confirmado na Story 3.6)*
