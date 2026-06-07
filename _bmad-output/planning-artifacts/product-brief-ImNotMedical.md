---
title: "Product Brief: ImNotMedical"
status: "complete"
created: "2026-05-12"
updated: "2026-05-12"
inputs:
  - docs/OVERVIEW.pt.md
  - market_analysis.md (pesquisa de mercado e regulatória)
  - conversas de discovery com o stakeholder
---

# Product Brief: ImNotMedical

## Sumário Executivo

O ImNotMedical é uma plataforma acadêmica de telemedicina que simula uma solução real de teleconsulta, conectando médicos e pacientes por videochamada. Inspirada em plataformas como **Doctor on Demand** (experiência on-demand simplificada) e **Doctoralia** (marketplace com perfis públicos de médicos), a plataforma oferece agendamento, consulta por vídeo, prontuário eletrônico simplificado e prescrição digital — tudo com compliance visual à regulamentação brasileira (CFM 2.314/2022 e LGPD).

Embora acadêmico, o projeto é desenvolvido com as melhores práticas de engenharia de software e arquitetura de sistemas, servindo como portfólio profissional do desenvolvedor. O stack moderno (NestJS + Next.js 14 + Prisma + PostgreSQL) e a adoção de WebRTC para videochamada P2P demonstram domínio técnico em comunicação real-time, arquitetura full-stack e design orientado a compliance — competências altamente valorizadas no mercado.

## O Problema

No cenário brasileiro de saúde, pacientes enfrentam filas, deslocamentos e dificuldade para acessar médicos — especialmente em regiões remotas ou para consultas de rotina. Do lado médico, profissionais buscam flexibilidade e ferramentas digitais para expandir seu alcance sem depender exclusivamente de consultórios físicos.

As soluções existentes são predominantemente corporativas (Conexa, Docway) ou voltadas para clínicas estabelecidas (iClinic), deixando uma lacuna para plataformas simples e acessíveis que conectem médicos individuais a pacientes de forma direta — como um Doctor on Demand à brasileira.

Para um desenvolvedor construindo portfólio, a telemedicina é um domínio que demonstra capacidade de resolver problemas complexos: comunicação real-time, segurança de dados sensíveis, compliance regulatória e UX empática para contextos de saúde.

## A Solução

O ImNotMedical entrega uma experiência completa de teleconsulta em três fluxos principais:

**Para o Paciente:**
1. Busca médicos por especialidade e visualiza perfis públicos
2. Agenda consultas com base na disponibilidade do médico
3. Preenche questionário de pré-triagem com sintomas
4. Aceita o termo de consentimento digital (CFM 2.314)
5. Entra na sala de espera virtual e aguarda o médico
6. Realiza a consulta por videochamada (WebRTC P2P)
7. Recebe atestados e prescrições digitais
8. Avalia a consulta

**Para o Médico:**
1. Mantém perfil público com especialidade, CRM e avaliações
2. Gerencia agenda de disponibilidade
3. Visualiza pré-triagem do paciente antes da consulta
4. Conduz a teleconsulta por vídeo
5. Registra prontuário simplificado pós-consulta (anamnese + conduta)
6. Emite atestados e prescrições digitais (PDF com QRCode)
7. Acompanha métricas no dashboard

## O Que Torna Diferente

| Diferencial | Impacto |
|:---|:---|
| **WebRTC P2P nativo** | Zero custo de servidor de mídia, demonstra domínio de comunicação real-time |
| **Compliance visual brasileira** | Termos de consentimento (CFM 2.314), política de privacidade (LGPD), disclaimer de complementaridade |
| **Pré-triagem inteligente** | Questionário com lógica condicional antes da consulta — simula triagem sem custo de IA |
| **Sala de espera virtual** | UX profissional, padrão de mercado, raramente visto em projetos acadêmicos |
| **Perfil público do médico** | Modelo marketplace inspirado na Doctoralia |
| **Stack 100% free tier** | Supabase, Cloudinary, Render, Vercel — arquitetura real com custo zero |
| **Qualidade de portfólio** | Monorepo, TypeScript end-to-end, testes, CI/CD — padrão de mercado profissional |

## Quem Isso Serve

**Usuário Primário — Paciente:**
Pessoa que busca atendimento médico remoto com simplicidade. Pode ter baixa familiaridade com tecnologia. Precisa de uma interface intuitiva que transmita confiança e profissionalismo. O momento "aha" acontece quando consegue agendar e realizar uma consulta completa sem sair de casa.

**Usuário Primário — Médico:**
Profissional de saúde que deseja oferecer teleconsultas. Valoriza ferramentas que se integrem ao fluxo clínico (prontuário, prescrição) sem burocracia digital. O momento "aha" é quando percebe que pode gerenciar agenda, consultar e emitir documentos em uma única plataforma.

**Audiência Secundária — Recrutadores/Avaliadores:**
Profissionais técnicos que avaliam o portfólio do desenvolvedor. Buscam evidências de arquitetura sólida, boas práticas, domínio de tecnologias modernas e capacidade de resolver problemas complexos de domínio.

## Compliance & Regulatório (Simulado)

O ImNotMedical adota compliance visual para demonstrar conhecimento regulatório sem a complexidade de uma implementação certificada:

- **Termo de Consentimento Digital** — Modal obrigatório antes da teleconsulta (CFM 2.314/2022)
- **Disclaimer de Complementaridade** — Indicação de que telemedicina é complementar ao presencial
- **Página de Política de Privacidade** — Explicação clara de tratamento de dados (LGPD)
- **Validação de CRM** — Campo obrigatório no perfil médico
- **Disclaimer Acadêmico** — Mensagem elegante no footer informando que é uma simulação acadêmica

## Critérios de Sucesso

| Métrica | Definição de Sucesso |
|:---|:---|
| **Fluxo completo funcional** | Paciente consegue agendar → entrar na sala → realizar videochamada → receber documentos |
| **UX profissional** | Interface indistinguível de produto real, responsiva, acessível |
| **Qualidade de código** | Linting limpo, TypeScript strict, testes unitários cobrindo módulos críticos |
| **Performance** | Tempo de conexão WebRTC < 3s, zero crashes durante consulta |
| **Compliance visual** | Todos os termos e disclaimers implementados e visíveis |
| **Documentação** | README completo, API documentada, arquitetura clara |

## Escopo

### ✅ MVP (v1)
- Autenticação JWT com RBAC (médico/paciente) *(existente)*
- Perfis de médico e paciente *(existente, expandir)*
- Agendamento de consultas com calendário de disponibilidade
- Videochamada 1:1 via WebRTC (PeerJS + Socket.IO)
- Sala de espera virtual
- Chat de texto durante a consulta
- Termo de consentimento digital
- Pré-triagem por questionário
- Prontuário eletrônico simplificado (registro pós-consulta)
- Prescrição digital (expandir módulo de atestados)
- Notificações por email (confirmação e lembrete)
- Dashboard com métricas (médico e paciente)
- Busca CID-10 *(existente)*
- Disclaimer acadêmico no footer
- Política de privacidade

### ⭐ Pós-MVP (v2)
- Perfil público do médico (marketplace)
- Avaliação pós-consulta (rating + comentário)
- Dark mode
- PWA (Progressive Web App)
- Acessibilidade WCAG 2.1 AA
- Audit logs básicos
- Internacionalização (PT-BR + EN)

### ❌ Fora de Escopo
- Integração com sistemas EHR reais (Epic, Cerner)
- Pagamento / cobrança por consultas
- Multi-party video (mais de 2 participantes)
- Integração com wearables / RPM
- App nativo (iOS/Android)
- IA generativa para diagnóstico
- Certificação NGS2 real

## Visão

Se bem-sucedido como projeto acadêmico e portfólio, o ImNotMedical se torna uma referência open-source de como construir uma plataforma de telemedicina full-stack com stack moderna e custo zero. Em 2-3 anos, poderia evoluir para:

1. **Template open-source** — Boilerplate para startups de healthtech que precisam de uma base sólida
2. **Plataforma de ensino** — Case study documentado para ensinar arquitetura de sistemas de saúde
3. **MVP real** — Com investimento, poderia ser adaptado para operação real com certificação NGS2, integração com convênios e monetização
