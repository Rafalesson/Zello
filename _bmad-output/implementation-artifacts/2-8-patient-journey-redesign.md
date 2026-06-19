# Story 2.8: Patient Journey Redesign (Vitrine & Dashboard)

Status: ready-for-dev

## Story

As a Paciente,
I want acessar uma vitrine aberta de médicos e agendar uma consulta com login contextualizado, e visualizar meu dashboard de saúde proativo,
so that eu tenha uma experiência ágil, transparente e moderna (premium SaaS) sem barreiras artificiais de conversão.

## Acceptance Criteria

1. O usuário deslogado deve conseguir acessar a rota `/medicos` e ver a lista de médicos e horários disponíveis.
2. Ao clicar em um horário na vitrine sem estar logado, o modal de autenticação (`AuthContextModal`) deve abrir sem redirecionar bruscamente, mantendo o contexto de agendamento (`selectedSlot`, `doctorId`).
3. Após o login bem-sucedido no modal, redirecionar para a confirmação de agendamento mantendo o slot e o contexto do médico selecionado.
4. A rota da vitrine (`/medicos` e `/medico/[id]`) e endpoints de listagem de médicos/disponibilidade devem ser acessíveis publicamente (sem requerer JWT).
5. A tela inicial pós-login (`/paciente/dashboard`) deve exibir o `DashboardProactiveHero` em destaque com a próxima ação (ex: consulta nas próximas 48h) ou um banner educacional.
6. O antigo grid de botões do dashboard não deve mais existir, sendo substituído pelas `DashboardActionPills` minimalistas fixadas abaixo do Hero.
7. O design deve ser responsivo, exibindo carrossel de horários no mobile (swipeable) para o `DoctorPublicCard` e adaptando as pills (grid 2x2) e o hero card (100% da largura) em telas menores.

## Tasks / Subtasks

- [x] Task 1: Backend Setup & Roteamento Público (AC: 1, 4)
  - [x] Remover exigência de token JWT nas rotas de listagem de médicos e visualização de agenda/disponibilidade no backend.
  - [x] Garantir que o backend não exponha dados sensíveis (apenas informações públicas dos médicos e horários).
  - [x] Ajustar testes de integração/e2e relacionados à vitrine para validar o acesso anônimo de usuários deslogados.
- [x] Task 2: Implementação da Vitrine Aberta (AC: 1, 4, 7)
  - [x] Criar/atualizar a página pública `/medicos` com layout focado em tons calmos, com barra de busca inteligente (por dor ou especialidade).
  - [x] Implementar o novo `DoctorPublicCard` com foto, avaliação em estrelas, especialidades e próximos 3 horários disponíveis.
  - [x] Garantir o comportamento responsivo do card no mobile (carrossel horizontal para horários).
- [x] Task 3: Login Contextual e Retenção de Intenção (AC: 2, 3)
  - [x] Criar o componente `AuthContextModal` elegante (drawer ou modal) para interceptar cliques nos horários para usuários deslogados.
  - [x] Implementar a lógica de salvamento do contexto de agendamento e gerenciar fluxo de sucesso do login para a finalização do agendamento sem fricção.
  - [x] Assegurar que ao completar o login, o paciente não é redirecionado para a home, mas sim para a tela de confirmação de agendamento com os dados preenchidos.
- [x] Task 4: Dashboard Proativo (Timeline) (AC: 5, 6, 7)
  - [x] Remover o grid de navegação estático (`Agendar`, `Minhas Consultas`, `Receitas`) do painel do paciente.
  - [x] Implementar o `DashboardProactiveHero`, com lógica dinâmica de exibição com base nas consultas agendadas nas próximas 48h.
  - [x] Implementar o componente `DashboardActionPills` para as ações rápidas do usuário.
  - [x] Montar a nova visão inicial do `/paciente/dashboard` garantindo uma identidade visual coesa com a nova UI premium.

## Dev Notes

- **UX/UI Target:** A experiência deve passar a sensação de "confiança e limpeza" equivalente a um banco digital ou grande healthtech moderna. Usar tons calmos e bastante espaço em branco.
- **Backend Constraints:** Assegurar que ao expor rotas públicas de médicos (`/medicos`), nenhuma informação não-autorizada vaze.
- **Frontend Components:** Novas entidades de UI: `DoctorPublicCard`, `AuthContextModal`, `DashboardProactiveHero`, `DashboardActionPills`.
- **Context Management:** O contexto da ação intencionada (`selectedSlot` / `doctorId`) deve ser retido pelo frontend ao invocar o modal de login para garantir o UX "frictionless".

### Project Structure Notes

- A rota `/medicos` deve ser otimizada para SEO (já que se tornará pública e o entry point para aquisição orgânica).
- Assegurar a continuidade do design system existente para a padronização visual das novas `Pills` e `Cards`.

### References

- UX Scenario (Evolution): `_bmad-output/evolution/scenarios/01-vitrine-to-dashboard.md`
- UX Specs (Evolution): `_bmad-output/evolution/specs/01-patient-experience-spec.md`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
