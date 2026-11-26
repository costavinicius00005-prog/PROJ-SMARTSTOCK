# Inventário de dados pessoais, finalidades e bases legais

Registro das operações de tratamento (LGPD art. 37). Revisar sempre que um campo novo de dado pessoal for criado.

**Controlador:** empresa que usa o SmartStock (preencher no `.env`: `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTROLLER_CNPJ`).
**Encarregado (DPO):** preencher `PRIVACY_DPO_NAME` e `PRIVACY_DPO_EMAIL`. Os dois aparecem em `/privacidade`.
**Operador:** quem hospeda o sistema (ex.: provedor de nuvem). Precisa de contrato com cláusulas de proteção de dados.

| # | Titular | Dados | Onde fica (tabela) | Finalidade | Base legal (art. 7) | Quem acessa | Retenção |
|---|---|---|---|---|---|---|---|
| 1 | Cliente | Nome, CPF/CNPJ, e-mail, telefone, endereço | `clients` | Vender, emitir comprovante, entregar | V: execução de contrato | ADMIN, FINANCEIRO, OPERADOR (CPF e e-mail mascarados nas listas) | 5 anos após o último documento; depois, anonimização total |
| 2 | Cliente | RG, nascimento, gênero, nome dos pais | `clients` | Análise de crédito no crediário (opcional) | X: proteção do crédito | Somente na ficha do cliente (nunca nas listas) | Eliminados na anonimização parcial, a qualquer momento a pedido |
| 3 | Cliente | Histórico de vendas, pedidos e orçamentos | `sales`, `sales_orders`, `sales_quotes` | Obrigações fiscais e contábeis | II: obrigação legal | Todos os papéis | 5 anos (CTN art. 173/174) |
| 4 | Cliente | Títulos, parcelas e recebimentos do crediário | `receivables*` | Cobrança | VI: exercício regular de direitos; X: proteção do crédito | Ver/receber: todos. Gerir: ADMIN e FINANCEIRO | Até a quitação mais 5 anos |
| 5 | Cliente | Endereço da entrega, nome de quem recebeu | `deliveries` | Fazer e comprovar a entrega | V: execução de contrato | Todos os papéis | Junto com o pedido; eliminados na anonimização total |
| 6 | Entregador | Localização GPS durante a entrega | `delivery_locations` | Acompanhar a rota em andamento | IX: legítimo interesse (avaliado no RIPD) | ADMIN e OPERADOR | **30 dias** (`GPS_RETENTION_DAYS`), apagamento automático |
| 7 | Usuário do sistema | Login, nome, papel, hash BCrypt da senha | `users` | Controle de acesso | V: execução de contrato (de trabalho) | Somente ADMIN | Enquanto o vínculo existir |
| 8 | Usuário do sistema | IP, navegador, horários de sessão | `user_sessions` | Segurança da sessão | IX: legítimo interesse | O próprio usuário e o ADMIN | 90 dias após o fim da sessão |
| 9 | Usuário e titulares | Trilha de auditoria (quem acessou, alterou ou exportou dados) | `security_audit_log` | Segurança e prestação de contas (art. 6, X) | II: obrigação legal (Marco Civil, art. 15); IX: legítimo interesse | Somente ADMIN (só leitura) | 365 dias (mínimo de 180) |
| 10 | Fornecedor pessoa física | Mesmos campos do cliente | `suppliers` | Compras e pagamentos | V: execução de contrato | Todos (CPF mascarado nas listas) | Enquanto houver relação mais 5 anos |

## Compartilhamento

Nenhum dado pessoal é enviado a terceiros pelo sistema. Os túneis (ngrok, Cloudflare) e a nuvem de hospedagem são **operadores**: transportam ou guardam os dados, mas não os usam para fins próprios. Antes de usar dados reais, confira os termos de cada provedor sobre transferência internacional (art. 33).

## Dados sensíveis (art. 11)

O sistema **não coleta** dados sensíveis (saúde, biometria, religião, origem racial etc.). O campo "gênero" não é dado sensível pela LGPD, mas é opcional e não deve ser obrigatório em nenhuma tela.
