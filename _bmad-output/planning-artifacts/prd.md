---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation-skipped", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish"]
inputDocuments:
  - product-brief-ImNotMedical.md
  - product-brief-ImNotMedical-distillate.md
  - OVERVIEW.pt.md
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: "Web App (full-stack, real-time)"
  domain: "Healthcare — Telemedicine (simulação acadêmica)"
  complexity: "medium-high"
  projectContext: "brownfield"
workflowType: 'prd'
---

# Product Requirements Document - ImNotMedical

**Author:** Rafa
**Date:** 2026-05-12

## Executive Summary

Demonstrar competência técnica em um domínio complexo e regulado é o que separa um portfólio comum de um memorável. O ImNotMedical é uma plataforma acadêmica de telemedicina que replica com fidelidade profissional o fluxo completo de teleconsulta entre médicos e pacientes — desde o agendamento até a emissão de prescrições digitais — construída sobre um stack moderno (NestJS + Next.js 14 + Prisma + PostgreSQL) com custo operacional zero.

O projeto parte de uma base existente com autenticação JWT/RBAC, geração de documentos médicos (PDF + QRCode) e dashboards — expandindo para o fluxo completo de teleconsulta: agendamento, videochamada P2P via WebRTC, sala de espera virtual, pré-triagem, prontuário eletrônico simplificado e compliance visual à regulamentação brasileira (CFM 2.314/2022, LGPD).

Os **usuários simulados** são pacientes que buscam atendimento remoto e médicos que oferecem teleconsultas. A **audiência real** do projeto — recrutadores e avaliadores técnicos — analisa a qualidade da implementação como evidência direta da competência do desenvolvedor.

### O Que Torna Especial

O diferencial do ImNotMedical não está em uma feature isolada, mas no **efeito agregado** de múltiplas competências funcionando juntas com qualidade de produto real:

- **Comunicação real-time** — WebRTC P2P nativo sem servidor de mídia, com sinalização via Socket.IO
- **Compliance regulatório** — Termos de consentimento (CFM 2.314), política de privacidade (LGPD), disclaimers de complementaridade
- **UX profissional** — Sala de espera virtual, fluxo guiado de consulta, interface empática para contexto de saúde
- **Engenharia de qualidade** — Monorepo, TypeScript end-to-end, arquitetura modular, CI/CD

A escolha do domínio de telemedicina foi estratégica — domínios regulados com comunicação real-time são raramente explorados em portfólios, o que aumenta a diferenciação. O projeto não busca inovar no produto, mas demonstrar excelência na execução de padrões consolidados, servindo como referência open-source e material de estudos.

## Project Classification

| Dimensão | Valor |
|:---|:---|
| **Tipo de Projeto** | Web App (full-stack, real-time) |
| **Domínio** | Healthcare — Telemedicine (simulação acadêmica) |
| **Complexidade** | Medium-High |
| **Contexto** | Brownfield (auth, atestados, CID-10, dashboards existentes) |
| **Stack Principal** | NestJS + Next.js 14 + Prisma + PostgreSQL + WebRTC |

## Success Criteria

### User Success (Simulado)

- **Paciente** completa o fluxo inteiro (buscar → agendar → pré-triagem → consentimento → sala de espera → videochamada → receber documentos) sem assistência ou tutorial
- **Médico** completa o fluxo inteiro (agenda → pré-triagem → teleconsulta → prontuário → documentos → dashboard) sem assistência ou tutorial
- O fluxo de consulta é **autoexplicativo** — a interface guia o usuário naturalmente pela sequência, sem necessidade de instruções externas

### Business Success (Portfólio)

| Prioridade | Métrica | Definição de Sucesso |
|:---|:---|:---|
| **P0** | Completude | Projeto funcional, publicado no GitHub com README profissional (screenshots, diagrama de arquitetura, instruções de setup) |
| **P0** | Demo funcional | Demo acessível online com loading state elegante para cold start |
| **P1** | Impressão técnica | Recrutador avalia positivamente ao ver: demo + README + qualidade de código |
| **P2** | Feedback externo | Retorno positivo de recrutadores ou pares técnicos |

### Technical Success

| Métrica | Target |
|:---|:---|
| **Conexão WebRTC** | < 3 segundos para estabelecer chamada P2P |
| **Desconexões** | Tratamento graceful — usuário recebe feedback visual em vez de tela branca ou erro genérico |
| **Cold start** | Loading state elegante quando backend desperta do spin-down do Render (~30s) |
| **TypeScript** | Strict mode, zero erros de tipo |
| **Linting** | ESLint limpo, zero warnings/errors |
| **Testes** | Cada service novo tem no mínimo teste de happy path + error path |
| **CI/CD** | GitHub Actions: lint + build + test a cada push, badge ✅ no README |
| **Build** | Produção sem erros em Next.js e NestJS |
| **Compliance visual** | Termos, disclaimers e políticas implementados e visíveis |

### Measurable Outcomes

| Outcome | Threshold |
|:---|:---|
| Tempo do fluxo completo (paciente) | < 10 minutos (do login até receber documento) |
| Tempo do fluxo completo (médico) | < 15 minutos (incluindo prontuário e prescrição) |
| Conexão WebRTC | < 3 segundos |
| Pipeline CI | 100% verde na branch main |
| README | Screenshots/GIFs + diagrama + instruções de setup + badge CI |
| Deploy | Funcional em Vercel + Render, acessível publicamente |
| Disclaimer acadêmico | Visível em 100% das páginas |

## Product Scope

> Detalhamento completo em [Project Scoping & Phased Development](#project-scoping--phased-development).

**Já existente (brownfield):** Auth JWT/RBAC, atestados médicos (PDF + QRCode), busca CID-10, dashboards básicos, fluxo "esqueci senha"

**MVP:** Agendamento + Videochamada WebRTC (simple-peer) + Sala de espera (state machine) + Termo de consentimento + Verificação de dispositivos + Perfil médico + Pré-triagem + Chat + Prontuário + Prescrição + Email + Dashboard admin + Polish (CI/CD, README, loading state, disclaimer, privacy)

**Growth:** Avaliações pós-consulta, ranking, dark mode, PWA, WCAG AA, audit logs, i18n

**Vision:** Template open-source, case study, landing page

## User Journeys

### 🩺 Journey 1: Ana, a Paciente — "Preciso de um médico sem sair de casa"

**Quem é Ana:** Ana tem 34 anos, é designer freelancer, mora em Campinas. Trabalha de casa e tem dificuldade em encaixar consultas presenciais na sua rotina. Tem familiaridade média com tecnologia — usa apps de banco e delivery com conforto, mas nunca fez uma teleconsulta.

**Opening Scene:** Ana acorda com dor de garganta persistente há 3 dias. Não é grave o suficiente pra ir ao pronto-socorro, mas não quer deixar piorar. Procura "consulta médica online" e encontra o ImNotMedical.

**Rising Action:**
1. Acessa a plataforma e se cadastra como paciente — o formulário é curto, pede só o essencial
2. Busca por "clínico geral" e vê a lista de médicos disponíveis com especialidade, CRM e bio curta — o suficiente pra sentir que é real e confiável
3. Encontra o Dr. Carlos com horários disponíveis amanhã às 10h — agenda a consulta
4. Recebe um email de confirmação com data, hora e link
5. No dia seguinte, 1h antes, recebe um lembrete por email
6. Acessa a plataforma, preenche o questionário de pré-triagem: "dor de garganta, 3 dias, sem febre, intensidade moderada"
7. Lê e aceita o termo de consentimento digital — entende que é complementar ao presencial
8. Passa pela **verificação de dispositivos**: tela que testa câmera e microfone, mostra preview do vídeo e confirma que o áudio está funcionando
9. Entra na sala de espera virtual — vê uma tela calma com mensagem "O Dr. Carlos entrará em breve" e um indicador de status

**Climax:** O Dr. Carlos entra na sala. A videochamada conecta em 2 segundos. Ana vê o médico, se sente acolhida. O médico já leu sua pré-triagem e faz perguntas objetivas. Em 10 minutos, o diagnóstico: faringite viral leve. O médico emite uma prescrição digital ali mesmo.

**Resolution:** Ana recebe a prescrição em PDF com QRCode de validação. Pode mostrar na farmácia direto do celular. Total: 15 minutos do login até ter o documento na mão. Ana pensa: "por que eu não fiz isso antes?"

---

### 👨‍⚕️ Journey 2: Dr. Carlos, o Médico — "Quero atender mais pacientes sem depender do consultório"

**Quem é Dr. Carlos:** Dr. Carlos tem 42 anos, é clínico geral com CRM ativo. Atende em um consultório particular 3 dias por semana e quer usar os outros 2 dias para teleconsultas.

**Opening Scene:** Dr. Carlos se cadastra na plataforma, informa seu CRM, especialidade e uma breve bio. Após aprovação do admin, seu perfil é ativado. Configura sua agenda de disponibilidade: terças e quintas, das 9h às 13h, com slots de 30 minutos.

**Rising Action:**
1. Recebe email de que Ana agendou uma consulta para terça às 10h
2. Na terça de manhã, abre seu dashboard — vê as consultas do dia listadas com status
3. Clica na consulta da Ana e lê a pré-triagem: "dor de garganta, 3 dias, sem febre" — já tem contexto antes de iniciar
4. Às 10h, entra na sala de consulta. Ana já está na sala de espera

**Climax:** A videochamada conecta instantaneamente. Dr. Carlos conduz a consulta com a pré-triagem na lateral da tela. Usa o chat de texto para pedir que Ana mostre a garganta mais de perto e para enviar orientações escritas. Após 10 minutos, preenche o prontuário simplificado: anamnese, dados clínicos (garganta hiperemiada), conduta (repouso + analgésico), CID-10 (J02.9). Emite prescrição digital com dois cliques.

**Resolution:** Dr. Carlos finaliza a consulta. Ana recebe o documento automaticamente. Ele olha o dashboard: 4 consultas hoje, todas concluídas, tempo médio de 12 minutos. Pensa: "consigo atender o dobro de pacientes sem sair de casa."

---

### 😰 Journey 3: Ana, a Paciente — Edge Case: "A chamada caiu no meio da consulta"

**Opening Scene:** Ana está no meio da consulta com Dr. Carlos. O Wi-Fi do apartamento oscila e a conexão WebRTC cai.

**Rising Action:**
1. A tela da Ana mostra: "Conexão interrompida. Tentando reconectar..." com um spinner (ICE restart automático)
2. O Dr. Carlos vê: "Paciente desconectou. Aguardando reconexão..."
3. Após 5 segundos, o Wi-Fi de Ana volta. A conexão se reestabelece via ICE restart
4. Se não reconectar em 30 segundos, ambos veem: "Não foi possível reconectar. Você pode voltar à sala de espera para tentar novamente"

**Climax:** Ana volta à sala de espera. Dr. Carlos a readmite. A consulta retoma de onde parou — o prontuário parcial e o chat estão preservados.

**Resolution:** A consulta é concluída normalmente. Ana percebe que o sistema lidou com o problema de forma profissional, sem pânico ou perda de dados.

---

### 👑 Journey 4: Marcos, o Admin — "Preciso garantir que a plataforma funcione direito"

**Quem é Marcos:** Marcos é o administrador da plataforma (na simulação, o próprio desenvolvedor). Gerencia cadastros, monitora operações e resolve problemas acumulando função de suporte.

**Opening Scene:** Marcos acessa o dashboard admin — vê o disclaimer acadêmico: "Simulação acadêmica — nenhum dado médico real é processado". Abaixo, a visão geral: total de usuários, consultas realizadas, taxa de conclusão.

**Rising Action:**
1. Vê na fila de "Cadastros pendentes" o cadastro da Dra. Fernanda (CRM, especialidade: dermatologia)
2. Verifica os dados, aprova o cadastro — Dra. Fernanda recebe email de ativação
3. Nota que a consulta #47 ficou com status "em_andamento" sem nunca concluir (o médico saiu sem finalizar)
4. Investiga o log: o médico desconectou às 11:47, paciente saiu da sala às 11:52. Atualiza o status manualmente para "concluída (admin)" com observação

**Climax:** No final do dia, consulta as métricas: 23 consultas, 21 concluídas, 1 cancelada, 1 resolvida manualmente. Taxa de sucesso: 91%.

**Resolution:** Marcos tem visibilidade completa da operação. Gerencia a plataforma com autonomia.

---

### 🔍 Journey 5: Lucas, o Recrutador — "Será que esse dev sabe o que tá fazendo?"

**Quem é Lucas:** Lucas é tech lead em uma empresa de healthtech em São Paulo. Está contratando um dev full-stack e encontrou o GitHub do Rafa.

**Opening Scene:** Lucas abre o repositório do ImNotMedical no GitHub. Vê um README com badge CI verde ✅, screenshots do sistema, diagrama de arquitetura e link para demo ao vivo.

**Rising Action:**
1. Lê o README: entende o stack (NestJS + Next.js + WebRTC), a motivação e a arquitetura. Pensa: "organizado."
2. Clica no link do demo. O Render está em cold start — vê um loading state elegante: "Preparando o ambiente... primeira conexão pode levar alguns segundos." Em 25 segundos, a plataforma carrega
3. Abre **duas abas** do browser — uma como paciente (Ana) e outra como médico (Dr. Carlos)
4. Na aba do paciente: cadastra, busca médico, agenda consulta
5. Na aba do médico: vê a consulta agendada, abre a sala
6. Na aba do paciente: preenche pré-triagem, aceita termo, testa câmera/mic, entra na sala de espera
7. O médico admite. **A videochamada conecta entre as duas abas** — Lucas vê a si mesmo em duas janelas

**Climax:** Lucas percebe: "ele implementou WebRTC P2P de verdade, com sinalização, sala de espera, state machine, compliance visual... isso não é um CRUD qualquer." Olha o código: TypeScript strict, testes nos services, CI rodando. Vê o termo de consentimento e pensa: "ele sabe o que é CFM 2.314?"

**Resolution:** Lucas adiciona o Rafa à shortlist de candidatos. Marca entrevista pra próxima semana. O projeto fez em 10 minutos o que o CV sozinho não faria em 10 páginas.

---

### Journey Requirements Summary

| Journey | Capabilities Reveladas |
|:---|:---|
| **Ana (happy path)** | Cadastro, busca, agendamento, email, pré-triagem, consentimento, verificação de dispositivos, sala de espera, videochamada, prescrição |
| **Dr. Carlos (happy path)** | Perfil médico com CRM/bio/foto, calendário, dashboard, pré-triagem viewer, videochamada + chat complementar, prontuário, prescrição, métricas |
| **Ana (edge case)** | ICE restart automático, feedback de desconexão, persistência de estado, retorno à sala de espera |
| **Marcos (admin)** | Dashboard admin com disclaimer, aprovação de cadastros, logs de consulta, gestão de status, métricas operacionais |
| **Lucas (recrutador)** | README com badge CI, loading state cold start, demo solo em 2 abas, fluxo completo demonstrável |

### Edge Cases Adicionais

| Cenário | Comportamento Esperado |
|:---|:---|
| Paciente agenda mas não há horários disponíveis | Mensagem clara: "Nenhum horário disponível para esta especialidade. Tente outro médico ou outra data." |
| Médico não aparece no horário | Após 10 min de espera, paciente vê: "O médico não entrou. Deseja reagendar?" — consulta muda para status "não_realizada" |
| Paciente cancela em cima da hora | Médico recebe notificação de cancelamento. Slot é liberado na agenda |
| Paciente nega permissão de câmera/mic | Verificação de dispositivos bloqueia avanço com mensagem explicativa de como habilitar |
| Browser não suporta WebRTC | Mensagem: "Seu navegador não suporta videochamada. Use Chrome, Firefox ou Edge." |

## Domain-Specific Requirements

### Compliance & Regulatório (Visual/Simulado)

O ImNotMedical adota compliance visual para demonstrar consciência regulatória sem a complexidade de uma implementação certificada:

| Regulamentação | Implementação Simulada |
|:---|:---|
| **CFM 2.314/2022** | Termo de consentimento digital obrigatório pré-consulta com timestamp de aceite |
| **LGPD** | Página de política de privacidade + RBAC + política de retenção de dados |
| **Lei 14.510/2022** | Disclaimer de complementaridade: telemedicina complementa, não substitui presencial |
| **CRM** | Campo obrigatório e visível no perfil do médico, verificado na aprovação admin |
| **Disclaimer acadêmico** | Footer em todas as páginas: "Simulação acadêmica — nenhum dado médico real é processado" |

### Explicitamente Fora de Escopo (Compliance Formal)

Os requisitos abaixo são deliberadamente excluídos do escopo — não por desconhecimento, mas por análise de custo-benefício para um projeto acadêmico. Em um ambiente de produção real, cada um deles seria endereçado:

| Requisito Real | Justificativa de Exclusão |
|:---|:---|
| Criptografia NGS2 | Certificação formal desproporcional para projeto acadêmico |
| ICP-Brasil (assinatura digital) | Requer certificado digital A3, inviável em free tier |
| DPO (Data Protection Officer) | Requisito organizacional, não técnico |
| Certificação SBIS | Processo formal de certificação de software de saúde |
| URLs Cloudinary signed | Em produção real, documentos médicos usariam signed URLs com expiração — na simulação, URLs únicas são suficientes |

### Segurança de Dados

O projeto utiliza segurança nativa dos serviços e não implementa camadas adicionais desnecessárias:

- **Transporte:** HTTPS via Render (backend) e Vercel (frontend)
- **Autenticação:** JWT com expiração + refresh token
- **Autorização:** RBAC com 3 roles (patient, doctor, admin)
- **Dados em repouso:** Criptografia AES-256 nativa do Supabase
- **Documentos:** PDFs armazenados no Cloudinary com URLs únicas

→ Requisitos mensuráveis formalizados em [NFR8-14](#segurança).

### Política de Retenção de Dados

Para gestão de custos (Cloudinary free tier) e simulação de conformidade LGPD:

- **Período de retenção:** 100 dias para documentos gerados (prescrições, atestados, prontuários)
- **Mecanismo de limpeza:** GitHub Actions scheduled workflow (diário) que aciona endpoint protegido no backend:
  1. GitHub Actions dispara `POST /admin/cleanup/run` diariamente via cron schedule
  2. Backend identifica registros com `createdAt` > 100 dias
  3. Remove PDFs do Cloudinary via API de destroy
  4. Remove ou anonimiza registros correspondentes no banco
  5. Registra log da operação de limpeza
- **Trigger manual:** O endpoint `POST /admin/cleanup/run` também é acessível pelo admin via dashboard para verificação e testes
- **Justificativa:** Backend no Render free tier dorme após 15 min de inatividade — cron interno não é viável. GitHub Actions é gratuito e confiável
- **Monitoramento de cota:** Acompanhamento manual via dashboards nativos do Cloudinary e Supabase (sem implementação customizada)

### Riscos de Domínio e Mitigações

| Risco | Mitigação |
|:---|:---|
| Usuário confundir simulação com plataforma real | Disclaimer acadêmico em todas as páginas + termo de consentimento explícito |
| Dados sensíveis inseridos por engano | Disclaimer informa que nenhum dado médico real deve ser inserido |
| Cota de serviços free tier estourar | Política de retenção de 100 dias + acompanhamento manual via dashboards dos serviços |
| Supabase pausar por inatividade | Loading state elegante + documentação de limitações no README |
| WebRTC falhar por NAT restritivo | TURN server fallback via Metered.ca (500MB/mês free) |
| Cron job de limpeza falhar | Logs da operação + alerta visual no dashboard admin se última limpeza > 48h |

## Web App — Requisitos Específicos

### Arquitetura de Renderização

O Next.js 14 com App Router opera em modo híbrido nativamente:

| Tipo de Página | Renderização | Justificativa |
|:---|:---|:---|
| Login / Cadastro | SSR (Server Component) | SEO básico, carregamento rápido |
| Perfil público do médico | SSR com meta tags dinâmicas | SEO, compartilhável, acessível sem auth |
| Política de privacidade | SSR estático | Indexável, conteúdo fixo |
| Dashboards (médico/paciente/admin) | CSR (Client Component) | Dados privados, interatividade, sem SEO (`noindex`) |
| Sala de consulta (vídeo/chat) | CSR (Client Component) | Real-time, WebRTC, estado local intensivo |

### Compatibilidade de Browsers

| Browser | Versões | WebRTC | Prioridade |
|:---|:---|:---|:---|
| Chrome | Últimas 2 | ✅ Suporte completo | P0 — browser de referência |
| Firefox | Últimas 2 | ✅ Suporte completo | P0 |
| Edge | Últimas 2 | ✅ Suporte completo (Chromium) | P1 |
| Safari | Últimas 2 | ⚠️ Funcional com restrições | P1 — testar, não bloqueia release |
| IE | Não suportado | ❌ | Fora de escopo |

**Notas sobre Safari/iOS:**
- `getUserMedia` requer HTTPS obrigatoriamente (já coberto por Vercel/Render)
- Permissão de câmera exige user gesture (click/tap) antes da chamada — a tela de verificação de dispositivos já satisfaz esse requisito
- Comportamento de ICE candidates pode diferir — testar mas não bloquear release

### Design Responsivo

| Breakpoint | Target | Prioridade |
|:---|:---|:---|
| Desktop (≥ 1024px) | Experiência completa com layout multi-coluna | P0 |
| Tablet (768-1023px) | Layout adaptado, funcional | P1 |
| Mobile (< 768px) | Layout single-column, fluxo completo funcional | P1 |

**Layout de videochamada mobile:**
- Vídeo do outro participante ocupa tela cheia
- Próprio vídeo fica como PiP (picture-in-picture) pequeno no canto inferior
- Controles de mídia (mute, câmera, encerrar) em barra fixa no bottom da tela
- Chat abre como drawer sobreposto ao vídeo (não ao lado)

### Estratégia de SEO (Mínimo Estratégico)

**Implementar no MVP:**
- `<title>` e `<meta description>` em páginas públicas (login, cadastro, perfil do médico, política de privacidade)
- Meta tags dinâmicas no perfil público do médico (nome, especialidade via SSR)
- `<meta name="robots" content="noindex">` em todas as páginas autenticadas
- Heading hierarchy correta (`<h1>` único por página)
- HTML semântico (`<main>`, `<nav>`, `<section>`, `<article>`)

**Não implementar no MVP:**
- Sitemap.xml, Structured data (JSON-LD), Open Graph, Canonical URLs

### Comunicação Real-Time

| Contexto | Tecnologia | Escopo |
|:---|:---|:---|
| Videochamada P2P | WebRTC via **simple-peer** (~15KB gzipped, zero dependências extras) | Sala de consulta apenas |
| Sinalização | Socket.IO via NestJS Gateway | Conexão, desconexão, ICE candidates |
| Chat de texto | Socket.IO (mesmo gateway) | Durante consulta apenas |
| Status da sala de espera | Socket.IO (evento de status) | Notificar paciente quando médico entra |
| Dashboards | HTTP polling / refresh manual | Sem real-time |

**Decisão: simple-peer sobre PeerJS.** PeerJS abstrai signaling com servidor PeerServer próprio — como já temos Socket.IO para signaling, usar PeerJS criaria dependência duplicada. simple-peer é mais leve e dá controle total sobre o processo de sinalização.

**Não implementar no MVP:** Notificações push no browser. Emails cobrem confirmação e lembrete. Push fica pra Growth (PWA).

### Performance & Acessibilidade

→ Formalizados em [Non-Functional Requirements](#non-functional-requirements): Performance (NFR1-7) e Acessibilidade (NFR20-24).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Abordagem:** Experience MVP — Foco na qualidade da experiência end-to-end, não no volume de features.

**Recurso:** 1 desenvolvedor full-stack (solo dev). Tempo estimado: 12-16 semanas para MVP completo.

**Princípio orientador:** Cada feature entregue no MVP deve ter qualidade de produto real. É melhor entregar menos features com excelência do que mais features com acabamento medíocre. O recrutador não conta features — ele avalia a qualidade da execução.

### MVP Feature Set (Phase 1)

**Journeys suportados no MVP:**
- ✅ Ana (paciente) — fluxo completo de consulta
- ✅ Dr. Carlos (médico) — fluxo completo de atendimento
- ✅ Ana (edge case) — desconexão e reconexão
- ✅ Marcos (admin) — gestão e monitoramento
- ✅ Lucas (recrutador) — demo solo em 2 abas

**Must-Have (P0 — sem isso o produto falha):**

| Feature | Justificativa |
|:---|:---|
| Agendamento com calendário | Sem agendar, não existe consulta |
| Videochamada WebRTC (simple-peer) | Core do produto — telemedicina sem vídeo não faz sentido |
| Sala de espera com state machine | Orquestra o fluxo — sem ela, o médico não sabe que o paciente está pronto |
| Termo de consentimento digital | Compliance visual CFM — requisito de domínio |
| Verificação de dispositivos | Sem isso, 50% dos problemas serão "câmera não funciona" |

**Should-Have (P1 — enriquece significativamente):**

| Feature | Justificativa |
|:---|:---|
| Perfil público do médico (mínimo) | Momento de confiança + elemento Doctoralia que impressiona recrutador |
| Pré-triagem por questionário | Médico chega preparado — UX profissional |
| Chat de texto na consulta | Comunicação complementar ao vídeo |
| Prontuário eletrônico simplificado | Registro pós-consulta é padrão no domínio |
| Prescrição digital | Expansão natural do módulo de atestados existente |
| Notificações por email | Confirmação + lembrete — mínimo de comunicação com o paciente |
| Dashboard admin | Gestão da plataforma + compliance visual |

**Nice-to-Have (P2 — polish profissional):**

| Feature | Justificativa |
|:---|:---|
| Disclaimer acadêmico (footer) | Compliance visual, implementação trivial |
| Política de privacidade | Página estática, LGPD simulada |
| CI/CD (GitHub Actions) | Badge verde ✅ no README, profissionalismo |
| README profissional | Screenshots, arquitetura, setup |
| Loading state (cold start) | UX do demo — essencial pro recrutador |

**Explicitamente fora de escopo do MVP:**
- Gravação de consulta (MediaRecorder API é viável mas complexidade desnecessária)
- Notificações push no browser
- Multi-idioma

### Ordem de Implementação (Sprints)

Baseada em dependências técnicas e testabilidade incremental do journey:

| Sprint | Escopo | Journey Testável |
|:---|:---|:---|
| **Sprint 0** | Design system (cores, tipografia, spacing, componentes reutilizáveis) | — Base visual consistente |
| **Sprint 1** | RBAC admin + Agendamento + calendário | Agendar consulta ✅ |
| **Sprint 2** | Socket.IO Gateway + Sala de espera + Verificação de dispositivos + Termo de consentimento | Agendar → Consentir → Esperar ✅ |
| **Sprint 3** | Videochamada (simple-peer + signaling) + Chat de texto | Agendar → Esperar → Consultar ✅ |
| **Sprint 4** | Pré-triagem + Prontuário + Prescrição | Fluxo completo paciente + médico ✅ |
| **Sprint 5** | Perfil público médico + Dashboard admin + Notificações email | Todos os journeys ✅ |
| **Sprint 6** | Polish: CI/CD, README, loading state, disclaimer, privacy page | Demo-ready ✅ |

### Post-MVP Features

**Phase 2 — Growth:**
- Avaliação pós-consulta (estrelas + comentário)
- Ranking de médicos por avaliação
- SEO para perfis públicos
- Dark mode
- PWA
- WCAG 2.1 AA formal
- Audit logs
- i18n (PT-BR + EN)
- Sistema de tickets de suporte

**Phase 3 — Vision:**
- Template open-source documentado
- Case study como material de estudos
- Landing page pública

### Risk Mitigation Strategy

**Riscos Técnicos:**

| Risco | Probabilidade | Impacto | Mitigação |
|:---|:---|:---|:---|
| WebRTC falha em NAT simétrico | Média | Alto | TURN server fallback (Metered.ca free) |
| simple-peer instável em Safari | Média | Médio | Safari como P1, não bloqueia release |
| Render cold start > 30s | Alta | Médio | Loading state elegante, documentar no README |
| Bundle size > 200KB | Baixa | Baixo | React Server Components + dynamic imports |

**Risco de Escopo:**

| Risco | Mitigação |
|:---|:---|
| MVP muito grande para 1 dev | P0 é reduzível. P1 pode ser cortado progressivamente |
| Feature creep | PRD aprovado como referência. Adições passam por avaliação de impacto |
| Tempo excede 16 semanas | Priorizar P0 completo + P2 (polish) > P1 incompleto |
| UX inconsistente entre módulos | Sprint 0 define design system antes de qualquer feature |

**Plano de contingência (ordem de corte):**
1. Primeiro corta: Notificações por email *(fallback: paciente vê consultas agendadas no dashboard)*
2. Depois corta: Chat de texto *(vídeo já é comunicação principal)*
3. Depois corta: Pré-triagem *(médico pergunta ao vivo)*
4. **Nunca corta:** Vídeo + Sala de espera + Agendamento + Termo de consentimento

## Functional Requirements

### Gestão de Identidade e Acesso

- **FR1:** Paciente pode se cadastrar com dados pessoais básicos (nome, email, senha)
- **FR2:** Médico pode se cadastrar informando CRM, especialidade, bio e foto de perfil
- **FR3:** Usuário autenticado pode fazer login e logout na plataforma
- **FR4:** Usuário pode solicitar recuperação de senha via email
- **FR5:** Sistema restringe acesso a funcionalidades baseado na role do usuário (patient, doctor, admin)
- **FR6:** Admin pode aprovar ou rejeitar cadastro de médicos pendentes
- **FR7:** Admin pode ativar ou desativar contas de usuários

### Agendamento de Consultas

- **FR8:** Médico pode configurar sua agenda de disponibilidade com slots de horário
- **FR9:** Paciente pode buscar médicos disponíveis por especialidade
- **FR10:** Paciente pode visualizar o perfil público do médico (foto, nome, CRM, especialidade, bio)
- **FR11:** Paciente pode agendar uma consulta em um slot disponível do médico
- **FR12:** Paciente pode cancelar uma consulta agendada
- **FR13:** Médico pode visualizar suas consultas agendadas no dashboard
- **FR14:** Sistema envia notificação por email de confirmação e lembrete de consulta

### Pré-Consulta

- **FR15:** Paciente pode preencher questionário de pré-triagem com informações clínicas antes da consulta
- **FR16:** Paciente deve aceitar termo de consentimento digital antes de acessar a sala de consulta
- **FR17:** Paciente pode verificar funcionamento de câmera e microfone antes de entrar na sala de espera
- **FR18:** Paciente pode entrar na sala de espera virtual e aguardar o médico
- **FR19:** Paciente pode visualizar o status de sua posição na sala de espera
- **FR20:** Médico pode visualizar a pré-triagem do paciente antes de iniciar a consulta

### Teleconsulta

- **FR21:** Sistema gerencia o ciclo de vida da consulta através de estados definidos (agendada, em_espera, em_andamento, concluída, cancelada, não_realizada) com transições controladas
- **FR22:** Médico pode admitir paciente da sala de espera para iniciar a consulta
- **FR23:** Sistema notifica o paciente em tempo real quando o médico entra na sala de consulta
- **FR24:** Sistema gerencia a sinalização de conexão P2P entre participantes da consulta em tempo real
- **FR25:** Médico e paciente podem se comunicar via videochamada P2P em tempo real
- **FR26:** Médico e paciente podem trocar mensagens de texto durante a consulta
- **FR27:** Participante pode controlar seu microfone (mute/unmute) durante a chamada
- **FR28:** Participante pode controlar sua câmera (ligar/desligar) durante a chamada
- **FR29:** Sistema reconecta automaticamente a videochamada em caso de queda temporária de conexão
- **FR30:** Sistema exibe feedback visual de status da conexão (conectado, reconectando, desconectado)
- **FR31:** Sistema detecta quando médico não entra na sala após tempo definido e permite ao paciente reagendar
- **FR32:** Médico pode encerrar a consulta

### Pós-Consulta

- **FR33:** Médico pode registrar prontuário simplificado da consulta (anamnese, dados clínicos, conduta, CID-10)
- **FR34:** Médico pode buscar códigos CID-10 por nome ou código durante o registro do prontuário
- **FR35:** Médico pode emitir prescrição digital para o paciente
- **FR36:** Médico pode emitir atestado médico para o paciente
- **FR37:** Paciente pode acessar documentos recebidos (prescrições, atestados) no seu dashboard
- **FR38:** Documentos gerados possuem QRCode de validação

### Administração e Operações

- **FR39:** Admin pode visualizar métricas operacionais da plataforma (total de consultas, taxa de conclusão, usuários ativos)
- **FR40:** Admin pode visualizar logs de consultas com status e timestamps
- **FR41:** Admin pode alterar manualmente o status de uma consulta
- **FR42:** Admin pode disparar manualmente o processo de limpeza de dados expirados
- **FR43:** Sistema remove automaticamente documentos com mais de 100 dias (banco + Cloudinary)

### Compliance e Informação

- **FR44:** Todas as páginas exibem disclaimer acadêmico no footer
- **FR45:** Plataforma disponibiliza página de política de privacidade acessível publicamente
- **FR46:** Sistema informa o usuário sobre incompatibilidade de browser ou falta de permissão de dispositivos antes de tentar acessar a videochamada

## Non-Functional Requirements

*Nota: Os NFRs formalizam como contrato de qualidade os targets previamente definidos nas seções Success Criteria e Performance Targets.*

### Performance

- **NFR1:** Interface responde a ações do usuário sem lag perceptível (< 200ms, medido via DevTools Performance)
- **NFR2:** Páginas SSR (login, perfil público, política de privacidade) carregam com FCP < 2s e LCP < 3s (Lighthouse, Slow 4G throttling)
- **NFR3:** TTI (Time to Interactive) das páginas < 4s (Lighthouse, Slow 4G throttling)
- **NFR4:** Bundle JavaScript inicial < 200KB gzipped
- **NFR5:** Conexão WebRTC P2P estabelecida em < 3 segundos após ambos os participantes estarem na sala
- **NFR6:** Sistema não adiciona latência artificial ao stream WebRTC — qualidade da chamada depende exclusivamente da rede dos participantes
- **NFR7:** Busca CID-10 retorna resultados em < 500ms

*Nota: Targets de Lighthouse medem o frontend isolado (Vercel) com throttling "Applied Slow 4G". Latência de API no Render free tier (cold start ~30s) não é contabilizada — é endereçada via loading states elegantes na UX.*

### Segurança

- **NFR8:** Todas as comunicações utilizam HTTPS (TLS 1.2+)
- **NFR9:** Tokens JWT possuem tempo de expiração definido e suportam refresh
- **NFR10:** Senhas são armazenadas com hash seguro (bcrypt com salt rounds ≥ 10)
- **NFR11:** Dados em repouso são criptografados via AES-256 (nativo Supabase)
- **NFR12:** Endpoints protegidos rejeitam requisições sem token válido com status 401
- **NFR13:** Endpoints restritos por role rejeitam acesso não autorizado com status 403
- **NFR14:** Dados de documentos médicos são removidos após 100 dias (política de retenção)

### Confiabilidade

- **NFR15:** Sistema exibe loading state elegante durante cold start do backend (~30s no Render free tier)
- **NFR16:** Queda de conexão WebRTC dispara tentativa de reconexão automática (ICE restart) antes de mostrar erro
- **NFR17:** Estado parcial da consulta (prontuário, chat) é preservado em caso de desconexão
- **NFR18:** Falha no envio de email não bloqueia o fluxo principal (agendamento/consulta prosseguem normalmente)
- **NFR19:** Falha na integração com Cloudinary é tratada com mensagem ao usuário (não com erro genérico)

### Acessibilidade

- **NFR20:** Contraste de texto atinge ratio mínimo de 4.5:1 (WCAG AA)
- **NFR21:** Todos os elementos interativos são acessíveis via navegação por teclado (Tab, Enter, Escape)
- **NFR22:** Todos os inputs possuem labels associados e todas as imagens possuem alt-text
- **NFR23:** Botões de ícone (mute, câmera, encerrar) possuem aria-label descritivo
- **NFR24:** Skip navigation link disponível em todas as páginas

### Integrações

- **NFR25:** Upload de imagem de perfil utiliza Cloudinary com tamanho máximo de 5MB
- **NFR26:** Geração de PDF (prescrição, atestado) utiliza QRCode de validação com URL pública
- **NFR27:** TURN server fallback (Metered.ca) é utilizado quando conexão P2P direta falha por NAT restritivo
- **NFR28:** Envio de emails (confirmação, lembrete, ativação) opera via SMTP gratuito, suportando até 100 emails/dia como baseline

### Qualidade de Código

- **NFR29:** TypeScript em modo strict habilitado em todo o projeto (frontend e backend)
- **NFR30:** ESLint com zero warnings e zero errors em 100% dos arquivos
- **NFR31:** Cada service novo possui no mínimo teste de happy path e error path
- **NFR32:** Commits na branch main passam por pipeline CI (lint + build + test) — build quebrado bloqueia merge, badge CI permanece verde

### Operacional

- **NFR33:** Volume de dados no PostgreSQL mantém-se abaixo de 400MB (80% do limite free tier Supabase) com a política de retenção ativa
