# Relatório de Impacto à Proteção de Dados (RIPD), versão inicial

LGPD art. 5º, XVII, e art. 38. Este documento é a base técnica. O controlador precisa revisar e assinar antes de usar dados reais.

## 1. Descrição do tratamento
ERP comercial para pequenos negócios: cadastro de clientes e fornecedores, vendas no caixa, crediário próprio (venda a prazo), estoque e entregas acompanhadas por aplicativo com GPS. Volume típico: centenas a poucos milhares de clientes por empresa. Não há dados sensíveis.

## 2. Necessidade e proporcionalidade
- Os campos obrigatórios do cliente se limitam a tipo e nome. CPF/CNPJ e endereço só são exigidos quando a operação precisa deles (crediário, entrega).
- RG, nascimento e filiação são opcionais e só aparecem na ficha completa.
- O GPS é coletado **somente** com a entrega em andamento, **somente** do entregador designado, e é apagado em 30 dias.

## 3. Riscos e medidas

| Risco | Prob. | Impacto | Medida aplicada | Risco residual |
|---|---|---|---|---|
| Acesso não autorizado à API | Média | Alto | Login obrigatório em toda a API; sessões revogáveis; permissões por papel no servidor | Baixo |
| Roubo de sessão por XSS | Baixa | Alto | Token em cookie HttpOnly, nunca acessível ao JavaScript | Baixo |
| Força bruta de senha | Média | Alto | Limite de 5 tentativas por usuário e 20 por IP a cada 15 min; política de senha; BCrypt | Baixo |
| Funcionário consultando dados sem necessidade | Média | Médio | Mascaramento nas listas; trilha de cada leitura de ficha e exportação | Médio (depende de revisão periódica da trilha) |
| Vigilância excessiva do entregador | Média | Médio | GPS só em entrega ativa e do próprio entregador; retenção de 30 dias; acesso só para ADMIN e OPERADOR | Baixo |
| Guarda além do necessário | Alta (antes) | Médio | Rotina diária de retenção; anonimização parcial e total | Baixo |
| Vazamento do banco ou do backup | Baixa | Alto | Banco só em 127.0.0.1; senhas com hash; backups cifrados (ver doc 05) | Médio (dados em claro no banco) |
| Senha padrão do administrador | Alta (antes) | Alto | Removida para instalações novas; aviso no log para bancos antigos | Baixo, depois da troca |

## 4. Pontos em aberto (ainda não resolvidos)
1. Cifragem de colunas (CPF, RG) no banco: hoje a proteção depende do controle de acesso e da cifragem do disco ou backup.
2. O aplicativo Android ainda permite tráfego HTTP sem TLS (`usesCleartextTraffic`). Em produção, use só HTTPS.
3. Não há revisão automática da trilha (alertas). Recomenda-se revisão semanal pelo ADMIN.

## 5. Conclusão
Com as medidas acima, o risco residual é aceitável para pequenos negócios. A condição é cumprir os itens em aberto antes de expor o sistema publicamente com dados reais e preencher os dados do controlador e do encarregado.
