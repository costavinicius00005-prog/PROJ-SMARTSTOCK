package com.smartstock.iam.infrastructure.web;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableScheduling
public class WebSecurityConfig implements WebMvcConfigurer {

  /**
   * Origens de navegador autorizadas a chamar a API diretamente. O ERP web nao precisa de CORS
   * (o navegador fala com o Next.js, que repassa ao Spring no servidor); a lista existe para a
   * versao web do aplicativo do entregador, servida em /aplicativo e publicada por tunel.
   * O aplicativo Android nao e navegador e nao e afetado por CORS.
   */
  private static final String DEFAULT_ORIGINS =
      "http://localhost:3000,http://127.0.0.1:3000,https://*.ngrok-free.dev,https://*.ngrok-free.app,"
          + "https://*.trycloudflare.com";

  private final AuthInterceptor authInterceptor;
  private final AuditInterceptor auditInterceptor;
  private final String[] allowedOrigins;

  public WebSecurityConfig(
      AuthInterceptor authInterceptor,
      AuditInterceptor auditInterceptor,
      @Value("${CORS_ALLOWED_ORIGINS:}") String corsAllowedOrigins) {
    this.authInterceptor = authInterceptor;
    this.auditInterceptor = auditInterceptor;
    String origins = corsAllowedOrigins == null || corsAllowedOrigins.isBlank()
        ? DEFAULT_ORIGINS
        : corsAllowedOrigins;
    this.allowedOrigins = Arrays.stream(origins.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isEmpty() && !"*".equals(origin))
        .toArray(String[]::new);
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
        .addInterceptor(authInterceptor)
        .addPathPatterns("/api/**")
        .excludePathPatterns("/api/auth/login");
    registry
        .addInterceptor(auditInterceptor)
        .addPathPatterns("/api/**")
        .excludePathPatterns("/api/auth/login");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOriginPatterns(allowedOrigins)
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("Authorization", "Content-Type", "ngrok-skip-browser-warning")
        .allowCredentials(false)
        .maxAge(3600);
  }
}
