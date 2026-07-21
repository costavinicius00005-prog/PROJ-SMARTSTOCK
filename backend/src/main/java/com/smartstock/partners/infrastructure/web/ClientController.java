package com.smartstock.partners.infrastructure.web;

import com.smartstock.partners.application.usecase.CreateClientCommand;
import com.smartstock.partners.application.usecase.ClientAlreadyExistsException;
import com.smartstock.partners.application.usecase.CreateClientUseCase;
import com.smartstock.partners.application.usecase.DeleteClientUseCase;
import com.smartstock.partners.application.usecase.ListClientsUseCase;
import com.smartstock.partners.domain.Client;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

  private final CreateClientUseCase createClientUseCase;
  private final ListClientsUseCase listClientsUseCase;
  private final DeleteClientUseCase deleteClientUseCase;

  public ClientController(
      CreateClientUseCase createClientUseCase,
      ListClientsUseCase listClientsUseCase,
      DeleteClientUseCase deleteClientUseCase) {
    this.createClientUseCase = createClientUseCase;
    this.listClientsUseCase = listClientsUseCase;
    this.deleteClientUseCase = deleteClientUseCase;
  }

  @GetMapping
  public List<ClientResponse> list() {
    return listClientsUseCase.execute().stream()
        .map(ClientResponse::fromDomain)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ClientResponse create(@RequestBody CreateClientRequest request) {
    Client client;

    try {
      client = createClientUseCase.execute(toCommand(request));
    } catch (ClientAlreadyExistsException exception) {
      throw exception;
    }

    return ClientResponse.fromDomain(client);
  }

  @ExceptionHandler(ClientAlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> handleClientAlreadyExists(
      ClientAlreadyExistsException exception) {
    return ResponseEntity
        .status(HttpStatus.CONFLICT)
        .body(Map.of("message", exception.getMessage()));
  }

  @DeleteMapping("/{clientId}")
  public ResponseEntity<Void> delete(@PathVariable UUID clientId) {
    deleteClientUseCase.execute(clientId);

    return ResponseEntity.noContent().build();
  }

  private CreateClientCommand toCommand(CreateClientRequest request) {
    return new CreateClientCommand(
        request.clientType(),
        request.cpf(),
        request.cnpj(),
        request.name(),
        request.tradeName(),
        request.email(),
        request.primaryPhone(),
        request.birthDate(),
        request.rg(),
        request.gender(),
        request.motherName(),
        request.fatherName(),
        request.primaryContactName(),
        request.zipCode(),
        request.address(),
        request.addressNumber(),
        request.complement(),
        request.district(),
        request.state(),
        request.city());
  }
}
