package com.smartstock.receivables.application.query;

import com.smartstock.receivables.application.query.ReceivableViews.ClientStatement;
import com.smartstock.receivables.application.query.ReceivableViews.CreditStatus;
import com.smartstock.receivables.application.query.ReceivableViews.DelinquencyRow;
import com.smartstock.receivables.application.query.ReceivableViews.Indicators;
import com.smartstock.receivables.application.query.ReceivableViews.InstallmentDetail;
import com.smartstock.receivables.application.query.ReceivableViews.InstallmentFilter;
import com.smartstock.receivables.application.query.ReceivableViews.InstallmentRow;
import com.smartstock.receivables.application.query.ReceivableViews.Page;
import com.smartstock.receivables.application.query.ReceivableViews.PaymentsReport;
import com.smartstock.receivables.application.query.ReceivableViews.PeriodReport;
import com.smartstock.receivables.application.query.ReceivableViews.ReceivableDetail;
import com.smartstock.receivables.domain.ReceivableNotFound;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Casos de uso de consulta: validam parametros e fixam a data de referencia (fuso do negocio). */
@Service
public class ReceivableQueryService {

  private static final Set<String> SITUATIONS = Set.of("OPEN", "PARTIAL", "PAID", "CANCELLED", "OVERDUE", "PENDING");
  private static final Set<String> REGIMES = Set.of("EMISSAO", "VENCIMENTO");
  private static final Set<String> GRANULARITIES = Set.of("DAY", "WEEK", "MONTH");

  private final ReceivableQueryPort queries;
  private final Clock clock;

  public ReceivableQueryService(ReceivableQueryPort queries, Clock clock) {
    this.queries = queries;
    this.clock = clock;
  }

  public LocalDate today() {
    return LocalDate.now(clock);
  }

  public Page<InstallmentRow> listInstallments(InstallmentFilter filter) {
    if (filter.situation() != null && !SITUATIONS.contains(filter.situation())) {
      throw new ReceivableRuleViolation("Situacao invalida.");
    }
    int size = Math.max(1, Math.min(filter.size() <= 0 ? 50 : filter.size(), 500));
    InstallmentFilter normalized = new InstallmentFilter(blank(filter.query()), filter.clientId(), filter.situation(),
        filter.issueFrom(), filter.issueTo(), filter.dueFrom(), filter.dueTo(), filter.saleNumber(),
        filter.receivableNumber(), Math.max(0, filter.page()), size);
    return queries.listInstallments(normalized, today());
  }

  public Indicators indicators() {
    return queries.indicators(today());
  }

  public InstallmentDetail installmentDetail(UUID installmentId) {
    return queries.installmentDetail(installmentId, today())
        .orElseThrow(() -> new ReceivableNotFound("Parcela nao encontrada."));
  }

  public ReceivableDetail receivableBySale(UUID saleId) {
    return queries.receivableBySale(saleId, today())
        .orElseThrow(() -> new ReceivableNotFound("Esta venda nao possui crediario."));
  }

  public ClientStatement clientStatement(UUID clientId) {
    return queries.clientStatement(clientId, today())
        .orElseThrow(() -> new ReceivableNotFound("Cliente nao encontrado."));
  }

  public CreditStatus creditStatus(UUID clientId) {
    return queries.creditStatus(clientId, today());
  }

  public List<DelinquencyRow> delinquency() {
    return queries.delinquency(today());
  }

  public PaymentsReport payments(LocalDate from, LocalDate to) {
    LocalDate[] range = range(from, to);
    return queries.payments(range[0], range[1]);
  }

  public PeriodReport periodSummary(String regime, String granularity, LocalDate from, LocalDate to) {
    String r = regime == null ? "VENCIMENTO" : regime.toUpperCase();
    String g = granularity == null ? "MONTH" : granularity.toUpperCase();
    if (!REGIMES.contains(r)) {
      throw new ReceivableRuleViolation("Regime invalido. Use EMISSAO ou VENCIMENTO.");
    }
    if (!GRANULARITIES.contains(g)) {
      throw new ReceivableRuleViolation("Agrupamento invalido. Use DAY, WEEK ou MONTH.");
    }
    LocalDate[] range = range(from, to);
    return queries.periodSummary(r, g, range[0], range[1], today());
  }

  private LocalDate[] range(LocalDate from, LocalDate to) {
    LocalDate start = from == null ? today().withDayOfMonth(1) : from;
    LocalDate end = to == null ? start.plusMonths(1).minusDays(1) : to;
    if (end.isBefore(start)) {
      throw new ReceivableRuleViolation("A data final deve ser posterior a inicial.");
    }
    if (start.plusYears(5).isBefore(end)) {
      throw new ReceivableRuleViolation("Periodo maximo de 5 anos.");
    }
    return new LocalDate[] {start, end};
  }

  private static String blank(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
