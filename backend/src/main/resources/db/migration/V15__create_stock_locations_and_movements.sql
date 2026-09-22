-- V15: locais de estoque e movimentacoes (modulo estoque real)
CREATE TABLE stock_locations (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
  movement_type VARCHAR(12) NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_stock_movements_type CHECK (movement_type IN ('ENTRADA', 'SAIDA', 'AJUSTE'))
);

CREATE INDEX idx_stock_movements_product ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements (created_at DESC);
