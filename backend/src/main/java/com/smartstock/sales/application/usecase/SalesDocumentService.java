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
import com.smartstock.sales.domain.PaymentMethod;
import com.smartstock.sales.domain.Sale;
import com.smartstock.catalog.application.port.ProductCompositionRepositoryPort;
import com.smartstock.catalog.domain.ProductComponent;
import java.util.LinkedHashMap;
import java.util.Map;
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
  private final ProductCompositionRepositoryPort compositions;

  public SalesDocumentService(SalesDocumentRepositoryPort repository, ClientRepositoryPort clients,
      ProductRepositoryPort products, ProductCompositionRepositoryPort compositions) {
    this.repository = repository; this.clients = clients; this.products = products; this.compositions = compositions;
  }

  public List<SalesQuote> listQuotes() { return repository.listQuotes(); }
  public SalesQuote getQuote(UUID id) { return repository.findQuote(id).orElseThrow(() -> new IllegalArgumentException("Orcamento nao encontrado.")); }
  public List<SalesOrder> listOrders() { return repository.listOrders(); }
  public SalesOrder getOrder(UUID id) { return repository.findOrder(id).orElseThrow(() -> new IllegalArgumentException("Pedido nao encontrado.")); }
  public List<PaymentMethod> listPaymentMethods() { return repository.listPaymentMethods(); }

  @Transactional
  public Sale completeSale(CompleteSaleCommand command) {
    SalesOrder order = null;
    if (command.salesOrderId() != null) {
      Sale completed = repository.findSaleByOrder(command.salesOrderId()).orElse(null);
      if (completed != null) return completed;
      order = repository.findOrderForUpdate(command.salesOrderId()).orElseThrow(() -> new IllegalArgumentException("Pedido nao encontrado."));
      completed = repository.findSaleByOrder(command.salesOrderId()).orElse(null);
      if (completed != null) return completed;
      if (order.status() != SalesOrderStatus.OPEN && order.status() != SalesOrderStatus.CONFIRMED)
        throw new IllegalArgumentException("Este pedido nao esta disponivel para faturamento.");
    }
    List<SalesDocumentItem> items = order == null ? directItems(command.items()) : order.items();
    UUID clientId = order == null ? command.clientId() : order.clientId();
    Client client = clientId == null ? null : clients.findById(clientId).orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado."));
    BigDecimal subtotal = money(items.stream().map(SalesDocumentItem::grossSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add));
    BigDecimal itemDiscount = money(items.stream().map(SalesDocumentItem::discount).reduce(BigDecimal.ZERO, BigDecimal::add));
    BigDecimal generalDiscount = order == null ? money(zero(command.generalDiscount())) : order.generalDiscount();
    BigDecimal freight = order == null ? BigDecimal.ZERO.setScale(2) : order.freight();
    BigDecimal total = money(subtotal.subtract(itemDiscount).subtract(generalDiscount).add(freight));
    if (total.signum() < 0) throw new IllegalArgumentException("O desconto nao pode superar o total.");
    validatePayments(command.payments(), total);
    Map<UUID, Map<UUID, BigDecimal>> snapshots = new LinkedHashMap<>();
    Map<UUID, BigDecimal> required = new LinkedHashMap<>();
    for (SalesDocumentItem item : items) {
      Map<UUID, BigDecimal> expanded = new LinkedHashMap<>();
      expand(item.productId(), item.quantity(), expanded, new HashSet<>());
      snapshots.put(item.productId(), expanded);
      expanded.forEach((id, qty) -> required.merge(id, qty, BigDecimal::add));
    }
    Map<UUID, BigDecimal> balances = new LinkedHashMap<>();
    required.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
      Product product = products.findByIdForUpdate(entry.getKey()).orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));
      BigDecimal available = product.stockQuantity().subtract(product.reservedQuantity());
      if (available.compareTo(entry.getValue()) < 0) throw new IllegalArgumentException("Estoque insuficiente para " + product.name() + ".");
      BigDecimal balance = product.stockQuantity().subtract(entry.getValue());
      products.updateStock(product.id(), balance); balances.put(product.id(), balance);
    });
    Sale draft = new Sale(UUID.randomUUID(), 0, order == null ? "DIRECT_SALE" : "SALES_ORDER",
        order == null ? null : order.id(), clientId, client == null ? null : client.name(), subtotal,
        itemDiscount, generalDiscount, freight, total, "COMPLETED", items, OffsetDateTime.now());
    Sale saved = repository.saveSale(draft, command.payments(), snapshots, balances);
    if (order != null) repository.updateOrderStatus(order.id(), SalesOrderStatus.FULFILLED.name());
    return saved;
  }

  private List<SalesDocumentItem> directItems(List<CompleteSaleCommand.Item> requested) {
    if (requested == null || requested.isEmpty()) throw new IllegalArgumentException("Adicione ao menos um produto.");
    Set<UUID> unique = new HashSet<>();
    return requested.stream().map(item -> {
      if (item.productId() == null || !unique.add(item.productId())) throw new IllegalArgumentException("Produtos repetidos nao sao permitidos.");
      if (item.quantity() == null || item.quantity().signum() <= 0) throw new IllegalArgumentException("A quantidade deve ser maior que zero.");
      Product product = products.findById(item.productId()).orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));
      BigDecimal price = money(product.salePrice()), gross = money(price.multiply(item.quantity())), discount = money(zero(item.discount()));
      if (discount.signum() < 0 || discount.compareTo(gross) > 0) throw new IllegalArgumentException("Desconto do item invalido.");
      return new SalesDocumentItem(UUID.randomUUID(), product.id(), product.internalCode(), product.name(), product.unitOfMeasure(),
          item.quantity(), price, discount, gross, gross.subtract(discount));
    }).toList();
  }

  private void expand(UUID productId, BigDecimal quantity, Map<UUID, BigDecimal> result, Set<UUID> path) {
    if (!path.add(productId)) throw new IllegalArgumentException("Composicao ciclica detectada.");
    List<ProductComponent> children = compositions.findByParentId(productId);
    if (children.isEmpty()) result.merge(productId, quantity, BigDecimal::add);
    else children.forEach(child -> expand(child.productId(), quantity.multiply(child.quantity()), result, new HashSet<>(path)));
  }

  private void validatePayments(List<CompleteSaleCommand.Payment> payments, BigDecimal total) {
    if (payments == null || payments.isEmpty()) throw new IllegalArgumentException("Informe o pagamento.");
    Map<UUID, PaymentMethod> methods = repository.listPaymentMethods().stream().collect(java.util.stream.Collectors.toMap(PaymentMethod::id, p -> p));
    BigDecimal paid = BigDecimal.ZERO;
    for (CompleteSaleCommand.Payment payment : payments) {
      PaymentMethod method = methods.get(payment.paymentMethodId());
      if (method == null || payment.amount() == null || payment.amount().signum() <= 0) throw new IllegalArgumentException("Forma de pagamento invalida.");
      BigDecimal received = payment.receivedAmount() == null ? payment.amount() : payment.receivedAmount();
      if (received.compareTo(payment.amount()) < 0 || (!method.allowsChange() && received.compareTo(payment.amount()) != 0))
        throw new IllegalArgumentException("Valor recebido invalido.");
      paid = paid.add(payment.amount());
    }
    if (money(paid).compareTo(total) != 0) throw new IllegalArgumentException("O pagamento deve corresponder ao total da venda.");
  }
  private BigDecimal zero(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

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
