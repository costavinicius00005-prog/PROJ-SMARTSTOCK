-- V14: contas financeiras (a pagar / a receber) — modulo financeiro real
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  account_type VARCHAR(10) NOT NULL,
  description VARCHAR(180) NOT NULL,
  party_name VARCHAR(160),
  amount NUMERIC(14, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'ABERTO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_accounts_type CHECK (account_type IN ('PAGAR', 'RECEBER')),
  CONSTRAINT ck_accounts_status CHECK (status IN ('ABERTO', 'PAGO', 'CANCELADO')),
  CONSTRAINT ck_accounts_amount CHECK (amount >= 0)
);

CREATE INDEX idx_accounts_type_status ON accounts (account_type, status);
CREATE INDEX idx_accounts_due_date ON accounts (due_date);
