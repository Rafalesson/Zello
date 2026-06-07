---
status: done
baseline_commit: 92e75878ea6c2e0b5415f26bcc37ecc94c1ea880
---

# Story 2.7: Redesign do Dashboard Médico e Migração de Documentos

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story Context

Como Médico,
Eu quero visualizar um painel de controle (Command Center) limpo focado na minha agenda diária, com a emissão de documentos movida para abas dedicadas,
Para que eu possa gerenciar minha rotina clínica com menos carga cognitiva e seguir os padrões de mercado.

## Tasks / Subtasks

- [x] **Task 1: Migração dos Documentos e Criação de Telas** (AC: 1)
  - [x] 1.1 Remover os botões "Emitir Atestado" e "Emitir Receita" da tela inicial do Dashboard (`apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx`).
  - [x] 1.2 Remover a listagem "Documentos Emitidos Recentemente" do Dashboard principal, assim como suas requisições de API (`fetchRecentDocuments`).
  - [x] 1.3 Criar a página de Atestados (`apps/frontend/src/app/medico/(dashboard)/atestados/page.tsx`), transferindo o fluxo de emissão de atestado e a listagem exclusiva de atestados recentes para lá.
  - [x] 1.4 Criar a página de Receitas (`apps/frontend/src/app/medico/(dashboard)/receitas/page.tsx`), transferindo o fluxo de emissão de receitas e a listagem exclusiva de receitas recentes para lá.
- [x] **Task 2: Novo Layout do Dashboard (Command Center)** (AC: 2, 3, 4)
  - [x] 2.1 Refatorar os cards de métricas no topo do Dashboard. Manter a saudação amigável e exibir métricas rápidas lado a lado (ex: Consultas Hoje, Total de Pacientes).
  - [x] 2.2 Transformar a seção "Próximas Consultas" em um componente de "Linha do Tempo (Timeline)" diária, ocupando a área principal. Destacar o paciente atual/próximo e adicionar botões primários consistentes (ex: "Iniciar Consulta" - que no momento pode ser apenas visual ou mock link).
  - [x] 2.3 Adicionar uma área à direita (onde ficavam os documentos) para "Tarefas Pendentes" ou "Avisos" (ex: "Nenhuma tarefa pendente"), preenchendo o espaço de forma útil e equilibrada visualmente.

## Dev Notes

-   A arquitetura deve seguir fielmente o Design System Teal/Slate, usando Tailwind CSS (`dark:bg-slate-800`, `text-teal-500`, etc.).
-   As rotas de `atestados` e `receitas` devem estar acessíveis através dos menus laterais já existentes (Sidebar). Se os links da Sidebar ainda apontarem para `href="#"`, atualize-os para `/medico/atestados` e `/medico/receitas`.
-   Nenhuma nova rota de backend é necessária; reaproveite `GET /patients/documents` com filtros no frontend (ou adicione params no Axios, se aplicável, caso já exista no controller).

## Review Findings

- [ ] [Review] ...

## Suggested Review Order

**Dashboard Redesign**

- Refatoração dos cards do topo e adição da saudação
  [`dashboard/page.tsx:223`](../../apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx#L223)

- Remoção da emissão de documentos e refatoração da timeline de consultas
  [`dashboard/page.tsx:189`](../../apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx#L189)

- Inclusão do botão Iniciar Consulta e placeholder para Tarefas Pendentes
  [`dashboard/page.tsx:209`](../../apps/frontend/src/app/medico/(dashboard)/dashboard/page.tsx#L209)

**Migração de Documentos**

- Acesso ao fluxo de emissão movido para a tela de Atestados
  [`atestados/page.tsx:241`](../../apps/frontend/src/app/medico/(dashboard)/atestados/page.tsx#L241)

- Acesso ao fluxo de emissão movido para a tela de Receitas
  [`receitas/page.tsx:241`](../../apps/frontend/src/app/medico/(dashboard)/receitas/page.tsx#L241)


