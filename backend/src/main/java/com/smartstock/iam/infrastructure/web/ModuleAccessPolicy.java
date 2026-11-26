package com.smartstock.iam.infrastructure.web;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Matriz de permissoes por modulo, aplicada no servidor pelo {@link AuthInterceptor} antes de
 * qualquer controller. A primeira regra que casa com metodo + caminho decide; sem regra, basta
 * estar autenticado. Regras mais finas (ex.: estorno no crediario) continuam nos casos de uso via
 * {@link AccessGuard}.
 *
 * <pre>
 * Modulo / operacao                                   ADMIN  FINANCEIRO  OPERADOR
 * Usuarios, sessoes de terceiros, trilha de seguranca   x
 * LGPD: anonimizar / exportar dados do titular          x
 * Excluir cliente, fornecedor ou produto                x
 * Alterar configuracoes da empresa                      x
 * Financeiro (contas a pagar/receber) e contabilidade   x        x
 * Localizacao GPS ao vivo das entregas                  x                    x
 * Demais modulos (cadastros, vendas, estoque, entregas) x        x           x
 * </pre>
 */
@Component
public class ModuleAccessPolicy {

  private static final Set<String> ANY_METHOD = Set.of();
  private static final Set<String> WRITE = Set.of("POST", "PUT", "PATCH", "DELETE");

  record Rule(Set<String> methods, Pattern path, Set<String> roles, String description) {
    boolean matches(String method, String uri) {
      return (methods.isEmpty() || methods.contains(method)) && path.matcher(uri).matches();
    }
  }

  private static final List<Rule> RULES = List.of(
      rule(ANY_METHOD, "/api/users(/.*)?", "administracao de usuarios", "ADMIN"),
      rule(ANY_METHOD, "/api/security(/.*)?", "trilha de seguranca e sessoes", "ADMIN"),
      rule(ANY_METHOD, "/api/clients/[^/]+/(anonymize|data-export)", "direitos do titular (LGPD)", "ADMIN"),
      rule(Set.of("DELETE"), "/api/(clients|suppliers|products)/.+", "exclusao de cadastros", "ADMIN"),
      rule(WRITE, "/api/settings(/.*)?", "configuracoes da empresa", "ADMIN"),
      rule(ANY_METHOD, "/api/finance(/.*)?", "modulo financeiro", "ADMIN", "FINANCEIRO"),
      rule(ANY_METHOD, "/api/accounting(/.*)?", "contabilidade", "ADMIN", "FINANCEIRO"),
      rule(Set.of("GET"), "/api/deliveries/live", "localizacao GPS das entregas", "ADMIN", "OPERADOR"));

  private static Rule rule(Set<String> methods, String regex, String description, String... roles) {
    return new Rule(methods, Pattern.compile(regex), Set.of(roles), description);
  }

  /** Retorna a regra que negou o acesso, ou vazio quando o papel pode prosseguir. */
  public Optional<Rule> deniedBy(String method, String uri, String role) {
    for (Rule rule : RULES) {
      if (rule.matches(method, uri)) {
        return rule.roles().contains(role) ? Optional.empty() : Optional.of(rule);
      }
    }
    return Optional.empty();
  }
}
