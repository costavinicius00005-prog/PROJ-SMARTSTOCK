package com.smartstock.settings.infrastructure.web;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

  private final JdbcTemplate jdbc;

  public SettingsController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping
  public Map<String, String> all() {
    Map<String, String> settings = new LinkedHashMap<>();
    jdbc.query("SELECT key, value FROM app_settings ORDER BY key",
        (org.springframework.jdbc.core.RowCallbackHandler) rs ->
            settings.put(rs.getString(1), rs.getString(2)));
    return settings;
  }

  @PutMapping
  public ResponseEntity<Map<String, String>> update(@RequestBody Map<String, String> body) {
    if (body == null || body.isEmpty()) {
      return ResponseEntity.badRequest().build();
    }
    for (Map.Entry<String, String> entry : body.entrySet()) {
      String key = entry.getKey();
      if (key == null || key.isBlank() || key.length() > 80) {
        continue;
      }
      jdbc.update("""
          INSERT INTO app_settings (key, value, updated_at)
          VALUES (?, ?, now())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
          """, key, entry.getValue() == null ? "" : entry.getValue());
    }
    return ResponseEntity.ok(all());
  }
}
