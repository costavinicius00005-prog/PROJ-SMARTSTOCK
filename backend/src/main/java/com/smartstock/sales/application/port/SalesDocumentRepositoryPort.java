package com.smartstock.sales.application.port;

import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesQuote;
import com.smartstock.sales.domain.PaymentMethod;
import com.smartstock.sales.domain.Sale;
import com.smartstock.sales.domain.SaleReceipt;
import com.smartstock.sales.application.usecase.CompleteSaleCommand;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface SalesDocumentRepositoryPort {
  List<SalesQuote> listQuotes();
  Optional<SalesQuote> findQuote(UUID id);
  Optional<SalesQuote> findQuoteForUpdate(UUID id);
  SalesQuote saveQuote(SalesQuote quote);
  void updateQuoteStatus(UUID id, String status);
  List<SalesOrder> listOrders();
  Optional<SalesOrder> findOrder(UUID id);
  Optional<SalesOrder> findOrderForUpdate(UUID id);
  Optional<SalesOrder> findOrderByQuote(UUID quoteId);
  SalesOrder createOrderFromQuote(SalesQuote quote);
  void updateOrderStatus(UUID id, String status);
  List<PaymentMethod> listPaymentMethods();
  Optional<Sale> findSaleByOrder(UUID orderId);

  /** Serializa (lock transacional) tentativas concorrentes com o mesmo identificador de requisicao. */
  void lockSaleRequest(UUID requestId);
  Optional<Sale> findSaleByRequestId(UUID requestId);

  /**
   * Grava venda, itens, componentes, pagamentos e as saidas de estoque (uma por produto) na
   * transacao corrente. balances = saldo final de cada produto baixado.
   */
  Sale saveSale(Sale sale, List<CompleteSaleCommand.Payment> payments,
      Map<UUID, Map<UUID, BigDecimal>> components, Map<UUID, BigDecimal> balances,
      UUID requestId, String operator);

  Optional<SaleReceipt> findSaleReceipt(UUID saleId);
  List<SaleReceipt> listRecentSales(int limit);

  Optional<Sale> findSaleForUpdate(UUID saleId);
  /** Quantidades efetivamente baixadas pela venda, por produto (a partir das movimentacoes). */
  Map<UUID, BigDecimal> findSaleStockOut(UUID saleId);
  void recordSaleReversal(UUID saleId, UUID productId, BigDecimal quantity, BigDecimal balanceAfter, String operator);
  void markSaleCancelled(UUID saleId, String operator, String reason);
}
