package com.smartstock.iam.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;

/**
 * IP de origem da requisicao. A API fica atras do Next.js, do ngrok ou do Cloudflare Tunnel, que
 * informam o cliente real no primeiro item de X-Forwarded-For; sem o cabecalho, usa o IP da conexao.
 */
public final class ClientIp {

  private ClientIp() {
  }

  public static String of(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      String first = forwarded.split(",")[0].trim();
      if (!first.isEmpty() && first.length() <= 64) {
        return first;
      }
    }
    return request.getRemoteAddr();
  }
}
