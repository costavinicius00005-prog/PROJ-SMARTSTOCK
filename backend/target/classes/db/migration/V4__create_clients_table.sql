CREATE TABLE clients (
  id UUID PRIMARY KEY,
  client_type VARCHAR(30) NOT NULL,
  cpf VARCHAR(20),
  cnpj VARCHAR(24),
  name VARCHAR(160) NOT NULL,
  trade_name VARCHAR(160),
  email VARCHAR(160),
  primary_phone VARCHAR(40),
  birth_date DATE,
  rg VARCHAR(40),
  gender VARCHAR(40),
  mother_name VARCHAR(160),
  father_name VARCHAR(160),
  primary_contact_name VARCHAR(160),
  zip_code VARCHAR(20),
  address VARCHAR(180),
  address_number VARCHAR(30),
  complement VARCHAR(120),
  district VARCHAR(120),
  state VARCHAR(2),
  city VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_clients_client_type CHECK (client_type IN ('Pessoa fisica', 'Pessoa juridica'))
);

CREATE INDEX idx_clients_name ON clients (name);
CREATE INDEX idx_clients_cpf ON clients (cpf);
CREATE INDEX idx_clients_cnpj ON clients (cnpj);
