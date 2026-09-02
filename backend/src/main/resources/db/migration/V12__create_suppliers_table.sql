CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  supplier_type VARCHAR(30) NOT NULL,
  cpf VARCHAR(20), cnpj VARCHAR(24), name VARCHAR(160) NOT NULL, trade_name VARCHAR(160),
  email VARCHAR(160), primary_phone VARCHAR(40), birth_date DATE, rg VARCHAR(40), gender VARCHAR(40),
  mother_name VARCHAR(160), father_name VARCHAR(160), primary_contact_name VARCHAR(160),
  zip_code VARCHAR(20), address VARCHAR(180), address_number VARCHAR(30), complement VARCHAR(120),
  district VARCHAR(120), state VARCHAR(80), city VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_suppliers_type CHECK (supplier_type IN ('Pessoa fisica', 'Pessoa juridica'))
);

CREATE INDEX idx_suppliers_name ON suppliers (name);
CREATE UNIQUE INDEX uk_suppliers_cpf ON suppliers (cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX uk_suppliers_cnpj ON suppliers (cnpj) WHERE cnpj IS NOT NULL;
