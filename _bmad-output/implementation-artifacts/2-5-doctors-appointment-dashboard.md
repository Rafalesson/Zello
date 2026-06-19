# Story 2.5: Doctor's Appointment Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Doctor,
I want to view a list of my upcoming consultations,
so that I can organize my day and prepare for my patients.

## Acceptance Criteria

1. **Dado** um médico visualizando seu dashboard
2. **Quando** a página carregar
3. **Então** ele deve ver uma lista cronológica de suas consultas agendadas (FR13)
4. **E** cada registro deve exibir o nome do paciente, horário da consulta formatado e status atual

## Tasks / Subtasks

- [x] **Task 1: Criar Serviço e Endpoint no Backend** (AC: 3, 4)
  - [x] 1.1 Adicionar o método `getDoctorAppointments(doctorProfileId: number)` em `apps/backend/src/appointment/appointment.service.ts`. Ele deve buscar consultas associadas ao médico, incluir o `patientProfile`, e ordenar de forma ascendente por `date`.
  - [x] 1.2 Criar rota `GET /appointments/doctor` em `apps/backend/src/appointment/appointment.controller.ts` protegida por `AuthGuard`, `RolesGuard` e restrita à role `DOCTOR` (`@Roles('DOCTOR')`). Ela deve extrair o ID do perfil médico através de `req.user.doctorProfile?.id` e lançar `ForbiddenException` caso o perfil não seja encontrado.
- [x] **Task 2: Implementar Testes Unitários no Backend** (AC: 3, 4)
  - [x] 2.1 Adicionar bloco de testes unitários em `apps/backend/src/appointment/appointment.service.spec.ts` para verificar o retorno correto e ordenado de `getDoctorAppointments` utilizando mocks do Prisma.
- [x] **Task 3: Integrar e Atualizar UI do Dashboard Médico no Frontend** (AC: 1, 2, 3, 4)
  - [x] 3.1 Em `apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx`, declarar a consulta das consultas do médico usando o hook `useQuery` com a chave `['doctorAppointments']` consumindo `GET /appointments/doctor`.
  - [x] 3.2 Substituir a contagem estática ("07") no card "Consultas Hoje" por uma contagem dinâmica calculada a partir das consultas recebidas cuja data corresponde ao dia atual (fuso horário local de Brasília).
  - [x] 3.3 Inserir uma seção visualmente elegante ("Próximas Consultas") abaixo dos cards principais para listar cronologicamente as consultas.
  - [x] 3.4 Exibir para cada consulta: o nome do paciente (`appointment.patientProfile.name`), a data/hora formatada no formato brasileiro (ex: `dd/MM/yyyy às HH:mm`) e um badge de status estilizado (`AGENDADA` = amarelo/âmbar, `CANCELADA` = vermelho, `REALIZADA` = verde).
  - [x] 3.5 Adicionar estados de carregamento (loading skeleton) e tratamento elegante caso não existam consultas agendadas (empty state com ícone da Lucide, ex: `CalendarDays`).

## Dev Notes

- **Autenticação:** O backend já fornece as informações de perfil do médico em `req.user` através do `JwtStrategy`. Siga o padrão estabelecido no `AvailabilityController` para obter o `doctorProfileId`.
- **Fuso Horário:** Garanta que a formatação da data das consultas no frontend utilize o fuso horário local e seja amigável (ex.: `new Date(app.date).toLocaleString('pt-BR', ...)`).
- **Consistência de Cores:** Use os tokens de cores do sistema de design Teal/Slate já configurados (`teal-650`, `slate-800` etc.) para os elements visuais.
- **Componentes:** Utilize ícones da biblioteca `lucide-react` (como `Calendar`, `User`, `Clock`, `Activity`) para enriquecer visualmente a listagem.

### Project Structure Notes

- **Backend Controller:** `apps/backend/src/appointment/appointment.controller.ts`
- **Backend Service:** `apps/backend/src/appointment/appointment.service.ts`
- **Backend Tests:** `apps/backend/src/appointment/appointment.service.spec.ts`
- **Frontend Page:** `apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx`

### References

- **Prisma Schema (Appointment Model):** [schema.prisma](file:///home/rafa/Documentos/Projetos/Zello/apps/backend/prisma/schema.prisma#L158-L172)
- **Availability Controller Reference:** [availability.controller.ts](file:///home/rafa/Documentos/Projetos/Zello/apps/backend/src/availability/availability.controller.ts#L29-L39)
- **Previous Mail Service & Date Fns Usage:** [2-4-booking-confirmation-notifications.md](file:///home/rafa/Documentos/Projetos/Zello/_bmad-output/implementation-artifacts/2-4-booking-confirmation-notifications.md#L30-L34)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

- Sucesso na execução dos testes de unidade com `npm run test --workspace=backend -- appointment.service.spec.ts`.
- Validação estática de tipos bem-sucedida com `npx tsc --noEmit` no frontend.

### Completion Notes List

- Método `getDoctorAppointments` implementado no `AppointmentService` do backend, com ordenação cronológica e carregamento de relações do paciente.
- Rota `GET /appointments/doctor` protegida por `AuthGuard`, `RolesGuard` e `@Roles('DOCTOR')` implementada no backend.
- Hook `useQuery` com chave `['doctorAppointments']` adicionado ao frontend.
- Lista cronológica "Próximas Consultas" inserida ao lado de "Documentos Emitidos Recentemente" com carregamento por esqueleto visual e tela amigável para listas vazias.
- Badges de status coloridos (`AGENDADA`, `CANCELADA`, `REALIZADA`) e formatação de datas em fuso horário de Brasília (UTC-3) finalizadas.
- O card "Consultas Hoje" agora calcula o total de consultas do dia dinamicamente e com fuso horário correto.

### File List

- `apps/backend/src/appointment/appointment.service.ts`
- `apps/backend/src/appointment/appointment.controller.ts`
- `apps/backend/src/appointment/appointment.service.spec.ts`
- `apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx`

### Review Findings

- [x] [Review][Decision] Escopo de "Próximas Consultas" — O backend e frontend carregam todo o histórico de consultas (sem limite ou paginação). Para a lista de "Próximas Consultas", devemos filtrar na query do backend para trazer apenas consultas a partir da data atual, ou manter todas e implementar paginação virtualizada no frontend?
- [x] [Review][Patch] Otimização de Performance no Contador — A filtragem para "Consultas Hoje" no frontend mapeia toda a lista (potencialmente pesada) em cada render/memo. O cálculo ficará mais leve assim que a API for corrigida.
