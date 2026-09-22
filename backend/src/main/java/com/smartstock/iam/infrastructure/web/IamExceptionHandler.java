package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.application.usecase.InactiveUserException;
import com.smartstock.iam.application.usecase.InvalidCredentialsException;
import com.smartstock.iam.application.usecase.UserAlreadyExistsException;
import com.smartstock.iam.application.usecase.UserNotFoundException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class IamExceptionHandler {

  @ExceptionHandler({InvalidCredentialsException.class})
  public ResponseEntity<Map<String, String>> invalidCredentials() {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("message", "Usuario ou senha invalidos."));
  }

  @ExceptionHandler({InactiveUserException.class})
  public ResponseEntity<Map<String, String>> inactiveUser(InactiveUserException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler({UserAlreadyExistsException.class})
  public ResponseEntity<Map<String, String>> alreadyExists(UserAlreadyExistsException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler({UserNotFoundException.class})
  public ResponseEntity<Map<String, String>> notFound(UserNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler({IllegalArgumentException.class})
  public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("message", ex.getMessage()));
  }
}
