CREATE SEQUENCE sale_number_seq START WITH 1;

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY, code VARCHAR(30) NOT NULL UNIQUE, name VARCHAR(80) NOT NULL,
  kind VARCHAR(20) NOT NULL, allows_change BOOLEAN NOT NULL DEFAULT false,
  allows_credit BOOLEAN NOT NULL DEFAULT false, active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO payment_methods (id, code, name, kind, allows_change) VALUES
  ('10000000-0000-0000-0000-000000000001', 'CASH', 'Dinheiro', 'CASH', true),
  ('10000000-0000-0000-0000-000000000002', 'PIX', 'PIX', 'INSTANT', false),
  ('10000000-0000-0000-0000-000000000003', 'CREDIT_CARD', 'Cartao de credito', 'CARD', false),
  ('10000000-0000-0000-0000-000000000004', 'DEBIT_CARD', 'Cartao de debito', 'CARD', false);

CREATE TABLE sales (
  id UUID PRIMARY KEY, number BIGINT NOT NULL DEFAULT nextval('sale_number_seq'),
  source VARCHAR(30) NOT NULL, sales_order_id UUID, client_id UUID, client_name VARCHAR(160),
  notes TEXT, subtotal NUMERIC(14,2) NOT NULL, item_discount NUMERIC(14,2) NOT NULL,
  general_discount NUMERIC(14,2) NOT NULL, freight NUMERIC(14,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_by VARCHAR(120) NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_sales_number UNIQUE(number),
  CONSTRAINT uk_sales_order UNIQUE(sales_order_id),
  CONSTRAINT fk_sales_order FOREIGN KEY(sales_order_id) REFERENCES sales_orders(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sales_client FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT ck_sales_source CHECK(source IN ('DIRECT_SALE','SALES_ORDER')),
  CONSTRAINT ck_sales_status CHECK(status IN ('COMPLETED','CANCELLED')),
  CONSTRAINT ck_sales_values CHECK(subtotal >= 0 AND item_discount >= 0 AND general_discount >= 0 AND freight >= 0 AND total >= 0)
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY, sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_code VARCHAR(80) NOT NULL, product_name VARCHAR(160) NOT NULL,
  unit_of_measure VARCHAR(130) NOT NULL, quantity NUMERIC(14,4) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL, discount NUMERIC(14,2) NOT NULL,
  gross_subtotal NUMERIC(14,2) NOT NULL, net_subtotal NUMERIC(14,2) NOT NULL,
  CONSTRAINT ck_sale_items_values CHECK(quantity > 0 AND unit_price >= 0 AND discount >= 0 AND discount <= gross_subtotal)
);

CREATE TABLE sale_item_components (
  id UUID PRIMARY KEY, sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,4) NOT NULL CHECK(quantity > 0)
);

CREATE TABLE sale_payments (
  id UUID PRIMARY KEY, sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL, received_amount NUMERIC(14,2) NOT NULL,
  change_amount NUMERIC(14,2) NOT NULL DEFAULT 0, installments INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT ck_sale_payments_values CHECK(amount > 0 AND received_amount >= amount AND change_amount >= 0 AND installments > 0)
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY, product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT, type VARCHAR(20) NOT NULL,
  quantity NUMERIC(14,4) NOT NULL, balance_after NUMERIC(14,4) NOT NULL,
  created_by VARCHAR(120) NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_stock_movement_sale_product UNIQUE(sale_id, product_id),
  CONSTRAINT ck_stock_movement_type CHECK(type IN ('SALE_OUT','REVERSAL_IN')),
  CONSTRAINT ck_stock_movement_quantity CHECK(quantity > 0)
);

CREATE INDEX idx_sales_client ON sales(client_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
