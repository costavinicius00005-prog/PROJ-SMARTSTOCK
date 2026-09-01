package com.smartstock.sales.application.port;

import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesQuote;
import java.util.List;
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
  Optional<SalesOrder> findOrderByQuote(UUID quoteId);
  SalesOrder createOrderFromQuote(SalesQuote quote);
  void updateOrderStatus(UUID id, String status);
}
