ALTER TABLE products
  ADD COLUMN stock_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ADD COLUMN reserved_quantity NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ADD CONSTRAINT ck_products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
  ADD CONSTRAINT ck_products_reserved_quantity_non_negative CHECK (reserved_quantity >= 0);

CREATE TABLE product_compositions (
  id UUID PRIMARY KEY,
  parent_product_id UUID NOT NULL,
  component_product_id UUID NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_product_compositions_parent
    FOREIGN KEY (parent_product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_product_compositions_component
    FOREIGN KEY (component_product_id) REFERENCES products (id) ON DELETE RESTRICT,
  CONSTRAINT uk_product_compositions_parent_component
    UNIQUE (parent_product_id, component_product_id),
  CONSTRAINT ck_product_compositions_not_self
    CHECK (parent_product_id <> component_product_id),
  CONSTRAINT ck_product_compositions_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_product_compositions_parent ON product_compositions (parent_product_id);
CREATE INDEX idx_product_compositions_component ON product_compositions (component_product_id);
