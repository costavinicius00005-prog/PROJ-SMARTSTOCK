-- V22: modulo de crediario (titulos a receber, parcelas, recebimentos e auditoria)
--
-- Modelo:
--   receivables              1 titulo por venda no crediario (vinculado a venda e ao cliente)
--   receivable_installments  parcelas do titulo (valor original preservado + valor vigente)
--   receivable_payments      cada baixa e um registro proprio; estorno muda status, nunca apaga
--   receivable_audit_logs    trilha de auditoria de toda operacao financeira
-- A tabela "accounts" (V14) continua atendendo os lancamentos manuais de contas a pagar/receber.

-- Formas de pagamento: crediario (gera titulos) e transferencia (usada em recebimentos)
INSERT INTO payment_methods (id, code, name, kind, allows_change, allows_credit, active)
SELECT gen_random_uuid(), 'CREDIARIO', 'Crediario', 'CREDIT', false, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'CREDIARIO');
INSERT INTO payment_methods (id, code, name, kind, allows_change, allows_credit, active)
SELECT gen_random_uuid(), 'TRANSFER', 'Transferencia', 'TRANSFER', false, false, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE code = 'TRANSFER');

-- Papel financeiro: pode editar, cancelar, reabrir e estornar titulos
INSERT INTO roles (name, description)
SELECT 'FINANCEIRO', 'Gestao financeira: baixas, alteracoes, cancelamentos e estornos de titulos'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'FINANCEIRO');

CREATE SEQUENCE receivable_number_seq START 1;

CREATE TABLE receivables (
  id UUID PRIMARY KEY,
  number BIGINT NOT NULL DEFAULT nextval('receivable_number_seq'),
  sale_id UUID NOT NULL,
  client_id UUID NOT NULL,
  issue_date DATE NOT NULL,
  sale_total NUMERIC(14, 2) NOT NULL,
  down_payment NUMERIC(14, 2) NOT NULL DEFAULT 0,
  financed_amount NUMERIC(14, 2) NOT NULL,
  installment_count INTEGER NOT NULL,
  interval_type VARCHAR(10) NOT NULL,
  interval_days INTEGER,
  first_due_date DATE NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'OPEN',
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_receivables_number UNIQUE (number),
  CONSTRAINT uk_receivables_sale UNIQUE (sale_id),
  CONSTRAINT fk_receivables_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receivables_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  CONSTRAINT ck_receivables_values CHECK (sale_total > 0 AND down_payment >= 0 AND financed_amount > 0
    AND down_payment + financed_amount = sale_total),
  CONSTRAINT ck_receivables_installments CHECK (installment_count BETWEEN 1 AND 60),
  CONSTRAINT ck_receivables_interval CHECK (
    (interval_type = 'MONTHLY' AND interval_days IS NULL) OR
    (interval_type = 'DAYS' AND interval_days BETWEEN 1 AND 365)),
  CONSTRAINT ck_receivables_due CHECK (first_due_date >= issue_date),
  CONSTRAINT ck_receivables_status CHECK (status IN ('OPEN', 'PAID', 'CANCELLED'))
);

CREATE INDEX idx_receivables_client ON receivables (client_id);
CREATE INDEX idx_receivables_issue_date ON receivables (issue_date);

CREATE TABLE receivable_installments (
  id UUID PRIMARY KEY,
  receivable_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  original_due_date DATE NOT NULL,
  original_amount NUMERIC(14, 2) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(12) NOT NULL DEFAULT 'OPEN',
  notes VARCHAR(500),
  paid_at DATE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by VARCHAR(120),
  cancel_reason VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_installments_receivable FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON DELETE RESTRICT,
  CONSTRAINT uk_installments_number UNIQUE (receivable_id, installment_number),
  CONSTRAINT ck_installments_values CHECK (original_amount > 0 AND amount > 0 AND paid_amount >= 0
    AND paid_amount <= amount),
  CONSTRAINT ck_installments_status CHECK (status IN ('OPEN', 'PARTIAL', 'PAID', 'CANCELLED')),
  -- Coerencia entre situacao e valores pagos (o banco nao aceita estados contraditorios)
  CONSTRAINT ck_installments_status_values CHECK (
    (status = 'OPEN' AND paid_amount = 0) OR
    (status = 'PARTIAL' AND paid_amount > 0 AND paid_amount < amount) OR
    (status = 'PAID' AND paid_amount = amount) OR
    (status = 'CANCELLED' AND paid_amount = 0))
);

CREATE INDEX idx_installments_due ON receivable_installments (due_date) WHERE status IN ('OPEN', 'PARTIAL');
CREATE INDEX idx_installments_receivable ON receivable_installments (receivable_id);

CREATE TABLE receivable_payments (
  id UUID PRIMARY KEY,
  installment_id UUID NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  payment_method_id UUID NOT NULL,
  paid_at DATE NOT NULL,
  notes VARCHAR(500),
  request_id UUID NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  recorded_by VARCHAR(120) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reversed_by VARCHAR(120),
  reversed_at TIMESTAMP WITH TIME ZONE,
  reverse_reason VARCHAR(255),
  CONSTRAINT fk_payments_installment FOREIGN KEY (installment_id) REFERENCES receivable_installments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT,
  CONSTRAINT uk_payments_request UNIQUE (request_id),
  CONSTRAINT ck_payments_amount CHECK (amount > 0),
  CONSTRAINT ck_payments_status CHECK (status IN ('ACTIVE', 'REVERSED')),
  CONSTRAINT ck_payments_reversal CHECK (
    (status = 'ACTIVE' AND reversed_at IS NULL) OR
    (status = 'REVERSED' AND reversed_at IS NOT NULL AND reversed_by IS NOT NULL))
);

CREATE INDEX idx_payments_installment ON receivable_payments (installment_id);
CREATE INDEX idx_payments_paid_at ON receivable_payments (paid_at) WHERE status = 'ACTIVE';

CREATE TABLE receivable_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  receivable_id UUID NOT NULL REFERENCES receivables(id) ON DELETE RESTRICT,
  installment_id UUID REFERENCES receivable_installments(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES receivable_payments(id) ON DELETE RESTRICT,
  action VARCHAR(30) NOT NULL,
  old_amount NUMERIC(14, 2),
  new_amount NUMERIC(14, 2),
  old_due_date DATE,
  new_due_date DATE,
  details VARCHAR(500),
  justification VARCHAR(500),
  performed_by VARCHAR(120) NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_audit_action CHECK (action IN ('CREATED', 'PAYMENT', 'PAYMENT_REVERSED', 'DUE_DATE_CHANGED',
    'AMOUNT_CHANGED', 'NOTES_CHANGED', 'CANCELLED', 'REOPENED', 'RECEIVABLE_CANCELLED'))
);

CREATE INDEX idx_audit_receivable ON receivable_audit_logs (receivable_id, performed_at);
CREATE INDEX idx_audit_installment ON receivable_audit_logs (installment_id, performed_at);

-- Historico financeiro nao pode ser apagado fisicamente (nem por SQL manual acidental)
CREATE FUNCTION forbid_financial_history_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Registros financeiros do crediario nao podem ser excluidos (tabela %). Use estorno ou cancelamento.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receivable_payments_no_delete BEFORE DELETE ON receivable_payments
  FOR EACH ROW EXECUTE FUNCTION forbid_financial_history_delete();
CREATE TRIGGER trg_receivable_audit_no_delete BEFORE DELETE ON receivable_audit_logs
  FOR EACH ROW EXECUTE FUNCTION forbid_financial_history_delete();
CREATE TRIGGER trg_receivable_audit_no_update BEFORE UPDATE ON receivable_audit_logs
  FOR EACH ROW EXECUTE FUNCTION forbid_financial_history_delete();
