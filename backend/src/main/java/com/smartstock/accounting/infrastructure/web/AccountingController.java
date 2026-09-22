package com.smartstock.accounting.infrastructure.web;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

  private final JdbcTemplate jdbc;

  public AccountingController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/overview")
  public Map<String, Object> overview() {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("period", "Este mes");

    out.put("salesRevenueMonth", scalar("""
        SELECT COALESCE(sum(total), 0) FROM sales_orders
        WHERE status IN ('CONFIRMED', 'FULFILLED')
          AND date_trunc('month', issue_date) = date_trunc('month', CURRENT_DATE)
        """));
    out.put("receivedThisMonth", scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'RECEBER' AND status = 'PAGO'
          AND date_trunc('month', updated_at) = date_trunc('month', now())
        """));
    out.put("expensesPaidMonth", scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'PAGAR' AND status = 'PAGO'
          AND date_trunc('month', updated_at) = date_trunc('month', now())
        """));
    out.put("overdueExpenses", scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'PAGAR' AND status = 'ABERTO' AND due_date < CURRENT_DATE
        """));
    out.put("overdueReceivables", scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'RECEBER' AND status = 'ABERTO' AND due_date < CURRENT_DATE
        """));

    BigDecimal receitas = scalar("""
        SELECT COALESCE((
          SELECT sum(amount) FROM accounts
          WHERE account_type = 'RECEBER' AND status = 'PAGO'
            AND date_trunc('month', updated_at) = date_trunc('month', now())
        ), 0) + COALESCE((
          SELECT sum(total) FROM sales_orders
          WHERE status IN ('CONFIRMED', 'FULFILLED')
            AND date_trunc('month', issue_date) = date_trunc('month', CURRENT_DATE)
        ), 0)
        """);
    BigDecimal despesas = scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'PAGAR' AND status = 'PAGO'
          AND date_trunc('month', updated_at) = date_trunc('month', now())
        """);
    out.put("netResult", receitas.subtract(despesas));
    out.put("receivablesOpen", scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'RECEBER' AND status = 'ABERTO'
        """));
    out.put("payablesOpen", scalar("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'PAGAR' AND status = 'ABERTO'
        """));
    return out;
  }

  private BigDecimal scalar(String sql) {
    return jdbc.queryForObject(sql, BigDecimal.class);
  }
}
