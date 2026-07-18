# Story 3.5: Versionamento e Conteúdo Dinâmico do Termo de Consentimento Legal (LGPD)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como Paciente,
Eu quero ter a garantia de que a versão exata dos termos legais que estou aceitando está registrada e auditável de acordo com as normas da LGPD,
Para que meus dados sensíveis de saúde estejam protegidos sob as bases legais corretas do consentimento informado.

E como Administrador Clínico,
Eu quero gerenciar dinamicamente as versões e conteúdos dos termos de consentimento,
Para atualizar as políticas legais instantaneamente sem a necessidade de realizar novos deploys de frontend.

## Critérios de Aceitação

1. **Dado** o check-in do paciente
   **Quando** a etapa de consentimento for exibida
   **Então** o sistema deve carregar o texto legal e a versão ativa de forma dinâmica a partir do backend (ex: buscando em `GET /consent/active-terms`).
   **E** em caso de indisponibilidade do backend, a interface deve exibir um estado de erro amigável com opção de tentar novamente.

2. **Dado** a submissão do termo de consentimento
   **Quando** o paciente confirma a aceitação
   **Então** a requisição enviada ao backend deve registrar o consentimento incluindo a versão ativa aceita (`termsVersion: string`) no modelo `ConsentRecord`.
   **E** o backend deve validar se a versão fornecida pelo cliente coincide exatamente com a versão ativa atualizada no banco.

3. **Dado** o registro histórico no banco de dados
   **Quando** um consentimento antigo for consultado
   **Então** o registro do banco deve manter a integridade com a versão histórica aceita na época (evitando atualizações retroativas em registros antigos).

4. **Dado** a cobertura de qualidade do produto
   **Quando** os testes forem executados
   **Então** deve existir cobertura de testes unitários no backend (validando `ConsentService` e os endpoints do controller) e um teste de integração cobrindo a validação de versão e o ciclo completo de consentimento.

## Tarefas / Subtasks

- [x] **Tarefa 1: Atualização de Banco de Dados e Backend**
  - [x] Adicionar um novo modelo `LegalTerms` no Prisma (`apps/backend/prisma/schema.prisma`) contendo:
    ```prisma
    model LegalTerms {
      id        Int      @id @default(autoincrement())
      version   String   @unique
      content   String   @db.Text
      isActive  Boolean  @default(true)
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
    }
    ```
  - [x] Atualizar o modelo `ConsentRecord` em `apps/backend/prisma/schema.prisma` para incluir a coluna `termsVersion` do tipo `String`. Para manter compatibilidade retroativa e evitar falhas na migração de bancos existentes, configure a coluna com valor padrão temporário:
    ```prisma
    termsVersion String @default("v1.0")
    ```
  - [x] Aplicar as alterações ao banco de dados executando `npx prisma db push`.
  - [x] Atualizar o arquivo de seed (`apps/backend/prisma/seed.ts`) para incluir a criação do termo inicial (`v1.0`) contendo o texto legal que estava previamente estático no frontend (estruturado com as seções: Escopo, Limitações, Uso de Dados Sensíveis e Direitos do Paciente).
  - [x] Criar o endpoint `GET /consent/active-terms` para retornar o conteúdo do termo ativo (onde `isActive: true` - se houver mais de um, pegar o mais recente).
    *Atenção à rota:* Para evitar conflitos de rotas com o wildcard `:id` de `/appointments/:id/consent` dentro do NestJS, crie uma classe de controller separada (ex: `ConsentTermsController` com prefixo `@Controller('consent')`) ou registre-a de forma isolada na ordem adequada.
  - [x] Expandir o DTO `CreateConsentDto` (`apps/backend/src/consent/dto/create-consent.dto.ts`) para aceitar e validar a string de versionamento:
    ```typescript
    @IsString()
    @IsNotEmpty()
    termsVersion: string;
    ```
  - [x] Atualizar o endpoint `POST /appointments/:id/consent` no `ConsentController`. O backend deve validar se a `termsVersion` recebida na DTO coincide com o termo ativo no banco de dados. Caso não coincida, deve retornar uma exceção (ex: `BadRequestException` informando que os termos foram atualizados e o paciente precisa recarregar o termo novo).
  - [x] Atualizar o `ConsentService` para persistir o campo `termsVersion` no banco de dados.
  - [x] Atualizar os testes unitários do `ConsentService` (`apps/backend/src/consent/consent.service.spec.ts`) para cobrir a gravação e validação da versão ativa do termo.

- [x] **Tarefa 2: Integração de Frontend Dinâmico**
  - [x] Atualizar o componente `ConsentForm.tsx` em `apps/frontend/src/components/consultation/`.
    - [x] Realizar chamada ao endpoint `GET /consent/active-terms` no carregamento (`useEffect`).
    - [x] Exibir um indicador de carregamento (spinner/skeleton) durante a requisição dos termos.
    - [x] Renderizar o conteúdo de texto dinamicamente de forma segura. Nota: como o texto pode conter quebras de linha ou marcações, estruture o layout para interpretá-lo mantendo a elegância.
    - [x] Tratar cenários de falha na busca dos termos, exibindo uma mensagem de erro empática com um botão de "Tentar Novamente".
    - [x] Enviar a string da versão carregada no payload do `POST` (`/appointments/:id/consent`) juntamente com o sinalizador de aceite.
  - [x] Garantir conformidade com os padrões de acessibilidade WCAG AA (uso correto de `aria-` attributes, contraste textual e anéis de foco `ring-2 ring-teal-500` visíveis).

- [x] **Tarefa 3: Testes de Integração e Validação**
  - [x] Adicionar testes de integração no backend cobrindo o fluxo dinâmico de busca de termos e validação de versionamento incorreto na submissão de consentimento.

## Dev Notes

### Evitando Erro de Rota no NestJS (Wildcard Collision)
No NestJS, o controlador existente `ConsentController` está mapeado para `@Controller('appointments')` e possui a rota `@Post(':id/consent')` e `@Get(':id/consent')`.
Se você adicionar uma rota `@Get('consent/active-terms')` sob o mesmo controlador, o NestJS pode tentar combinar a string `'consent'` com o parâmetro `:id` da rota parametrizada, disparando um erro de validação (especialmente por conta do `ParseIntPipe`).
*Solução:* É altamente recomendável declarar um controlador independente para gerenciar termos gerais, como:
```typescript
@Controller('consent')
export class ConsentTermsController {
  @Get('active-terms')
  async getActiveTerms() { ... }
}
```
Não esqueça de registrar o novo controller no `consent.module.ts`.

### Segurança de Migração do Banco de Dados
Ao modificar o modelo `ConsentRecord` para adicionar `termsVersion String`, o Prisma gerará um erro em bancos de dados que já contêm dados (ambientes de teste ou produção) se o campo for obrigatório e não possuir um valor padrão. A inclusão de `@default("v1.0")` é uma proteção indispensável contra quebras de integridade operacional.

### Padrão de Legibilidade do Conteúdo
Para permitir flexibilidade ao Administrador Clínico, o campo `content` do modelo `LegalTerms` aceitará formatação textual multilinha. No frontend, utilize classes como `whitespace-pre-wrap` do CSS Vanilla/Tailwind no container de texto para que a quebra de linha cadastrada no banco seja renderizada corretamente, evitando a necessidade de usar marcações HTML brutas perigosas (como `dangerouslySetInnerHTML`) se não for estritamente necessário.

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash

### Debug Log References

N/A

### Completion Notes List

- Adicionado modelo de banco de dados LegalTerms para armazenamento de termos legais em apps/backend/prisma/schema.prisma.
- Adicionado campo termsVersion ao modelo ConsentRecord em apps/backend/prisma/schema.prisma com valor padrão "v1.0" para preservar compatibilidade de registros existentes.
- Executado npx prisma db push para sincronizar schema com o banco de dados.
- Atualizado script de seed apps/backend/prisma/seed.ts para persistir o termo inicial v1.0 com os textos extraídos do frontend original.
- Criado o controlador ConsentTermsController isolado para servir a rota GET /consent/active-terms evitando conflitos de wildcard (:id).
- Atualizado o DTO CreateConsentDto para validar a string termsVersion usando class-validator.
- Atualizada a validação no backend para barrar requisições em que termsVersion não coincide com a versão atualmente ativa, lançando BadRequestException.
- Atualizado o ConsentService para persistir e retornar a versão dos termos devidamente.
- Escritos testes unitários e de integração no backend cobrindo todo o ciclo em apps/backend/src/consent.
- Atualizado o componente frontend ConsentForm.tsx para carregar dados de forma dinâmica e assíncrona, exibindo spinner de carregamento e estado de erro resiliente com botão "Tentar Novamente".
- Reforçada a acessibilidade do container de termos no frontend adicionando suporte a foco de teclado (tabIndex={0}, ring-2 ring-teal-500) e propriedades ARIA (aria-label).

### File List

- apps/backend/prisma/schema.prisma
- apps/backend/prisma/seed.ts
- apps/backend/src/consent/consent-terms.controller.ts
- apps/backend/src/consent/consent.controller.ts
- apps/backend/src/consent/consent.module.ts
- apps/backend/src/consent/consent.service.ts
- apps/backend/src/consent/dto/create-consent.dto.ts
- apps/backend/src/consent/consent.service.spec.ts
- apps/backend/src/consent/consent.controller.spec.ts
- apps/frontend/src/components/consultation/ConsentForm.tsx

### Review Findings

- [x] [Review][Patch] Propagação de Evento Enter no Botão "Voltar" Submete Formulário Acidentalmente [apps/frontend/src/components/consultation/ConsentForm.tsx:822]
- [x] [Review][Patch] Risco de Cache HTTP Exibindo Termo Desatualizado (Stale Terms) [apps/backend/src/consent/consent-terms.controller.ts:13]
- [x] [Review][Patch] Visibilidade Limitada e Retorno Não Estruturado na Falha de Carregamento dos Termos [apps/frontend/src/components/consultation/ConsentForm.tsx:788]

