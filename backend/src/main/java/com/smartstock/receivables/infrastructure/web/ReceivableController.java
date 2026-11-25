package com.smartstock.receivables.infrastructure.web;

import com.smartstock.iam.infrastructure.security.CurrentUserProvider;
import com.smartstock.iam.infrastructure.web.AccessGuard;
import com.smartstock.receivables.application.query.ReceivableQueryService;
import com.smartstock.receivables.application.query.ReceivableViews;
import com.smartstock.receivables.application.usecase.InstallmentAdministrationUseCase;
import com.smartstock.receivables.application.usecase.ReceiveInstallmentPaymentUseCase;
import com.smartstock.receivables.application.usecase.ReverseInstallmentPaymentUseCase;
import com.smartstock.receivables.domain.ReceivableNotFound;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API do crediario. Todas as rotas exigem login (AuthInterceptor). Permissoes:
 * - consultar e dar baixa: ADMIN, FINANCEIRO, OPERADOR;
 * - alterar vencimento/valor, cancelar, reabrir e estornar: ADMIN, FINANCEIRO.
 */
@RestController
@RequestMapping("/api/receivables")
public class ReceivableController {

  private static final String[] VIEW_AND_RECEIVE = {"ADMIN", "FINANCEIRO", "OPERADOR"};
  private static final String[] MANAGE = {"ADMIN", "FINANCEIRO"};

  public record PaymentRequest(BigDecimal amount, UUID paymentMethodId, LocalDate paidAt, String notes, UUID requestId) {
  }

  public record JustifiedRequest(String justification) {
  }

  public record DueDateRequest(LocalDate dueDate, String justification) {
  }

  public record AmountRequest(BigDecimal amount, String justification) {
  }

  public record NotesRequest(String notes) {
  }

  private final ReceivableQueryService queries;
  private final ReceiveInstallmentPaymentUseCase receive;
  private final ReverseInstallmentPaymentUseCase reverse;
  private final InstallmentAdministrationUseCase administration;
  private final AccessGuard access;
  private final CurrentUserProvider currentUser;

  public ReceivableController(ReceivableQueryService queries, ReceiveInstallmentPaymentUseCase receive,
      ReverseInstallmentPaymentUseCase reverse, InstallmentAdministrationUseCase administration, AccessGuard access,
      CurrentUserProvider currentUser) {
    this.queries = queries;
    this.receive = receive;
    this.reverse = reverse;
    this.administration = administration;
    this.access = access;
    this.currentUser = currentUser;
  }

  // ---------- consultas ----------

  @GetMapping("/installments")
  public ReceivableViews.Page<ReceivableViews.InstallmentRow> installments(
      @RequestParam(required = false) String q, @RequestParam(required = false) UUID clientId,
      @RequestParam(required = false) String situation,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate issueFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate issueTo,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
      @RequestParam(required = false) Long saleNumber, @RequestParam(required = false) Long receivableNumber,
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.listInstallments(new ReceivableViews.InstallmentFilter(q, clientId,
        situation == null || situation.isBlank() ? null : situation.toUpperCase(), issueFrom, issueTo, dueFrom, dueTo,
        saleNumber, receivableNumber, page, size));
  }

  @GetMapping("/indicators")
  public ReceivableViews.Indicators indicators() {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.indicators();
  }

  @GetMapping("/installments/{id}")
  public ReceivableViews.InstallmentDetail installment(@PathVariable UUID id) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.installmentDetail(id);
  }

  @GetMapping("/sales/{saleId}")
  public ReceivableViews.ReceivableDetail bySale(@PathVariable UUID saleId) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.receivableBySale(saleId);
  }

  @GetMapping("/clients/{clientId}/statement")
  public ReceivableViews.ClientStatement statement(@PathVariable UUID clientId) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.clientStatement(clientId);
  }

  @GetMapping("/clients/{clientId}/credit-status")
  public ReceivableViews.CreditStatus creditStatus(@PathVariable UUID clientId) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.creditStatus(clientId);
  }

  /** Permissoes do usuario logado (a tela usa para mostrar/ocultar acoes; o backend valida sempre). */
  @GetMapping("/permissions")
  public Map<String, Boolean> permissions() {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return Map.of("receive", access.hasAnyRole(VIEW_AND_RECEIVE), "manage", access.hasAnyRole(MANAGE));
  }

  // ---------- relatorios ----------

  @GetMapping("/reports/delinquency")
  public List<ReceivableViews.DelinquencyRow> delinquency() {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.delinquency();
  }

  @GetMapping("/reports/payments")
  public ReceivableViews.PaymentsReport paymentsReport(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.payments(from, to);
  }

  @GetMapping("/reports/period")
  public ReceivableViews.PeriodReport periodReport(@RequestParam(required = false) String regime,
      @RequestParam(required = false) String granularity,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    return queries.periodSummary(regime, granularity, from, to);
  }

  // ---------- operacoes ----------

  @PostMapping("/installments/{id}/payments")
  public ResponseEntity<Map<String, Object>> pay(@PathVariable UUID id, @RequestBody PaymentRequest request) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    var result = receive.execute(new ReceiveInstallmentPaymentUseCase.Command(id, request.amount(),
        request.paymentMethodId(), request.paidAt(), request.notes(), request.requestId(), currentUser.currentUserName()));
    return ResponseEntity.status(result.duplicate() ? HttpStatus.OK : HttpStatus.CREATED).body(Map.of(
        "paymentId", result.payment().id(), "duplicate", result.duplicate(),
        "installment", queries.installmentDetail(id).installment()));
  }

  @PostMapping("/payments/{paymentId}/reverse")
  public ReceivableViews.InstallmentRow reversePayment(@PathVariable UUID paymentId, @RequestBody JustifiedRequest request) {
    access.requireAnyRole(MANAGE);
    var installment = reverse.execute(paymentId, request.justification(), currentUser.currentUserName());
    return queries.installmentDetail(installment.id()).installment();
  }

  @PatchMapping("/installments/{id}/due-date")
  public ReceivableViews.InstallmentRow changeDueDate(@PathVariable UUID id, @RequestBody DueDateRequest request) {
    access.requireAnyRole(MANAGE);
    administration.changeDueDate(id, request.dueDate(), request.justification(), currentUser.currentUserName());
    return queries.installmentDetail(id).installment();
  }

  @PatchMapping("/installments/{id}/amount")
  public ReceivableViews.InstallmentRow changeAmount(@PathVariable UUID id, @RequestBody AmountRequest request) {
    access.requireAnyRole(MANAGE);
    administration.changeAmount(id, request.amount(), request.justification(), currentUser.currentUserName());
    return queries.installmentDetail(id).installment();
  }

  @PatchMapping("/installments/{id}/notes")
  public ReceivableViews.InstallmentRow updateNotes(@PathVariable UUID id, @RequestBody NotesRequest request) {
    access.requireAnyRole(VIEW_AND_RECEIVE);
    administration.updateNotes(id, request.notes(), currentUser.currentUserName());
    return queries.installmentDetail(id).installment();
  }

  @PostMapping("/installments/{id}/cancel")
  public ReceivableViews.InstallmentRow cancel(@PathVariable UUID id, @RequestBody JustifiedRequest request) {
    access.requireAnyRole(MANAGE);
    administration.cancel(id, request.justification(), currentUser.currentUserName());
    return queries.installmentDetail(id).installment();
  }

  @PostMapping("/installments/{id}/reopen")
  public ReceivableViews.InstallmentRow reopen(@PathVariable UUID id, @RequestBody JustifiedRequest request) {
    access.requireAnyRole(MANAGE);
    administration.reopen(id, request.justification(), currentUser.currentUserName());
    return queries.installmentDetail(id).installment();
  }

  @ExceptionHandler(ReceivableNotFound.class)
  public ResponseEntity<Map<String, String>> notFound(ReceivableNotFound exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", exception.getMessage()));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> status(ResponseStatusException exception) {
    return ResponseEntity.status(exception.getStatusCode())
        .body(Map.of("message", exception.getReason() == null ? "Operacao nao permitida." : exception.getReason()));
  }
}
