# Project Context — ImNotMedical (Zello)

## Convenções Estabelecidas

### 1. Componente `<Button>` Unificado
- **Local:** `apps/frontend/src/components/common/Button.tsx`
- **Regra:** Todos os botões de ação devem usar este componente.
- **Padrão:** `type="button"` por default (evita submissão automática pelo Enter).
- **Variantes:** `primary` (default), `secondary`, `danger`, `ghost`.

### 2. UTC Global no Backend
- **Regra:** Todas as datas são armazenadas e manipuladas em UTC puro no banco de dados e na lógica de negócio.
- **Formatação:** A conversão para fuso horário local ocorre apenas na camada de UI (frontend) via `Intl.DateTimeFormat` ou `toLocaleDateString`.
- **Proibido:** Uso de `Intl.DateTimeFormat` com timezone no backend para computação de lógica de negócio.

### 3. Erros 404 Unificados para Ownership (Prevenção de ID Leaking)
- **Regra:** Quando um usuário acessa um recurso por ID que não existe ou que pertence a outro usuário, o backend DEVE retornar `404 Not Found` com a mesma mensagem genérica.
- **Proibido:** Usar `403 Forbidden` para diferenciar "recurso existe mas não é seu" de "recurso não existe", pois isso permite enumeração de IDs.
- **Padrão:** `throw new NotFoundException('Consulta não encontrada.')`.

### 4. Transações com Lock Concorrente (`runInTransactionWithLock`)
- **Local:** `apps/backend/src/prisma/prisma.service.ts`
- **Regra:** Toda operação que lê e modifica o status de um `Appointment` deve usar `runInTransactionWithLock(appointmentId, callback)`.
- **Mecanismo:** Executa `SELECT id FROM "Appointment" WHERE id = $1 FOR UPDATE` dentro de uma transação Prisma antes de executar a lógica de negócio.
- **Motivo:** Previne condições de corrida TOCTOU em transições de status concorrentes.

### 5. Enum Compartilhado `ConsultationStatus`
- **Local:** `packages/shared/src/enums/consultation-status.ts`
- **Regra:** Todas as comparações e atribuições de status de consulta no frontend e backend devem usar `ConsultationStatus` importado de `@imnotmedical/shared`.
- **Proibido:** Strings mágicas como `'EM_ESPERA'` ou `'AGENDADA'` diretamente no código.

### 6. Persistência de Preferências de Mídia
- **Mecanismo:** `sessionStorage` com chaves indexadas por ID da consulta.
- **Chaves:** `media-prefs-${appointmentId}` (JSON: `{ videoEnabled, audioEnabled }`), `device-check-passed-${appointmentId}` (flag booleano).
- **Ciclo de vida:** Persistem durante a sessão do navegador. Consumidas na tela de chamada de vídeo (Epic 4).
