CREATE SEQUENCE sales_quote_number_seq START WITH 1;
CREATE SEQUENCE sales_order_number_seq START WITH 1;

CREATE TABLE sales_quotes (
  id UUID PRIMARY KEY,
  number BIGINT NOT NULL DEFAULT nextval('sales_quote_number_seq'),
  client_id UUID,
  client_name VARCHAR(160),
  client_document VARCHAR(24),
  issue_date DATE NOT NULL,
  valid_until DATE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  general_discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  freight NUMERIC(14, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14, 2) NOT NULL,
  item_discount NUMERIC(14, 2) NOT NULL,
  total NUMERIC(14, 2) NOT NULL,
  created_by VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_sales_quotes_number UNIQUE (number),
  CONSTRAINT fk_sales_quotes_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT ck_sales_quotes_status CHECK (status IN ('DRAFT','OPEN','CONVERTED','CANCELLED','EXPIRED')),
  CONSTRAINT ck_sales_quotes_values CHECK (general_discount >= 0 AND freight >= 0 AND subtotal >= 0 AND item_discount >= 0 AND total >= 0)
);

CREATE TABLE sales_quote_items (
  id UUID PRIMARY KEY,
  quote_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_code VARCHAR(80) NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  unit_of_measure VARCHAR(130) NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gross_subtotal NUMERIC(14, 2) NOT NULL,
  net_subtotal NUMERIC(14, 2) NOT NULL,
  CONSTRAINT fk_sales_quote_items_quote FOREIGN KEY (quote_id) REFERENCES sales_quotes(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_quote_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT uk_sales_quote_items_product UNIQUE (quote_id, product_id),
  CONSTRAINT ck_sales_quote_items_values CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND discount <= gross_subtotal AND net_subtotal >= 0)
);

CREATE TABLE sales_orders (
  id UUID PRIMARY KEY,
  number BIGINT NOT NULL DEFAULT nextval('sales_order_number_seq'),
  source_quote_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name VARCHAR(160) NOT NULL,
  client_document VARCHAR(24),
  issue_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  general_discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  freight NUMERIC(14, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14, 2) NOT NULL,
  item_discount NUMERIC(14, 2) NOT NULL,
  total NUMERIC(14, 2) NOT NULL,
  created_by VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_sales_orders_number UNIQUE (number),
  CONSTRAINT uk_sales_orders_source_quote UNIQUE (source_quote_id),
  CONSTRAINT fk_sales_orders_quote FOREIGN KEY (source_quote_id) REFERENCES sales_quotes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sales_orders_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT ck_sales_orders_status CHECK (status IN ('OPEN','CONFIRMED','FULFILLED','CANCELLED')),
  CONSTRAINT ck_sales_orders_values CHECK (general_discount >= 0 AND freight >= 0 AND subtotal >= 0 AND item_discount >= 0 AND total >= 0)
);

CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_code VARCHAR(80) NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  unit_of_measure VARCHAR(130) NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL,
  gross_subtotal NUMERIC(14, 2) NOT NULL,
  net_subtotal NUMERIC(14, 2) NOT NULL,
  CONSTRAINT fk_sales_order_items_order FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT uk_sales_order_items_product UNIQUE (order_id, product_id),
  CONSTRAINT ck_sales_order_items_values CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND discount <= gross_subtotal AND net_subtotal >= 0)
);

CREATE INDEX idx_sales_quotes_client ON sales_quotes(client_id);
CREATE INDEX idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX idx_sales_quotes_issue_date ON sales_quotes(issue_date);
CREATE INDEX idx_sales_orders_client ON sales_orders(client_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_issue_date ON sales_orders(issue_date);
