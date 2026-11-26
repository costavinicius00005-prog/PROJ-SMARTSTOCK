# Procedimento de atendimento aos direitos do titular (art. 18)

**Canal:** e-mail do encarregado publicado em `/privacidade`.
**Prazo de resposta:** até 15 dias (art. 19, II). Pedidos de confirmação simples: imediato.
**Registro:** cada pedido deve ter data, titular, pedido, resposta e data da resposta (planilha ou chamado). As ações no sistema ficam automaticamente em **Administração > Segurança e LGPD**.

## 1. Confirmar a identidade
Peça um documento ou confirme dados que só o titular sabe (ex.: data e valor da última compra). Nunca entregue dados a terceiros sem procuração.

## 2. Atender

| Pedido | Como fazer no SmartStock | Quem |
|---|---|---|
| Confirmação e acesso (I, II) | Ficha do cliente > **Exportar dados do titular** (JSON com cadastro, vendas, crediário e entregas) | ADMIN |
| Correção (III) | Ficha do cliente > **Editar** | Qualquer papel |
| Portabilidade (V) | Mesmo arquivo da exportação (formato estruturado JSON) | ADMIN |
| Anonimização, bloqueio ou eliminação (IV, VI) | Ficha do cliente > **Anonimizar cliente**, com justificativa | ADMIN |
| Informação sobre compartilhamento (VII) | Responder com a seção "Compartilhamento" do inventário | Encarregado |
| Revogação do consentimento (IX) | Não se aplica: o sistema não usa consentimento como base legal | Encarregado |

## 3. O que a anonimização faz

- **Sem histórico, ou histórico com mais de 5 anos** (`CLIENT_LEGAL_RETENTION_YEARS`), vira **anonimização total (FULL)**. Saem nome, CPF/CNPJ, contatos e endereço. Também saem as cópias de nome e documento em vendas, pedidos, orçamentos e entregas, e os pontos de GPS. Os valores ficam para estatística.
- **Histórico com menos de 5 anos** vira **anonimização parcial (PARTIAL)**. Saem e-mail, telefone, endereço, RG, nascimento, gênero, filiação e limite de crédito. Nome, CPF/CNPJ, cidade e UF ficam guardados por obrigação legal (art. 16, I). O cliente é bloqueado para novas vendas por gatilho no banco. Depois do prazo, repita a operação para chegar ao nível total.
- O sistema **recusa** a anonimização se houver parcela em aberto ou entrega pendente. Nesses casos, explique ao titular que a guarda segue enquanto houver crédito em aberto (art. 7, VI e X).
- Cliente **sem nenhum histórico** pode também ser simplesmente **excluído** (ADMIN).

## 4. Responder ao titular
Informe o que foi feito, o que ficou guardado, por qual motivo legal e até quando.
