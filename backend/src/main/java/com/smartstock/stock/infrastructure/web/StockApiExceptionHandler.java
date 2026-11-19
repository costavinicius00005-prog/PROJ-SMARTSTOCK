package com.smartstock.stock.infrastructure.web;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/** Devolve as mensagens de validacao do estoque como {"message": ...} para exibicao na tela. */
@RestControllerAdvice(assignableTypes = StockController.class)
public class StockApiExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> handle(ResponseStatusException exception) {
    String message = exception.getReason() != null ? exception.getReason() : "Falha na operacao de estoque.";
    return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", message));
  }
}
