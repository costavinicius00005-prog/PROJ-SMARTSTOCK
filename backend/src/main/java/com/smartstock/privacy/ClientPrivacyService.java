package com.smartstock.privacy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Direitos do titular (LGPD art. 18) para clientes.
 *
 * <ul>
 *   <li><b>Acesso/portabilidade (II e V)</b>: {@link #export} reune em um JSON tudo que o sistema
 *       guarda sobre o titular.</li>
 *   <li><b>Anonimizacao/eliminacao (IV e VI)</b>: {@link #anonymize}. Enquanto houver obrigacao
 *       legal de guarda (fiscal/financeira, CLIENT_LEGAL_RETENTION_YEARS, padrao 5 anos desde o
 *       ultimo documento), elimina so os dados nao obrigatorios (nivel PARTIAL) e bloqueia o cliente
 *       para novos documentos. Passado o prazo, ou sem historico, elimina tudo que identifica o
 *       titular, inclusive copias em vendas, pedidos, orcamentos, entregas e GPS (nivel FULL).</li>
 * </ul>
 * Cliente sem historico pode simplesmente ser excluido pela rota normal.
 */
@Service
public class ClientPrivacyService {

  private final JdbcTemplate jdbc;
  private final ObjectMapper objectMapper;
  private final int legalRetentionYears;

  public ClientPrivacyService(
      JdbcTemplate jdbc,
      ObjectMapper objectMapper,
      @Value("${CLIENT_LEGAL_RETENTION_YEARS:5}") int legalRetentionYears) {
    this.jdbc = jdbc;
    this.objectMapper = objectMapper;
    this.legalRetentionYears = Math.max(0, legalRetentionYears);
  }

  public record AnonymizationResult(UUID clientId, String level, OffsetDateTime anonymizedAt, String explanation) {
  }

  /** Impede editar cadastro ja anonimizado (os dados eliminados nao podem voltar). */
  public void ensureEditable(UUID clientId) {
    Integer anonymized = jdbc.queryForObject(
        "SELECT count(*) FROM clients WHERE id = ? AND anonymized_at IS NOT NULL", Integer.class, clientId);
    if (anonymized != null && anonymized > 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "Cliente anonimizado (LGPD): o cadastro nao pode mais ser alterado.");
    }
  }

  public Map<String, Object> export(UUID clientId) {
    List<Map<String, Object>> client = jdbc.queryForList("SELECT * FROM clients WHERE id = ?", clientId);
    if (client.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado.");
    }
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("exportedAt", OffsetDateTime.now());
    out.put("legalBasis", "LGPD art. 18, II (acesso) e V (portabilidade)");
    out.put("titular", client.get(0));
    out.put("quotes", jdbc.queryForList("""
        SELECT id, number, issue_date, valid_until, status, total, notes, created_at
        FROM sales_quotes WHERE client_id = ? ORDER BY created_at""", clientId));
    out.put("orders", jdbc.queryForList("""
        SELECT id, number, issue_date, status, total, notes, created_at
        FROM sales_orders WHERE client_id = ? ORDER BY created_at""", clientId));
    out.put("sales", withJson(jdbc.queryForList("""
        SELECT s.id, s.number, s.status, s.total, s.created_at,
               (SELECT json_agg(json_build_object('product', si.product_name, 'quantity', si.quantity,
                                                  'total', si.net_subtotal))
                  FROM sale_items si WHERE si.sale_id = s.id)::text AS items
        FROM sales s WHERE s.client_id = ? ORDER BY s.created_at""", clientId)));
    out.put("creditAccounts", withJson(jdbc.queryForList("""
        SELECT r.number, r.issue_date, r.sale_total, r.down_payment, r.financed_amount, r.status,
               (SELECT json_agg(json_build_object('number', i.installment_number, 'dueDate', i.due_date,
                                                  'amount', i.amount, 'paid', i.paid_amount,
                                                  'status', i.status) ORDER BY i.installment_number)
                  FROM receivable_installments i WHERE i.receivable_id = r.id)::text AS installments
        FROM receivables r WHERE r.client_id = ? ORDER BY r.issue_date""", clientId)));
    out.put("deliveries", jdbc.queryForList("""
        SELECT d.id, o.number AS order_number, d.status, d.scheduled_date, d.full_address,
               d.receiver_name, d.failure_reason,
               (SELECT count(*) FROM delivery_locations dl WHERE dl.delivery_id = d.id) AS gps_points
        FROM deliveries d JOIN sales_orders o ON o.id = d.order_id
        WHERE o.client_id = ? ORDER BY d.created_at""", clientId));
    return out;
  }

  /** Converte as colunas json_agg (lidas como texto) em estrutura JSON de verdade na resposta. */
  private List<Map<String, Object>> withJson(List<Map<String, Object>> rows) {
    for (Map<String, Object> row : rows) {
      row.replaceAll((key, value) -> {
        if (("items".equals(key) || "installments".equals(key)) && value instanceof String json) {
          try {
            return objectMapper.readTree(json);
          } catch (Exception ex) {
            return json;
          }
        }
        return value;
      });
    }
    return rows;
  }

  @Transactional
  public AnonymizationResult anonymize(UUID clientId, String reason) {
    if (reason == null || reason.trim().length() < 10) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Informe a justificativa da anonimizacao (minimo de 10 caracteres), ex.: pedido do titular em dd/mm/aaaa.");
    }
    List<Map<String, Object>> rows = jdbc.queryForList(
        "SELECT anonymization_level FROM clients WHERE id = ? FOR UPDATE", clientId);
    if (rows.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado.");
    }
    if ("FULL".equals(rows.get(0).get("anonymization_level"))) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Cliente ja esta totalmente anonimizado.");
    }

    Integer openInstallments = jdbc.queryForObject("""
        SELECT count(*) FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
        WHERE r.client_id = ? AND i.status IN ('OPEN', 'PARTIAL')""", Integer.class, clientId);
    if (openInstallments != null && openInstallments > 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "O cliente tem " + openInstallments + " parcela(s) em aberto no crediario. Quite ou cancele antes de "
              + "anonimizar (o credito em aberto e legitimo interesse/exercicio regular de direito).");
    }
    Integer activeDeliveries = jdbc.queryForObject("""
        SELECT count(*) FROM deliveries d JOIN sales_orders o ON o.id = d.order_id
        WHERE o.client_id = ? AND d.status IN ('Pendente', 'Em rota')""", Integer.class, clientId);
    if (activeDeliveries != null && activeDeliveries > 0) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "O cliente tem entrega(s) pendente(s). Conclua ou cancele antes de anonimizar.");
    }

    LocalDate lastDocument = jdbc.queryForObject("""
        SELECT max(d) FROM (
          SELECT max(created_at)::date AS d FROM sales WHERE client_id = ?
          UNION ALL SELECT max(issue_date) FROM sales_orders WHERE client_id = ?
          UNION ALL SELECT max(issue_date) FROM sales_quotes WHERE client_id = ?
          UNION ALL SELECT max(issue_date) FROM receivables WHERE client_id = ?
        ) t""", LocalDate.class, clientId, clientId, clientId, clientId);

    boolean withinLegalRetention = lastDocument != null
        && lastDocument.isAfter(LocalDate.now().minusYears(legalRetentionYears));

    if (withinLegalRetention) {
      jdbc.update("""
          UPDATE clients SET email = NULL, primary_phone = NULL, birth_date = NULL, rg = NULL, gender = NULL,
                 mother_name = NULL, father_name = NULL, primary_contact_name = NULL, zip_code = NULL,
                 address = NULL, address_number = NULL, complement = NULL, district = NULL,
                 credit_limit = NULL, anonymized_at = now(), anonymization_level = 'PARTIAL', updated_at = now()
          WHERE id = ?""", clientId);
      return new AnonymizationResult(clientId, "PARTIAL", OffsetDateTime.now(),
          "Dados nao obrigatorios eliminados e cliente bloqueado para novos documentos. Nome, CPF/CNPJ, cidade "
              + "e UF ficam guardados por obrigacao legal ate " + lastDocument.plusYears(legalRetentionYears)
              + "; depois dessa data, repita a anonimizacao para eliminar tudo.");
    }

    String label = "Titular anonimizado " + clientId.toString().substring(0, 8);
    jdbc.update("""
        UPDATE clients SET name = ?, trade_name = NULL, cpf = NULL, cnpj = NULL, email = NULL, primary_phone = NULL,
               birth_date = NULL, rg = NULL, gender = NULL, mother_name = NULL, father_name = NULL,
               primary_contact_name = NULL, zip_code = NULL, address = NULL, address_number = NULL,
               complement = NULL, district = NULL, city = NULL, state = NULL, credit_limit = NULL,
               anonymized_at = now(), anonymization_level = 'FULL', updated_at = now()
        WHERE id = ?""", label, clientId);
    jdbc.update("UPDATE sales SET client_name = ? WHERE client_id = ?", label, clientId);
    jdbc.update("UPDATE sales_orders SET client_name = ?, client_document = NULL WHERE client_id = ?", label, clientId);
    jdbc.update("UPDATE sales_quotes SET client_name = ?, client_document = NULL WHERE client_id = ?", label, clientId);
    jdbc.update("""
        UPDATE deliveries SET full_address = NULL, receiver_name = NULL, city = NULL
        WHERE order_id IN (SELECT id FROM sales_orders WHERE client_id = ?)""", clientId);
    jdbc.update("""
        DELETE FROM delivery_locations WHERE delivery_id IN (
          SELECT d.id FROM deliveries d JOIN sales_orders o ON o.id = d.order_id WHERE o.client_id = ?)""", clientId);
    return new AnonymizationResult(clientId, "FULL", OffsetDateTime.now(),
        "Todos os dados que identificam o titular foram eliminados, inclusive copias em vendas, pedidos, "
            + "orcamentos, entregas e GPS. Os valores comerciais permanecem para fins estatisticos.");
  }
}
