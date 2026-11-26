# Relatório de segurança e LGPD do SmartStock

**Data:** 25/11/2026
**Escopo:** backend Spring Boot, frontend/BFF Next.js, banco PostgreSQL e Docker Compose. O **aplicativo Flutter não foi alterado** (pedido do usuário); ele segue compatível com tudo o que mudou.
**Verificação:**
- 61 testes automatizados no backend (47 antigos + 14 novos de segurança), todos passando;
- roteiro de ponta a ponta com 50 verificações contra o sistema rodando no Docker, todas passando;
- testes diretos no banco (trilha imutável) e no navegador (telas novas).

---

## 1. Visão geral: como uma requisição é protegida

```
Navegador ──cookie HttpOnly──▶ Next.js (/api) ──Authorization: Bearer──▶ Spring Boot ──▶ PostgreSQL
App Flutter ─────────────────Authorization: Bearer (via túnel)─────────▶ Spring Boot
```

Ao chegar no Spring, cada requisição passa por quatro etapas, nesta ordem:

1. **AuthInterceptor**: existe token? A assinatura confere? A sessão existe no banco, não foi encerrada, não expirou e o usuário está ativo? Se algo falhar, responde **401**.
2. **ModuleAccessPolicy**: o papel do usuário (lido do banco, não do token) pode usar este módulo? Se não, responde **403**.
3. **Controller e caso de uso**: regras de negócio (ex.: estorno no crediário só para ADMIN e FINANCEIRO).
4. **AuditInterceptor**: se a operação envolveu dado pessoal ou foi negada, grava na trilha de segurança.

---

## 2. Situação de cada problema apontado na avaliação

| # | Problema apontado | Situação | Seção |
|---|---|---|---|
| 1 | API quase toda sem autenticação | **Resolvido** (já estava resolvido antes desta etapa e foi reforçado com sessões no servidor) | 3.1 |
| 2 | Sem permissão por módulo | **Resolvido** | 3.2 |
| 3 | Dados pessoais retornados por inteiro | **Resolvido** nas listagens; a ficha completa fica auditada | 4.1 |
| 4 | GPS exposto e sem retenção | **Resolvido** | 4.2 |
| 5 | Sem governança LGPD | **Resolvido em documentos e telas** (falta preencher controlador e encarregado) | 5 |
| 6 | Sem bloqueio ou anonimização | **Resolvido** | 4.3 |
| 7 | Sessão vulnerável (cookie legível, sem revogação) | **Resolvido** | 3.3 a 3.5 |
| 8 | Configurações inseguras | **Resolvido**, exceto o HTTP do Android (é do app) e a cifragem por coluna | 3.6 a 3.10 |
| 9 | Auditoria parcial | **Resolvido** | 4.4 |
| — | Documentação não refletia o código | **Resolvido**: este relatório e `docs/lgpd/` descrevem o que existe | 5 |

---

## 3. Controles de acesso e sessão

### 3.1 Autenticação obrigatória em toda a API

**O que é:** toda rota `/api/**` exige login, exceto `/api/auth/login`.

**Por que importa:** esconder a tela de login no frontend não protege nada. Qualquer pessoa com `curl` falaria direto com a API. A proteção precisa estar no servidor.

**Como foi feito:** o `AuthInterceptor` está registrado em `WebSecurityConfig` para `/api/**`. Ele lê `Authorization: Bearer <token>`, valida e grava na requisição o usuário, o papel e a sessão. Sem token, ou com token inválido, a resposta é 401 e uma linha `ACCESS_DENIED` vai para a trilha.

**Arquivos:**
- `backend/.../iam/infrastructure/web/AuthInterceptor.java`
- `backend/.../iam/infrastructure/web/WebSecurityConfig.java`

**Verificado:** `GET /api/clients` sem login retorna 401.

### 3.2 Permissões por módulo (matriz de papéis)

**O que é:** cada papel só acessa os módulos de que precisa (princípio do menor privilégio).

| Módulo / operação | ADMIN | FINANCEIRO | OPERADOR |
|---|:-:|:-:|:-:|
| Usuários, trilha de segurança, sessões de outros usuários | ✔ | | |
| Exportar dados do titular e anonimizar cliente | ✔ | | |
| Excluir cliente, fornecedor ou produto | ✔ | | |
| Alterar configurações da empresa | ✔ | | |
| Financeiro (contas a pagar e receber) e contabilidade | ✔ | ✔ | |
| Localização GPS ao vivo | ✔ | | ✔ |
| Gerir títulos do crediário (estornar, mudar vencimento ou valor, cancelar) | ✔ | ✔ | |
| Cadastros, vendas, caixa, estoque, entregas, ver e receber crediário | ✔ | ✔ | ✔ |

**Como foi feito:**
- A matriz fica em um único lugar, `ModuleAccessPolicy.java`: uma lista de regras do tipo método + caminho + papéis. Fica fácil de ler, revisar e testar.
- O papel vem **do banco a cada requisição**, então rebaixar um usuário vale na hora.
- O menu lateral esconde o que o papel não pode usar (`menu.ts` com `roles`). Isso é só conforto visual: quem decide é o servidor.

**Verificado:** o OPERADOR recebe 403 em financeiro, contabilidade, usuários, trilha e alteração de configurações, e recebe 200 em clientes, produtos e GPS. Há testes unitários em `SecurityControlsTest`.

### 3.3 Sessões no servidor: logout real e revogação

**O que é:** cada login cria uma linha em `user_sessions`. O token carrega só o ID da sessão, o usuário e a expiração. A cada requisição o servidor confere se a sessão ainda vale.

**Por que importa:** antes, o token valia 24 h e não havia como cancelá-lo. "Sair" apagava o cookie, mas quem tivesse copiado o token continuava entrando. Desativar um funcionário também não o expulsava.

**Como foi feito (`SessionService.java`):**
- Expiração **absoluta** de 12 h (`SESSION_MAX_HOURS`) e por **inatividade** de 120 min (`SESSION_IDLE_MINUTES`). O "último acesso" é renovado no máximo uma vez por minuto, para não gravar no banco a cada clique.
- As sessões são **revogadas** em:
  - logout;
  - "Encerrar as outras" (o próprio usuário);
  - "Encerrar sessões" (o ADMIN, para um usuário);
  - desativação, troca de papel ou redefinição de senha pelo ADMIN;
  - troca da própria senha (as outras sessões caem).
- Telas: **Minha conta e senha** (menu do usuário) e **Administração > Segurança e LGPD** (todas as sessões ativas).

**Decisão sobre "refresh token":** não foi criado um segundo token. A sessão no servidor com expiração por inatividade cumpre o mesmo papel com menos complexidade: quem usa o sistema continua logado, quem para é desconectado, e tudo pode ser revogado. Um refresh token existe para quando o servidor **não** guarda sessão (JWT puro), e esse não é mais o caso.

**Verificado:**
- token usado depois do logout retorna 401;
- operador desativado recebe 401 na requisição seguinte.

### 3.4 Token em cookie HttpOnly (proteção contra roubo por XSS)

**O que é:** no ERP web, o token fica apenas em um cookie com `HttpOnly`, `SameSite=Lax` e `Secure` (quando o acesso é por HTTPS).

**Por que importa:** antes o token era gravado por JavaScript (`document.cookie`). Qualquer script injetado na página (XSS) poderia lê-lo e enviá-lo a um atacante. Com `HttpOnly`, o navegador não deixa o JavaScript ler o cookie. `SameSite=Lax` impede que outro site faça POST no SmartStock usando a sessão do usuário (CSRF).

**Como foi feito:**
- A rota de login do Next (`app/api/auth/login/route.ts`) recebe o token do Spring e grava o cookie no servidor.
- Para o navegador (cabeçalho `X-SmartStock-Client: web`), o token **não volta no corpo** da resposta.
- O app Flutter não manda esse cabeçalho e continua recebendo o token, por isso continua funcionando sem mudança.
- `lib/auth-client.ts` não lê nem grava mais o token. O `localStorage` guarda só nome e papel, para exibir na tela.
- O logout (`app/api/auth/logout`) encerra a sessão no Spring e apaga o cookie.
- `Secure` é automático: liga quando a requisição chegou por HTTPS (`x-forwarded-proto`, como no ngrok). Pode ser forçado com `COOKIE_SECURE`.

**Verificado:** o `Set-Cookie` contém `HttpOnly` e `SameSite=Lax`, e o corpo do login web não traz o token.

### 3.5 Token assinado e segredo obrigatório

**O que é:** o token é assinado com HMAC-SHA256 usando o `AUTH_SECRET`, comparado em tempo constante.

**Por que importa:** antes havia um segredo padrão no código. Quem o conhecesse (por exemplo, alguém que leu o repositório) poderia **forjar** um token de ADMIN.

**Como foi feito (`TokenService.java`):** a API **não sobe** sem `AUTH_SECRET`, ou com menos de 32 caracteres, e a mensagem de erro explica como gerar um. O seu `.env` atual tem 64 caracteres.

**Verificado:** testes cobrem token adulterado, token assinado com outro segredo, token expirado e segredo ausente ou curto.

### 3.6 Limite de tentativas de login (força bruta)

**O que é:**
- 5 falhas para o mesmo usuário em 15 minutos bloqueiam esse usuário por 15 minutos;
- 20 falhas vindas do mesmo IP bloqueiam o IP (contra quem testa muitos usuários).

**Como foi feito (`LoginAttemptService.java`):** contadores em memória com janela deslizante. Responde **429** com `Retry-After` e a mensagem "tente novamente em X minutos". Um login certo zera o contador do usuário. Os limites são configuráveis (`LOGIN_MAX_FAILURES`, `LOGIN_WINDOW_MINUTES`).

**Detalhe extra:** quando o usuário não existe, o sistema calcula um BCrypt falso mesmo assim. O tempo de resposta fica igual ao de uma senha errada, então ninguém descobre quais usuários existem medindo o tempo.

**Verificado:** 5 respostas 401 seguidas de uma 429.

### 3.7 Política de senha e fim da senha padrão

**O que é:** senha com no mínimo 8 caracteres, letras e números, que não contenha o nome do usuário e não esteja numa lista de senhas óbvias (`admin123`, `12345678`, `senha123` e outras).

**Como foi feito:**
- `PasswordPolicy.java` vale para criar usuário, redefinir senha e trocar a própria senha. A troca da própria senha (`ChangeOwnPasswordUseCase`) exige a senha atual.
- `DefaultAdminSeeder.java` **não tem mais senha padrão**. Numa instalação nova, ele usa `ADMIN_PASSWORD` (validada pela política) ou gera uma senha aleatória de 20 caracteres, exibida **uma única vez** no log.
- Em bancos existentes, a API escreve um aviso no log se o admin ainda usa `admin123`. **É o caso do seu banco atual**, então troque a senha em "Minha conta e senha".

### 3.8 CORS restrito

**O que é:** CORS é a regra que diz quais **sites** podem chamar a API pelo navegador. Antes, qualquer site podia.

**Como foi feito:** a lista padrão inclui `localhost:3000` e os domínios de túnel `*.ngrok-free.dev`, `*.ngrok-free.app` e `*.trycloudflare.com`. Eles são necessários para a versão web do app do entregador em `/aplicativo`. A lista é configurável por `CORS_ALLOWED_ORIGINS`, e `*` é ignorado mesmo se alguém colocar. Os cabeçalhos aceitos também foram restringidos.

O ERP web não depende de CORS, porque o navegador fala com o Next e o Next fala com o Spring dentro do Docker. O app Android não é navegador, então CORS não se aplica a ele.

**Verificado:** origem `site-malicioso.example` é recusada e `*.ngrok-free.dev` é aceita.

### 3.9 Portas do Docker fechadas para a rede

**O que é:** a API (8080) e o banco (5432) agora só aceitam conexões do próprio computador (`127.0.0.1`).

**Por que importa:** antes, qualquer máquina da rede (Wi-Fi da loja, por exemplo) podia tentar conectar direto no banco ou na API.

**Como foi feito (`docker-compose.yml`):**
- O Next acessa a API pela rede interna do Docker.
- O ngrok ou cloudflared rodando no computador continua alcançando `localhost:8080`, então o app pelo túnel funciona.
- DBeaver e pgAdmin locais continuam funcionando.
- Para testar o app pela rede local sem túnel, existe `API_BIND=0.0.0.0` no `.env`.

**Verificado:** `docker ps` mostra `127.0.0.1:8080` e `127.0.0.1:5432`.

### 3.10 Cabeçalhos de segurança HTTP

**O que é:** o Next agora envia, em todas as respostas:

| Cabeçalho | Para que serve |
|---|---|
| `X-Frame-Options: DENY` e `frame-ancestors 'none'` | Impede abrir o SmartStock dentro de outro site (clickjacking). |
| `X-Content-Type-Options: nosniff` | O navegador não "adivinha" o tipo de arquivo. |
| `Referrer-Policy` | Não vaza URLs internas para outros sites. |
| `Permissions-Policy` | Câmera e GPS só na própria origem; microfone e pagamento desligados. |
| `Strict-Transport-Security` | Com HTTPS, o navegador passa a recusar HTTP. |
| `Cache-Control: no-store` em `/api` | Dados pessoais não ficam no cache do navegador nem de proxies. |
| `poweredByHeader: false` | Não anuncia a tecnologia do servidor. |

**Arquivo:** `next.config.mjs`

---

## 4. Proteção de dados pessoais (LGPD)

### 4.1 Mascaramento e minimização nas listagens

**O que é:** as listas de clientes e fornecedores mostram o CPF como `***.456.789-**` e o e-mail do cliente como `jo***@gmail.com`. RG, nascimento, gênero e nome dos pais **não saem** nas listas.

**Por que importa:** é o princípio da necessidade (art. 6º, III). Para escolher um cliente no caixa ninguém precisa ver o RG nem a filiação de todos os clientes. Uma lista completa é o que um vazamento levaria de uma vez.

**Como foi feito:**
- `ClientResponse.forListing` e `SupplierResponse.forListing` usam `PersonalDataMask`.
- Nome, telefone e endereço continuam nas listas, porque vendas e o app de entrega precisam deles.
- A ficha completa (`GET /api/clients/{id}`) continua inteira, mas cada abertura fica registrada na trilha.
- As vendas copiam o documento do cliente **do banco**, não da tela, então o mascaramento não afeta comprovantes nem pedidos.

**Verificado:** todos os CPFs da lista começam com `***`, a lista não traz RG nem filiação e a ficha traz o CPF completo.

### 4.2 GPS: coleta restrita e retenção de 30 dias

**O que é:**
- O ponto GPS só é aceito se a entrega estiver **em andamento** e se quem envia for o **entregador designado** (ou a entrega ainda não tiver entregador).
- A consulta do mapa ao vivo é só para ADMIN e OPERADOR.
- Os pontos são **apagados após 30 dias**.

**Por que importa:** localização contínua é um dos dados mais invasivos sobre o trabalhador. Antes, qualquer pessoa enviava ou lia pontos de qualquer entrega, e os pontos ficavam para sempre.

**Como foi feito:**
- `DeliveryController.sendLocation` responde 409 para entrega encerrada e 403 para entregador errado.
- `DataRetentionJob` roda todo dia às 03:00 e 1 minuto depois da inicialização.
- A leitura do mapa é registrada como `LOCATION_READ`.

**Verificado:** um operador tentando gravar GPS na entrega de outro recebeu 403.

### 4.3 Direitos do titular: exportação e anonimização

**Exportação (acesso e portabilidade, art. 18, II e V):** na ficha do cliente, o botão **Exportar dados do titular** (só ADMIN) gera um JSON com:
- cadastro;
- orçamentos, pedidos e vendas com itens;
- crediário com parcelas;
- entregas.

**Anonimização (art. 18, IV e VI):** botão **Anonimizar cliente**, só ADMIN, com justificativa obrigatória. Ele resolve o conflito entre "o titular pediu para apagar" e "a lei manda guardar 5 anos":

| Situação do cliente | O que acontece |
|---|---|
| Parcela em aberto ou entrega pendente | **Recusado**, com a explicação. O crédito em aberto é exercício regular de direito. |
| Histórico com menos de 5 anos | **Parcial**: apaga e-mail, telefone, endereço, RG, nascimento, gênero, filiação e limite de crédito. Mantém nome, CPF/CNPJ, cidade e UF por obrigação fiscal. O cliente é **bloqueado** para novos orçamentos, pedidos e vendas (gatilho no banco). |
| Sem histórico, ou histórico com mais de 5 anos | **Total**: apaga tudo que identifica a pessoa, inclusive as cópias de nome e documento em vendas, pedidos, orçamentos, endereços de entrega e pontos GPS. Os valores ficam para estatística. |

Cliente anonimizado não pode mais ser editado, para que os dados não voltem.

**Arquivos:**
- `backend/.../privacy/ClientPrivacyService.java`
- `backend/.../privacy/ClientPrivacyController.java`
- `components/privacy/client-privacy-card.tsx`
- gatilhos na migração `V23`

**Verificado:**
- exportação completa com download;
- justificativa curta recusada;
- anonimização total apagou o CPF e o e-mail e trocou o nome;
- edição posterior recusada com 409.

### 4.4 Trilha geral de auditoria (imutável)

**O que é:** a tabela `security_audit_log` registra quem, quando, de qual IP, o quê e o resultado de:

| Evento | Quando é gravado |
|---|---|
| `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGIN_BLOCKED`, `LOGOUT` | Tentativas de entrada e saída |
| `ACCESS_DENIED` | Qualquer 401 ou 403, inclusive os gerados pelas regras de negócio |
| `PERSONAL_DATA_READ` | Abertura da ficha ou histórico de cliente, ficha de fornecedor, extrato do crediário |
| `PERSONAL_DATA_LIST` | Listagem de clientes |
| `PERSONAL_DATA_CHANGE` | Criação, edição ou exclusão de cliente ou fornecedor |
| `PERSONAL_DATA_EXPORT`, `DATA_EXPORT` | Exportação do titular e relatórios do crediário |
| `PERSONAL_DATA_ANONYMIZE` | Anonimização, com nível e justificativa |
| `LOCATION_READ` | Consulta do mapa GPS |
| `USER_ADMIN_CHANGE`, `SETTINGS_CHANGE`, `PASSWORD_CHANGED`, `SESSION_REVOKED` | Mudanças administrativas |

**Imutável de verdade:** um gatilho no PostgreSQL **proíbe UPDATE e DELETE**, mesmo para quem tem acesso direto ao banco. A única exceção é a rotina de retenção, que liga uma variável de sessão dentro da própria transação.

**Retenção:** 365 dias (mínimo de 180, acima dos 6 meses do Marco Civil, art. 15).

**Tela:** Administração > **Segurança e LGPD**, com filtros por evento e usuário. Tentativas de login recusadas e acessos negados aparecem em vermelho.

**Arquivos:**
- `AuditInterceptor.java`
- `SecurityAuditService.java`
- `SecurityAdminController.java`
- `app/admin/seguranca/page.tsx`

**Verificado:**
- os 12 tipos principais de evento foram gravados no roteiro;
- `UPDATE` e `DELETE` direto no banco foram recusados pelo gatilho.

### 4.5 Política de retenção automática

`DataRetentionJob` roda diariamente e elimina:

| Dado | Prazo |
|---|---|
| Pontos GPS | 30 dias |
| Sessões encerradas ou expiradas | 90 dias |
| Trilha de auditoria | 365 dias |

Todos os prazos são configuráveis no `.env`. Vendas, crediário e estoque **não** são apagados automaticamente (obrigação legal). Para esses dados existe a anonimização.

---

## 5. Governança (documentos)

| Documento | Conteúdo |
|---|---|
| `/privacidade` (página pública, link no login) | Política de privacidade: controlador, encarregado, dados, finalidades, bases legais, prazos, direitos e incidentes. Os dados da empresa vêm do `.env`. |
| `docs/lgpd/01-inventario-de-dados.md` | Inventário de dados pessoais: tabela por tabela, com finalidade, base legal, quem acessa e prazo. |
| `docs/lgpd/02-direitos-do-titular.md` | Passo a passo para atender cada direito do art. 18 no sistema. |
| `docs/lgpd/03-plano-de-resposta-a-incidentes.md` | Detectar, conter, avaliar, comunicar à ANPD (3 dias úteis) e registrar. |
| `docs/lgpd/04-ripd.md` | Relatório de impacto: riscos, medidas e risco residual. |
| `docs/lgpd/05-backups-e-criptografia.md` | Backup cifrado, retenção de backups, criptografia em trânsito e em repouso. |

---

## 6. O que ainda falta (honestamente)

1. **App Android aceita HTTP sem criptografia** (`usesCleartextTraffic`). Não foi alterado por pedido. Em produção, gere o APK apontando só para HTTPS e desligue essa opção.
2. **O app guarda o token só em memória.** Funciona, mas ao fechar o app é preciso entrar de novo. Se um dia o token for persistido, use `flutter_secure_storage`.
3. **Cifragem por coluna** (CPF, RG) no banco não foi implementada. A proteção hoje é o acesso restrito, o banco só em localhost e o disco ou backup cifrado.
4. **IP na trilha em acesso local direto:** quando o navegador acessa `localhost:3000` sem túnel, a trilha mostra o IP interno do Docker (`172.x`). Pelo ngrok ou Cloudflare aparece o IP real do usuário.
5. **Dados do controlador e do encarregado** precisam ser preenchidos no `.env` (`PRIVACY_*`), e o RIPD precisa ser revisado e assinado pela empresa.
6. **Bloqueio de login em memória:** reiniciar a API zera os contadores. É aceitável com uma única instância da API.

## 7. Ações necessárias agora

1. **Trocar a senha do `admin`** (menu do usuário > Minha conta e senha). O log da API está avisando que ainda é a padrão.
2. **Todos precisam entrar de novo**, inclusive no app: o formato do token mudou.
3. Preencher `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTROLLER_CNPJ`, `PRIVACY_DPO_NAME` e `PRIVACY_DPO_EMAIL` no `.env`.
4. Rodar `flutter test` no app para confirmar a compatibilidade. O app não foi alterado, mas o login e as listas mudaram de formato: a lista de clientes ganhou máscara, o login ganhou o campo `expiresAt`.
