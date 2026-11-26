package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.infrastructure.security.RequestAttributes;
import com.smartstock.iam.infrastructure.security.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Registra na trilha de seguranca, depois de cada resposta, as operacoes sobre dados pessoais e
 * sensiveis: leitura de ficha de cliente/fornecedor, listagens com dados pessoais, alteracoes de
 * cadastro, exportacoes, consulta de localizacao GPS e mudancas de usuarios/configuracoes.
 * Tambem registra respostas 403 geradas dentro dos casos de uso (ex.: estorno sem permissao).
 *
 * <p>O envio de posicoes GPS pelo aplicativo nao e registrado aqui (seria um evento a cada poucos
 * segundos); o proprio ponto GPS ja guarda entrega e horario.
 */
@Component
public class AuditInterceptor implements HandlerInterceptor {

  private static final Set<String> WRITE = Set.of("POST", "PUT", "PATCH", "DELETE");

  record Rule(Set<String> methods, Pattern path, String eventType, String targetType) {
  }

  private static final List<Rule> RULES = List.of(
      new Rule(Set.of("GET"), Pattern.compile("/api/clients/([^/]+)/data-export"), "PERSONAL_DATA_EXPORT", "CLIENT"),
      new Rule(Set.of("POST"), Pattern.compile("/api/clients/([^/]+)/anonymize"), "PERSONAL_DATA_ANONYMIZE", "CLIENT"),
      new Rule(Set.of("GET"), Pattern.compile("/api/clients/([^/]+)(/history)?"), "PERSONAL_DATA_READ", "CLIENT"),
      new Rule(Set.of("GET"), Pattern.compile("/api/clients"), "PERSONAL_DATA_LIST", "CLIENT"),
      new Rule(WRITE, Pattern.compile("/api/clients(?:/([^/]+))?"), "PERSONAL_DATA_CHANGE", "CLIENT"),
      new Rule(Set.of("GET"), Pattern.compile("/api/suppliers/([^/]+)"), "PERSONAL_DATA_READ", "SUPPLIER"),
      new Rule(WRITE, Pattern.compile("/api/suppliers(?:/([^/]+))?"), "PERSONAL_DATA_CHANGE", "SUPPLIER"),
      new Rule(Set.of("GET"), Pattern.compile("/api/receivables/clients/([^/]+)/statement"), "PERSONAL_DATA_READ", "CLIENT_CREDIT"),
      new Rule(Set.of("GET"), Pattern.compile("/api/receivables/reports.*"), "DATA_EXPORT", "RECEIVABLES_REPORT"),
      new Rule(Set.of("GET"), Pattern.compile("/api/deliveries/live"), "LOCATION_READ", "DELIVERY"),
      new Rule(WRITE, Pattern.compile("/api/users(?:/([^/]+))?.*"), "USER_ADMIN_CHANGE", "USER"),
      new Rule(WRITE, Pattern.compile("/api/settings.*"), "SETTINGS_CHANGE", "SETTINGS"));

  private final SecurityAuditService audit;

  public AuditInterceptor(SecurityAuditService audit) {
    this.audit = audit;
  }

  @Override
  public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
      Exception ex) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())
        || Boolean.TRUE.equals(request.getAttribute(RequestAttributes.DENIAL_AUDITED))) {
      return;
    }
    int status = response.getStatus();
    String method = request.getMethod().toUpperCase();
    String uri = request.getRequestURI();

    if (status == 401 || status == 403) {
      audit.record(request, "ACCESS_DENIED", status, null, null, "negado pela regra de negocio");
      return;
    }
    if (status >= 400) {
      return;
    }
    for (Rule rule : RULES) {
      if (!rule.methods().contains(method)) {
        continue;
      }
      Matcher m = rule.path().matcher(uri);
      if (m.matches()) {
        String target = m.groupCount() >= 1 ? m.group(1) : null;
        audit.record(request, rule.eventType(), status, rule.targetType(), target, null);
        return;
      }
    }
  }
}
