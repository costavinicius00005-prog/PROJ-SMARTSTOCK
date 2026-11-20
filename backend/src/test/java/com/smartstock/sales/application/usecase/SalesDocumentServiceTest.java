package com.smartstock.sales.application.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.application.port.ProductCompositionRepositoryPort;
import com.smartstock.catalog.domain.Product;
import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import com.smartstock.sales.application.port.SalesDocumentRepositoryPort;
import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesOrderStatus;
import com.smartstock.sales.domain.SalesQuote;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SalesDocumentServiceTest {
  @Mock SalesDocumentRepositoryPort repository;
  @Mock ClientRepositoryPort clients;
  @Mock ProductRepositoryPort products;
  @Mock ProductCompositionRepositoryPort compositions;
  SalesDocumentService service;
  UUID clientId = UUID.randomUUID();
  UUID productId = UUID.randomUUID();

  @BeforeEach void setUp() {
    service = new SalesDocumentService(repository, clients, products, compositions);
  }

  @Test void recalculatesAndPreservesNegotiatedValues() {
    when(clients.findById(clientId)).thenReturn(Optional.of(client()));
    when(products.findById(productId)).thenReturn(Optional.of(product()));
    AtomicReference<SalesQuote> saved = new AtomicReference<>();
    when(repository.saveQuote(any())).thenAnswer(invocation -> { saved.set(invocation.getArgument(0)); return saved.get(); });
    when(repository.findQuote(any())).thenAnswer(invocation -> Optional.ofNullable(saved.get()));
    SaveSalesQuoteCommand command = command(List.of(new SaveSalesQuoteCommand.Item(
        productId, new BigDecimal("2"), new BigDecimal("12.50"), new BigDecimal("3.00"))));

    SalesQuote quote = service.create(command, false);

    assertEquals(new BigDecimal("25.00"), quote.subtotal());
    assertEquals(new BigDecimal("3.00"), quote.itemDiscount());
    assertEquals(new BigDecimal("21.00"), quote.total());
    assertEquals("Produto snapshot", quote.items().getFirst().productName());
  }

  @Test void rejectsDuplicateProductAndInvalidQuantity() {
    when(clients.findById(clientId)).thenReturn(Optional.of(client()));
    when(products.findById(productId)).thenReturn(Optional.of(product()));
    var item = new SaveSalesQuoteCommand.Item(productId, BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ZERO);
    assertThrows(IllegalArgumentException.class, () -> service.create(command(List.of(item, item)), false));
    assertThrows(IllegalArgumentException.class, () -> service.create(command(List.of(
        new SaveSalesQuoteCommand.Item(productId, BigDecimal.ZERO, BigDecimal.TEN, BigDecimal.ZERO))), false));
  }

  @Test void repeatedConversionReturnsTheExistingOrder() {
    UUID quoteId = UUID.randomUUID();
    SalesQuote quote = quote(quoteId);
    SalesOrder existing = new SalesOrder(UUID.randomUUID(), 7, quoteId, 3, clientId, "Cliente", "123",
        LocalDate.now(), SalesOrderStatus.OPEN, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.TEN,
        BigDecimal.ZERO, BigDecimal.TEN, quote.items(), OffsetDateTime.now(), OffsetDateTime.now());
    when(repository.findQuoteForUpdate(quoteId)).thenReturn(Optional.of(quote));
    when(repository.findOrderByQuote(quoteId)).thenReturn(Optional.of(existing));

    assertEquals(existing.id(), service.convert(quoteId).id());
    verify(repository, never()).createOrderFromQuote(any());
  }

  @Test void conversionDoesNotBlockWhenProductHasNoStock() {
    UUID quoteId = UUID.randomUUID();
    SalesQuote quote = quote(quoteId);
    SalesOrder created = new SalesOrder(UUID.randomUUID(), 8, quoteId, 3, clientId, "Cliente", "123",
        LocalDate.now(), SalesOrderStatus.OPEN, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.TEN,
        BigDecimal.ZERO, BigDecimal.TEN, quote.items(), OffsetDateTime.now(), OffsetDateTime.now());
    when(repository.findQuoteForUpdate(quoteId)).thenReturn(Optional.of(quote));
    when(repository.findOrderByQuote(quoteId)).thenReturn(Optional.empty());
    when(repository.createOrderFromQuote(quote)).thenReturn(created);

    assertEquals(created.id(), service.convert(quoteId).id());
    verify(repository).createOrderFromQuote(quote);
  }

  @Test void repeatedRequestIdReturnsTheExistingSaleWithoutNewStockOut() {
    UUID requestId = UUID.randomUUID();
    com.smartstock.sales.domain.Sale existing = sale(UUID.randomUUID(), "COMPLETED", null);
    when(repository.findSaleByRequestId(requestId)).thenReturn(Optional.of(existing));
    CompleteSaleCommand command = new CompleteSaleCommand(null, null, BigDecimal.ZERO, "",
        List.of(new CompleteSaleCommand.Item(productId, BigDecimal.ONE, BigDecimal.ZERO)), List.of(), requestId);

    assertEquals(existing.id(), service.completeSale(command, "operador").id());
    verify(repository).lockSaleRequest(requestId);
    verify(products, never()).updateStock(any(), any());
    verify(repository, never()).saveSale(any(), any(), any(), any(), any(), any());
  }

  @Test void cancellationReturnsExactlyWhatTheSaleDeducted() {
    UUID saleId = UUID.randomUUID();
    when(repository.findSaleForUpdate(saleId)).thenReturn(Optional.of(sale(saleId, "COMPLETED", null)));
    when(repository.findSaleStockOut(saleId)).thenReturn(java.util.Map.of(productId, new BigDecimal("3")));
    when(products.findByIdForUpdate(productId)).thenReturn(Optional.of(product()));
    when(repository.findSaleReceipt(saleId)).thenReturn(Optional.of(org.mockito.Mockito.mock(com.smartstock.sales.domain.SaleReceipt.class)));

    service.cancelSale(saleId, "Cliente desistiu", "operador");

    verify(products).updateStock(productId, new BigDecimal("13"));
    verify(repository).recordSaleReversal(saleId, productId, new BigDecimal("3"), new BigDecimal("13"), "operador");
    verify(repository).markSaleCancelled(saleId, "operador", "Cliente desistiu");
  }

  @Test void cancellingTwiceIsRejectedAndDoesNotTouchStock() {
    UUID saleId = UUID.randomUUID();
    when(repository.findSaleForUpdate(saleId)).thenReturn(Optional.of(sale(saleId, "CANCELLED", null)));

    assertThrows(IllegalArgumentException.class, () -> service.cancelSale(saleId, null, "operador"));
    verify(products, never()).updateStock(any(), any());
  }

  @Test void cancellingAnOrderBillingAlsoCancelsTheOrder() {
    UUID saleId = UUID.randomUUID(), orderId = UUID.randomUUID();
    when(repository.findSaleForUpdate(saleId)).thenReturn(Optional.of(sale(saleId, "COMPLETED", orderId)));
    when(repository.findSaleStockOut(saleId)).thenReturn(java.util.Map.of());
    when(repository.findSaleReceipt(saleId)).thenReturn(Optional.of(org.mockito.Mockito.mock(com.smartstock.sales.domain.SaleReceipt.class)));

    service.cancelSale(saleId, null, "operador");

    verify(repository).updateOrderStatus(orderId, SalesOrderStatus.CANCELLED.name());
  }

  private com.smartstock.sales.domain.Sale sale(UUID id, String status, UUID orderId) {
    return new com.smartstock.sales.domain.Sale(id, 1, orderId == null ? "DIRECT_SALE" : "SALES_ORDER", orderId, null,
        null, BigDecimal.TEN, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.TEN, status, List.of(),
        OffsetDateTime.now());
  }

  private SaveSalesQuoteCommand command(List<SaveSalesQuoteCommand.Item> items) {
    return new SaveSalesQuoteCommand(clientId, LocalDate.now(), LocalDate.now().plusDays(7), "OPEN", "",
        BigDecimal.ONE, BigDecimal.ZERO, items);
  }
  private Client client() { return new Client(clientId, "Pessoa fisica", "123", null, "Cliente", null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null, null, null); }
  private Product product() { return new Product(productId, "Produto snapshot", UUID.randomUUID(), "Categoria",
      UUID.randomUUID(), "Marca", "P1", "Produto simples", "", UUID.randomUUID(), "UN - Unidade",
      BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.TEN, null, BigDecimal.TEN, BigDecimal.ZERO); }
  private SalesQuote quote(UUID id) {
    var item = new com.smartstock.sales.domain.SalesDocumentItem(UUID.randomUUID(), productId, "P1", "Produto",
        "UN", BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ZERO, BigDecimal.TEN, BigDecimal.TEN);
    return new SalesQuote(id, 3, clientId, "Cliente", "123", LocalDate.now(), LocalDate.now().plusDays(7),
        com.smartstock.sales.domain.SalesQuoteStatus.OPEN, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.TEN,
        BigDecimal.ZERO, BigDecimal.TEN, null, null, List.of(item), OffsetDateTime.now(), OffsetDateTime.now());
  }
}
