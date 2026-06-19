# Product Evolution: Patient Experience Analysis

## 1. Product Snapshot (Current State)
O fluxo atual do paciente no Epic 2 estava estruturado em três momentos principais, com forte dependência de um login prévio para qualquer ação de valor:
- **A Descoberta (`/medicos`):** Busca e listagem de médicos.
- **A Decisão e Agendamento (`/medico/[id]`):** Perfil público e componente de agendamento (`booking-widget`).
- **A Gestão (`/paciente/dashboard`):** Painel utilitário baseado em um grid de botões estáticos ("Agendar", "Minhas Consultas", "Atestados", etc.), sem hierarquia orientada a ação imediata.

**Diagnóstico:** A interface atual do dashboard se assemelha a um sistema administrativo (amador para o B2C), carecendo de fluidez, confiança e acolhimento. A obrigatoriedade de login antes de agregar valor (explorar a vitrine de médicos) adiciona fricção desnecessária à jornada.

## 2. Improvement Targets & Market Context (Benchmarking)
A pesquisa com os principais players do mercado de healthtechs (Doctoralia, Zenklub, Alice, Amparo Saúde) revelou padrões claros de UX:
1. **"Vitrine Aberta" (Silent Search):** A jornada começa na busca anônima. A plataforma exibe perfis com prova social (avaliações) e disponibilidade imediata. O login ocorre apenas no momento de conversão (agendar).
2. **"Paradoxo da Escolha":** Redução de ansiedade guiando a escolha por dores/necessidades (não apenas especialidades técnicas) e utilizando design limpo e confiável.
3. **"Gestor de Saúde" vs "Menu de Botões":** Dashboards modernos abandonaram grids genéricos em favor de uma *Timeline* ou *Feed Proativo* focado no "Next Best Action" (ex: "Sua consulta é amanhã às 14h [Entrar]").

## 3. Selected Target: The Vitrine-to-Dashboard Journey
Nosso alvo central para a Evolução do Produto é o redesign holístico da jornada do paciente, dividida em três pilares integrados:
1. **A Vitrine Pública:** Acesso aberto à listagem e perfis médicos, otimizados para confiança e clareza de horários.
2. **Login Contextual (Frictionless):** Funil de conversão natural. O paciente escolhe o horário -> loga/cadastra -> confirmação.
3. **O Novo Dashboard Proativo:** Substituição dos botões estáticos por um painel orientado ao contexto ("Próximo Passo", lembretes e histórico imediato).
