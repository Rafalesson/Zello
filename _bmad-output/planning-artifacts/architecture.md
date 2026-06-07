---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-05-12'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-ImNotMedical.md'
  - '_bmad-output/planning-artifacts/product-brief-ImNotMedical-distillate.md'
  - 'docs/OVERVIEW.pt.md'
workflowType: 'architecture'
project_name: 'ImNotMedical'
user_name: 'Rafa'
date: '2026-05-12T15:27:05-03:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
46 FRs organizados em 7 domínios de negócio:

| Domínio | FRs | Complexidade Arquitetural |
|:---|:---|:---|
| Gestão de Identidade e Acesso | FR1-FR7 | Baixa — brownfield existente, expansão para aprovação admin |
| Agendamento de Consultas | FR8-FR14 | Média — calendário, busca, slots, notificações |
| Pré-Consulta | FR15-FR20 | Média — formulários, consentimento, verificação de dispositivos |
| Teleconsulta | FR21-FR32 | **Alta** — WebRTC P2P, state machine, reconexão, sinalização |
| Pós-Consulta | FR33-FR38 | Média — expansão do módulo de atestados existente |
| Administração e Operações | FR39-FR43 | Baixa-Média — dashboards, logs, cleanup scheduled |
| Compliance e Informação | FR44-FR46 | Baixa — páginas estáticas, disclaimers, detecção de browser |

**O domínio de Teleconsulta (FR21-FR32) é o centro de gravidade arquitetural** — concentra WebRTC, Socket.IO, state machine, reconexão e persistência de estado. Todas as decisões de arquitetura real-time orbitam esse domínio.

**Non-Functional Requirements:**
33 NFRs em 7 categorias que direcionam decisões arquiteturais:

| Categoria | NFRs | Impacto Arquitetural |
|:---|:---|:---|
| Performance (NFR1-7) | Bundle <200KB, WebRTC <3s, FCP <2s | Otimização de bundle, code splitting, RSC |
| Segurança (NFR8-14) | JWT refresh, bcrypt, retenção 100d | Auth middleware, cron jobs, Supabase nativo |
| Confiabilidade (NFR15-19) | Cold start, ICE restart, estado parcial | Loading states, reconnection logic, session persistence |
| Acessibilidade (NFR20-24) | WCAG AA, keyboard nav, aria-labels | Design system, component patterns |
| Integrações (NFR25-28) | Cloudinary, Metered.ca, SMTP | Service adapters, fallback patterns |
| Qualidade de Código (NFR29-32) | TS strict, ESLint zero, CI/CD | Build pipeline, testing strategy |
| Operacional (NFR33) | PostgreSQL <400MB | Retenção, cleanup, monitoring |

**Scale & Complexity:**

- Primary domain: Full-stack Web App com real-time (WebRTC + WebSocket)
- Complexity level: **Medium-High**
- Contexto: **Brownfield** — 8 módulos backend e 6 fluxos frontend já existentes

### Core Architectural Capabilities

Os 46 FRs se reduzem a **4 capabilities arquiteturais fundamentais**. Se a arquitetura endereçar essas capabilities bem, todos os requisitos se encaixam naturalmente:

| Capability | Status | FRs Cobertos | Desafio Principal |
|:---|:---|:---|:---|
| **CRUD + Auth** | Brownfield (expandir) | FR1-FR14, FR33-FR43 | Expansão incremental sem quebrar existente |
| **Real-Time Bidirecional** | Novo | FR18-FR24, FR26, FR29-FR31 | Socket.IO gateway com auth, rooms, state sync |
| **P2P Media** | Novo | FR25, FR27-FR28, FR30 | WebRTC via simple-peer, ICE restart, TURN fallback |
| **Scheduled Jobs** | Novo | FR43 | Trigger externo (GitHub Actions) por limitação Render |

**Ponto arquitetural de SSR dinâmico:** O Perfil Público do Médico (FR10) é a única página pública que requer dados dinâmicos server-side com meta tags (SSR + SEO). Merece atenção específica na decisão de renderização.

### Technical Constraints & Dependencies

**Infraestrutura (Zero-Cost):**
- Backend: Render free tier (cold start ~30s, spin-down 15min inatividade)
- Frontend: Vercel free tier (serverless, edge)
- Banco: Supabase free tier (500MB PostgreSQL, pause por inatividade)
- Storage: Cloudinary free tier (25 créditos/mês)
- TURN: Metered.ca free tier (500MB/mês)
- Email: SMTP gratuito (100/dia baseline)
- CI/CD: GitHub Actions (free para repos públicos)

**Stack Definido pelo PRD:**
- Backend: NestJS (módulos, guards, gateways)
- Frontend: Next.js 14 App Router (RSC + CSR híbrido)
- ORM: Prisma (PostgreSQL)
- WebRTC: simple-peer (~15KB, sem dependências extras)
- Sinalização: Socket.IO via NestJS Gateway
- PDF: Browserless + Puppeteer → Cloudinary

**Código Existente (Brownfield):**
- Auth JWT com RBAC (patient, doctor) + guards + decorators
- Fluxo completo "esqueci/reset senha"
- Módulo de atestados médicos (CRUD + PDF + QRCode + Cloudinary)
- Busca CID-10
- Dashboards básicos (médico e paciente)
- Módulo Prisma global
- Middleware de proteção de rotas por role no frontend
- Estrutura monorepo apps/backend + apps/frontend

**Riscos Operacionais Documentados:**
- **simple-peer:** Pacote funcional mas com baixa atividade de manutenção. Arquitetura deve isolar o wrapper WebRTC via adapter pattern para permitir substituição futura sem reescrita da sala de consulta.
- **Browserless:** Dependência externa para geração de PDF. Se free tier acabar ou serviço ficar indisponível, fluxo de documentos quebra. Alternativas conhecidas: `@react-pdf/renderer`, Puppeteer local no Render. Risco mitigado pelo adapter implícito no `PdfService` existente.

### Cross-Cutting Concerns Identified

1. **Consultation Lifecycle & Real-Time Orchestration** — O ciclo de vida da consulta (6 estados: agendada → em_espera → em_andamento → concluída/cancelada/não_realizada) e a conexão real-time (Socket.IO + WebRTC) são **o mesmo problema arquitetural**. O Socket.IO gateway é o enforcer das transições de estado — eventos disparam transições no backend E notificam o frontend simultaneamente. Precisa de implementação server-side autoritativa com projeção real-time.

2. **Autenticação & Autorização** — JWT/RBAC permeia todos os módulos. Socket.IO precisa autenticar na conexão. WebRTC signaling precisa de rooms autorizadas. A expansão da role admin impacta guards e middleware existentes.

3. **Type Safety & Contract Sharing** — TypeScript strict mode em ambos os lados exige uma estratégia clara de compartilhamento de tipos no monorepo. Prisma gera tipos, NestJS tem DTOs, frontend precisa de interfaces para payloads Socket.IO. Enums de estado da consulta (`agendada`, `em_espera`, etc.) devem ser definidos **uma vez** e consumidos em ambos os lados. Ponto de maior dor potencial se não resolvido desde o dia 1.

4. **Cold Start & Resilience** — Render/Supabase podem estar dormindo. Toda interação precisa de loading states graceful. Socket.IO precisa reconectar após cold start. WebRTC precisa de ICE restart automático.

5. **Política de Retenção** — 100 dias para documentos impacta banco, Cloudinary e cron jobs. GitHub Actions como trigger externo por limitação do Render free tier.

6. **Design System & Acessibilidade** — Sprint 0 define tokens visuais que permeiam todos os componentes. WCAG AA é transversal (contraste, keyboard nav, aria-labels, skip navigation).

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web App com real-time (brownfield) — o monorepo já existe com npm workspaces.

### Existing Project Audit

**Monorepo:** npm workspaces com `apps/backend` + `apps/frontend`
- ⚠️ Package.json raiz ainda usa nome antigo `zello-monorepo` — renomear para `imnotmedical` no Sprint -1

**Backend (NestJS v11):**
- NestJS ^11.0.1 com Express adapter
- Prisma ^6.x (Client + CLI) — **manter na v6, não migrar para v7** (boring technology, funciona, migrar pós-MVP)
- TypeScript 5.4.5 (pinned)
- Auth: passport + passport-jwt + @nestjs/jwt
- PDF: puppeteer + cloudinary + qrcode
- Email: nodemailer (Ethereal dev only)
- Build: SWC
- Test: Jest + Supertest
- Lint: ESLint 9 + Prettier

**Frontend (Next.js 14 — EOL):**
- Next.js 14.2.3 (pinned) — **EOL Out/2025, migração necessária**
- React ^18 — React 19 disponível
- TypeScript 5.4.5 (pinned)
- Styling: Tailwind CSS v4
- State: Zustand ^5 + TanStack Query ^5
- HTTP: Axios ^1
- UI: Headless UI ^2 + Lucide React
- Auth (client): jose + js-cookie

### Upgrade Decision: Next.js 14 → 16

**Decisão: Migrar para Next.js 16 em Sprint -1 (pré-sprint isolado).**

**Rationale:**
- Next.js 14 atingiu EOL em Out/2025 — sem security patches
- Turbopack (stable, default) melhora DX significativamente
- Partial Pre-Rendering (PPR) é ideal para o perfil público do médico (SSR + streaming)
- React Compiler elimina necessidade de memoização manual
- React 19 traz Server Functions e melhorias em Server Components
- O projeto tem poucas páginas — custo de migração é baixo agora
- Projeto de portfólio deve usar stack atual para impressionar recrutadores

**Por que Sprint -1 e não Sprint 0:**
Sprint 0 é para design system (tokens, cores, componentes). Misturar migração de framework com design system cria duas fontes de instabilidade no mesmo sprint. Sprint -1 isola o risco: migra, valida, commit limpo, CI verde. Só então Sprint 0 começa com base estável.

**Checklist de Migração (Sprint -1):**
1. ⚠️ **Primeiro checkpoint:** validar middleware de auth (`jose` + JWT) — ponto mais provável de breaking change
2. Migrar Next.js 14 → 16 seguindo guia oficial de migração
3. Migrar React 18 → 19
4. Verificar compatibilidade: Tailwind v4, Zustand, TanStack Query, Headless UI
5. Verificar que todas as páginas existentes compilam e renderizam
6. Renomear `zello-monorepo` → `imnotmedical` no package.json raiz
7. Commit limpo, CI verde

**Impacto na Arquitetura:**
- App Router se mantém (mesma API)
- Turbopack substitui Webpack (transparente)
- PPR habilita padrão de shell estático + streaming para perfil do médico
- React 19 Server Functions podem simplificar algumas mutações

### Dependencies to Add (MVP)

**Backend:**
- `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` — real-time gateway
- Pacote de email production-ready (ou manter Nodemailer com SMTP real)

**Frontend:**
- `socket.io-client` — conexão real-time
- `simple-peer` + `@types/simple-peer` — WebRTC P2P

**Monorepo:**
- `packages/shared` — pacote de tipos compartilhados

### Shared Package Scope (`packages/shared`)

**Incluir:**
- Enums de estado da consulta (`ConsultationStatus`)
- Event names e payloads do Socket.IO (`SocketEvents`, `SignalingPayload`)
- DTOs compartilhados (tipos de request/response usados em ambos os lados)

**Excluir:**
- Prisma generated types — ficam no backend, frontend nunca importa Prisma
- Componentes React — frontend only

**Requisito de configuração TypeScript:**
- `packages/shared/tsconfig.json` com `composite: true`
- `apps/backend/tsconfig.json` e `apps/frontend/tsconfig.json` com `references` apontando para shared
- Sem isso, imports cross-package não resolvem corretamente

### Architectural Decisions Established by Existing Code

**Já decidido (não alterar):**
- ✅ Monorepo npm workspaces
- ✅ NestJS modular architecture (guards, decorators, services)
- ✅ Prisma v6 como ORM com módulo global
- ✅ JWT + Passport para auth
- ✅ SWC para build do backend
- ✅ Tailwind CSS v4 para styling
- ✅ Zustand + TanStack Query para state management
- ✅ Axios para HTTP client
- ✅ Jest para testes backend

**A formalizar neste documento:**
- Socket.IO gateway patterns (namespaces, rooms, auth)
- WebRTC encapsulamento via hook (`useWebRTC`) — pragmático para solo dev, isola simple-peer sem over-engineering
- Shared types strategy (`packages/shared` com composite TS)
- State machine implementation (consultation lifecycle)
- Rendering strategy (SSR vs CSR per page)
- CI/CD pipeline structure
- Testing strategy (frontend)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Socket.IO gateway architecture (single namespace + rooms)
- State machine implementation (transition map declarativo)
- Rendering strategy por página (SSR/CSR split)
- Error handling standard (domain exceptions)
- Socket.IO reconnection strategy (reconnect-with-fresh-token)

**Important Decisions (Shape Architecture):**
- CI/CD pipeline structure
- Data validation strategy
- Operational monitoring strategy

**Deferred Decisions (Post-MVP):**
- Frontend testing no CI (Playwright/Vitest)
- Caching strategy (sem necessidade imediata no free tier)
- Rate limiting (volume baixo, demo only)

### Data Architecture

**Database:** PostgreSQL via Prisma v6 (Supabase free tier) — já decidido, brownfield.

**Data Validation:** class-validator + class-transformer (manter existente)
- Rationale: Já instalado, padrão NestJS, integração automática com ValidationPipe global
- Affects: Todos os DTOs de input (agendamento, pré-triagem, prontuário, prescrição)
- Versão: class-validator ^0.14.2, class-transformer ^0.5.1

**Migration Approach:** Prisma Migrate (já configurado)
- `prisma migrate dev` para desenvolvimento
- `prisma migrate deploy` para produção
- Novas tabelas: appointments, consultation_states, prescriptions, pre_triage, consent_records

### Authentication & Security

**Já decidido (brownfield):**
- JWT + Passport + bcrypt (salt rounds ≥ 10)
- RBAC com 3 roles: patient, doctor, admin
- Guards + decorators para proteção de endpoints
- jose para validação JWT no middleware Next.js

**Decisão nova — Socket.IO Authentication:**
- Autenticação no handshake via token JWT no `auth` option do socket.io-client
- ⚠️ **Importante:** WebSocket guards no NestJS recebem `Socket`, não `Request`. O token deve ser extraído de `client.handshake.auth.token`, não do header HTTP `Authorization`. Não é reutilização direta do `JwtAuthGuard` HTTP — requer um `WsJwtGuard` dedicado que lê do handshake.

```typescript
// Client-side
const socket = io(BACKEND_URL, { auth: { token: jwtAccessToken } });

// Server-side (WsJwtGuard)
const token = client.handshake.auth?.token;
// Validate token with JwtService (reutiliza o JwtService, não o guard HTTP)
```

- Conexão rejeitada se token inválido ou expirado
- Rationale: Reutiliza JwtService e validação existentes, mas com guard dedicado para WebSocket

**Decisão nova — Room Authorization:**
- Rooms nomeadas `consultation:{consultationId}`
- Antes de join, Gateway verifica se o usuário é participante da consulta (médico ou paciente daquela appointment)
- Rationale: Previne que um usuário entre na sala de outra consulta

**Decisão nova — Reconnection Strategy (reconnect-with-fresh-token):**
- Socket.IO client intercepta o evento `reconnect_attempt`
- Antes de reconectar, verifica se o access token ainda é válido
- Se expirado, faz refresh via endpoint REST `/auth/refresh` (já existe no auth module)
- Só então reconecta com o token fresh no `auth` option
- Resolve 3 cenários de uma vez: cold start do Render (~30s), network drops, e token expiration natural
- Rationale: Padrão único que endereça todas as causas de desconexão no free tier

### API & Communication Patterns

**API Style:** REST (NestJS controllers) — já decidido, brownfield.

**Socket.IO Gateway Architecture:**
- **Single namespace** com rooms por consulta
- Room naming: `consultation:{consultationId}`
- Event contracts tipados em `packages/shared`
- Rationale: Para consulta 1:1, namespaces separados seriam over-engineering. Eventos tipados (`signal`, `chat:message`, `waiting:status`, `consultation:transition`) já separam concerns sem overhead.

**Consultation State Machine:**
- **Transition map declarativo** em `packages/shared`
- 6 estados: `agendada`, `em_espera`, `em_andamento`, `concluida`, `cancelada`, `nao_realizada`
- Mapa de transições válidas compartilhado entre backend e frontend
- Backend é fonte de verdade (server-authoritative)
- Frontend usa o mesmo mapa para UI otimista e validação local
- Helper `canTransition(from, to): boolean` + `getValidTransitions(from): Status[]`
- Rationale: Declarativo, zero dependência, testável, compartilhável. XState seria overkill para 6 estados.

**Error Handling Standard:**
- **Domain exceptions** com filtro global
- Exceções de domínio: `InvalidTransitionError`, `ConsultationNotFoundError`, `SlotUnavailableError`, `DevicePermissionError`
- `DomainExceptionFilter` global mapeia para respostas HTTP padronizadas `{ statusCode, message, error, code }`
- Campo `code` usa enum `DomainErrorCode` de `packages/shared` — tipado em ambos os lados

```typescript
// packages/shared/src/errors.ts
export enum DomainErrorCode {
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  CONSULTATION_NOT_FOUND = 'CONSULTATION_NOT_FOUND',
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  DEVICE_PERMISSION_DENIED = 'DEVICE_PERMISSION_DENIED',
  UNAUTHORIZED_ROOM_ACCESS = 'UNAUTHORIZED_ROOM_ACCESS',
  // Expandir incrementalmente conforme implementação avança
}
```

- Frontend pode fazer `switch(error.code)` de forma tipada
- Enum é vivo — começa com 5-6 códigos e cresce conforme necessidade
- Rationale: Clareza semântica, facilita debug, demonstra maturidade de engenharia

### Frontend Architecture

**State Management:** Zustand (client state) + TanStack Query (server state) — já decidido, brownfield.

**Rendering Strategy:**

| Página | Tipo | Justificativa |
|:---|:---|:---|
| Login / Cadastro | Server Component | FCP rápido, SEO básico |
| Perfil público do médico | Server Component + PPR | SSR com meta tags dinâmicas, streaming de conteúdo dinâmico |
| Política de privacidade | Server Component (estático) | Conteúdo fixo, indexável |
| Dashboards (médico/paciente/admin) | Client Component | Dados privados, interatividade, `noindex` |
| Sala de consulta (vídeo/chat) | Client Component | Real-time, WebRTC, estado local intensivo |
| Sala de espera | Client Component | Socket.IO, estado dinâmico |

**WebRTC Encapsulation:**
- Hook `useWebRTC` encapsula toda interação com simple-peer
- Responsabilidades: criar peer, gerenciar streams, ICE restart, TURN fallback, cleanup
- Se precisar trocar simple-peer no futuro, troca apenas o hook
- Rationale: Pragmático para solo dev — isolamento via hook, não adapter pattern formal

**Bundle Optimization:**
- React Server Components (default no App Router)
- Dynamic imports para componentes pesados (sala de consulta, videochamada)
- Target: < 200KB gzipped (NFR4)

### Infrastructure & Deployment

**Hosting:** Render (backend) + Vercel (frontend) + Supabase (banco) — já decidido.

**CI/CD Pipeline (GitHub Actions):**

```yaml
# ci.yml — Runs on push and PR
jobs:
  lint:     # ESLint backend + frontend
  build:    # Build backend + frontend (TS type check implícito)
  test:     # Jest backend only (MVP)

# cleanup.yml — Scheduled daily
jobs:
  cleanup:  # POST /admin/cleanup/run (política de retenção 100d)
```

- Frontend testing (Playwright/Vitest) deferred para post-MVP
- Next.js build com TypeScript strict já serve como safety net de tipos
- Badge CI verde no README (NFR32)
- Rationale: ROI de Playwright no CI é baixo para solo dev no MVP. Build valida tipos.

**Environment Configuration:**
- `.env` por app (backend + frontend) — já configurado
- Variáveis sensíveis no dashboard de cada provider (Render, Vercel, Supabase)
- `packages/shared` não tem variáveis de ambiente (pure types)

**Operational Monitoring (dashboards nativos):**

| Serviço | Dashboard | O que monitorar |
|:---|:---|:---|
| Supabase | Database dashboard | Storage usage (< 400MB), conexões ativas |
| Render | Service dashboard | Deploy status, cold start logs |
| Cloudinary | Media Library | Créditos restantes (25/mês) |
| Vercel | Analytics | Build times, function invocations |
| GitHub Actions | Actions tab | CI status, cleanup job logs |

Rationale: Sem implementação customizada — orientação para operação usando ferramentas nativas dos providers.

### Decision Impact Analysis

**Implementation Sequence:**
1. Sprint -1: Migração Next.js 16 + rename monorepo + setup packages/shared
2. Sprint 0: Design system + CI/CD pipeline
3. Sprint 1: Agendamento (CRUD + auth expansion + novas tabelas Prisma + DomainErrorCode)
4. Sprint 2: Socket.IO Gateway + WsJwtGuard + state machine + sala de espera + reconnection
5. Sprint 3: WebRTC (useWebRTC hook) + chat
6. Sprint 4-6: Pós-consulta + admin + polish

**Cross-Component Dependencies:**
- `packages/shared` → precisa existir antes de Socket.IO e state machine (Sprint -1)
- `DomainErrorCode` enum → definido em Sprint -1, usado a partir de Sprint 1
- Socket.IO auth (WsJwtGuard) → depende de JwtService existente, não do guard HTTP (Sprint 2)
- Reconnection strategy → implementada junto com Socket.IO gateway (Sprint 2)
- WebRTC → depende de Socket.IO gateway para signaling (Sprint 3)
- State machine → usada por Socket.IO gateway E por REST controllers (Sprint 2+)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma Schema):**
- Tabelas: PascalCase singular (`User`, `Appointment`, `Consultation`) — padrão Prisma
- Colunas: camelCase (`createdAt`, `consultationId`) — padrão Prisma
- Relações: camelCase descritivo (`patient`, `doctor`, `appointment`)
- Enums: PascalCase com valores UPPER_SNAKE (`ConsultationStatus.EM_ANDAMENTO`)
- Prisma gera o mapeamento para snake_case no PostgreSQL via `@map`/`@@map` quando necessário

**API (NestJS):**
- Endpoints: kebab-case, plural (`/appointments`, `/consultations`, `/pre-triage`)
- Parâmetros de rota: camelCase (`:consultationId`)
- Query params: camelCase (`?specialtyId=1&page=2`)
- Verbos: `GET` lista/detalhe, `POST` cria, `PATCH` atualiza parcial, `DELETE` remove
- Nunca `PUT` — apenas `PATCH` para atualizações parciais

**Código Backend (NestJS):**
- Módulos: kebab-case singular diretamente em `src/` (flat, como brownfield: `src/consultation/`, `src/appointment/`)
- Services/Controllers: PascalCase singular (`ConsultationService`, `AppointmentController`)
- DTOs: PascalCase com sufixo (`CreateAppointmentDto`, `UpdateConsultationStatusDto`)
- Guards: PascalCase com sufixo (`WsJwtGuard`, `RolesGuard`)
- Arquivos: kebab-case (`consultation.service.ts`, `create-appointment.dto.ts`)

**Código Frontend (Next.js):**
- Componentes: PascalCase (`WaitingRoom`, `VideoCall`, `DeviceCheck`)
- Arquivos de componente: PascalCase (`WaitingRoom.tsx`)
- Hooks: camelCase com prefixo `use` (`useWebRTC`, `useConsultation`, `useSocket`)
- Arquivos de hook: camelCase (`useWebRTC.ts`)
- Pages (App Router): kebab-case diretórios (`app/consultation/[id]/waiting-room/`)
- Utilitários: camelCase (`formatDate.ts`, `validateTransition.ts`)

**Socket.IO Events:**
- Formato: `domain:action` em kebab-case (`consultation:transition`, `chat:message`, `signal:offer`)
- Payloads tipados em `@imnotmedical/shared`

**Import Order (enforced via ESLint):**
```typescript
// 1. Node/framework imports
import { Injectable } from '@nestjs/common';
// 2. Third-party imports
import { PrismaService } from '../prisma/prisma.service';
// 3. Shared package imports
import { ConsultationStatus, SocketEvents } from '@imnotmedical/shared';
// 4. Local imports
import { CreateAppointmentDto } from './dto/create-appointment.dto';
```

**Shared Package Name:** `@imnotmedical/shared` — escopo com `@` prefix, alinhado com nome do projeto.

### Structure Patterns

**Backend (NestJS — flat structure, seguindo brownfield):**
```
src/
  auth/                 # Brownfield
  certificate/          # Brownfield
  cids/                 # Brownfield
  cloudinary/           # Brownfield
  mail/                 # Brownfield
  patient/              # Brownfield
  pdf/                  # Brownfield
  prisma/               # Brownfield
  templates/            # Brownfield
  user/                 # Brownfield
  consultation/         # NOVO — gateway + service + controller
    consultation.module.ts
    consultation.service.ts
    consultation.controller.ts
    consultation.gateway.ts     # Socket.IO gateway
    guards/
      ws-jwt.guard.ts
    dto/
      create-appointment.dto.ts
      update-status.dto.ts
    consultation.service.spec.ts
  appointment/          # NOVO
  pre-triage/           # NOVO
  prescription/         # NOVO — expande certificate existente
  common/               # NOVO — cross-cutting concerns
    filters/
      domain-exception.filter.ts
    exceptions/
      domain.exception.ts
    interceptors/       # Futuro se necessário
```

**Frontend (Next.js App Router):**
```
src/
  app/
    (public)/               # Route group — rotas públicas (adotar no Sprint -1)
      login/
      cadastro/
      medico/[id]/          # Perfil público
      privacidade/
    (authenticated)/        # Route group — rotas protegidas (adotar no Sprint -1)
      dashboard/
      consulta/[id]/
        sala-de-espera/
        video/
    layout.tsx
  components/
    ui/                     # Design system (botões, inputs, cards)
    consultation/           # Componentes de domínio
    shared/                 # Header, Footer, Disclaimer
  hooks/
    useWebRTC.ts
    useSocket.ts            # Socket.IO client instanciado via hook, NÃO singleton
    useConsultation.ts
  lib/
    api.ts                  # Axios instance (brownfield)
```

⚠️ **Nota:** Route groups `(public)` e `(authenticated)` são pattern a adotar. Requer reorganização das rotas existentes no Sprint -1 junto com a migração Next.js 16.

⚠️ **Socket.IO Client:** Instanciado via hook `useSocket`, nunca como singleton de módulo (`lib/socket.ts`). Singletons de módulo podem ser importados por Server Components acidentalmente, causando erros de SSR.

**Monorepo:**
```
/
  apps/
    backend/              # NestJS
    frontend/             # Next.js 16
  packages/
    shared/               # @imnotmedical/shared
      src/
        index.ts
        enums/
          consultation-status.ts
        events/
          socket-events.ts
        errors/
          domain-error-code.ts
        types/
          dto/
      tsconfig.json       # composite: true
      package.json        # name: "@imnotmedical/shared"
  package.json            # name: "imnotmedical", workspaces: ["apps/*", "packages/*"]
```

**Testes (Backend):**
- Co-located: `consultation.service.spec.ts` ao lado de `consultation.service.ts`
- Padrão NestJS existente no brownfield
- Nunca em pasta `__tests__/` separada

### Format Patterns

**API Responses:**
```typescript
// Sucesso (direto, sem wrapper)
{ id: 1, status: "agendada", ... }

// Lista com paginação
{ data: [...], meta: { total: 42, page: 1, perPage: 10 } }

// Erro (via DomainExceptionFilter)
{ statusCode: 400, message: "Transição inválida", error: "Bad Request", code: "INVALID_TRANSITION" }
```
- Sem wrapper `{ data, error }` em respostas de sucesso — NestJS retorna direto
- Wrapper `{ data, meta }` apenas quando tem paginação

**Datas:**
- API: ISO 8601 strings (`2026-05-12T15:00:00.000Z`)
- Banco: `DateTime` nativo Prisma (armazenado como `timestamptz` no PostgreSQL)
- Frontend display: `Intl.DateTimeFormat` — nunca hardcode format
- Manipulação de datas: aritmética nativa de `Date`. `date-fns` permitido se operações ficarem complexas (ex: adicionar 30min a um slot, calcular diferença de 100 dias)

**JSON:**
- camelCase em todo payload (padrão JavaScript/TypeScript)
- `null` para campos ausentes, nunca `undefined` em respostas
- Arrays vazios `[]` em vez de `null` para listas

### Communication Patterns

**Socket.IO Event Contracts:**
```typescript
// @imnotmedical/shared/src/events/socket-events.ts
export const SocketEvents = {
  // Consultation lifecycle
  CONSULTATION_JOIN: 'consultation:join',
  CONSULTATION_LEAVE: 'consultation:leave',
  CONSULTATION_TRANSITION: 'consultation:transition',

  // Waiting room
  WAITING_STATUS: 'waiting:status-update',
  WAITING_DOCTOR_ARRIVED: 'waiting:doctor-arrived',

  // Signaling (WebRTC)
  SIGNAL_OFFER: 'signal:offer',
  SIGNAL_ANSWER: 'signal:answer',
  SIGNAL_ICE_CANDIDATE: 'signal:ice-candidate',

  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
} as const;
```
- Nomes como constants em `@imnotmedical/shared` — frontend e backend importam do mesmo lugar
- Payloads tipados com interfaces ao lado dos event names

**State Management (Frontend):**
- TanStack Query para **server state** (appointments, user profile, CID-10)
- Zustand para **client state** (media controls, UI state, form drafts)
- Nunca duplicar server state no Zustand — TanStack Query é a cache
- Query keys: array format `['appointments', consultationId]`

### Process Patterns

**Loading States:**
- Componente `<LoadingState />` reutilizável do design system
- Cold start: `<ColdStartLoader />` dedicado com mensagem amigável (NFR15)
- Skeleton screens para dashboards, spinner para ações
- `isLoading` / `isPending` do TanStack Query — não reinventar

**Error Recovery:**
- Erros de rede: retry automático via TanStack Query (`retry: 3`)
- Erros de domínio: tratar pelo `code` do `DomainErrorCode`
- Erros de Socket.IO: reconnection strategy (reconnect-with-fresh-token)
- Erros de WebRTC: ICE restart automático, fallback para mensagem de erro

**Validation Timing:**
- Client-side: validação visual nos forms (feedback imediato)
- Server-side: ValidationPipe + class-validator (fonte de verdade)
- Nunca confiar apenas em validação client-side

### Enforcement Guidelines

**All AI Agents MUST:**

1. Seguir os naming patterns deste documento — sem exceções
2. Usar types/enums/events de `@imnotmedical/shared` — nunca duplicar definições
3. Domain exceptions para erros de negócio — nunca `throw new HttpException` com string literal
4. Co-locate testes com o arquivo testado — nunca em pasta `__tests__/` separada
5. Importar Socket.IO events de `SocketEvents` — nunca usar strings inline
6. Seguir import order: Node/framework → Third-party → @imnotmedical/shared → Local

**Enforcement via ESLint:**
- `@typescript-eslint/naming-convention` para naming patterns
- Plugin de import order para organização de imports
- TypeScript strict mode já enforce tipagem
- Configurar no Sprint 0 junto com CI/CD

**Anti-Patterns (evitar):**
- ❌ `throw new HttpException('Slot indisponível', 400)` → ✅ `throw new SlotUnavailableException()`
- ❌ `socket.emit('chat-message', ...)` → ✅ `socket.emit(SocketEvents.CHAT_MESSAGE, ...)`
- ❌ Estado do servidor no Zustand → ✅ TanStack Query para server state
- ❌ `import io from 'socket.io-client'` no nível de módulo → ✅ Instanciar via hook `useSocket`
- ❌ `PUT /consultations/:id` → ✅ `PATCH /consultations/:id/status`
- ❌ `src/modules/consultation/` → ✅ `src/consultation/` (flat, seguindo brownfield)

## Project Structure & Boundaries

### Directory Structure

→ Estrutura completa definida na seção "Implementation Patterns — Structure Patterns" acima.

### Requirements to Structure Mapping

**FR1-FR7 (Identidade e Acesso):**
- Backend: `src/auth/` (brownfield) + `src/user/` (expandir admin role)
- Frontend: `app/(public)/login/`, `app/(public)/cadastro/`
- Shared: `@imnotmedical/shared` (roles enum)

**FR8-FR14 (Agendamento):**
- Backend: `src/appointment/` (NOVO)
- Frontend: `app/(authenticated)/dashboard/`, `components/consultation/Calendar.tsx`
- Prisma: tabelas `Appointment`, `DoctorAvailability`

**FR15-FR20 (Pré-Consulta):**
- Backend: `src/pre-triage/` (NOVO)
- Frontend: `app/(authenticated)/consulta/[id]/`, `components/consultation/PreTriage.tsx`, `components/consultation/ConsentForm.tsx`, `components/consultation/DeviceCheck.tsx`
- Prisma: tabelas `PreTriage`, `ConsentRecord`

**FR21-FR32 (Teleconsulta):**
- Backend: `src/consultation/` (NOVO — gateway + service + controller)
- Frontend: `app/(authenticated)/consulta/[id]/sala-de-espera/`, `app/(authenticated)/consulta/[id]/video/`
- Hooks: `useWebRTC.ts`, `useSocket.ts`, `useConsultation.ts`
- Shared: `ConsultationStatus` enum, `SocketEvents`, `VALID_TRANSITIONS` map

**FR33-FR38 (Pós-Consulta):**
- Backend: `src/prescription/` (NOVO, expande `src/certificate/`), campos de prontuário em `src/consultation/`
- Frontend: `components/consultation/MedicalRecord.tsx`, `components/consultation/Prescription.tsx`
- Prisma: tabelas `MedicalRecord`, `Prescription`

**FR39-FR43 (Admin):**
- Backend: `src/user/` (expandir), `src/consultation/` (logs), cleanup endpoint em `src/consultation/`
- Frontend: `app/(authenticated)/dashboard/` (admin views)

**FR44-FR46 (Compliance):**
- Frontend: `components/shared/AcademicDisclaimer.tsx`, `app/(public)/privacidade/`

### Architectural Boundaries

**API Boundaries:**

| Boundary | Interno | Externo |
|:---|:---|:---|
| REST API | Controllers NestJS | Frontend via Axios |
| Socket.IO Gateway | consultation.gateway.ts | Frontend via useSocket hook |
| WebRTC Signaling | Via Socket.IO gateway | P2P entre browsers (não passa pelo server) |
| Auth | JwtService (HTTP) + WsJwtGuard (WS) | jose middleware (Next.js) |

**Data Boundaries:**

| Camada | Responsabilidade | Acesso |
|:---|:---|:---|
| Prisma Service | Acesso ao banco (fonte de verdade) | Apenas services backend |
| REST Controllers | Expõe dados via HTTP | Frontend (Axios/TanStack Query) |
| Socket.IO Gateway | Projeta estado real-time | Frontend (useSocket hook) |
| `@imnotmedical/shared` | Contratos e tipos | Backend + Frontend (read-only) |

**Component Boundaries (Frontend):**

| Camada | Responsabilidade | Comunicação |
|:---|:---|:---|
| Pages (App Router) | Roteamento, layout, data fetching SSR | Server Components → Client Components |
| Components (ui/) | Design system, sem lógica de negócio | Props only |
| Components (consultation/) | Lógica de domínio da consulta | Hooks + Zustand + TanStack Query |
| Hooks | Encapsulam side-effects (WS, WebRTC) | Retornam state + actions |

### Integration Points

**External Services:**

| Serviço | Módulo Backend | Padrão de Integração |
|:---|:---|:---|
| Supabase (PostgreSQL) | `src/prisma/` | Prisma Client (connection string) |
| Cloudinary | `src/cloudinary/` | SDK upload/destroy |
| Browserless | `src/pdf/` | Puppeteer remote |
| Metered.ca (TURN) | Frontend config | ICE servers no useWebRTC |
| SMTP | `src/mail/` | Nodemailer transport |
| GitHub Actions | `.github/workflows/` | HTTP trigger para cleanup |

**Data Flow — Teleconsulta (fluxo principal):**

```
Paciente agenda (REST) → Appointment criado no banco
     ↓
Paciente entra na sala (Socket.IO) → consultation:join → room criado
     ↓
Médico entra (Socket.IO) → waiting:doctor-arrived → paciente notificado
     ↓
Médico admite (Socket.IO) → consultation:transition → estado: em_andamento
     ↓
Signaling (Socket.IO) → signal:offer/answer/ice-candidate → WebRTC P2P conecta
     ↓
Videochamada P2P (WebRTC) → stream direto entre browsers
     ↓
Chat (Socket.IO) → chat:message → mensagens durante consulta
     ↓
Médico encerra (Socket.IO) → consultation:transition → estado: concluída
     ↓
Prontuário + Prescrição (REST) → documentos salvos no banco + Cloudinary
```

### Monorepo Configuration Requirements (Sprint -1)

1. **Next.js Compilation:** Adicionar `transpilePackages: ['@imnotmedical/shared']` no `next.config.js` do frontend para permitir a transpilação dos tipos compartilhados.
2. **Environment Variables:** Arquivos `.env` e `.env.example` devem existir estritamente em `apps/backend/` e `apps/frontend/`. Nunca adicionar arquivos `.env` na raiz do monorepo para evitar vazamento de secrets entre ambientes (ex: chaves do Supabase e SMTP no frontend).
3. **Nested Layouts (Next.js):** Utilizar layouts aninhados (`layout.tsx`) para o Route Group `(public)`, o Route Group `(authenticated)` e para a tela de consulta em vídeo (`consulta/[id]/video/layout.tsx`) visando renderizar a experiência de fullscreen isoladamente sem carregar elementos da navegação global.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Stack escolhido (NestJS v11 + Next.js 16 + Prisma v6 + Socket.IO + simple-peer) é altamente compatível e alinhado com o brownfield existente.
- A decisão de **não atualizar** o Prisma (manter v6) reduz riscos de breaking changes com tipos gerados, balanceando com a necessidade de atualizar o Next.js para segurança (EOL da v14).
- A configuração do monorepo (npm workspaces + `transpilePackages`) resolve o gargalo clássico de compartilhamento de código TypeScript.

**Pattern Consistency:**
- O encapsulamento de WebRTC via hook (`useWebRTC`) e de Socket.IO (`useSocket`) no frontend garante consistência no tratamento de side-effects.
- O padrão `DomainExceptionFilter` no backend assegura que o frontend sempre consumirá payloads de erro com um formato previsível (`{ code, message }`), eliminando guess-work.

**Structure Alignment:**
- A estrutura reflete fielmente as restrições arquiteturais. A manutenção da estrutura "flat" no NestJS respeita a base de código legada, enquanto os "Route Groups" no App Router organizam de forma clara a segurança de rotas públicas vs. autenticadas.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
- **FR1-FR7 (Identity):** Coberto via Guards, Middleware e roles enum.
- **FR8-FR14 (Agendamento):** Suportado por novos módulos REST (controllers/services) e tabelas Prisma.
- **FR15-FR20 (Pré-Consulta):** Estruturado no frontend e backend (tabelas `PreTriage` e `ConsentRecord`).
- **FR21-FR32 (Teleconsulta - Core):** Plenamente endereçado via Socket.IO Gateway, State Machine declarativa e WebRTC hook.
- **FR33-FR38 (Pós-Consulta):** Expansão lógica dos módulos de certificados existentes.
- **FR39-FR46 (Admin/Compliance):** Coberto por rotas dedicadas e endpoints de cleanup.

**Non-Functional Requirements Coverage:**
- **NFR1-NFR7 (Performance):** Next.js 16 + PPR + Bundle optimization.
- **NFR8-NFR14 (Segurança):** WsJwtGuard implementado para fechar a lacuna de segurança do Socket.IO.
- **NFR15-NFR19 (Confiabilidade):** "Reconnect-with-fresh-token" para lidar com os cold starts de 30s do Render.
- **NFR20-NFR33 (Acessibilidade/Operacional):** Testes via build no CI, dashboards nativos para monitoramento.

### Implementation Readiness Validation ✅

**Decision Completeness:**
As decisões foram tomadas com um nível de granularidade suficiente para evitar que agentes de IA comecem a inventar padrões paralelos (ex: `DomainErrorCode`, `SocketEvents`).

**Structure & Pattern Completeness:**
A nomenclatura de diretórios, padrões de nomeação (camelCase vs PascalCase), arquivos de eventos compartilhados e organização de rotas provêem "guardrails" fortes.

### Gap Analysis Results

**Important Gaps (Riscos para Monitoramento):**
- **Next.js 16 / React 19 Compatibility Risk:** A atualização no Sprint -1 trará o React 19. Algumas libs frontend atuais (`@headlessui/react`, `zustand`) precisarão ser validadadas contra essa versão logo no início para garantir que não haja breaking changes não mapeados.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION**

**Confidence Level:** **High**. A arquitetura alavanca inteligentemente o brownfield existente sem tentar reescrever tudo, isola as complexidades reais (WebRTC e real-time sync) através de padrões claros (hooks e state machine compartilhada), e lida de frente com os desafios da infraestrutura "zero-cost" (reconnection strategy).

**Key Strengths:**
- Pragmatismo na escolha de tecnologias (manter o que funciona, atualizar o que é risco).
- Isolamento tipado através do `@imnotmedical/shared`.
- Tratamento explícito dos problemas do free-tier (cold start e drops).

**Areas for Future Enhancement:**
- Adição de testes E2E/Frontend no CI (Playwright).
- Implementação de Caching (Redis) se o uso de banco bater no limite do free tier.

### Implementation Handoff

**AI Agent Guidelines:**
- Siga todas as decisões arquiteturais exatamente como documentado.
- Use padrões de implementação de forma consistente em todos os componentes.
- Respeite a estrutura do projeto e seus limites (boundaries).
- Consulte este documento de Arquitetura antes de introduzir novas abstrações ou dependências.

**First Implementation Priority:**
> **Sprint -1:** Executar a rotina de atualização para o Next.js 16, validação do Auth Middleware e a criação da infraestrutura monorepo com o pacote `@imnotmedical/shared`.
