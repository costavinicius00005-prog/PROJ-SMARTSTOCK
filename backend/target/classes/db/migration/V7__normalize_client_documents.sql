DROP INDEX IF EXISTS uk_clients_cnpj;

UPDATE clients
SET cpf = NULLIF(regexp_replace(cpf, '\D', '', 'g'), '')
WHERE cpf IS NOT NULL;

UPDATE clients
SET cnpj = NULLIF(regexp_replace(cnpj, '\D', '', 'g'), '')
WHERE cnpj IS NOT NULL;

WITH duplicated_documents AS (
  SELECT id, row_number() OVER (PARTITION BY cpf ORDER BY created_at, id) AS document_position
  FROM clients
  WHERE cpf IS NOT NULL
)
UPDATE clients
SET cpf = NULL
FROM duplicated_documents
WHERE clients.id = duplicated_documents.id
  AND duplicated_documents.document_position > 1;

WITH duplicated_documents AS (
  SELECT id, row_number() OVER (PARTITION BY cnpj ORDER BY created_at, id) AS document_position
  FROM clients
  WHERE cnpj IS NOT NULL
)
UPDATE clients
SET cnpj = NULL
FROM duplicated_documents
WHERE clients.id = duplicated_documents.id
  AND duplicated_documents.document_position > 1;

CREATE UNIQUE INDEX uk_clients_cpf
  ON clients (cpf)
  WHERE cpf IS NOT NULL;

CREATE UNIQUE INDEX uk_clients_cnpj
  ON clients (cnpj)
  WHERE cnpj IS NOT NULL;
