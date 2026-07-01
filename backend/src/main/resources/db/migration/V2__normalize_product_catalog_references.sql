CREATE OR REPLACE FUNCTION normalize_catalog_text(value TEXT)
RETURNS TEXT AS $$
  SELECT lower(regexp_replace(
    translate(
      trim(coalesce(value, '')),
      U&'\00C1\00C0\00C2\00C3\00C4\00E1\00E0\00E2\00E3\00E4\00C9\00C8\00CA\00CB\00E9\00E8\00EA\00EB\00CD\00CC\00CE\00CF\00ED\00EC\00EE\00EF\00D3\00D2\00D4\00D5\00D6\00F3\00F2\00F4\00F5\00F6\00DA\00D9\00DB\00DC\00FA\00F9\00FB\00FC\00C7\00E7',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
    ),
    '\s+',
    ' ',
    'g'
  ));
$$ LANGUAGE SQL IMMUTABLE;

CREATE TABLE categorias (
  id UUID PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  nome_normalizado VARCHAR(120) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  padrao_sistema BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_categorias_nome_normalizado UNIQUE (nome_normalizado)
);

CREATE TABLE marcas (
  id UUID PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  nome_normalizado VARCHAR(120) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  padrao_sistema BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_marcas_nome_normalizado UNIQUE (nome_normalizado)
);

CREATE TABLE unidades_medida (
  id UUID PRIMARY KEY,
  sigla VARCHAR(30) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  sigla_normalizada VARCHAR(40) NOT NULL,
  nome_normalizado VARCHAR(120) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  padrao_sistema BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uk_unidades_medida_sigla_normalizada UNIQUE (sigla_normalizada),
  CONSTRAINT uk_unidades_medida_nome_normalizado UNIQUE (nome_normalizado)
);

INSERT INTO categorias (id, nome, nome_normalizado, padrao_sistema)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Mercadoria', 'mercadoria', true),
  ('10000000-0000-0000-0000-000000000002', 'Servico', 'servico', true),
  ('10000000-0000-0000-0000-000000000003', 'Materia-prima', 'materia-prima', true),
  ('10000000-0000-0000-0000-000000000004', 'Produto acabado', 'produto acabado', true),
  ('10000000-0000-0000-0000-000000000005', 'Insumo', 'insumo', true)
ON CONFLICT (nome_normalizado) DO NOTHING;

INSERT INTO marcas (id, nome, nome_normalizado, padrao_sistema)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Sem marca', 'sem marca', true),
  ('20000000-0000-0000-0000-000000000002', 'Generica', 'generica', true)
ON CONFLICT (nome_normalizado) DO NOTHING;

INSERT INTO unidades_medida (id, sigla, nome, sigla_normalizada, nome_normalizado, padrao_sistema)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'UN', 'Unidade', 'un', 'unidade', true),
  ('30000000-0000-0000-0000-000000000002', 'CX', 'Caixa', 'cx', 'caixa', true),
  ('30000000-0000-0000-0000-000000000003', 'KG', 'Quilograma', 'kg', 'quilograma', true),
  ('30000000-0000-0000-0000-000000000004', 'G', 'Grama', 'g', 'grama', true),
  ('30000000-0000-0000-0000-000000000005', 'L', 'Litro', 'l', 'litro', true),
  ('30000000-0000-0000-0000-000000000006', 'ML', 'Mililitro', 'ml', 'mililitro', true),
  ('30000000-0000-0000-0000-000000000007', 'M', 'Metro', 'm', 'metro', true),
  ('30000000-0000-0000-0000-000000000008', 'PC', 'Peca', 'pc', 'peca', true)
ON CONFLICT (sigla_normalizada) DO NOTHING;

INSERT INTO categorias (id, nome, nome_normalizado)
SELECT md5('categoria:' || normalize_catalog_text(trimmed.nome))::uuid,
  trimmed.nome,
  normalize_catalog_text(trimmed.nome)
FROM (
  SELECT DISTINCT trim(category) AS nome
  FROM products
  WHERE nullif(trim(category), '') IS NOT NULL
) trimmed
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE nome_normalizado = normalize_catalog_text(trimmed.nome)
);

INSERT INTO marcas (id, nome, nome_normalizado)
SELECT md5('marca:' || normalize_catalog_text(trimmed.nome))::uuid,
  trimmed.nome,
  normalize_catalog_text(trimmed.nome)
FROM (
  SELECT DISTINCT trim(brand) AS nome
  FROM products
  WHERE nullif(trim(brand), '') IS NOT NULL
) trimmed
WHERE NOT EXISTS (
  SELECT 1 FROM marcas WHERE nome_normalizado = normalize_catalog_text(trimmed.nome)
);

INSERT INTO unidades_medida (id, sigla, nome, sigla_normalizada, nome_normalizado)
SELECT md5('unidade:' || normalize_catalog_text(trimmed.sigla))::uuid,
  upper(trimmed.sigla),
  upper(trimmed.sigla),
  normalize_catalog_text(trimmed.sigla),
  normalize_catalog_text(trimmed.sigla)
FROM (
  SELECT DISTINCT trim(unit_of_measure) AS sigla
  FROM products
  WHERE nullif(trim(unit_of_measure), '') IS NOT NULL
) trimmed
WHERE NOT EXISTS (
  SELECT 1
  FROM unidades_medida
  WHERE sigla_normalizada = normalize_catalog_text(trimmed.sigla)
     OR nome_normalizado = normalize_catalog_text(trimmed.sigla)
);

ALTER TABLE products
  ADD COLUMN categoria_id UUID,
  ADD COLUMN marca_id UUID,
  ADD COLUMN unidade_medida_id UUID;

UPDATE products
SET categoria_id = categorias.id
FROM categorias
WHERE categorias.nome_normalizado = normalize_catalog_text(products.category);

UPDATE products
SET categoria_id = '10000000-0000-0000-0000-000000000001'
WHERE categoria_id IS NULL;

UPDATE products
SET marca_id = marcas.id
FROM marcas
WHERE nullif(trim(products.brand), '') IS NOT NULL
  AND marcas.nome_normalizado = normalize_catalog_text(products.brand);

UPDATE products
SET marca_id = '20000000-0000-0000-0000-000000000001'
WHERE marca_id IS NULL;

UPDATE products
SET unidade_medida_id = unidades_medida.id
FROM unidades_medida
WHERE unidades_medida.sigla_normalizada = normalize_catalog_text(products.unit_of_measure)
   OR unidades_medida.nome_normalizado = normalize_catalog_text(products.unit_of_measure);

UPDATE products
SET unidade_medida_id = '30000000-0000-0000-0000-000000000001'
WHERE unidade_medida_id IS NULL;

ALTER TABLE products
  ALTER COLUMN categoria_id SET NOT NULL,
  ALTER COLUMN marca_id SET NOT NULL,
  ALTER COLUMN unidade_medida_id SET NOT NULL;

DROP INDEX IF EXISTS idx_products_category;

ALTER TABLE products
  ADD CONSTRAINT fk_products_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id),
  ADD CONSTRAINT fk_products_marca FOREIGN KEY (marca_id) REFERENCES marcas (id),
  ADD CONSTRAINT fk_products_unidade_medida FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida (id);

CREATE INDEX idx_products_categoria_id ON products (categoria_id);
CREATE INDEX idx_products_marca_id ON products (marca_id);
CREATE INDEX idx_products_unidade_medida_id ON products (unidade_medida_id);

ALTER TABLE products
  DROP COLUMN category,
  DROP COLUMN brand,
  DROP COLUMN unit_of_measure;
