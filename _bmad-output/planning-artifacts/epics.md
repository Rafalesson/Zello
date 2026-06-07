---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments: ["prd.md", "architecture.md", "ux-design-specification.md"]
---

# ImNotMedical - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ImNotMedical, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1:** Paciente pode se cadastrar com dados pessoais básicos (nome, email, senha)
- **FR2:** Médico pode se cadastrar informando CRM, especialidade, bio e foto de perfil
- **FR3:** Usuário autenticado pode fazer login e logout na plataforma
- **FR4:** Usuário pode solicitar recuperação de senha via email
- **FR5:** Sistema restringe acesso a funcionalidades baseado na role do usuário (patient, doctor, admin)
- **FR6:** Admin pode aprovar ou rejeitar cadastro de médicos pendentes
- **FR7:** Admin pode ativar ou desativar contas de usuários
- **FR8:** Médico pode configurar sua agenda de disponibilidade com slots de horário
- **FR9:** Paciente pode buscar médicos disponíveis por especialidade
- **FR10:** Paciente pode visualizar o perfil público do médico (foto, nome, CRM, especialidade, bio)
- **FR11:** Paciente pode agendar uma consulta em um slot disponível do médico
- **FR12:** Paciente pode cancelar uma consulta agendada
- **FR13:** Médico pode visualizar suas consultas agendadas no dashboard
- **FR14:** Sistema envia notificação por email de confirmação e lembrete de consulta
- **FR15:** Paciente pode preencher questionário de pré-triagem com informações clínicas antes da consulta
- **FR16:** Paciente deve aceitar termo de consentimento digital antes de acessar a sala de consulta
- **FR17:** Paciente pode verificar funcionamento de câmera e microfone antes de entrar na sala de espera
- **FR18:** Paciente pode entrar na sala de espera virtual e aguardar o médico
- **FR19:** Paciente pode visualizar o status de sua posição na sala de espera
- **FR20:** Médico pode visualizar a pré-triagem do paciente antes de iniciar a consulta
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
- **FR33:** Médico pode registrar prontuário simplificado da consulta (anamnese, dados clínicos, conduta, CID-10)
- **FR34:** Médico pode buscar códigos CID-10 por nome ou código durante o registro do prontuário
- **FR35:** Médico pode emitir prescrição digital para o paciente
- **FR36:** Médico pode emitir atestado médico para o paciente
- **FR37:** Paciente pode acessar documentos recebidos (prescrições, atestados) no seu dashboard
- **FR38:** Documentos gerados possuem QRCode de validação
- **FR39:** Admin pode visualizar métricas operacionais da plataforma (total de consultas, taxa de conclusão, usuários ativos)
- **FR40:** Admin pode visualizar logs de consultas com status e timestamps
- **FR41:** Admin pode alterar manualmente o status de uma consulta
- **FR42:** Admin pode disparar manualmente o processo de limpeza de dados expirados
- **FR43:** Sistema remove automaticamente documentos com mais de 100 dias (banco + Cloudinary)
- **FR44:** Todas as páginas exibem disclaimer acadêmico no footer
- **FR45:** Plataforma disponibiliza página de política de privacidade acessível publicamente
- **FR46:** Sistema informa o usuário sobre incompatibilidade de browser ou falta de permissão de dispositivos antes de tentar acessar a videochamada

### NonFunctional Requirements

- **NFR1:** Interface responde a ações do usuário sem lag perceptível (< 200ms)
- **NFR2:** Páginas SSR (login, perfil, privacidade) carregam com FCP < 2s e LCP < 3s
- **NFR3:** TTI das páginas < 4s
- **NFR4:** Bundle JavaScript inicial < 200KB gzipped
- **NFR5:** Conexão WebRTC P2P estabelecida em < 3 segundos após ambos estarem na sala
- **NFR6:** Qualidade WebRTC depende exclusivamente da rede (sem latência artificial)
- **NFR7:** Busca CID-10 retorna resultados em < 500ms
- **NFR8:** Todas as comunicações utilizam HTTPS (TLS 1.2+)
- **NFR9:** Tokens JWT possuem tempo de expiração definido e suportam refresh
- **NFR10:** Senhas com hash seguro (bcrypt salt ≥ 10)
- **NFR11:** Dados em repouso criptografados via AES-256 (Supabase)
- **NFR12:** Endpoints protegidos rejeitam requisições sem token válido (401)
- **NFR13:** Endpoints restritos por role rejeitam acesso não autorizado (403)
- **NFR14:** Dados removidos após 100 dias (retenção)
- **NFR15:** Loading state elegante durante cold start do backend (~30s)
- **NFR16:** Tentativa de reconexão automática (ICE restart) antes de mostrar erro em queda WebRTC
- **NFR17:** Estado parcial (prontuário, chat) preservado em caso de desconexão
- **NFR18:** Falha no envio de email não bloqueia o fluxo principal
- **NFR19:** Falha no Cloudinary tratada com mensagem ao usuário
- **NFR20:** Contraste de texto mínimo 4.5:1 (WCAG AA)
- **NFR21:** Elementos interativos acessíveis via navegação por teclado
- **NFR22:** Inputs com labels associados e imagens com alt-text
- **NFR23:** Botões de ícone com aria-label descritivo
- **NFR24:** Skip navigation link disponível em todas as páginas
- **NFR25:** Upload de perfil utiliza Cloudinary (max 5MB)
- **NFR26:** Geração de PDF com QRCode de validação com URL pública
- **NFR27:** TURN server fallback (Metered.ca) quando conexão P2P falha
- **NFR28:** Envio de emails via SMTP gratuito
- **NFR29:** TypeScript em modo strict (frontend e backend)
- **NFR30:** ESLint com zero warnings/errors
- **NFR31:** Cada service novo possui teste happy/error path
- **NFR32:** Commits na main passam por CI pipeline (lint + build + test)
- **NFR33:** Volume PostgreSQL < 400MB

### Additional Requirements

- **Starter Template / Migration (Sprint -1):** Migrar para Next.js 16, React 19, e renomear monorepo (`imnotmedical`). **CRÍTICO: Validar middleware de auth após atualização e antes do Design System**.
- **Monorepo Structure:** Implementar pacote `@imnotmedical/shared` (composite TypeScript) para eventos Socket.IO, payloads, DTOs e enums (como `DomainErrorCode` e `ConsultationStatus`).
- **Socket.IO:** Handshake autenticado via JWT (`WsJwtGuard`). Gateway com single namespace, rooms isoladas por consulta `consultation:{id}`, estratégia "reconnect-with-fresh-token".
- **State Machine:** Implementação server-authoritative de estado da consulta (agendada, em_espera, em_andamento, etc.) declarativa em `packages/shared`.
- **Render Strategy:** Componentes híbridos App Router (Login/Public = RSC; Dashboards/Consulta = CSR; Perfil Médico = RSC+PPR).
- **Domain Exceptions:** Padronizar filtros de exceção globais via `DomainErrorCode` (eliminando strings hardcoded).
- **Scheduled Jobs:** Configurar GitHub Actions workflow agendado para disparar limpeza `POST /admin/cleanup/run` contornando inatividade do Render.

### UX Design Requirements

- **UX-DR1:** Implementar fluxo de transição da "Sala de Espera" para a "Chamada de Vídeo" em menos de 3s através de "Pre-warmed P2P" (iniciar sinalização em background).
- **UX-DR2:** Construir "Device Check-in Modal": Tela obrigatória pre-flight exibindo preview de vídeo e feedback de áudio em tempo real.
- **UX-DR3:** Construir "Split-Screen Cockpit": Layout de vídeo assimétrico (60% vídeo / 40% formulário) garantindo ausência de re-renders no vídeo ao preencher o prontuário. (Desktop-first; fallback mobile sticky video).
- **UX-DR4:** Configurar "Tematização Clínica Boutique": Tailwind com tokens para Off-white (Slate 50), Dark Blue (Slate 800) e Teal 600. Alternância nativa para Dark Mode.
- **UX-DR5:** Implementar "Loading Narrativo": Skeletons animados com ciclagens de status técnicos amigáveis durante long-polling/cold start.
- **UX-DR6:** Criar "Calendar Strip" no Frontend: Seletor horizontal rolável de slots (`date-fns` + CSS snap), minimizando uso de bibliotecas de calendário pesadas.
- **UX-DR7:** Adotar padrões "Empathetic Errors": Erradicar modals bloqueantes durante oscilações de rede; usar Inline Banners e Toasts não-bloqueantes.
- **UX-DR8:** Auditar e forçar Focus Rings (`ring-2 ring-teal-500`) em componentes interativos permitindo preenchimento de prontuários Tab-Only.

### FR Coverage Map

- **FR1:** Epic 1 - Cadastro de paciente
- **FR2:** Epic 1 - Cadastro de médico
- **FR3:** Epic 1 - Login/logout
- **FR4:** Epic 1 - Recuperação de senha
- **FR5:** Epic 1 - RBAC / restrições de acesso
- **FR6:** Epic 1 - Aprovação de médicos pendentes
- **FR7:** Epic 1 - Ativar/desativar contas
- **FR8:** Epic 2 - Configurar agenda de disponibilidade
- **FR9:** Epic 2 - Buscar médicos
- **FR10:** Epic 1 - Perfil público do médico
- **FR11:** Epic 2 - Agendar consulta
- **FR12:** Epic 2 - Cancelar consulta
- **FR13:** Epic 2 - Médico visualizar agenda
- **FR14:** Epic 2 - Notificação por email
- **FR15:** Epic 3 - Preencher pré-triagem
- **FR16:** Epic 3 - Termo de consentimento
- **FR17:** Epic 3 - Verificação de dispositivos
- **FR18:** Epic 3 - Entrar na sala de espera
- **FR19:** Epic 3 - Status na sala de espera
- **FR20:** Epic 4 - Médico visualiza pré-triagem
- **FR21:** Epic 4 - State machine (estados da consulta)
- **FR22:** Epic 4 - Médico admite paciente
- **FR23:** Epic 4 - Notificação real-time de entrada
- **FR24:** Epic 4 - Sinalização P2P real-time
- **FR25:** Epic 4 - Videochamada P2P
- **FR26:** Epic 4 - Chat de texto
- **FR27:** Epic 4 - Controle de microfone
- **FR28:** Epic 4 - Controle de câmera
- **FR29:** Epic 4 - Reconexão automática
- **FR30:** Epic 4 - Feedback visual de conexão
- **FR31:** Epic 4 - Timeout/reagendar
- **FR32:** Epic 4 - Encerrar consulta
- **FR33:** Epic 5 - Registrar prontuário
- **FR34:** Epic 5 - Busca CID-10
- **FR35:** Epic 5 - Prescrição digital
- **FR36:** Epic 5 - Atestado médico
- **FR37:** Epic 5 - Acesso a documentos recebidos
- **FR38:** Epic 5 - Validação por QRCode
- **FR39:** Epic 6 - Dashboard admin métricas
- **FR40:** Epic 6 - Logs de consultas
- **FR41:** Epic 6 - Admin alterar status manualmente
- **FR42:** Epic 6 - Disparar limpeza manual
- **FR43:** Epic 6 - Limpeza automática > 100 dias
- **FR44:** Epic 1 - Disclaimer acadêmico (global)
- **FR45:** Epic 1 - Política de privacidade
- **FR46:** Epic 3 - Incompatibilidade browser/devices

## Epic List

### Epic 1: Identity & Profiles (Onboarding & Acesso)
Pacientes e médicos podem criar contas, gerenciar perfis e acessar a plataforma com segurança, enquanto admins aprovam credenciais médicas. (Estabelece a fundação de confiança).
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR10, FR44, FR45

### Epic 2: Scheduling & Availability (Agendamento de Consultas)
Médicos podem publicar suas agendas e pacientes podem buscar especialistas e marcar horários, estabelecendo a conexão inicial no marketplace.
**FRs covered:** FR8, FR9, FR11, FR12, FR13, FR14

### Epic 3: Patient Pre-Consultation (Check-in & Preparação)
Pacientes podem se preparar para a consulta preenchendo a triagem, aceitando os termos legais e testando seus dispositivos antes de entrar na sala de espera (redução de atrito técnico e compliance).
**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR46

### Epic 4: Teleconsultation Cockpit (Vídeo & Chat em Tempo Real)
Médicos e pacientes podem se comunicar perfeitamente por vídeo P2P e chat dentro da sala virtual, com reconexão automática e gestão de estado (a experiência central do produto).
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32

### Epic 5: Post-Consultation Records (Prontuário & Prescrição Digital)
Médicos podem registrar o atendimento clínico de forma eficiente e emitir documentos oficiais com QRCode, que os pacientes acessam imediatamente após a consulta.
**FRs covered:** FR33, FR34, FR35, FR36, FR37, FR38

### Epic 6: Platform Operations & Governance (Painel Admin)
Administradores podem monitorar a saúde da plataforma, auditar logs de consulta, forçar transições de estado paradas e garantir o expurgo de dados pela LGPD.
**FRs covered:** FR39, FR40, FR41, FR42, FR43

## Epic 1: Identity & Profiles (Onboarding & Acesso)

Pacientes e médicos podem criar contas, gerenciar perfis e acessar a plataforma com segurança, enquanto admins aprovam credenciais médicas. Estabelece a fundação de confiança e a base arquitetural (Sprint -1).

### Story 1.1: Project Setup, Migration & Design System Base

As a Developer,
I want to migrate the project to Next.js 16, setup the monorepo workspace, and configure the base Design Tokens,
So that the foundational architecture and visual consistency (UX-DR4) are established for all future features.

**Acceptance Criteria:**

**Given** the existing NestJS/Next.js 14 brownfield repository
**When** the migration process is executed
**Then** the project runs on Next.js 16 and React 19 without critical build errors
**And** a new `@imnotmedical/shared` package is created with TypeScript composite enabled
**And** the `DomainErrorCode` enum is available in the shared package
**And** Tailwind is configured with the Slate 50, Slate 800, and Teal 600 design tokens supporting Dark Mode native switching.

### Story 1.2: Base Layout & Compliance Pages

As a Patient,
I want to be able to view the platform's academic disclaimer and privacy policy,
So that I understand the legal and academic nature of the service before using it.

**Acceptance Criteria:**

**Given** the user is navigating any page on the platform
**When** they scroll to the footer
**Then** an academic disclaimer is prominently displayed (FR44)
**And** there is a link to the Privacy Policy page

**Given** a user navigates to the privacy policy link
**When** the page loads
**Then** the full static privacy policy is displayed with proper semantic HTML and styling (FR45).

### Story 1.3: User Registration & Authentication Core

As a Patient,
I want to register for an account and log in securely,
So that I can access the platform's features using my personal identity.

**Acceptance Criteria:**

**Given** a new user on the registration page
**When** they submit valid name, email, and password
**Then** their account is created with the role `patient` and password hashed via bcrypt (FR1, NFR10)
**And** they are logged in automatically and redirected to their dashboard

**Given** a user attempting to log in
**When** they provide valid credentials
**Then** a JWT token is generated and returned, containing user ID and role, designed to be compatible with future Socket.IO usage (FR3, NFR9)

**Given** an unauthorized user
**When** they attempt to access a protected route
**Then** they are redirected to the login page (FR5, NFR12).

### Story 1.4: Doctor Registration & Onboarding

As a Doctor,
I want to register by providing my professional details and profile picture,
So that I can create a professional profile and apply to join the platform.

**Acceptance Criteria:**

**Given** a doctor on the professional registration page
**When** they submit their CRM, specialty, bio, and profile picture
**Then** the profile picture is uploaded to Cloudinary (NFR25)
**And** their account is created with role `doctor` and status `pending` (FR2)

**Given** a doctor submitting registration with a network failure reaching Cloudinary
**When** the upload fails
**Then** an empathetic error message is shown, the form state is preserved, and they can try again (NFR19, UX-DR7).

### Story 1.5: Admin Account Governance

As an Administrator,
I want to view and manage user accounts and doctor applications,
So that I can ensure only qualified professionals join the platform and maintain safety.

**Acceptance Criteria:**

**Given** an admin in the governance dashboard
**When** they view the list of pending doctors
**Then** they can see the CRM, details, and approve or reject the application (FR6)

**Given** an admin managing an existing user
**When** they click to deactivate the account
**Then** the account is marked inactive and the user can no longer log in (FR7, NFR13).

### Story 1.6: Public Doctor Profile (SSR)

As a Patient,
I want to view a doctor's public profile including their CRM and specialty,
So that I can verify their credentials before booking a consultation.

**Acceptance Criteria:**

**Given** a patient navigating to a doctor's profile URL
**When** the page loads
**Then** it displays the doctor's photo, name, CRM, specialty, and bio (FR10)
**And** the page loads fast (FCP < 2s) utilizing Next.js server-side rendering or PPR (NFR2).

### Story 1.7: Password Recovery Flow

As a User,
I want to request a password reset via email,
So that I can regain access to my account if I forget my password.

**Acceptance Criteria:**

**Given** a user on the forgot password page
**When** they submit their registered email address
**Then** a secure recovery token is generated and a reset link is emailed (FR4, NFR28)

**Given** the email service is temporarily unavailable
**When** the user submits the reset request
**Then** the system logs the error, shows a graceful fallback message, and does not crash the application (NFR18).

## Epic 2: Scheduling & Availability (Agendamento de Consultas)

Médicos podem publicar suas agendas e pacientes podem buscar especialistas e marcar horários, estabelecendo a conexão inicial no marketplace.

### Story 2.1: Doctor Availability Setup

As a Doctor,
I want to configure my available time slots for consultations,
So that patients know when they can book appointments with me.

**Acceptance Criteria:**

**Given** a doctor is logged into their dashboard
**When** they navigate to the availability settings
**Then** they can define their working days and hours (FR8)
**And** the slots are saved in the database associated with the doctor's profile.

### Story 2.2: Doctor Search & Discovery

As a Patient,
I want to search for doctors by specialty,
So that I can find a suitable professional for my needs.

**Acceptance Criteria:**

**Given** a patient on the search page
**When** they filter by a specific medical specialty
**Then** a list of available doctors matching that specialty is displayed (FR9)
**And** the list includes their photo, name, CRM, and next available date.

### Story 2.3: Appointment Booking with Calendar Strip

As a Patient,
I want to select an available time slot and book a consultation,
So that my appointment is confirmed with the doctor.

**Acceptance Criteria:**

**Given** a patient viewing a doctor's profile
**When** they use the Calendar Strip (horizontal scrollable date selector) to pick a date (UX-DR6)
**Then** the available time slots for that date are displayed
**And** when they confirm booking a specific slot, the consultation is created in the database with status `agendada` (FR11, FR21).

### Story 2.4: Booking Confirmation Notifications

As a System,
I want to send email notifications upon booking confirmation,
So that both patient and doctor are informed of the upcoming consultation.

**Acceptance Criteria:**

**Given** a newly booked consultation
**When** the booking transaction is successful
**Then** the system sends a confirmation email to the patient and the doctor (FR14)
**And** if the email service fails temporarily, the consultation booking is still successful and the failure is logged (NFR18).

### Story 2.5: Doctor's Appointment Dashboard

As a Doctor,
I want to view a list of my upcoming consultations,
So that I can organize my day and prepare for my patients.

**Acceptance Criteria:**

**Given** a doctor viewing their dashboard
**When** the page loads
**Then** they see a chronological list of their upcoming appointments (FR13)
**And** each entry shows the patient's name, appointment time, and current status.

### Story 2.6: Appointment Cancellation Flow

As a Patient,
I want to cancel an existing appointment before it starts,
So that I can free up the slot if I am unable to attend.

**Acceptance Criteria:**

**Given** a patient viewing their upcoming appointments
**When** they click "Cancel" on an appointment
**Then** the status of the consultation is updated to `cancelada` (FR12, FR21)
**And** the time slot becomes available again for other patients to book.

## Epic 3: Patient Pre-Consultation (Check-in & Preparação)

Pacientes podem se preparar para a consulta preenchendo a triagem, aceitando os termos legais e testando seus dispositivos antes de entrar na sala de espera (redução de atrito técnico e compliance).

### Story 3.1: Pre-Consultation Triage Questionnaire

As a Patient,
I want to fill out a brief triage questionnaire regarding my symptoms,
So that the doctor has clinical context before the consultation begins.

**Acceptance Criteria:**

**Given** a patient about to enter their consultation session
**When** they start the check-in flow
**Then** they are presented with a form to describe symptoms and primary complaints (FR15)
**And** this data is securely saved and linked to the specific consultation.

### Story 3.2: Digital Consent Form & LGPD

As a Patient,
I want to read and accept the telemedicine consent form,
So that I understand my rights and the legal boundaries of remote care.

**Acceptance Criteria:**

**Given** a patient proceeding past the triage step
**When** they are presented with the digital consent and LGPD terms
**Then** they must explicitly accept the terms to proceed (FR16)
**And** the acceptance is recorded with a timestamp in the database for compliance.

### Story 3.3: Device Check-in Modal

As a Patient,
I want to test my camera and microphone before the consultation,
So that I know my hardware is working and the doctor will be able to see and hear me.

**Acceptance Criteria:**

**Given** a patient proceeding past the consent step
**When** they reach the device check-in modal
**Then** the browser requests camera and microphone permissions
**And** they see a real-time preview of their video and an audio level indicator (UX-DR2, FR17)

**Given** the patient denies permission or their browser is incompatible
**When** the check fails
**Then** they see a clear error message explaining how to enable devices and cannot proceed to the waiting room (FR46).

### Story 3.4: Virtual Waiting Room & Dynamic Status

As a Patient,
I want to enter a virtual waiting room and see my status,
So that I know my appointment is ready and I just need to wait for the doctor.

**Acceptance Criteria:**

**Given** a patient has successfully completed the device check-in
**When** they enter the waiting room
**Then** the consultation status updates to `em_espera`
**And** they see a dynamic loading UI ("Loading Narrativo") assuring them the connection is established (UX-DR5, FR18)
**And** they can see their queue status or an indication that the doctor has been notified (FR19).

## Epic 4: Teleconsultation Cockpit (Vídeo & Chat em Tempo Real)

Médicos e pacientes podem se comunicar perfeitamente por vídeo P2P e chat dentro da sala virtual, com reconexão automática e gestão de estado (a experiência central do produto).

### Story 4.1: Consultation State Machine & Socket Rooms

As a Developer,
I want to implement the WebSocket gateway and the consultation state machine,
So that both frontend and backend share a reliable and synchronized state of the consultation flow.

**Acceptance Criteria:**

**Given** a consultation is transitioning through its lifecycle
**When** state changes occur (e.g., agendada -> em_espera -> em_andamento)
**Then** the state machine logic in `@imnotmedical/shared` enforces valid transitions (FR21)
**And** the WebSocket gateway isolates communication by assigning clients to specific consultation `rooms` (FR24)
**And** the connections are authenticated securely using `WsJwtGuard`.

### Story 4.2: Pre-warmed P2P & Doctor Admission

As a Doctor,
I want to review the patient's triage and admit them instantly,
So that the consultation begins smoothly without long loading times.

**Acceptance Criteria:**

**Given** a patient is in the virtual waiting room
**When** the socket connection is established
**Then** the system initiates a "pre-warmed" P2P signaling process silently in the background (UX-DR1)

**Given** the doctor is reviewing the patient's pre-triage data (FR20)
**When** the doctor clicks "Admitir Paciente"
**Then** the patient receives a real-time socket notification (FR23)
**And** both parties are transitioned to the `em_andamento` state instantly (FR22).

### Story 4.3: Real-Time Video & Audio Stream Core

As a User (Doctor/Patient),
I want to communicate via a stable WebRTC video stream with media controls,
So that we can conduct the remote consultation effectively.

**Acceptance Criteria:**

**Given** both parties are in the active consultation state
**When** the WebRTC handshake completes
**Then** a stable P2P video and audio connection is established (FR25)

**Given** a user is in an active video call
**When** they interact with the media controls
**Then** they can independently mute/unmute their microphone (FR27) and turn their camera on/off (FR28).

### Story 4.4: Split-Screen Cockpit Layout

As a Doctor,
I want a unified workspace interface combining the video feed and the clinical form,
So that I can type notes without the video feed interrupting or stuttering.

**Acceptance Criteria:**

**Given** the doctor is in the active consultation
**When** the cockpit layout renders
**Then** it displays an asymmetric split-screen (60% video, 40% clinical form) (UX-DR3)

**Given** the doctor is typing in the clinical form
**When** the form state updates
**Then** the UI state management (e.g., using Zustand or strict React Context/memoization) ensures the WebRTC video component does NOT re-render or stutter.

### Story 4.5: Real-Time Text Chat

As a User (Doctor/Patient),
I want to exchange text messages during the video call,
So that we can share written information (like names of medications) easily.

**Acceptance Criteria:**

**Given** an active WebRTC session
**When** a user sends a text message via the chat interface
**Then** the message is transmitted instantly via WebRTC Data Channels (or Socket.IO fallback) to the other participant (FR26)
**And** the message appears in the chat log UI for both users.

### Story 4.6: Resiliency & Empathetic Feedback

As a User,
I want the system to handle network fluctuations gracefully,
So that I am not abruptly kicked out or subjected to confusing technical errors.

**Acceptance Criteria:**

**Given** a temporary network drop during the consultation
**When** the WebRTC connection is lost
**Then** the system automatically attempts an ICE restart to reconnect (FR29)
**And** displays a non-blocking empathetic Toast/Banner showing "Reconectando..." instead of a modal alert (FR30, UX-DR7).

### Story 4.7: Consultation Lifecycle Terminations

As a Doctor,
I want to be able to end the consultation, or have it time out if I don't show up,
So that the consultation cycle can be properly closed or rescheduled.

**Acceptance Criteria:**

**Given** an active consultation
**When** the doctor clicks to end the call
**Then** the WebRTC connection is torn down safely, cameras are released, and the state becomes `concluída` (FR32)

**Given** a patient waiting in the virtual waiting room
**When** the doctor fails to join within the predefined timeout period
**Then** the system prompts the patient with an option to reschedule, changing state to `não_realizada` (FR31).

## Epic 5: Post-Consultation Records (Prontuário & Prescrição Digital)

Médicos podem registrar o atendimento clínico de forma eficiente e emitir documentos oficiais com QRCode, que os pacientes acessam imediatamente após a consulta.

### Story 5.1: Clinical Record Form & CID-10 Search

As a Doctor,
I want to fill out the patient's clinical record and search for CID-10 codes,
So that I can document the consultation findings and diagnosis efficiently.

**Acceptance Criteria:**

**Given** a doctor in the consultation view
**When** they interact with the clinical record form
**Then** the form allows input of anamnesis, clinical data, and medical conduct (FR33)
**And** all interactive fields are fully accessible via keyboard navigation (Tab-only) with clear focus rings (UX-DR8)

**Given** the doctor is searching for a diagnosis code
**When** they type a term or code in the CID-10 search field
**Then** the results are returned in less than 500ms (NFR7, FR34).

### Story 5.2: Digital Prescription Generation

As a Doctor,
I want to issue a digital prescription for my patient,
So that they can purchase necessary medications with a valid document.

**Acceptance Criteria:**

**Given** the doctor has completed the consultation
**When** they fill out and submit the prescription form
**Then** a secure PDF document is generated containing the prescription details (FR35)
**And** the PDF includes a verifiable QRCode pointing to a public validation URL (FR38, NFR26).

### Story 5.3: Medical Certificate Generation

As a Doctor,
I want to issue a medical certificate for the patient,
So that they can justify their absence from work or school.

**Acceptance Criteria:**

**Given** the doctor has completed the consultation
**When** they fill out and submit the certificate form (specifying days off and CID if authorized)
**Then** a secure PDF document is generated containing the certificate details (FR36)
**And** the PDF includes a verifiable QRCode pointing to a public validation URL (FR38, NFR26).

### Story 5.4: Patient Documents Dashboard

As a Patient,
I want to access the documents issued during my consultation,
So that I can download my prescriptions and medical certificates.

**Acceptance Criteria:**

**Given** a patient looking at their completed consultations
**When** they navigate to the documents section
**Then** they can view a list of all documents (prescriptions, certificates) issued to them (FR37)
**And** they can download the PDF files to their local device.

## Epic 6: Platform Operations & Governance (Painel Admin)

Administradores podem monitorar a saúde da plataforma, auditar logs de consulta, forçar transições de estado paradas e garantir o expurgo de dados pela LGPD.

### Story 6.1: Operational Metrics Dashboard

As an Administrator,
I want to view operational metrics for the platform,
So that I can monitor the health and usage of the telemedicine service.

**Acceptance Criteria:**

**Given** an admin is viewing their dashboard
**When** the metrics section loads
**Then** it displays the total number of consultations, the completion rate, and the number of active users (FR39).

### Story 6.2: Consultation Audit Logs

As an Administrator,
I want to view detailed logs of consultation state changes,
So that I can audit technical issues or resolve disputes between users.

**Acceptance Criteria:**

**Given** an admin is investigating a specific consultation
**When** they view the consultation details
**Then** they can see a chronological log of all state transitions (e.g., waiting, in progress, completed) with exact timestamps (FR40).

### Story 6.3: Manual Consultation State Override

As an Administrator,
I want to manually change the status of a consultation,
So that I can fix consultations that are stuck in an invalid state due to network drops or user abandonment.

**Acceptance Criteria:**

**Given** an admin viewing a consultation's details
**When** they select a new state from the manual override controls
**Then** the consultation status is forcefully updated in the database (FR41)
**And** an audit log entry is created indicating the manual override by the admin.

### Story 6.4: Automated Data Expiration Cleanup (LGPD)

As a System/Administrator,
I want to permanently delete sensitive documents older than 100 days,
So that the platform complies with data retention policies (LGPD).

**Acceptance Criteria:**

**Given** documents (prescriptions, certificates, triages) exist in the database that are older than 100 days
**When** the cleanup endpoint (`POST /admin/cleanup/run`) is triggered
**Then** the system securely deletes these records from the PostgreSQL database (FR43, NFR14)
**And** the system deletes the associated physical files from the Cloudinary storage

**Given** the need for automated scheduling without a persistent background process
**When** a GitHub Actions workflow sends an authenticated POST request to the cleanup endpoint
**Then** the system executes the cleanup job successfully

**Given** an admin in the dashboard
**When** they click the manual cleanup trigger
**Then** the cleanup process runs immediately and returns a success report (FR42).
