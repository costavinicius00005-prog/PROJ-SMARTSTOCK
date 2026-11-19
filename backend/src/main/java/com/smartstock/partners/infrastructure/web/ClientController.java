package com.smartstock.partners.infrastructure.web;

import com.smartstock.partners.application.usecase.CreateClientCommand;
import com.smartstock.partners.application.usecase.ClientAlreadyExistsException;
import com.smartstock.partners.application.usecase.CreateClientUseCase;
import com.smartstock.partners.application.usecase.DeleteClientUseCase;
import com.smartstock.partners.application.usecase.ClientInUseException;
import com.smartstock.partners.application.usecase.ClientNotFoundException;
import com.smartstock.partners.application.usecase.GetClientUseCase;
import com.smartstock.partners.application.usecase.UpdateClientUseCase;
import com.smartstock.partners.infrastructure.persistence.ClientPurchaseHistoryQuery;
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
import org.springframework.web.bind.annotation.PutMapping;
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
  private final GetClientUseCase getClientUseCase;
  private final UpdateClientUseCase updateClientUseCase;
  private final ClientPurchaseHistoryQuery purchaseHistoryQuery;

  public ClientController(
      CreateClientUseCase createClientUseCase,
      ListClientsUseCase listClientsUseCase,
      DeleteClientUseCase deleteClientUseCase,
      GetClientUseCase getClientUseCase,
      UpdateClientUseCase updateClientUseCase,
      ClientPurchaseHistoryQuery purchaseHistoryQuery) {
    this.createClientUseCase = createClientUseCase;
    this.listClientsUseCase = listClientsUseCase;
    this.deleteClientUseCase = deleteClientUseCase;
    this.getClientUseCase = getClientUseCase;
    this.updateClientUseCase = updateClientUseCase;
    this.purchaseHistoryQuery = purchaseHistoryQuery;
  }

  @GetMapping("/{clientId}")
  public ClientResponse get(@PathVariable UUID clientId) {
    return ClientResponse.fromDomain(getClientUseCase.execute(clientId));
  }

  @PutMapping("/{clientId}")
  public ClientResponse update(@PathVariable UUID clientId, @RequestBody CreateClientRequest request) {
    return ClientResponse.fromDomain(updateClientUseCase.execute(clientId, toCommand(request)));
  }

  @GetMapping("/{clientId}/history")
  public List<ClientPurchaseHistoryQuery.Entry> history(@PathVariable UUID clientId) {
    getClientUseCase.execute(clientId);
    return purchaseHistoryQuery.find(clientId);
  }

  @ExceptionHandler(ClientNotFoundException.class)
  public ResponseEntity<Map<String, String>> handleNotFound(ClientNotFoundException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", exception.getMessage()));
  }

  @ExceptionHandler(ClientInUseException.class)
  public ResponseEntity<Map<String, String>> handleInUse(ClientInUseException exception) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", exception.getMessage()));
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
        request.city(),
        request.creditLimit());
  }
}
