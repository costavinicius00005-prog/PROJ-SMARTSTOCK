package com.smartstock.receivables.infrastructure.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Relogio do negocio. Datas como "hoje", vencido e data de emissao seguem o fuso da loja
 * (padrao America/Sao_Paulo), e nao o fuso do servidor/container (normalmente UTC).
 */
@Configuration
public class BusinessClockConfiguration {

  @Bean
  @ConditionalOnMissingBean(Clock.class)
  public Clock businessClock(@Value("${APP_TIMEZONE:America/Sao_Paulo}") String zone) {
    return Clock.system(ZoneId.of(zone));
  }
}
