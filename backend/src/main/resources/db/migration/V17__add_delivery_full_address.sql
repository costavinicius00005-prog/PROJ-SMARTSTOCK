-- V17: endereco completo de destino nas rotas de entrega (para o Maps do app)
ALTER TABLE deliveries ADD COLUMN full_address VARCHAR(300);

UPDATE deliveries d SET full_address = sub.endereco
FROM (
  SELECT d2.id AS delivery_id,
         concat_ws(', ',
           nullif(concat_ws(' ', c.address, c.address_number), ''),
           nullif(c.district, ''),
           nullif(c.city, ''),
           nullif(c.state, '')) AS endereco
  FROM deliveries d2
  JOIN sales_orders o ON o.id = d2.order_id
  JOIN clients c ON c.id = o.client_id
) sub
WHERE d.id = sub.delivery_id;
