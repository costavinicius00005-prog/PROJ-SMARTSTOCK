-- V20: limite de credito do cliente (NULL = sem limite definido)
ALTER TABLE clients ADD COLUMN credit_limit NUMERIC(14, 2);
ALTER TABLE clients
  ADD CONSTRAINT ck_clients_credit_limit CHECK (credit_limit IS NULL OR credit_limit >= 0);
