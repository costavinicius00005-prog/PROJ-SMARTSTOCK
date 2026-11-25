package com.smartstock.receivables.application.usecase;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.InstallmentPlan;
import com.smartstock.receivables.domain.InstallmentStatus;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gera o titulo e as parcelas de uma venda no crediario. Executa na mesma transacao da venda
 * (propagacao REQUIRED): se algo falhar, venda, estoque, pagamentos e titulos sao desfeitos juntos.
 * Idempotente por venda (UNIQUE(sale_id)): reprocessar a mesma venda devolve o titulo existente.
 */
@Service
public class IssueCreditReceivableUseCase {

  public record Command(UUID saleId, UUID clientId, BigDecimal saleTotal, BigDecimal financedAmount,
      InstallmentPlan plan, String operator) {
  }

  private final ReceivableRepositoryPort repository;
  private final ClientRepositoryPort clients;
  private final Clock clock;

  public IssueCreditReceivableUseCase(ReceivableRepositoryPort repository, ClientRepositoryPort clients, Clock clock) {
    this.repository = repository;
    this.clients = clients;
    this.clock = clock;
  }

  @Transactional
  public Receivable execute(Command command) {
    var existing = repository.findBySaleId(command.saleId());
    if (existing.isPresent()) {
      return existing.get();
    }
    if (command.clientId() == null) {
      throw new ReceivableRuleViolation("Selecione um cliente cadastrado para vender no crediario.");
    }
    Client client = clients.findById(command.clientId())
        .orElseThrow(() -> new ReceivableRuleViolation("Cliente do crediario nao encontrado."));
    if (command.plan() == null) {
      throw new ReceivableRuleViolation("Informe as condicoes do crediario (parcelas e vencimentos).");
    }

    BigDecimal saleTotal = money(command.saleTotal());
    BigDecimal financed = money(command.financedAmount());
    if (financed.compareTo(saleTotal) > 0) {
      throw new ReceivableRuleViolation("O valor no crediario nao pode ser maior que o total da venda.");
    }

    if (client.creditLimit() != null) {
      BigDecimal open = repository.clientOpenBalance(client.id());
      BigDecimal available = client.creditLimit().subtract(open);
      if (financed.compareTo(available) > 0) {
        throw new ReceivableRuleViolation("Limite de credito excedido para " + client.name() + ": limite R$ "
            + client.creditLimit() + ", em aberto R$ " + open + ", disponivel R$ " + available.max(BigDecimal.ZERO) + ".");
      }
    }

    LocalDate issueDate = LocalDate.now(clock);
    UUID receivableId = UUID.randomUUID();
    List<Installment> installments = command.plan().schedule(financed, issueDate).stream()
        .map(s -> new Installment(UUID.randomUUID(), receivableId, s.number(), s.dueDate(), s.dueDate(), s.amount(),
            s.amount(), BigDecimal.ZERO.setScale(2), InstallmentStatus.OPEN, null, null))
        .toList();

    Receivable receivable = repository.insert(new Receivable(receivableId, 0, command.saleId(), client.id(), issueDate,
        saleTotal, saleTotal.subtract(financed), financed, command.plan(), "OPEN", command.operator()), installments);
    repository.audit(new AuditEntry(receivable.id(), null, null, "CREATED", null, financed, null,
        command.plan().firstDueDate(), "Crediario de R$ " + financed + " em " + command.plan().installments()
            + "x gerado pela venda", null, command.operator()));
    return receivable;
  }

  private static BigDecimal money(BigDecimal value) {
    if (value == null) {
      throw new ReceivableRuleViolation("Valor do crediario invalido.");
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }
}
