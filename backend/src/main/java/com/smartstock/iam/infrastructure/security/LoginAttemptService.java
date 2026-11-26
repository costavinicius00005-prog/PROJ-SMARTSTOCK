package com.smartstock.iam.infrastructure.security;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Limita tentativas de login (protecao contra forca bruta e teste de senhas vazadas).
 *
 * <ul>
 *   <li>Por usuario: LOGIN_MAX_FAILURES (padrao 5) falhas em LOGIN_WINDOW_MINUTES (padrao 15)
 *       bloqueiam novas tentativas desse usuario ate a janela expirar.</li>
 *   <li>Por IP: 4x o limite por usuario, para frear quem testa muitos usuarios a partir do mesmo
 *       endereco.</li>
 * </ul>
 * Um login bem-sucedido limpa o contador do usuario. Os contadores ficam em memoria: reiniciar a
 * API zera os bloqueios (aceitavel para uma instancia unica).
 */
@Service
public class LoginAttemptService {

  private final int maxFailuresPerUser;
  private final int maxFailuresPerIp;
  private final Duration window;
  private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

  public LoginAttemptService(
      @Value("${LOGIN_MAX_FAILURES:5}") int maxFailures,
      @Value("${LOGIN_WINDOW_MINUTES:15}") long windowMinutes) {
    this.maxFailuresPerUser = Math.max(3, maxFailures);
    this.maxFailuresPerIp = this.maxFailuresPerUser * 4;
    this.window = Duration.ofMinutes(Math.max(1, windowMinutes));
  }

  /** Segundos que faltam para liberar novas tentativas; 0 quando permitido. */
  public long blockedForSeconds(String identifier, String ip) {
    long byUser = remaining(userKey(identifier), maxFailuresPerUser);
    long byIp = remaining(ipKey(ip), maxFailuresPerIp);
    return Math.max(byUser, byIp);
  }

  public void recordFailure(String identifier, String ip) {
    Instant now = Instant.now();
    add(userKey(identifier), now);
    add(ipKey(ip), now);
  }

  public void recordSuccess(String identifier) {
    failures.remove(userKey(identifier));
  }

  public long windowMinutes() {
    return window.toMinutes();
  }

  @Scheduled(fixedDelay = 300_000)
  public void evictOld() {
    Instant limit = Instant.now().minus(window);
    failures.entrySet().removeIf(entry -> {
      synchronized (entry.getValue()) {
        entry.getValue().removeIf(t -> t.isBefore(limit));
        return entry.getValue().isEmpty();
      }
    });
  }

  private long remaining(String key, int max) {
    Deque<Instant> list = failures.get(key);
    if (list == null) {
      return 0;
    }
    synchronized (list) {
      Instant limit = Instant.now().minus(window);
      list.removeIf(t -> t.isBefore(limit));
      if (list.size() < max) {
        return 0;
      }
      Instant unblockAt = list.peekFirst().plus(window);
      return Math.max(1, Duration.between(Instant.now(), unblockAt).toSeconds());
    }
  }

  private void add(String key, Instant when) {
    Deque<Instant> list = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
    synchronized (list) {
      list.addLast(when);
      while (list.size() > maxFailuresPerIp + 1) {
        list.removeFirst();
      }
    }
  }

  private static String userKey(String identifier) {
    return "u:" + (identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT));
  }

  private static String ipKey(String ip) {
    return "ip:" + (ip == null ? "" : ip);
  }
}
