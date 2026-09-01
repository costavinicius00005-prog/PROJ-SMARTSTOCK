package com.smartstock.sales.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import com.smartstock.sales.application.port.SalesDocumentRepositoryPort;
import com.smartstock.sales.domain.SalesDocumentItem;
import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesOrderStatus;
import com.smartstock.sales.domain.SalesQuote;
import com.smartstock.sales.domain.SalesQuoteStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SalesDocumentService {
  private final SalesDocumentRepositoryPort repository;
  private final ClientRepositoryPort clients;
  private final ProductRepositoryPort products;

  public SalesDocumentService(SalesDocumentRepositoryPort repository, ClientRepositoryPort clients,
      ProductRepositoryPort products) {
    this.repository = repository; this.clients = clients; this.products = products;
  }

  public List<SalesQuote> listQuotes() { return repository.listQuotes(); }
  public SalesQuote getQuote(UUID id) { return repository.findQuote(id).orElseThrow(() -> new IllegalArgumentException("Orcamento nao encontrado.")); }
  public List<SalesOrder> listOrders() { return repository.listOrders(); }
  public SalesOrder getOrder(UUID id) { return repository.findOrder(id).orElseThrow(() -> new IllegalArgumentException("Pedido nao encontrado.")); }

  @Transactional
  public SalesQuote create(SaveSalesQuoteCommand command, boolean convert) {
    SalesQuote quote = build(UUID.randomUUID(), 0, command);
    if (convert && quote.status() == SalesQuoteStatus.DRAFT) {
      quote = new SalesQuote(quote.id(), quote.number(), quote.clientId(), quote.clientName(), quote.clientDocument(),
          quote.issueDate(), quote.validUntil(), SalesQuoteStatus.OPEN, quote.notes(), quote.generalDiscount(),
          quote.freight(), quote.subtotal(), quote.itemDiscount(), quote.total(), null, null, quote.items(),
          quote.createdAt(), quote.updatedAt());
      validateComplete(quote.clientId(), quote.items());
    }
    SalesQuote saved = repository.saveQuote(quote);
    if (convert) convert(saved.id());
    return repository.findQuote(saved.id()).orElseThrow();
  }

  @Transactional
  public SalesQuote update(UUID id, SaveSalesQuoteCommand command) {
    SalesQuote current = getQuote(id);
    if (!current.editable()) throw new IllegalArgumentException("Este orcamento nao pode mais ser editado.");
    return repository.saveQuote(build(id, current.number(), command));
  }

  @Transactional
  public SalesOrder convert(UUID quoteId) {
    SalesQuote quote = repository.findQuoteForUpdate(quoteId)
        .orElseThrow(() -> new IllegalArgumentException("Orcamento nao encontrado."));
    OptionalOrder existing = existingOrder(quoteId);
    if (existing.order != null) return existing.order;
    if (!quote.convertible()) throw new IllegalArgumentException("O orcamento nao esta disponivel para conversao.");
    validateComplete(quote.clientId(), quote.items());
    SalesOrder order = repository.createOrderFromQuote(quote);
    repository.updateQuoteStatus(quoteId, SalesQuoteStatus.CONVERTED.name());
    return order;
  }

  @Transactional public void cancelQuote(UUID id) {
    SalesQuote quote = repository.findQuoteForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Orcamento nao encontrado."));
    if (!quote.editable()) throw new IllegalArgumentException("Este orcamento nao pode ser cancelado.");
    repository.updateQuoteStatus(id, SalesQuoteStatus.CANCELLED.name());
  }

  @Transactional public void cancelOrder(UUID id) {
    SalesOrder order = getOrder(id);
    if (order.status() == SalesOrderStatus.CANCELLED || order.status() == SalesOrderStatus.FULFILLED)
      throw new IllegalArgumentException("Este pedido nao pode ser cancelado.");
    repository.updateOrderStatus(id, SalesOrderStatus.CANCELLED.name());
  }

  private SalesQuote build(UUID id, long number, SaveSalesQuoteCommand command) {
    SalesQuoteStatus status = "DRAFT".equalsIgnoreCase(command.status()) ? SalesQuoteStatus.DRAFT : SalesQuoteStatus.OPEN;
    Client client = command.clientId() == null ? null : clients.findById(command.clientId())
        .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado."));
    List<SaveSalesQuoteCommand.Item> requested = command.items() == null ? List.of() : command.items();
    Set<UUID> unique = new HashSet<>();
    List<SalesDocumentItem> items = requested.stream().map(item -> {
      if (item.productId() == null || !unique.add(item.productId())) throw new IllegalArgumentException("Produtos repetidos nao sao permitidos.");
      if (item.quantity() == null || item.quantity().signum() <= 0) throw new IllegalArgumentException("A quantidade deve ser maior que zero.");
      if (item.unitPrice() == null || item.unitPrice().signum() < 0) throw new IllegalArgumentException("O preco nao pode ser negativo.");
      Product product = products.findById(item.productId()).orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));
      BigDecimal gross = money(item.quantity().multiply(item.unitPrice()));
      BigDecimal discount = money(item.discount() == null ? BigDecimal.ZERO : item.discount());
      if (discount.signum() < 0 || discount.compareTo(gross) > 0) throw new IllegalArgumentException("Desconto do item invalido.");
      return new SalesDocumentItem(UUID.randomUUID(), product.id(), product.internalCode(), product.name(),
          product.unitOfMeasure(), item.quantity(), money(item.unitPrice()), discount, gross, gross.subtract(discount));
    }).toList();
    if (status == SalesQuoteStatus.OPEN) validateComplete(command.clientId(), items);
    BigDecimal subtotal = items.stream().map(SalesDocumentItem::grossSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal itemDiscount = items.stream().map(SalesDocumentItem::discount).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal generalDiscount = money(command.generalDiscount() == null ? BigDecimal.ZERO : command.generalDiscount());
    BigDecimal freight = money(command.freight() == null ? BigDecimal.ZERO : command.freight());
    BigDecimal total = subtotal.subtract(itemDiscount).subtract(generalDiscount).add(freight);
    if (generalDiscount.signum() < 0 || freight.signum() < 0 || total.signum() < 0) throw new IllegalArgumentException("Valores totais invalidos.");
    LocalDate issueDate = command.issueDate() == null ? LocalDate.now() : command.issueDate();
    if (command.validUntil() != null && command.validUntil().isBefore(issueDate)) throw new IllegalArgumentException("A validade nao pode ser anterior a emissao.");
    String document = client == null ? null : (client.cnpj() != null ? client.cnpj() : client.cpf());
    OffsetDateTime now = OffsetDateTime.now();
    return new SalesQuote(id, number, command.clientId(), client == null ? null : client.name(), document,
        issueDate, command.validUntil(), status, command.notes(), generalDiscount, freight, money(subtotal),
        money(itemDiscount), money(total), null, null, items, now, now);
  }

  private void validateComplete(UUID clientId, List<SalesDocumentItem> items) {
    if (clientId == null) throw new IllegalArgumentException("Selecione um cliente para abrir ou converter o orcamento.");
    if (items.isEmpty()) throw new IllegalArgumentException("Adicione ao menos um produto.");
  }
  private BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
  private OptionalOrder existingOrder(UUID quoteId) { return new OptionalOrder(repository.findOrderByQuote(quoteId).orElse(null)); }
  private record OptionalOrder(SalesOrder order) {}
}
