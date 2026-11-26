package com.smartstock.privacy;

import com.smartstock.iam.infrastructure.security.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Atendimento aos direitos do titular. Somente ADMIN (ModuleAccessPolicy); cada uso fica na trilha
 * de seguranca (o AuditInterceptor registra o evento e aqui guardamos a justificativa e o resultado).
 */
@RestController
@RequestMapping("/api/clients/{clientId}")
public class ClientPrivacyController {

  private final ClientPrivacyService privacy;
  private final SecurityAuditService audit;

  public ClientPrivacyController(ClientPrivacyService privacy, SecurityAuditService audit) {
    this.privacy = privacy;
    this.audit = audit;
  }

  public record AnonymizeRequest(String reason) {
  }

  @GetMapping("/data-export")
  public ResponseEntity<Map<String, Object>> export(@PathVariable UUID clientId) {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"dados-titular-" + clientId + ".json\"")
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(privacy.export(clientId));
  }

  @PostMapping("/anonymize")
  public ClientPrivacyService.AnonymizationResult anonymize(
      @PathVariable UUID clientId, @RequestBody AnonymizeRequest body, HttpServletRequest request) {
    var result = privacy.anonymize(clientId, body == null ? null : body.reason());
    audit.record(request, "PERSONAL_DATA_ANONYMIZE_DETAIL", 200, "CLIENT", clientId.toString(),
        "nivel " + result.level() + "; justificativa: " + body.reason().trim());
    return result;
  }
}
