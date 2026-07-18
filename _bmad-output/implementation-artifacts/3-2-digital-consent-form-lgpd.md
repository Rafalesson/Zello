# Story 3.2: Termo de Consentimento Digital & LGPD

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como Paciente,
Eu quero ler e aceitar o termo de consentimento de telemedicina e os termos da LGPD,
Para que eu entenda meus direitos e os limites legais do atendimento remoto.

## Critérios de Aceitação

1. **Dado** um paciente prosseguindo após a etapa de triagem
   **Quando** ele for apresentado aos termos de consentimento digital e LGPD
   **Então** ele deve aceitar explicitamente os termos para prosseguir (FR16).

2. **Dado** a exibição dos termos de consentimento digital e LGPD
   **Quando** o paciente visualiza a interface
   **Então** os termos são divididos claramente em seções legíveis (ex: escopo do atendimento remoto, limitações, consentimento de uso de dados sensíveis e direitos do paciente sob a LGPD)
   **E** um checkbox interativo deve estar presente com o texto: *"Li, compreendi e aceito os Termos de Consentimento Digital e a Política de Privacidade/LGPD para esta consulta."*
   **E** todos os elementos interativos (checkbox e botões) devem ser acessíveis via navegação por teclado (Tab-only) e possuir anéis de foco de alta visibilidade (`ring-2 ring-teal-500`).

3. **Dado** a submissão do termo de consentimento
   **Quando** o paciente clica para confirmar
   **Então** a confirmação é gravada no banco de dados com um timestamp e informações de auditoria (IP e User-Agent) sob o modelo `ConsentRecord` com uma relação 1-para-1 estrita com o modelo `Appointment` (usando `onDelete: Cascade`)
   **E** o endpoint da API (`POST /appointments/:id/consent`) valida se o usuário autenticado é o paciente associado à consulta.

4. **Dado** o fluxo de check-in geral do paciente
   **Quando** a página de check-in (`/paciente/consulta/[id]/page.tsx`) carrega
   **Então** o sistema deve verificar se a triagem e o consentimento já foram realizados para aquela consulta
   **E** redirecionar o paciente diretamente para o próximo passo pertinente (evitando cliques redundantes).

## Tarefas / Subtasks

- [x] Tarefa 1: Banco de Dados e Implementação Backend (AC: 3)
  - [x] Adicionar o modelo `ConsentRecord` ao esquema Prisma (`apps/backend/prisma/schema.prisma`), incluindo `id`, `accepted` (Boolean), `ipAddress` (String?), `userAgent` (String?), `acceptedAt` (DateTime @default(now())) e relacionamento 1-para-1 com `Appointment` (onDelete: Cascade).
  - [x] Atualizar o modelo `Appointment` com a relação opcional `consentRecord ConsentRecord?`.
  - [x] Aplicar as alterações do banco com `npx prisma db push`.
  - [x] Criar o módulo `src/consent/` no backend NestJS.
  - [x] Implementar a DTO `CreateConsentDto` contendo a validação de que `accepted` deve ser obrigatoriamente `true` (usando `class-validator`).
  - [x] Implementar `ConsentService` para gerenciar a persistência do registro de consentimento no banco de dados.
  - [x] Implementar `ConsentController` contendo:
    - [x] Endpoint `POST /appointments/:id/consent` restrito à role `PATIENT` que valida a propriedade da consulta, valida se o status é `AGENDADA`, extrai o IP (`req.ip` ou `req.headers['x-forwarded-for']`) e User-Agent (`req.headers['user-agent']`), e salva o registro.
    - [x] Endpoint `GET /appointments/:id/consent` restrito a `PATIENT` e `DOCTOR` que valida o acesso de propriedade/atendimento e retorna os detalhes do consentimento se existirem.
  - [x] Registrar o `ConsentModule` no `app.module.ts`.
  - [x] Adicionar testes unitários Jest para o `ConsentService`.

- [x] Tarefa 2: Implementação Frontend (AC: 1, 2, 4)
  - [x] Criar o componente `ConsentForm.tsx` em `apps/frontend/src/components/consultation/`.
  - [x] Exibir o texto estruturado do Termo de Consentimento Digital e LGPD (foco em legibilidade e acessibilidade).
  - [x] Implementar o checkbox interativo de aceitação integrado com controle de teclado e anéis de foco (`ring-2 ring-teal-500`).
  - [x] Habilitar o botão de submissão ("Confirmar e Prosseguir") apenas quando o checkbox estiver marcado.
  - [x] Atualizar a página de check-in em `apps/frontend/src/app/paciente/consulta/[id]/page.tsx` para integrar o passo `consent`:
    - [x] Adicionar `'consent'` nas opções de `CheckInStep`.
    - [x] No carregamento da página, disparar uma chamada para verificar se o consentimento já foi assinado (`GET /appointments/:id/consent`).
    - [x] Sequenciar o fluxo: se `pre-triage` não foi feita -> exibe `pre-triage`. Se `pre-triage` foi feita mas `consent` não -> exibe `consent`. Se ambos estão prontos -> redireciona para a sala virtual.

## Dev Notes

- Requisitos de arquitetura e restrições relevantes:
  - O backend deve utilizar a estrutura flat padrão do projeto: `src/consent/`.
  - Utilizar `class-validator` e `class-transformer` para validação DTO no backend.
  - Validações de propriedade nos endpoints são vitais para evitar vazamento de dados de saúde (ID leaking).
  - Acessibilidade WCAG AA: contraste e navegação por teclado em todos os botões e no checkbox de termos.
- Componentes da árvore de código a serem alterados/criados:
  - `apps/backend/prisma/schema.prisma`
  - `apps/backend/src/consent/*`
  - `apps/backend/src/app.module.ts`
  - `apps/frontend/src/components/consultation/ConsentForm.tsx`
  - `apps/frontend/src/app/paciente/consulta/[id]/page.tsx`
- Resumo dos padrões de teste:
  - Incluir testes Jest para o `ConsentService` cobrindo o happy path de criação, cenários de erro e busca.

### Project Structure Notes

- Alinhamento com a estrutura unificada do projeto (caminhos, módulos, nomenclatura):
  - Módulo NestJS kebab-cased: `consent` (ou `consent-record` no backend, preferido `consent` para brevidade).
  - Componente Next.js PascalCased: `ConsentForm.tsx`.
- Conflitos ou divergências detectados:
  - Nenhum.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows]

## Dev Agent Record

### Implementation Plan

- Followed PreTriage module pattern exactly for ConsentRecord backend implementation
- ConsentRecord model uses 1-to-1 relationship with Appointment via unique appointmentId, with onDelete: Cascade
- CreateConsentDto uses @Equals(true) from class-validator to enforce explicit acceptance
- ConsentController implements dual-endpoint pattern: POST for patients, GET for patient+doctor access
- Duplicate consent prevention via ConflictException guard
- IP extraction handles both x-forwarded-for (proxied) and req.ip (direct) scenarios
- Frontend ConsentForm component displays 4 structured legal sections with icons
- Check-in page flow updated: pre-triage → consent → virtual room, with skip logic for completed steps

### Debug Log

- No debug issues encountered

### Completion Notes

- ✅ Tarefa 1: ConsentRecord model added to Prisma schema with all required fields and 1-to-1 Appointment relationship. ConsentModule created with service, controller, DTO. All 6 unit tests passing.
- ✅ Tarefa 2: ConsentForm.tsx created with 4 structured legal sections (Escopo, Limitações, LGPD, Direitos), accessible checkbox with keyboard navigation and focus rings. Check-in page updated with multi-step flow (pre-triage → consent → completed → redirect).
- Frontend build passes. Backend tests: 6/6 new consent tests pass, 80/80 existing tests pass (1 pre-existing template test failure unrelated to this story).

## File List

- `apps/backend/prisma/schema.prisma` (modified — added ConsentRecord model and Appointment relation)
- `apps/backend/src/consent/consent.module.ts` (new)
- `apps/backend/src/consent/consent.service.ts` (new)
- `apps/backend/src/consent/consent.controller.ts` (new)
- `apps/backend/src/consent/consent.service.spec.ts` (new)
- `apps/backend/src/consent/dto/create-consent.dto.ts` (new)
- `apps/backend/src/app.module.ts` (modified — added ConsentModule import)
- `apps/frontend/src/components/consultation/ConsentForm.tsx` (new)
- `apps/frontend/src/app/paciente/consulta/[id]/page.tsx` (modified — added consent step to check-in flow)

## Change Log

- 2026-07-08: Implementação completa da Story 3.2 — modelo ConsentRecord, módulo backend consent com endpoints POST/GET, componente ConsentForm.tsx, e integração do passo de consentimento na página de check-in do paciente.

### Review Findings

- [x] [Review][Patch] Bug Lógico na Autorização do getConsent [apps/backend/src/consent/consent.controller.ts:81-85]
- [x] [Review][Patch] Condição de Corrida (TOCTOU) no Registro de Consentimento [apps/backend/src/consent/consent.controller.ts:43-46]
- [x] [Review][Patch] Vulnerabilidade de ID Leaking (Enumeração de IDs) na Validação de Propriedade [apps/backend/src/consent/consent.controller.ts:77-91]
- [x] [Review][Patch] Vulnerabilidade de Falsificação de IP (IP Spoofing) [apps/backend/src/consent/consent.controller.ts:48-51]
- [x] [Review][Patch] Acessibilidade WCAG AA: Parada de Foco Dupla e Falha de Foco Invisível no Checkbox [apps/frontend/src/components/consultation/ConsentForm.tsx:212-237]
- [x] [Review][Patch] Propagação de Evento de Teclado no Enter Submete Formulário Acidentalmente [apps/frontend/src/components/consultation/ConsentForm.tsx:52-57]
- [x] [Review][Patch] Supressão Silenciosa de Erros de Rede no Check-in (Locking/Loop) [apps/frontend/src/app/paciente/consulta/[id]/page.tsx:95-115]
- [x] [Review][Patch] Ausência de Validação/Sanitização de IP e User-Agent [apps/backend/src/consent/consent.controller.ts:48-52]
- [x] [Review][Patch] Vulnerabilidade a Runtime Exception na Coleta do Cabeçalho X-Forwarded-For [apps/backend/src/consent/consent.controller.ts:49]

