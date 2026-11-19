package com.smartstock.catalog.application.port;

import java.math.BigDecimal;
import java.util.UUID;

/** Registra no historico de estoque as alteracoes de saldo feitas pelo cadastro de produtos. */
public interface StockMovementRecorderPort {

  void recordInitialStock(UUID productId, BigDecimal quantity);

  void recordAdjustment(UUID productId, BigDecimal delta, String note);
}
