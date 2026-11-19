-- V15: locais de estoque e movimentacoes (modulo estoque real)
-- A tabela stock_movements ja foi criada na V11 (baixa de estoque das vendas).
-- Aqui ela e estendida para atender tambem as movimentacoes manuais do modulo de estoque.
CREATE TABLE stock_locations (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE stock_movements
  ADD COLUMN location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
  ADD COLUMN movement_type VARCHAR(12),
  ADD COLUMN note VARCHAR(255);

-- Colunas especificas de vendas passam a ser opcionais para movimentacoes manuais
ALTER TABLE stock_movements
  ALTER COLUMN sale_id DROP NOT NULL,
  ALTER COLUMN type DROP NOT NULL,
  ALTER COLUMN balance_after DROP NOT NULL,
  ALTER COLUMN created_by SET DEFAULT 'system';

-- Movimentacoes de ajuste podem ter quantidade negativa
ALTER TABLE stock_movements DROP CONSTRAINT ck_stock_movement_quantity;
ALTER TABLE stock_movements ADD CONSTRAINT ck_stock_movement_quantity CHECK (quantity <> 0);

UPDATE stock_movements SET movement_type = CASE type WHEN 'REVERSAL_IN' THEN 'ENTRADA' ELSE 'SAIDA' END;

ALTER TABLE stock_movements ALTER COLUMN movement_type SET NOT NULL;
ALTER TABLE stock_movements
  ADD CONSTRAINT ck_stock_movements_type CHECK (movement_type IN ('ENTRADA', 'SAIDA', 'AJUSTE'));

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements (created_at DESC);
