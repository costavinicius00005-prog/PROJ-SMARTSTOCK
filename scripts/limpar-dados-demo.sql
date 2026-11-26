-- Remove os dados ficticios de demonstracao (produtos DEMO-xxx e clientes com e-mail *.demo*@example.com)
-- e as vendas feitas com eles. Rode ANTES de usar o sistema com dados reais:
--   Get-Content scripts\limpar-dados-demo.sql | docker exec -i meu-sistema-postgres sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL session_replication_role = replica;  -- desliga os gatilhos que impedem apagar historico financeiro

CREATE TEMP TABLE d_prod ON COMMIT DROP AS SELECT id FROM products WHERE internal_code LIKE 'DEMO-%';
CREATE TEMP TABLE d_cli ON COMMIT DROP AS SELECT id FROM clients WHERE email LIKE '%.demo%@example.com';
CREATE TEMP TABLE d_sales ON COMMIT DROP AS
  SELECT DISTINCT s.id FROM sales s LEFT JOIN sale_items i ON i.sale_id = s.id
  WHERE i.product_id IN (SELECT id FROM d_prod) OR s.client_id IN (SELECT id FROM d_cli);

-- trava: nao apaga se uma venda demo misturar produto real, ou se houver pedido/orcamento ligado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sale_items WHERE sale_id IN (SELECT id FROM d_sales) AND product_id NOT IN (SELECT id FROM d_prod))
     OR EXISTS (SELECT 1 FROM sales_orders WHERE client_id IN (SELECT id FROM d_cli))
     OR EXISTS (SELECT 1 FROM sales_quotes WHERE client_id IN (SELECT id FROM d_cli))
     OR EXISTS (SELECT 1 FROM sales_order_items WHERE product_id IN (SELECT id FROM d_prod))
     OR EXISTS (SELECT 1 FROM sales_quote_items WHERE product_id IN (SELECT id FROM d_prod)) THEN
    RAISE EXCEPTION 'Dados demo ligados a registros reais: limpeza cancelada. Revise manualmente.';
  END IF;
END $$;

CREATE TEMP TABLE d_rec ON COMMIT DROP AS SELECT id FROM receivables WHERE sale_id IN (SELECT id FROM d_sales);
DELETE FROM receivable_audit_logs WHERE receivable_id IN (SELECT id FROM d_rec);
DELETE FROM receivable_payments WHERE installment_id IN (SELECT id FROM receivable_installments WHERE receivable_id IN (SELECT id FROM d_rec));
DELETE FROM receivable_installments WHERE receivable_id IN (SELECT id FROM d_rec);
DELETE FROM receivables WHERE id IN (SELECT id FROM d_rec);
DELETE FROM stock_movements WHERE sale_id IN (SELECT id FROM d_sales) OR product_id IN (SELECT id FROM d_prod);
DELETE FROM sale_item_components WHERE sale_item_id IN (SELECT id FROM sale_items WHERE sale_id IN (SELECT id FROM d_sales));
DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM d_sales);
DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM d_sales);
DELETE FROM sales WHERE id IN (SELECT id FROM d_sales);
DELETE FROM product_presentations WHERE product_id IN (SELECT id FROM d_prod);
DELETE FROM products WHERE id IN (SELECT id FROM d_prod);
DELETE FROM clients WHERE id IN (SELECT id FROM d_cli);

SELECT (SELECT count(*) FROM products) AS produtos_restantes, (SELECT count(*) FROM clients) AS clientes_restantes,
       (SELECT count(*) FROM sales) AS vendas_restantes;
COMMIT;
