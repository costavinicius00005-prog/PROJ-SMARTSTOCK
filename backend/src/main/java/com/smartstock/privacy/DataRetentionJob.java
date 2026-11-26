package com.smartstock.privacy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Politica de retencao (LGPD art. 15 e 16: eliminar o dado quando a finalidade se encerra).
 * Roda todo dia as 03:00 e uma vez logo apos a inicializacao.
 *
 * <ul>
 *   <li>Pontos GPS de entregas: GPS_RETENTION_DAYS (padrao 30 dias). Servem ao acompanhamento da rota
 *       e a eventual contestacao da entrega; depois disso nao ha finalidade.</li>
 *   <li>Sessoes de login expiradas ou revogadas: SESSION_RETENTION_DAYS (padrao 90 dias).</li>
 *   <li>Trilha de seguranca: AUDIT_RETENTION_DAYS (padrao 365 dias; minimo de 180 dias, acima dos
 *       6 meses de guarda de registros de acesso do Marco Civil da Internet, art. 15).</li>
 * </ul>
 * Historico comercial, fiscal e financeiro (vendas, crediario, estoque) nao e apagado: a guarda e
 * obrigacao legal (LGPD art. 16, I). Para esses titulares existe a anonimizacao.
 */
@Component
public class DataRetentionJob {

  private static final Logger LOG = LoggerFactory.getLogger(DataRetentionJob.class);

  private final JdbcTemplate jdbc;
  private final int gpsDays;
  private final int sessionDays;
  private final int auditDays;

  public DataRetentionJob(
      JdbcTemplate jdbc,
      @Value("${GPS_RETENTION_DAYS:30}") int gpsDays,
      @Value("${SESSION_RETENTION_DAYS:90}") int sessionDays,
      @Value("${AUDIT_RETENTION_DAYS:365}") int auditDays) {
    this.jdbc = jdbc;
    this.gpsDays = Math.max(1, gpsDays);
    this.sessionDays = Math.max(1, sessionDays);
    this.auditDays = Math.max(180, auditDays);
  }

  @Scheduled(cron = "${RETENTION_CRON:0 0 3 * * *}")
  @Scheduled(initialDelay = 60_000, fixedDelay = Long.MAX_VALUE)
  @Transactional
  public void purge() {
    int gps = jdbc.update(
        "DELETE FROM delivery_locations WHERE recorded_at < now() - make_interval(days => ?)", gpsDays);
    int sessions = jdbc.update("""
        DELETE FROM user_sessions
        WHERE (revoked_at IS NOT NULL OR expires_at < now())
          AND COALESCE(revoked_at, expires_at) < now() - make_interval(days => ?)
        """, sessionDays);
    jdbc.execute("SET LOCAL smartstock.audit_purge = 'on'");
    int audit = jdbc.update(
        "DELETE FROM security_audit_log WHERE occurred_at < now() - make_interval(days => ?)", auditDays);
    jdbc.execute("SET LOCAL smartstock.audit_purge = 'off'");

    if (gps + sessions + audit > 0) {
      LOG.info("Retencao LGPD: {} ponto(s) GPS, {} sessao(oes) e {} registro(s) de auditoria eliminados.",
          gps, sessions, audit);
    }
  }
}
