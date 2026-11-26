-- V23: seguranca e LGPD
--   user_sessions         sessoes de login no servidor (permite logout real, revogacao e expiracao por inatividade)
--   security_audit_log    trilha geral de seguranca (logins, acessos negados, leitura/alteracao/exportacao de dados pessoais)
--   clients.anonymized_*  controle de minimizacao/anonimizacao de dados do titular (LGPD art. 16 e 18)

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason VARCHAR(60),
  ip_address VARCHAR(64),
  user_agent VARCHAR(255)
);

CREATE INDEX idx_user_sessions_user ON user_sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_sessions_expires ON user_sessions (expires_at);

CREATE TABLE security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_type VARCHAR(40) NOT NULL,
  user_id BIGINT,
  username VARCHAR(120),
  user_role VARCHAR(30),
  ip_address VARCHAR(64),
  http_method VARCHAR(10),
  path VARCHAR(255),
  http_status INTEGER,
  target_type VARCHAR(40),
  target_id VARCHAR(80),
  detail VARCHAR(500)
);

CREATE INDEX idx_security_audit_time ON security_audit_log (occurred_at DESC);
CREATE INDEX idx_security_audit_type ON security_audit_log (event_type, occurred_at DESC);
CREATE INDEX idx_security_audit_target ON security_audit_log (target_type, target_id);

-- A trilha e somente-insercao. Alteracao e sempre proibida; exclusao so e aceita pela rotina de
-- retencao, que liga a variavel de sessao smartstock.audit_purge dentro da propria transacao.
CREATE FUNCTION protect_security_audit_log() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND current_setting('smartstock.audit_purge', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'A trilha de auditoria de seguranca nao pode ser alterada nem excluida (operacao %).', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_security_audit_no_update BEFORE UPDATE ON security_audit_log
  FOR EACH ROW EXECUTE FUNCTION protect_security_audit_log();
CREATE TRIGGER trg_security_audit_no_delete BEFORE DELETE ON security_audit_log
  FOR EACH ROW EXECUTE FUNCTION protect_security_audit_log();

-- Anonimizacao de clientes:
--   PARTIAL = dados nao obrigatorios eliminados; nome e documento mantidos por obrigacao legal (fiscal/financeira)
--   FULL    = todos os dados que identificam o titular eliminados (apos o prazo legal de guarda)
ALTER TABLE clients ADD COLUMN anonymized_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN anonymization_level VARCHAR(10);
ALTER TABLE clients ADD CONSTRAINT ck_clients_anonymization_level
  CHECK (anonymization_level IS NULL OR anonymization_level IN ('PARTIAL', 'FULL'));

-- Cliente anonimizado nao pode ser usado em novos documentos comerciais
CREATE FUNCTION forbid_anonymized_client_use() RETURNS trigger AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM clients WHERE id = NEW.client_id AND anonymized_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Cliente anonimizado (LGPD) nao pode ser usado em novos documentos.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sales_quotes_no_anonymized BEFORE INSERT ON sales_quotes
  FOR EACH ROW EXECUTE FUNCTION forbid_anonymized_client_use();
CREATE TRIGGER trg_sales_orders_no_anonymized BEFORE INSERT ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION forbid_anonymized_client_use();
CREATE TRIGGER trg_sales_no_anonymized BEFORE INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION forbid_anonymized_client_use();
