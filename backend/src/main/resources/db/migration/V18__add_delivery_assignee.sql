-- V18: entregador designado para a rota (referencia ao usuario do sistema)
ALTER TABLE deliveries ADD COLUMN assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE deliveries ADD COLUMN assignee_name VARCHAR(150);
CREATE INDEX idx_deliveries_assignee ON deliveries (assignee_id);
