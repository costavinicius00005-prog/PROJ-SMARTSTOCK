package com.smartstock.iam.infrastructure.security;

/** Atributos gravados na requisicao pelo AuthInterceptor depois de validar a sessao. */
public final class RequestAttributes {

  public static final String USER_ID = "smartstock.auth.userId";
  public static final String USERNAME = "smartstock.auth.username";
  public static final String DISPLAY_NAME = "smartstock.auth.displayName";
  public static final String ROLE = "smartstock.auth.role";
  public static final String SESSION_ID = "smartstock.auth.sessionId";
  /** Marca que o interceptor ja registrou o acesso negado (evita registro duplicado). */
  public static final String DENIAL_AUDITED = "smartstock.audit.denialRecorded";

  private RequestAttributes() {
  }
}
