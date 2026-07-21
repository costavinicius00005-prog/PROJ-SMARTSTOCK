CREATE UNIQUE INDEX uk_clients_cnpj
  ON clients (cnpj)
  WHERE cnpj IS NOT NULL;
