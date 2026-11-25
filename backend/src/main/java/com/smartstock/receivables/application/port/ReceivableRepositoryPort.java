package com.smartstock.receivables.application.port;

import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivablePayment;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Persistencia (escrita) do crediario. Metodos *ForUpdate travam a linha na transacao corrente. */
public interface ReceivableRepositoryPort {

  Optional<Receivable> findBySaleId(UUID saleId);

  Optional<Receivable> findById(UUID receivableId);

  Receivable insert(Receivable receivable, List<Installment> installments);

  Optional<Installment> findInstallmentForUpdate(UUID installmentId);

  List<Installment> findInstallmentsForUpdate(UUID receivableId);

  void updateInstallment(Installment installment);

  void updateReceivableStatus(UUID receivableId, String status);

  Optional<ReceivablePayment> findPaymentByRequestId(UUID requestId);

  Optional<ReceivablePayment> findPaymentForUpdate(UUID paymentId);

  void insertPayment(ReceivablePayment payment);

  void markPaymentReversed(UUID paymentId, String reversedBy, String reason);

  void audit(AuditEntry entry);

  /** Saldo pendente (parcelas em aberto/parciais) de todos os titulos do cliente. */
  BigDecimal clientOpenBalance(UUID clientId);

  boolean isSaleCancelled(UUID saleId);

  /** Forma de pagamento: existe, esta ativa e se e crediario. */
  Optional<PaymentMethodInfo> findPaymentMethod(UUID paymentMethodId);

  record PaymentMethodInfo(UUID id, String code, String name, boolean allowsCredit, boolean active) {
  }
}
