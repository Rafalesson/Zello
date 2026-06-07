---
title: "Product Brief Distillate: ImNotMedical"
type: llm-distillate
source: "product-brief-ImNotMedical.md"
created: "2026-05-12"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: ImNotMedical

## Identidade do Produto
- Plataforma acadêmica de telemedicina que simula produto real
- Inspiração: Doctor on Demand (on-demand simplificado) + Doctoralia (marketplace com perfis públicos)
- Serve como portfólio profissional — recrutadores são audiência secundária
- Nome "ImNotMedical" reforça natureza acadêmica/simulada

## Stack Técnico (Definido)
- **Monorepo**: apps/backend (NestJS) + apps/frontend (Next.js 14)
- **Banco**: PostgreSQL via Prisma, hospedado no Supabase (free tier)
- **Autenticação**: JWT com RBAC (médico/paciente) — já implementado
- **PDF**: Browserless + Puppeteer → Cloudinary (já implementado)
- **Video**: WebRTC nativo (PeerJS ou simple-peer) — P2P sem servidor de mídia
- **Sinalização**: Socket.IO via NestJS WebSocket Gateway
- **TURN fallback**: Metered.ca free tier (500MB/mês)
- **Email**: Resend free tier (100/dia) ou manter Ethereal para dev
- **Deploy**: Render (backend) + Vercel (frontend) — ambos free tier
- **CI/CD**: GitHub Actions (free para repos públicos)

## Funcionalidades Existentes (Não Reimplementar)
- Autenticação JWT com roles (médico/paciente) e guards
- Fluxo completo de "esqueci senha" com token + email
- Módulo de atestados médicos: criação, listagem, remoção, validação pública
- Geração de PDF com QRCode via Browserless + upload Cloudinary
- Busca CID-10
- Dashboards básicos (médico e paciente)
- Módulo Prisma global
- Middleware de proteção de rotas por role no frontend

## Funcionalidades a Construir (MVP)
- **Agendamento**: Calendário de disponibilidade do médico + marcação pelo paciente + lembretes email
- **Videochamada WebRTC**: Sinalização via Socket.IO, conexão P2P, controles de mídia (mute/câmera), fallback áudio, indicador de qualidade
- **Sala de espera virtual**: Estado da consulta no backend (agendada → em_espera → em_andamento → concluída), interface visual de espera com feedback
- **Chat de texto**: Mensagens durante consulta via mesmo gateway WebSocket
- **Termo de consentimento**: Modal com checkboxes antes de entrar na sala, registro com timestamp no banco
- **Pré-triagem**: Questionário com lógica condicional (sintomas, duração, intensidade) preenchido antes da consulta
- **Prontuário simplificado**: Formulário pós-consulta para médico (anamnese, dados clínicos, conduta, CID-10)
- **Prescrição digital**: Expandir módulo de atestados para incluir receitas médicas (mesmo fluxo PDF + Cloudinary)
- **Notificações email**: Confirmação de agendamento + lembrete 1h antes
- **Disclaimer acadêmico**: Mensagem elegante no footer de todas as páginas
- **Política de privacidade**: Página estática simulando compliance LGPD

## Funcionalidades Pós-MVP (v2)
- Perfil público do médico com especialidade, CRM, bio, avaliações (modelo marketplace)
- Sistema de avaliação pós-consulta (1-5 estrelas + comentário)
- Dark mode (CSS variables + toggle)
- PWA (service worker + manifest.json)
- Acessibilidade WCAG 2.1 AA (contraste, ARIA, navegação por teclado)
- Audit logs básicos (middleware de logging de ações sensíveis)
- Internacionalização PT-BR + EN (next-intl)

## Explicitamente Fora de Escopo
- Integração com EHR reais (Epic, Cerner, etc.)
- Sistema de pagamento/cobrança
- Videochamada com mais de 2 participantes
- Integração com wearables/IoT/RPM
- App nativo iOS/Android
- IA generativa para diagnóstico ou triage automática
- Certificação NGS2 real ou compliance formal
- Dados médicos reais de pacientes

## Regulamentação (Compliance Visual Apenas)
- **CFM 2.314/2022**: Simular via termo de consentimento digital + disclaimer de complementaridade
- **LGPD**: Simular via página de política de privacidade + RBAC existente
- **Lei 14.510/2022**: Simular via textos informativos sobre direito de recusa
- **CRM**: Campo obrigatório e visível no perfil do médico
- **Disclaimer geral**: Todas as páginas devem ter indicação de que é simulação acadêmica — nenhum dado médico real é processado
- NÃO implementar: criptografia NGS2, ICP-Brasil, audit logs formais, DPO

## Restrições de Custo
- Somente serviços free tier ou gratuitos
- Serviços já em uso: Supabase, Cloudinary, Render, Vercel
- Cota Supabase free: 500MB banco, 1GB storage, pause por inatividade após 1 semana
- Cota Cloudinary free: 25 créditos/mês
- Cota Render free: spin-down após 15min inatividade, cold start ~30s
- WebRTC P2P não tem custo de servidor de mídia
- TURN server (Metered.ca): 500MB/mês free — suficiente para demos

## Decisões de Design (Capturadas)
- UX deve ser "indistinguível de produto real" — qualidade visual premium
- Interface deve funcionar em mobile e desktop (responsiva)
- Fluxo de consulta deve ser simples: agendar → esperar → consultar → documentar
- Médico tem autonomia total sobre agenda e conduta
- Paciente tem fluxo self-service completo
- Atestados existentes devem continuar funcionando — prescrição é expansão, não substituição
- **Identidade visual**: redesign incremental durante a implementação do MVP (não parar para redesenhar tudo de uma vez)
- **Paleta sugerida**: tons de azul/teal (saúde + confiança), tipografia Inter, micro-animações
- **Repositório**: público no GitHub — portfólio aberto, README com screenshots/GIFs
- **Landing page**: será construída como vitrine do projeto para recrutadores

## Insights da Pesquisa de Mercado
- Mercado brasileiro dominado por soluções corporativas (Conexa, Docway) — gap para individual/simples
- iClinic é a referência para gestão integrada de consultório + teleconsulta
- Doctoralia domina como marketplace de busca de médicos — perfil público é feature chave
- Doctor on Demand se destaca por UX simplificada e acesso via browser
- Tendência global: omnichannel (vídeo + chat + assíncrono), IA para triagem, PWA
- WebRTC P2P é viável e impressiona em portfólio — padrão para 1:1

## Insights do Review
- Supabase free tier pode pausar — considerar loading state para cold start do Render
- Disclaimer acadêmico deve ser explícito: "nenhum dado médico real é processado"
- Perfil público de médico tem potencial para subir de v2 para v1 (elemento Doctoralia)
- Landing page pública explicando a arquitetura seria diferencial para recrutadores
- Web Speech API (grátis no browser) como transcrição de consulta = wow factor de baixo esforço para v2

## Decisões Resolvidas
- ✅ Perfil público do médico permanece em **v2** — MVP foca no fluxo core de teleconsulta
- ✅ Identidade visual: **redesign incremental** durante implementação do MVP
- ✅ Projeto será **open-source** (repo público no GitHub)
- ✅ Landing page pública será construída como vitrine para recrutadores

## Perguntas em Aberto
- Definir estrutura e conteúdo da landing page (seções, screenshots, tech stack showcase)
- Decidir se landing page fica no mesmo repo ou em repo separado
