# Story 3.6: Technical Debt & Review Cleanup

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como Desenvolvedor,
Eu quero resolver os débitos técnicos, correções sistêmicas e as pendências identificadas na retrospectiva do Epic 3,
Para que a plataforma seja robusta, segura contra vulnerabilidades de controle de acesso (ID Leaking e TOCTOU), e tenha consistência de fuso horário antes do início do Epic 4.

## Critérios de Aceitação (Acceptance Criteria)

### Bloco A: Correções dos 11 Review Findings da Story 3.4
1. **A1 - Verificação Server-side de Check-in de Dispositivos e Triagem:**
   - **Given** que o paciente tenta entrar na sala de espera virtual (PATCH `/appointments/:id/waiting-room`).
   - **When** o backend processa a requisição.
   - **Then** deve validar que a pré-triagem (`PreTriage`) e o termo de consentimento (`ConsentRecord`) estão gravados no banco de dados para a consulta.
   - **And** retornar `400 Bad Request` se ausentes.
   - **And** no frontend, se o paciente acessar a rota `/paciente/sala/[id]` diretamente e não tiver concluído a triagem/consentimento, redirecioná-lo para a tela de check-in `/paciente/consulta/[id]`.
   - **And** se tiver concluído triagem e consentimento mas não a verificação de hardware, forçar a execução da verificação de dispositivos (ex: validando através de um flag temporário no `sessionStorage` com a chave `device-check-passed-${id}`).

2. **A2 - Regressão de Fuso Horário:**
   - **Given** que consultas possuem datas armazenadas em UTC.
   - **When** o backend compara horários para transições ou consultas do dia (ex: `enterWaitingRoom()` e `markNoShow()`).
   - **Then** deve-se garantir o uso consistente de data e hora em UTC puro, eliminando desvios decorrentes do fuso horário local do servidor.

3. **A3 - Polling Otimizado de Status na Sala de Espera:**
   - **Given** que o paciente está aguardando na sala de espera.
   - **When** o sistema verifica se a consulta foi iniciada pelo médico.
   - **Then** o frontend deve realizar polling a cada 5-10 segundos consumindo o novo endpoint individual `GET /appointments/:id` (em vez do endpoint de listagem genérica).
   - **And** a inicialização da tela deve obter os detalhes da consulta diretamente de `GET /appointments/:id` em vez do endpoint de listagem genérica.

4. **A4/A9 - Idempotência e Reentrada na Sala de Espera:**
   - **Given** que o paciente recarrega a página da sala de espera.
   - **When** a consulta já possui status `EM_ESPERA` ou `EM_ANDAMENTO`.
   - **Then** a chamada para `PATCH /appointments/:id/waiting-room` deve responder com `200 OK` e retornar os dados da consulta sem gerar exceções de transição inválida.
   - **And** o frontend deve evitar submeter a requisição de entrada caso o status inicial retornado já seja `EM_ESPERA` ou `EM_ANDAMENTO`.

5. **A5 - Janela Temporal para Entrada na Sala de Espera:**
   - **Given** uma consulta agendada para um determinado horário.
   - **When** o paciente tenta entrar na sala de espera virtual.
   - **Then** o backend só deve permitir a transição para `EM_ESPERA` se a hora atual estiver dentro de uma janela de ±15 minutos em relação ao horário agendado (ex: agendada para 14:00, entrada permitida entre 13:45 e 14:15).

6. **A6 - Timer de No-Show Dinâmico:**
   - **Given** que o paciente entra na sala de espera (seja cedo ou com atraso).
   - **When** o timeout de no-show é calculado no frontend.
   - **Then** a duração restante deve ser baseada dinamicamente na diferença entre a hora atual e `scheduledTime + 10 minutos` (e não fixada em 10 minutos a partir do carregamento da página).

7. **A7 - Proteção contra Condição de Corrida (TOCTOU):**
   - **Given** concorrência de requisições de atualização de status de consulta.
   - **When** as operações de transição de status (`enterWaitingRoom`, `markNoShow`, `startConsultation`, `cancelAppointment`, `rescheduleAppointment`) são executadas.
   - **Then** o backend deve iniciar uma transação do Prisma e aplicar um bloqueio exclusivo de linha (row-level lock, `SELECT ... FOR UPDATE`) no registro da tabela `Appointment` antes de qualquer lógica de validação ou escrita.

8. **A8 - Feedback de Erro no Timeout de No-Show:**
   - **Given** que o timer de 10 minutos de no-show do paciente expirou.
   - **When** a chamada para `PATCH /appointments/:id/no-show` falhar (ex: falha de rede).
   - **Then** o frontend deve capturar o erro em um bloco try/catch, manter a interface consistente e exibir uma mensagem empática de erro com opção de nova tentativa (retry).

9. **A10 - Landmarks Semânticos e Acessibilidade:**
   - **Given** a página da sala de espera virtual.
   - **When** percorrida por leitores de tela ou navegada por teclado.
   - **Then** deve possuir landmarks HTML5 semânticos (`<main>`, `<section>`, etc.).
   - **And** a região do "Loading Narrativo" com mensagens dinâmicas deve utilizar `aria-live="polite"` e `aria-atomic="true"` corretamente configurados para anunciar mudanças sem interromper o fluxo do usuário.

10. **A11 - Uso Estrito de Enum Compartilhado:**
    - **Given** as páginas e componentes do frontend para o fluxo do paciente.
    - **When** realizando comparações e atribuições de status de consulta.
    - **Then** todas as referências a strings mágicas de status (ex: `"EM_ESPERA"`) devem ser substituídas pelo enum `ConsultationStatus` importado de `@imnotmedical/shared`.

11. **A12 - Fraseologia Exata de Ausência:**
    - **Given** que a tela de no-show é exibida ao paciente.
    - **When** a tolerância do médico expira.
    - **Then** a mensagem exibida na tela deve ser exatamente: *"O médico não pôde iniciar a consulta no momento. Deseja reagendar?"*.

### Bloco B: Correções Sistêmicas e Guardrails
12. **B1 - Componente `<Button>` Padronizado:**
    - **Given** botões de ação e submissão na interface.
    - **When** implementados no frontend.
    - **Then** devem utilizar um componente customizado centralizado `<Button>` (em `apps/frontend/src/components/common/Button.tsx`) com `type="button"` definido como padrão (para evitar submissões de formulário automáticas indesejadas pelo navegador ao apertar Enter).
    - **And** suportar a variante `type="submit"` quando necessário.
    - **And** todos os botões do fluxo de pré-triagem, consentimento e sala de espera devem ser migrados para este componente.

13. **B2 - Helper de Transações com Lock do Prisma:**
    - **Given** a necessidade de transações seguras com bloqueio concorrente no backend.
    - **When** implementando serviços que alteram estados cruciais do agendamento.
    - **Then** utilizar uma função utilitária helper `runInTransactionWithLock` no `PrismaService` (`apps/backend/src/prisma/prisma.service.ts`) para encapsular o boilerplate de `$transaction` e execução de queries SQL raw de lock com assinatura `runInTransactionWithLock<T>(id: number, callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>`.

14. **B3/C5 - Prevenção de ID Leaking (Ownership Guard):**
    - **Given** um usuário logado tentando acessar dados de uma entidade pelo ID na URL ou API.
    - **When** o registro não existe ou pertence a outro usuário (médico/paciente diferente da consulta).
    - **Then** o backend deve lançar uma exceção de `NotFoundException` (404 Not Found) ao invés de `ForbiddenException` (403 Forbidden) para evitar enumeração de IDs existentes por agentes maliciosos.
    - **And** auditar e atualizar o `PreTriageController` (`apps/backend/src/pre-triage/pre-triage.controller.ts`) para usar `NotFoundException` no `validateOwnership` e no `GET /appointments/:id/pre-triage`.

15. **B4 - Auditoria UTC Global:**
    - **Given** as operações de data e hora do backend.
    - **When** executadas em qualquer módulo.
    - **Then** todas devem usar estritamente datas normalizadas para UTC no banco de dados e na lógica de negócio, eliminando manipulação local.

### Bloco C: Deferred Work Relevante para o Epic 4
16. **C1 - Preferências de Mídia persistidas:**
    - **Given** que o paciente selecionou preferências de mute/unmute para câmera e microfone na tela de check-in.
    - **When** o paciente prossegue para a sala de espera ou para a chamada.
    - **Then** essas escolhas devem ser guardadas em `sessionStorage` ou através de um Contexto React, e aplicadas de forma transparente no carregamento da tela de chamada de vídeo no Epic 4.

17. **C3 - Endpoint Direto `GET /appointments/:id`:**
    - **Given** a necessidade de obter detalhes de uma consulta específica.
    - **When** consumido pelo frontend.
    - **Then** o backend deve expor a rota `GET /appointments/:id` protegida por autenticação, validando a posse e retornando 404 se não for proprietário.

18. **C4 - Validação de Intensidade da Pré-Triagem:**
    - **Given** o envio de dados da pré-triagem pelo paciente.
    - **When** o DTO de criação de pré-triagem é validado no backend.
    - **Then** o campo de intensidade deve possuir validação `@Min(1)` e `@Max(10)` ativa (alinhando com a escala de 1 a 10 e os labels correspondentes no frontend).

---

## Tasks / Subtasks

- [x] **Tarefa 1: Refatoração do Backend e Proteção de Dados** (AC: 1, 2, 4, 5, 7, 13, 14, 15, 17, 18)
  - [x] Implementar helper de transação com row-level lock no `PrismaService` (`apps/backend/src/prisma/prisma.service.ts`).
  - [x] Refatorar os métodos em `AppointmentService` para usar transação com bloqueio exclusivo do `Appointment` por ID (ex: `SELECT id FROM "Appointment" WHERE id = $1 FOR UPDATE`).
  - [x] Adicionar validação server-side na transação de `enterWaitingRoom()` para checar a existência de `preTriage` e `consentRecord` associados à consulta.
  - [x] Validar a janela de tempo de acesso (±15 minutos) do horário agendado em `enterWaitingRoom()`.
  - [x] Ajustar o retorno de `enterWaitingRoom()` para ser idempotente quando o status for `EM_ESPERA` ou `EM_ANDAMENTO`.
  - [x] Criar endpoint `GET /appointments/:id` no `AppointmentController` e `AppointmentService` com validação de ownership (retornar 404 se não pertencer ao usuário logado).
  - [x] Substituir o uso de `ForbiddenException` por `NotFoundException` em todas as rotas e validações de recursos por ID (ex: `validateOwnership` e GET de pré-triagem no `PreTriageController`, endpoints de consentimento) para evitar ID leaking.
  - [x] Auditar e ajustar as operações de data no backend (ex: `getDoctorAppointments`) para garantir uso de datas normatizadas em UTC.
  - [x] Adicionar validações `@Min(1)` e `@Max(10)` no DTO de triagem (`CreatePreTriageDto`). *(Já existiam)*
  - [x] Atualizar e expandir os testes unitários do backend para validar as novas regras de negócio e transições idempotentes.

- [x] **Tarefa 2: Refatoração do Frontend e Componentes Comuns** (AC: 1, 3, 4, 6, 8, 9, 10, 11, 12, 16)
  - [x] Criar o componente `<Button>` padronizado em `apps/frontend/src/components/common/Button.tsx` com `type="button"` por padrão.
  - [x] Substituir tags `<button>` nativas por `<Button>` no formulário de pré-triagem, formulário de consentimento, modal de check-in de mídia e na página da sala de espera.
  - [x] Atualizar a página da sala de espera (`apps/frontend/src/app/paciente/sala/[id]/page.tsx`) para fazer o fetch inicial e o polling de status consumindo o novo endpoint individual `GET /appointments/:id` em vez do endpoint de listagem genérica.
  - [x] Ajustar o timer de no-show na sala de espera para calcular dinamicamente a diferença até o deadline de `scheduledTime + 10min` a partir de `Date.now()`.
  - [x] Tratar erro na chamada de no-show com try/catch no frontend, exibindo um modal ou banner amigável de erro que permita ao usuário tentar novamente (retry).
  - [x] Armazenar as preferências de mute do microfone e câmera no `sessionStorage` ao concluir o device check-in, com chave indexada pelo ID da consulta.
  - [x] Gerenciar o flag temporário `device-check-passed-${id}` em `sessionStorage` para forçar a execução do device check-in se não concluído.
  - [x] Corrigir redirecionamentos e validações de reentrada na sala de espera para evitar chamar o PATCH se a consulta já estiver `EM_ESPERA` ou `EM_ANDAMENTO`.
  - [x] Garantir o uso estrito do enum `ConsultationStatus` compartilhado do pacote `@imnotmedical/shared` na página `/paciente/sala/[id]/page.tsx` e componentes.
  - [x] Revisar a semântica de landmarks da sala de espera e as propriedades de `aria-live`/`aria-atomic` no loading narrativo.

- [x] **Tarefa 3: Atualizações de Status e Documentação**
  - [x] Atualizar o status da Story 3.4 de `review` para `done` no `sprint-status.yaml`. *(Já estava done)*
  - [x] Atualizar o status da Story 3.6 de `backlog` para `ready-for-dev` no `sprint-status.yaml`. *(Feito - agora in-progress)*
  - [x] Atualizar o arquivo `_bmad-output/implementation-artifacts/deferred-work.md` para remover débitos resolvidos.
  - [x] Documentar no `project-context.md` (caso exista ou criar novo) as convenções estabelecidas: componente de botão unificado, UTC global, erros 404 unificados para ownership e locks concorrentes.

### Review Findings

- [ ] [Review][Patch] [Blind-1] Hardcoding de Tabela `"Appointment"` no helper `PrismaService.runInTransactionWithLock` [apps/backend/src/prisma/prisma.service.ts:1299-1307]
- [ ] [Review][Patch] [Blind-2] Contenção/Deadlock no Lock do `DoctorProfile` no Reschedule e Create [apps/backend/src/appointment/appointment.service.ts:722, 930-960]
- [ ] [Review][Patch] [Blind-3] Disparo de E-mails (*Side Effects*) dentro do callback de transação não comitada [apps/backend/src/appointment/appointment.service.ts:907-917, 988-1010]
- [ ] [Review][Patch] [Blind-4 + Edge-1] Ausência de Validação DTO para `cancelAppointment` e `rescheduleAppointment` no Controller [apps/backend/src/appointment/appointment.controller.ts:66, 75]
- [ ] [Review][Patch] [Blind-5 + Edge-13] Inconsistência na verificação de ownership no `PreTriageController` (`user.patientProfile?.id`) [apps/backend/src/pre-triage/pre-triage.controller.ts:1377-1384]
- [ ] [Review][Patch] [Blind-6 + Edge-12] Condição de Corrida (TOCTOU) no `PreTriageController.createPreTriage` [apps/backend/src/pre-triage/pre-triage.controller.ts:1348, 1394-1416]
- [ ] [Review][Patch] [Blind-7 + Edge-5] Regressão de Fuso Horário (UTC Rollover) no `getDoctorAppointments` / `getPatientAppointments` [apps/backend/src/appointment/appointment.service.ts:178-185, 780-788]
- [ ] [Review][Patch] [Blind-8 + Blind-9 + Edge-8] Falha ao verificar `Availability` e autocolisão no `create` / `rescheduleAppointment` [apps/backend/src/appointment/appointment.service.ts:703-768, 948-976]
- [ ] [Review][Patch] [Blind-10] Código HTTP incorreto (`404` vs `403`) em rotas de listagem sem ID (`getDoctorAppointments` e `getPatientAppointments`) [apps/backend/src/appointment/appointment.controller.ts:33, 42]
- [ ] [Review][Patch] [Blind-11] Padronização de Exceções Lançadas (`code` vs string pura) no `AppointmentService` [apps/backend/src/appointment/appointment.service.ts:832, 883, 1042]
- [ ] [Review][Patch] [Blind-12] Falta de verificação de janela de tempo/expiração no retorno idempotente de `enterWaitingRoom` [apps/backend/src/appointment/appointment.service.ts:1052-1056]
- [ ] [Review][Patch] [Blind-13] Acoplamento de `PrismaService` diretamente no `PreTriageController` [apps/backend/src/pre-triage/pre-triage.controller.ts:1365, 1395]
- [ ] [Review][Patch] [Blind-14 + Blind-15] Cobertura de Testes Unitários ausente para `rescheduleAppointment` e envio de e-mail no `cancelAppointment` [apps/backend/src/appointment/appointment.service.spec.ts]
- [ ] [Review][Patch] [Edge-2] Rollover em data de calendário inválida (`getAvailableSlots`) [apps/backend/src/appointment/appointment.service.ts:20-21]
- [ ] [Review][Patch] [Edge-3] Loop infinito caso `slotDurationMinutes <= 0` na `Availability` [apps/backend/src/appointment/appointment.service.ts:60-65]
- [ ] [Review][Patch] [Edge-4] Agendamento simultâneo com múltiplos médicos pelo mesmo paciente [apps/backend/src/appointment/appointment.service.ts:120-136]
- [ ] [Review][Patch] [Edge-6] Cancelamento por paciente permitido em consultas `EM_ANDAMENTO` ou `REALIZADA` [apps/backend/src/appointment/appointment.service.ts:886-894]
- [ ] [Review][Patch] [Edge-7] Reagendamento permitido para consultas `EM_ANDAMENTO`, `EM_ESPERA` ou `NAO_REALIZADA` [apps/backend/src/appointment/appointment.service.ts:943-945]
- [ ] [Review][Patch] [Edge-9 + Edge-10] Omissão de `include` para relações essenciais em `enterWaitingRoom` e `markNoShow` [apps/backend/src/appointment/appointment.service.ts:1117-1124, 1187-1190]
- [ ] [Review][Patch] [Edge-11] Iniciar consulta (`startConsultation`) sem checar `preTriage` ou `consentRecord` quando o status é `AGENDADA` [apps/backend/src/appointment/appointment.service.ts:1247-1253]
- [ ] [Review][Patch] [Auditor-1] Uso de string literal (`'AGENDADA'`) em `PreTriageController` e `ConsentController` [apps/backend/src/pre-triage/pre-triage.controller.ts:1394]

---

## Dev Notes

- **Prevenção de TOCTOU:** O row lock na transação deve ser executado no início da transação Prisma para que nenhuma outra requisição simultânea possa ler ou alterar o status da consulta paralelamente.
- **Segurança (ID Leaking):** Certifique-se de que a resposta HTTP para um ID inexistente e um ID de outro usuário seja idêntica (`404 Not Found` com a mesma mensagem), de forma que seja impossível inferir se um ID específico de consulta existe no sistema.
- **Persistência de Mídia:** Salvar as preferências de mídia (`videoEnabled`, `audioEnabled`) no `sessionStorage` no formato JSON ajuda a repassar esses estados de forma limpa sem poluir a URL ou o estado global de rotas.

### Referências
- Retrospectiva do Epic 3: `_bmad-output/implementation-artifacts/epic-3-retro-2026-07-08.md`
- Template de Cleanup: `_bmad-output/implementation-artifacts/2-10-technical-debt-cleanup.md`
- Prisma Schema: `apps/backend/prisma/schema.prisma`
- Página da Sala de Espera: `apps/frontend/src/app/paciente/sala/[id]/page.tsx`

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (Thinking)

### Debug Log References
- All 50 relevant backend tests passing (appointment, pre-triage, consent modules)
- 1 pre-existing template test failure (timezone-dependent, unrelated to changes)

### Completion Notes List
- ✅ Implemented `runInTransactionWithLock` helper in PrismaService for TOCTOU-safe row-level locking
- ✅ Refactored all 5 state-transition methods (enterWaitingRoom, markNoShow, startConsultation, cancelAppointment, rescheduleAppointment) to use row-level locks
- ✅ Added server-side validation of PreTriage and ConsentRecord existence in enterWaitingRoom
- ✅ Implemented ±15 minute time window validation for waiting room entry
- ✅ Made enterWaitingRoom idempotent for EM_ESPERA and EM_ANDAMENTO statuses
- ✅ Created GET /appointments/:id endpoint with ownership validation (404 for non-owners)
- ✅ Replaced all ForbiddenException with NotFoundException across controllers (AppointmentController, PreTriageController) to prevent ID leaking
- ✅ Fixed getDoctorAppointments to use UTC-normalized dates (removed timezone-dependent Intl.DateTimeFormat)
- ✅ Verified @Min(1)/@Max(10) validators already present in CreatePreTriageDto
- ✅ Created standardized `<Button>` component with type="button" default
- ✅ Migrated all buttons in PreTriage, ConsentForm, DeviceCheckModal, and waiting room page to `<Button>`
- ✅ Updated waiting room to use GET /appointments/:id for init and polling
- ✅ Implemented dynamic no-show timer based on scheduledTime + 10min
- ✅ Added no-show error state with retry capability
- ✅ Persisted media preferences (videoEnabled/audioEnabled) and device-check-passed flag in sessionStorage
- ✅ Added device-check-passed validation on waiting room entry
- ✅ Prevented PATCH call when status is already EM_ESPERA or EM_ANDAMENTO
- ✅ Used ConsultationStatus enum strictly throughout frontend
- ✅ Added semantic HTML5 landmarks (main, section with aria-label)
- ✅ Updated deferred-work.md marking 9 items as resolved
- ✅ Created docs/project-context.md with established conventions
- ✅ 28 new/updated backend tests, all 50 relevant tests passing

### File List
- `apps/backend/src/prisma/prisma.service.ts` — Added runInTransactionWithLock helper
- `apps/backend/src/appointment/appointment.service.ts` — Major refactor: TOCTOU locks, server-side validation, idempotency, time window, UTC dates, getAppointmentById
- `apps/backend/src/appointment/appointment.controller.ts` — Added GET :id endpoint, replaced ForbiddenException with NotFoundException
- `apps/backend/src/appointment/appointment.service.spec.ts` — Comprehensive test suite (28 tests)
- `apps/backend/src/pre-triage/pre-triage.controller.ts` — Fixed ForbiddenException to NotFoundException
- `apps/frontend/src/components/common/Button.tsx` — New standardized Button component
- `apps/frontend/src/app/paciente/sala/[id]/page.tsx` — Major refactor: individual endpoint, dynamic timer, error retry, semantic landmarks, Button migration
- `apps/frontend/src/components/consultation/DeviceCheckModal.tsx` — Added appointmentId prop, media prefs persistence, device-check flag, Button migration
- `apps/frontend/src/components/consultation/PreTriage.tsx` — Button migration
- `apps/frontend/src/components/consultation/ConsentForm.tsx` — Button migration
- `apps/frontend/src/app/paciente/consulta/[id]/page.tsx` — Added appointmentId prop to DeviceCheckModal, ConsultationStatus enum, Button migration
- `_bmad-output/implementation-artifacts/deferred-work.md` — Marked 9 resolved items
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated story status
- `docs/project-context.md` — New: established conventions documentation

### Change Log
- 2026-07-18: Story 3.6 implementation complete — 18 acceptance criteria addressed across backend TOCTOU protection, ID leaking prevention, UTC normalization, frontend component standardization, and documentation
