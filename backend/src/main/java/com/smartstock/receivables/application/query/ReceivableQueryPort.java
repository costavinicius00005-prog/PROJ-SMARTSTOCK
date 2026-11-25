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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Consultas (somente leitura) do crediario. "today" e a data de referencia para calcular atrasos. */
public interface ReceivableQueryPort {

  Page<InstallmentRow> listInstallments(InstallmentFilter filter, LocalDate today);

  Indicators indicators(LocalDate today);

  Optional<InstallmentDetail> installmentDetail(UUID installmentId, LocalDate today);

  Optional<ReceivableDetail> receivableBySale(UUID saleId, LocalDate today);

  Optional<ClientStatement> clientStatement(UUID clientId, LocalDate today);

  CreditStatus creditStatus(UUID clientId, LocalDate today);

  List<DelinquencyRow> delinquency(LocalDate today);

  PaymentsReport payments(LocalDate from, LocalDate to);

  PeriodReport periodSummary(String regime, String granularity, LocalDate from, LocalDate to, LocalDate today);
}
