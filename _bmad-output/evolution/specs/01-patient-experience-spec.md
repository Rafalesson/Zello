# Jornada do Paciente (Vitrine & Dashboard) — Update Specification

## Change Summary
Redesign completo da experiência do paciente em duas frentes: a criação de uma Vitrine Aberta otimizada para SEO e conversão (sem exigência de login para descoberta), e a transformação do Dashboard Privado de um grid estático de botões para uma Timeline Proativa focada no "Next Best Action".

## Before
- O paciente só visualizava valor ou interagia com o sistema após um login obrigatório (barreira de conversão).
- O dashboard pós-login (`/paciente/dashboard`) consistia em 5 cards/botões genéricos (Agendar, Minhas Consultas, Receitas, etc.), exigindo navegação extra para descobrir o status atual da sua saúde ou das próximas consultas.
- O design transmitia uma estética puramente administrativa e "amadora".

## After
- **A Vitrine (`/medicos`):** Uma rota pública com uma hero section chamativa, barra de busca inteligente (por dor ou especialidade) e cards de médicos exibindo foto, avaliação, especialidades e os próximos 3 horários disponíveis inline.
- **Login Contextual:** Um modal fluído que intercepta a ação apenas quando o paciente clica no horário desejado no card do médico, garantindo retenção de intenção ("frictionless").
- **Dashboard Proativo (`/paciente/dashboard`):** Uma interface em timeline. No topo, um "Hero Card" dinâmico alerta se existe uma consulta nas próximas 48h. Ações secundárias viram "pílulas" minimalistas, seguidas de um "Feed de Saúde" (histórico recente). O visual adota tons calmos (saúde), tipografia forte e muito white space, garantindo o visual *premium SaaS*.

## Components

1. **`DoctorPublicCard` (Novo/Atualizado)**
   - **Propriedades:** Exibe `avatar`, `name`, `specialty`, `rating` (estrelas), e um mini-carrossel de `availableSlots`.
   - **Comportamento:** Ao clicar em um horário, verifica autenticação. Se deslogado, abre o `AuthContextModal`.

2. **`AuthContextModal` (Novo)**
   - **Propriedades:** Recebe o contexto (ex: `selectedSlot`, `doctorId`).
   - **Comportamento:** Um drawer/modal elegante para login/cadastro. Após o sucesso, redireciona para a tela de confirmação (`/paciente/consultas/nova` ou fluxo equivalente) com o slot já selecionado.

3. **`DashboardProactiveHero` (Novo)**
   - **Propriedades:** Recebe `nextAppointment`.
   - **Comportamento:** Se `nextAppointment` existe, mostra um banner de aviso (ex: "Sua próxima consulta é hoje às 14:00") com botão primário para a ação (sala virtual/cancelar). Se for nulo, mostra um banner educacional "O que precisa hoje?" com barra de busca.

4. **`DashboardActionPills` (Novo)**
   - **Propriedades:** Lista de links secundários (Atestados, Receitas, Histórico).
   - **Comportamento:** Substitui os atuais cards gigantes do dashboard por pílulas pequenas (ícone + texto) fixadas abaixo do Hero.

## Responsive Behavior
- **Vitrine:** A barra de busca fica compacta. Os horários dentro do `DoctorPublicCard` transformam-se em um carrossel horizontal em mobile (swipeable) para não quebrar o layout vertical.
- **Dashboard:** O `DashboardProactiveHero` ocupa 100% da largura em mobile. As `DashboardActionPills` viram um grid 2x2.

## Acceptance Criteria
1. O usuário deslogado deve conseguir acessar a rota `/medicos` e ver a lista de médicos e horários disponíveis.
2. Ao clicar em um horário na vitrine sem estar logado, o modal de autenticação deve abrir em vez de redirecionar bruscamente, mantendo o contexto de agendamento.
3. Ao logar, a tela `/paciente/dashboard` deve obrigatoriamente exibir a próxima consulta em destaque (se houver alguma marcada para o futuro).
4. O grid de botões estáticos antigo do `/paciente/dashboard` não deve mais existir.
