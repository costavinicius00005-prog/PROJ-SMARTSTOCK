-- V13: usuarios, papeis (controle de acesso) e entregas (integracao mobile)

CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL DEFAULT ''
);

INSERT INTO roles (name, description) VALUES
  ('ADMIN', 'Acesso total ao sistema, incluindo administracao de usuarios'),
  ('OPERADOR', 'Acesso operacional as telas do ERP');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE deliveries (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES sales_orders(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  city VARCHAR(120),
  receiver_name VARCHAR(150),
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_deliveries_status CHECK (status IN ('Pendente', 'Em rota', 'Entregue', 'Cancelada'))
);

CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_users_username ON users(username);
