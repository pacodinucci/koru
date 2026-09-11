INSERT INTO "InventoryProduct" ("id", "name", "unit", "minimumStock", "updatedAt") VALUES
  ('inventory_initial_boligrafos', 'Bolígrafos', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_borradores', 'Borradores', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_cartulinas', 'Cartulinas', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_cinta_adhesiva', 'Cinta adhesiva', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_colores_caja', 'Colores', 'caja', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_cuadernos', 'Cuadernos', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_folders', 'Folders', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_grapas_caja', 'Grapas', 'caja', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_hojas_blancas_paquete', 'Hojas blancas', 'paquete', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_hojas_colores_paquete', 'Hojas de colores', 'paquete', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_lapices', 'Lápices', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_marcadores', 'Marcadores', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_papel_china_pliego', 'Papel china', 'pliego', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_papel_crepe_pliego', 'Papel crepé', 'pliego', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_pegamento_barra', 'Pegamento', 'barra', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_plastilina_caja', 'Plastilina', 'caja', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_post_its_block', 'Post-its', 'block', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_sacapuntas', 'Sacapuntas', 'unidad', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_silicon_barras', 'Silicón', 'barra', 0, CURRENT_TIMESTAMP),
  ('inventory_initial_tijeras', 'Tijeras', 'unidad', 0, CURRENT_TIMESTAMP)
ON CONFLICT ("name", "unit") DO NOTHING;

INSERT INTO "InventoryMovement" ("id", "productId", "type", "quantity", "reason")
SELECT initial."id", product."id", 'STOCK_IN'::"InventoryMovementType", initial."quantity", 'Stock inicial de inventario'
FROM (VALUES
  ('inventory_initial_stock_boligrafos', 'Bolígrafos', 'unidad', 30::DECIMAL(12,3)),
  ('inventory_initial_stock_borradores', 'Borradores', 'unidad', 20::DECIMAL(12,3)),
  ('inventory_initial_stock_cartulinas', 'Cartulinas', 'unidad', 25::DECIMAL(12,3)),
  ('inventory_initial_stock_cinta_adhesiva', 'Cinta adhesiva', 'unidad', 15::DECIMAL(12,3)),
  ('inventory_initial_stock_colores_caja', 'Colores', 'caja', 15::DECIMAL(12,3)),
  ('inventory_initial_stock_cuadernos', 'Cuadernos', 'unidad', 20::DECIMAL(12,3)),
  ('inventory_initial_stock_folders', 'Folders', 'unidad', 25::DECIMAL(12,3)),
  ('inventory_initial_stock_grapas_caja', 'Grapas', 'caja', 8::DECIMAL(12,3)),
  ('inventory_initial_stock_hojas_blancas_paquete', 'Hojas blancas', 'paquete', 20::DECIMAL(12,3)),
  ('inventory_initial_stock_hojas_colores_paquete', 'Hojas de colores', 'paquete', 10::DECIMAL(12,3)),
  ('inventory_initial_stock_lapices', 'Lápices', 'unidad', 40::DECIMAL(12,3)),
  ('inventory_initial_stock_marcadores', 'Marcadores', 'unidad', 15::DECIMAL(12,3)),
  ('inventory_initial_stock_papel_china_pliego', 'Papel china', 'pliego', 15::DECIMAL(12,3)),
  ('inventory_initial_stock_papel_crepe_pliego', 'Papel crepé', 'pliego', 10::DECIMAL(12,3)),
  ('inventory_initial_stock_pegamento_barra', 'Pegamento', 'barra', 20::DECIMAL(12,3)),
  ('inventory_initial_stock_plastilina_caja', 'Plastilina', 'caja', 10::DECIMAL(12,3)),
  ('inventory_initial_stock_post_its_block', 'Post-its', 'block', 15::DECIMAL(12,3)),
  ('inventory_initial_stock_sacapuntas', 'Sacapuntas', 'unidad', 15::DECIMAL(12,3)),
  ('inventory_initial_stock_silicon_barras', 'Silicón', 'barra', 20::DECIMAL(12,3)),
  ('inventory_initial_stock_tijeras', 'Tijeras', 'unidad', 12::DECIMAL(12,3))
) AS initial("id", "name", "unit", "quantity")
JOIN "InventoryProduct" AS product ON product."name" = initial."name" AND product."unit" = initial."unit"
ON CONFLICT ("id") DO NOTHING;
