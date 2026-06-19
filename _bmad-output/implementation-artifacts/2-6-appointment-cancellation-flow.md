---
status: done
---

# Story 2.6: Appointment Cancellation Flow

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story Context

Como Paciente,
Eu quero poder visualizar minhas consultas agendadas e cancelar uma consulta antes de seu início,
Para que eu possa liberar o horário caso não possa comparecer.

## Tasks / Subtasks

- [x] **Task 1: Backend - Listagem e Cancelamento para Paciente** (AC: 1)
  - [x] 1.1 Criar endpoint `GET /appointments/patient` no `AppointmentController` para listar as consultas futuras e passadas do paciente autenticado (com os dados do médico incluídos, como `name`, `specialty`, etc).
  - [x] 1.2 Criar endpoint `PATCH /appointments/:id/cancel` no `AppointmentController` para permitir que o paciente altere o status de uma consulta para `CANCELADA`.
  - [x] 1.3 Implementar regras de negócio no `AppointmentService`: verificar se a consulta pertence ao usuário (paciente), verificar se a data/hora ainda é no futuro (com margem se aplicável), e atualizar o `status` para `ConsultationStatus.CANCELADA` no banco de dados.
  - [x] 1.4 Garantir envio de e-mail ao médico (usando `MailService`) notificando do cancelamento da consulta, sem bloquear o response para o cliente se o e-mail falhar.
- [x] **Task 2: Frontend - Tela "Minhas Consultas" (Paciente)** (AC: 2)
  - [x] 2.1 Criar a página de listagem de consultas do paciente (ex: `apps/frontend/src/app/paciente/(dashboard)/consultas/page.tsx`).
  - [x] 2.2 Atualizar o arquivo do Dashboard ou do Layout (`apps/frontend/src/app/paciente/dashboard/page.tsx` ou sidebar) para incluir um link "Minhas Consultas" referenciando esta nova página.
  - [x] 2.3 Exibir cada agendamento listando: Data, Horário, Nome do Médico, Especialidade e Status Atual (`AGENDADA`, `CANCELADA`, etc).
- [x] **Task 3: Frontend - Fluxo de Cancelamento** (AC: 3, 4)
  - [x] 3.1 Adicionar um botão de "Cancelar Consulta" aos cards de agendamentos futuros (onde status seja `AGENDADA`).
  - [x] 3.2 Ao clicar, exibir um Alert Dialog/Modal de confirmação destrutivo ("Tem certeza que deseja cancelar?").
  - [x] 3.3 Após confirmação, acionar `PATCH /appointments/:id/cancel` e atualizar a UI refletindo o status cancelado (removendo o botão de cancelar da view).
  - [x] 3.4 Mostrar feedback (Toast/Banner) de sucesso ou erro amigável ao usuário.

## Dev Notes

-   **Backend Guardrails:** Siga o padrão do `AppointmentController` para autenticação (`@UseGuards(AuthGuard, RolesGuard)` e `@Roles('PATIENT')` no nível de rota ou controller).
-   O modelo Prisma define os status no enum `ConsultationStatus` como `AGENDADA`, `CANCELADA`, `REALIZADA`. O valor correto para cancelar é exatamente **`CANCELADA`**.
-   **Frontend Guardrails:** Utilize os tokens de Tailwind consistentes com o Design System da aplicação (ex: botões `bg-red-600 hover:bg-red-700` para a confirmação destrutiva).
-   **Tratamento de Exceções:** Em caso de erro na tentativa de cancelamento de uma consulta que não pertence ao paciente, lançar erro HTTP apropriado (`ForbiddenException`).
-   O MailService e a funcionalidade de envios devem ser fire-and-forget; lembre-se das lições da story 2.4 sobre falhas do serviço de email não afetarem fluxos principais (NFR18).

## Review Findings

- [x] [Review][Patch] Implementar regra de antecedência de 12h para cancelamento e capturar justificativa (exige atualização de schema Prisma para 'cancellationReason', ajuste na UI para coletar o motivo e envio deste no e-mail).
- [x] [Review][Patch] Imports ausentes no MailService [apps/backend/src/mail/mail.service.ts]
- [x] [Review][Patch] Uso do Local Time do Servidor na busca de consultas do médico [apps/backend/src/appointment/appointment.service.ts]
- [x] [Review][Patch] Rota de cancelamento não é idempotente [apps/backend/src/appointment/appointment.service.ts]
- [x] [Review][Patch] Ausência de fallback na formatação de preço do Frontend [apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx]
- [x] [Review][Patch] Uso de string literal em vez de Enum para Status [apps/backend/src/appointment/appointment.service.ts]
- [x] [Review][Decision] Caminho da rota (dashboard) — A página foi criada em `apps/frontend/src/app/paciente/consultas/page.tsx` ignorando o grupo de layout `(dashboard)`. Isso afeta a herança de layout.
- [x] [Review][Patch] Vazamento de IDs de Consulta (404 vs 403) — Diferença de código de erro expõe existência de consultas de outros pacientes.
- [x] [Review][Patch] Validação de Parâmetro de ID (NaN) — ID não numérico gera erro 500 no Prisma; falta ParseIntPipe.
- [x] [Review][Patch] Ausência de DTOs e payload malformado — Falta validação rígida via DTO para reason e newDate.
- [x] [Review][Patch] Fuso horário hardcoded — Lógicas do servidor e frontend sofrem com diferenças e UTC ignorado.
- [x] [Review][Patch] Condição de Corrida (TOCTOU) no reagendamento — Verificação separada da atualização permite slot duplicado.
- [x] [Review][Patch] Referência não definida para nodemailer — O pacote não foi importado no arquivo mail.service.ts.
- [x] [Review][Patch] Logs inconsistentes no MailService — Mensagens copiadas da função de cancelamento no reagendamento.
- [x] [Review][Patch] Falta de testes de reagendamento — Funções críticas sem cobertura no spec do service.
- [x] [Review][Patch] Botão Acessar Sala Virtual inoperante — Nenhum link ou ação associada.
- [x] [Review][Patch] Componente Image falhando sem fallback — Falta verificação do RemotePatterns e tratamento de string vazia.
- [x] [Review][Patch] Importações não utilizadas — Limpar imports não usados no frontend (differenceInHours, etc).
- [x] [Review][Patch] Formatação de datas gerando RangeError/Hydration warnings — Tratamento inseguro de nulos no React.
- [x] [Review][Patch] Ausência de atalho Minhas Consultas no painel — O link foi removido do dashboard (quick access) invés de ser atualizado.
- [x] [Review][Patch] Reagendamento com perfil sem usuário causa TypeError — Acessar user em perfil indefinido causa 500 não tratado.
- [x] [Review][Patch] Cancelamento da última consulta na última página quebra listagem — Não altera currentPage para a anterior.
- [x] [Review][Patch] Reagendamento para slot cancelado viola índice — Constraint unique falha se o slot previamente cancelado não for sobrescrito corretamente.

## Suggested Review Order

**Backend Updates**
- Implementação dos novos endpoints no `AppointmentController`
- Validações e envio de email (fire-and-forget) em `AppointmentService`

**Frontend Dashboard (Patient)**
- Criação e roteamento da página "Minhas Consultas" (`/paciente/consultas`)
- Componentização do card de consulta e listagem dos agendamentos
- Dialog de confirmação para o botão Cancelar e integração com `PATCH /appointments/:id/cancel`

## Dev Agent Record

### Implementation Plan
- Implemented `getPatientAppointments` and `cancelAppointment` methods in `AppointmentService`.
- Added tests for `AppointmentService` covering these new methods.
- Added `sendCancellationToDoctor` method to `MailService` with proper non-blocking execution (fire-and-forget).
- Exposed `GET /appointments/patient` and `PATCH /appointments/:id/cancel` in `AppointmentController`.
- Updated `apps/frontend/src/app/paciente/dashboard/page.tsx` to include "Minhas Consultas" in `serviceCards`.
- Created `apps/frontend/src/app/paciente/consultas/page.tsx` displaying appointments and providing cancellation flow using `Modal`.

### Completion Notes
- All ACs are met. Tests pass. Emails are correctly executed fire-and-forget.
- ✅ Resolved code review findings (16 patches applied, including security, robustness, and UI/UX improvements).

## File List
- `apps/backend/src/appointment/appointment.service.ts`
- `apps/backend/src/appointment/appointment.controller.ts`
- `apps/backend/src/appointment/appointment.service.spec.ts`
- `apps/backend/src/mail/mail.service.ts`
- `apps/frontend/src/app/paciente/dashboard/page.tsx`
- `apps/frontend/src/app/paciente/consultas/page.tsx`

## Change Log
- [2026-06-07] Initial implementation of story 2.6 (Appointment Cancellation Flow).
- [2026-06-15] Addressed code review findings - 16 patches applied.
