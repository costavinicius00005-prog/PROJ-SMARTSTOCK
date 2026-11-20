-- V21: rastreabilidade das movimentacoes de estoque, idempotencia e cancelamento de vendas

-- 1) Motivo e origem de cada movimentacao (o usuario ja fica em created_by)
ALTER TABLE stock_movements
  ADD COLUMN reason VARCHAR(30),
  ADD COLUMN origin VARCHAR(120);

-- Saidas de vendas ja existentes: venda direta ou faturamento de pedido
UPDATE stock_movements m
SET reason = CASE WHEN s.source = 'SALES_ORDER' THEN 'FATURAMENTO_PEDIDO' ELSE 'VENDA' END,
    origin = CASE WHEN s.source = 'SALES_ORDER'
                  THEN 'Pedido #' || o.number || ' / Venda #' || s.number
                  ELSE 'Venda #' || s.number END
FROM sales s
LEFT JOIN sales_orders o ON o.id = s.sales_order_id
WHERE m.sale_id = s.id AND m.type = 'SALE_OUT';

UPDATE stock_movements m
SET reason = 'CANCELAMENTO_VENDA', origin = 'Venda #' || s.number
FROM sales s
WHERE m.sale_id = s.id AND m.type = 'REVERSAL_IN';

-- Movimentacoes manuais / do cadastro de produtos ja existentes
UPDATE stock_movements SET reason = 'ESTOQUE_INICIAL', origin = 'Cadastro de produto'
WHERE reason IS NULL AND note LIKE 'Estoque inicial%';
UPDATE stock_movements SET reason = 'AJUSTE', origin = 'Edicao de produto'
WHERE reason IS NULL AND note LIKE 'Ajuste pela edicao%';
UPDATE stock_movements
SET reason = CASE movement_type WHEN 'ENTRADA' THEN 'ENTRADA_MANUAL'
                                WHEN 'SAIDA' THEN 'SAIDA_MANUAL'
                                ELSE 'AJUSTE' END,
    origin = COALESCE(origin, 'Movimentacao manual')
WHERE reason IS NULL;

ALTER TABLE stock_movements ALTER COLUMN reason SET NOT NULL;
ALTER TABLE stock_movements ADD CONSTRAINT ck_stock_movements_reason CHECK (reason IN (
  'VENDA', 'FATURAMENTO_PEDIDO', 'CANCELAMENTO_VENDA', 'COMPRA', 'ENTRADA_MANUAL', 'SAIDA_MANUAL',
  'AJUSTE', 'DEVOLUCAO', 'PERDA', 'ESTOQUE_INICIAL'));

-- 2) Uma venda baixa cada produto uma unica vez e estorna uma unica vez
ALTER TABLE stock_movements DROP CONSTRAINT uk_stock_movement_sale_product;
ALTER TABLE stock_movements
  ADD CONSTRAINT uk_stock_movement_sale_product_type UNIQUE (sale_id, product_id, type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_sale ON stock_movements (sale_id);

-- 3) Idempotencia da finalizacao no caixa (protege contra cliques repetidos / reenvio)
ALTER TABLE sales ADD COLUMN request_id UUID;
ALTER TABLE sales ADD CONSTRAINT uk_sales_request UNIQUE (request_id);

-- 4) Dados do cancelamento (a venda e o historico nao sao apagados)
ALTER TABLE sales
  ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN cancelled_by VARCHAR(120),
  ADD COLUMN cancel_reason VARCHAR(255);
