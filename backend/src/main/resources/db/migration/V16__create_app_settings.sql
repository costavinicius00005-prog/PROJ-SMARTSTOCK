-- V16: configuracoes da empresa (chave/valor)
CREATE TABLE app_settings (
  key VARCHAR(80) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
