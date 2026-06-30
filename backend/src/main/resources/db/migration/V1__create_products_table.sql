CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  internal_code VARCHAR(80) NOT NULL,
  variation_type VARCHAR(80),
  description TEXT,
  unit_of_measure VARCHAR(30) NOT NULL,
  cost_value NUMERIC(12, 2) NOT NULL,
  sale_markup NUMERIC(8, 4) NOT NULL,
  sale_price NUMERIC(12, 2) NOT NULL,
  barcode VARCHAR(80),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_products_internal_code UNIQUE (internal_code),
  CONSTRAINT uk_products_barcode UNIQUE (barcode),
  CONSTRAINT ck_products_cost_value_non_negative CHECK (cost_value >= 0),
  CONSTRAINT ck_products_sale_markup_non_negative CHECK (sale_markup >= 0),
  CONSTRAINT ck_products_sale_price_non_negative CHECK (sale_price >= 0)
);

CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_category ON products (category);
