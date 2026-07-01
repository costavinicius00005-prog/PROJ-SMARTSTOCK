UPDATE products
SET barcode = NULL
WHERE nullif(trim(barcode), '') IS NULL;
