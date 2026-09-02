package com.smartstock.sales.infrastructure.web;

import com.smartstock.sales.application.usecase.SalesDocumentService;
import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesQuote;
import com.smartstock.sales.domain.PaymentMethod;
import com.smartstock.sales.domain.Sale;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
public class SalesDocumentController {
  private final SalesDocumentService service;
  public SalesDocumentController(SalesDocumentService service) { this.service = service; }

  @GetMapping("/quotes") public List<SalesQuote> listQuotes() { return service.listQuotes(); }
  @GetMapping("/quotes/{id}") public SalesQuote getQuote(@PathVariable UUID id) { return service.getQuote(id); }
  @PostMapping("/quotes") @ResponseStatus(HttpStatus.CREATED)
  public SalesQuote createQuote(@RequestBody SaveSalesQuoteRequest request,
      @RequestParam(defaultValue = "false") boolean convert) { return service.create(request.toCommand(), convert); }
  @PutMapping("/quotes/{id}") public SalesQuote updateQuote(@PathVariable UUID id,
      @RequestBody SaveSalesQuoteRequest request) { return service.update(id, request.toCommand()); }
  @PostMapping("/quotes/{id}/convert") public SalesOrder convert(@PathVariable UUID id) { return service.convert(id); }
  @DeleteMapping("/quotes/{id}") public ResponseEntity<Void> cancelQuote(@PathVariable UUID id) {
    service.cancelQuote(id); return ResponseEntity.noContent().build();
  }

  @GetMapping("/orders") public List<SalesOrder> listOrders() { return service.listOrders(); }
  @GetMapping("/orders/{id}") public SalesOrder getOrder(@PathVariable UUID id) { return service.getOrder(id); }
  @DeleteMapping("/orders/{id}") public ResponseEntity<Void> cancelOrder(@PathVariable UUID id) {
    service.cancelOrder(id); return ResponseEntity.noContent().build();
  }
  @GetMapping("/checkout/payment-methods") public List<PaymentMethod> paymentMethods() { return service.listPaymentMethods(); }
  @PostMapping("/checkout/complete") @ResponseStatus(HttpStatus.CREATED)
  public Sale complete(@RequestBody CompleteSaleRequest request) { return service.completeSale(request.toCommand()); }
}
