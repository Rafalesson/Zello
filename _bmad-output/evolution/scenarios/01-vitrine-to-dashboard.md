# Scenario: Jornada Vitrine -> Dashboard Proativo

## Target
**O que estamos melhorando:** A experiência completa do paciente (End-to-End), desde a busca anônima pelo médico até a gestão pós-agendamento.
**Por quê:** A interface atual exige login prematuro para entregar valor, gera atrito ("paradoxo da escolha") na busca e, no pós-login, exibe um painel utilitário estático que não acalma nem guia o usuário ("amador"). O objetivo é alinhar a plataforma com as melhores práticas de mercado (Doctoralia, Zenklub, Alice).

## Current State
- O paciente encontra uma barreira de login antes de se engajar com a oferta (os médicos).
- A busca por profissionais carece de "prova social" e filtros humanizados.
- O Dashboard do paciente é apenas um menu de navegação (grid de botões para "Agendar", "Minhas Consultas", etc.), exigindo cliques extras para descobrir a data da próxima consulta ou status de receitas.

## Desired State
- **Público (A Vitrine):** Uma página `/medicos` pública, limpa, que usa tons que acalmam e destaca a "próxima data disponível" logo no card.
- **Conversão (Login Contextual):** O usuário clica para agendar um horário na página do médico, e o login/cadastro aparece não como uma barreira, mas como o último passo rápido para garantir a vaga.
- **Privado (Dashboard Proativo):** O Dashboard `/paciente/dashboard` se transforma em um "Gestor de Saúde", focando na linha do tempo. "Sua próxima teleconsulta é amanhã [Acessar Link]".

## User Journey
### Fluxo Atual:
1. Usuário acessa o sistema -> Tela de Login -> Entra no Dashboard -> Vê grid de botões -> Clica em "Encontrar Médicos" -> Tenta agendar -> Acompanha consultas em outra aba.

### Fluxo Proposto:
1. **Entry Point (SEO/Orgânico):** Usuário entra no app e vê direto a **Vitrine de Médicos**.
2. **Busca Guiada:** Filtra por dores ou especialidades. Vê cards profissionais com foco em avaliações e horários livres.
3. **Conversão Natural:** Clica no horário desejado no perfil do médico. Um modal fluído de Login/Cadastro intercepta a ação.
4. **Agendamento Confirmado:** Volta pro fluxo logado e o agendamento é concluído.
5. **Dashboard Timeline:** Cai no dashboard. O destaque agora não são botões, mas um **Hero Card** dizendo: "Consulta marcada para [Data]. Veja orientações."

## Success Criteria
- O paciente consegue encontrar e selecionar um médico em menos de 3 cliques a partir da página inicial (sem estar logado).
- A tela inicial do paciente logado exibe a próxima ação (consulta/receita) sem precisar navegar para outra página.
- O visual passa a mesma sensação de "confiança e limpeza" de um banco digital ou grande healthtech.

## Scope
- **Pages affected:** `app/medicos` (Vitrine), `app/medico/[id]` (Perfil Público), `app/paciente/dashboard` (Painel Privado).
- **Components touched:** `booking-widget`, novos cards de médicos, transformação do grid do dashboard em cards de timeline.
- **Data changes:** Expor a listagem de médicos e horários publicamente (sem exigir token JWT na rota de listagem), e interceptar rotas privadas para o modal de autenticação.
- **Risk level:** High (Mudança estrutural no fluxo de autenticação e navegação principal).
