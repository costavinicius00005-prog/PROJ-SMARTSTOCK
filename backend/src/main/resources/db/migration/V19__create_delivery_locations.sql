-- V19: posicoes GPS das rotas (rastreamento ao vivo do entregador)
CREATE TABLE delivery_locations (
  id BIGSERIAL PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_delivery_locations_delivery ON delivery_locations (delivery_id, recorded_at DESC);
