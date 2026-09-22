import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../domain/delivery_repository.dart';
import '../../domain/models.dart';

/// Adaptador para a API Spring Boot já existente no SmartStock.
///
/// Os endpoints atuais ainda não expõem comprovantes, eventos ou rota por
/// entregador. Por isso, a integração cobre login, consulta de entregas e
/// atualização de status, sem acoplar a interface do aplicativo ao backend.
class ApiDeliveryRepository extends DeliveryRepository {
  ApiDeliveryRepository({required String baseUrl, http.Client? client})
    : _baseUrl = baseUrl.replaceFirst(RegExp(r'/$'), ''),
      _client = client ?? http.Client();

  final String _baseUrl;
  final http.Client _client;
  static const _requestTimeout = Duration(seconds: 15);
  String? _currentEmail;

  @override
  Future<void> initialize() async {}

  @override
  Future<AppUser> login(String email, String password) async {
    _currentEmail = email.trim().toLowerCase();
    final response = await _client
        .post(
          Uri.parse('$_baseUrl/auth/login'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email.trim(), 'password': password}),
        )
        .timeout(_requestTimeout);
    _ensureSuccess(response, 'Não foi possível entrar.');
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return AppUser(
      id: json['email'] as String,
      name: json['userName'] as String? ?? 'Entregador SmartStock',
      email: json['email'] as String? ?? email.trim(),
    );
  }

  @override
  Future<List<Delivery>> getDeliveries() async {
    final results = await Future.wait([
      _getList('/deliveries'),
      _getList('/clients'),
      _getList('/orders'),
      _getList('/products'),
    ]);
    final clients = {for (final item in results[1]) item['id'] as String: item};
    final orders = {for (final item in results[2]) item['id'] as String: item};
    final products = {for (final item in results[3]) '${item['id']}': item};

    // Cada entregador ve as rotas designadas a ele (por e-mail) e as que ainda
    // nao tem entregador; rotas de outros entregadores ficam ocultas.
    final items = _currentEmail == null
        ? results[0]
        : results[0].where((item) {
            final assignee = item['assigneeEmail'] as String?;
            if (assignee == null || assignee.trim().isEmpty) return true;
            return assignee.toLowerCase() == _currentEmail!.toLowerCase();
          }).toList();

    final deliveries = items.map((item) {
      final client = clients[item['clientId']] ?? const <String, dynamic>{};
      final order = orders[item['orderId']] ?? const <String, dynamic>{};
      final orderItems = (order['items'] as List<dynamic>? ?? const [])
          .cast<Map<String, dynamic>>();
      // Endereco completo (rua, numero, bairro, cidade, UF) capturado na rota
      final fullAddress = item['fullAddress'] as String?;
      final useFullAddress = fullAddress?.trim().isNotEmpty ?? false;
      return Delivery(
        id: item['id'] as String,
        orderNumber: order['number'] as String? ?? 'Pedido sem número',
        customerName: client['name'] as String? ?? 'Cliente não informado',
        phone: client['phone'] as String? ??
            client['primaryPhone'] as String? ??
            '',
        // Quando a rota carrega o endereco completo, ele e a referencia exata
        // para o Google Maps; caso contrario, monta a partir do cliente.
        address: useFullAddress ? fullAddress! : _clientAddress(client),
        neighborhood: useFullAddress
            ? ''
            : client['neighborhood'] as String? ??
                client['district'] as String? ??
                '',
        city: useFullAddress
            ? ''
            : item['city'] as String? ?? client['city'] as String? ?? '',
        sequence: 0,
        status: _statusFromApi(item['status'] as String? ?? 'Pendente'),
        scheduledAt:
            DateTime.tryParse(item['scheduledDate'] as String? ?? '') ??
            DateTime.now(),
        notes: '',
        receiverName: item['receiverName'] as String?,
        failureReason: item['failureReason'] as String?,
        items: orderItems.map((orderItem) {
          final product = products['${orderItem['productId']}'];
          return DeliveryItem(
            name: product?['name'] as String? ?? 'Produto',
            quantity: (orderItem['quantity'] as num?)?.round() ?? 0,
          );
        }).toList(),
      );
    }).toList();
    deliveries.sort((a, b) {
      final statusCompare = a.status == DeliveryStatus.delivered ? 1 : 0;
      final otherStatusCompare = b.status == DeliveryStatus.delivered ? 1 : 0;
      return statusCompare != otherStatusCompare
          ? statusCompare.compareTo(otherStatusCompare)
          : a.scheduledAt.compareTo(b.scheduledAt);
    });
    return [
      for (var index = 0; index < deliveries.length; index++)
        deliveries[index].copyWithSequence(index + 1),
    ];
  }

  @override
  Future<List<DeliveryEvent>> getEvents(String deliveryId) async => const [];

  @override
  Future<void> updateDelivery(Delivery delivery, {String? eventNote}) async {
    final response = await _client
        .put(
          Uri.parse('$_baseUrl/deliveries/${delivery.id}/status'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({
            'status': _statusToApi(delivery.status),
            'receiverName': delivery.receiverName,
            'failureReason': delivery.failureReason ?? eventNote,
          }),
        )
        .timeout(_requestTimeout);
    _ensureSuccess(response, 'Não foi possível atualizar a entrega.');
  }

  @override
  bool get supportsLiveTracking => true;

  @override
  Future<bool> sendLocation(
    String deliveryId,
    double latitude,
    double longitude,
  ) async {
    try {
      final response = await _client
          .post(
            Uri.parse('$_baseUrl/deliveries/$deliveryId/locations'),
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode({
              'latitude': latitude,
              'longitude': longitude,
              'recordedAt': DateTime.now().toUtc().toIso8601String(),
            }),
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode < 200 || response.statusCode >= 300) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<int> pendingSyncCount() async => 0;

  Future<List<Map<String, dynamic>>> _getList(String path) async {
    final response = await _client
        .get(Uri.parse('$_baseUrl$path'))
        .timeout(_requestTimeout);
    _ensureSuccess(response, 'Não foi possível carregar $path.');
    return (jsonDecode(response.body) as List<dynamic>)
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  void _ensureSuccess(http.Response response, String fallback) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        '${response.statusCode}: ${response.body.isEmpty ? fallback : response.body}',
      );
    }
  }

  DeliveryStatus _statusFromApi(String value) => switch (value.toLowerCase()) {
    'em rota' => DeliveryStatus.onRoute,
    'entregue' => DeliveryStatus.delivered,
    'cancelada' => DeliveryStatus.failed,
    _ => DeliveryStatus.pending,
  };

  String _statusToApi(DeliveryStatus value) => switch (value) {
    DeliveryStatus.pending => 'Pendente',
    DeliveryStatus.onRoute => 'Em rota',
    DeliveryStatus.delivered => 'Entregue',
    DeliveryStatus.failed => 'Cancelada',
  };

  String _clientAddress(Map<String, dynamic> client) {
    final address = client['address'] as String?;
    if (address?.trim().isNotEmpty == true) {
      final number = client['addressNumber'] as String?;
      if (number?.trim().isNotEmpty == true) return '$address, $number'.trim();
      return address!.trim();
    }
    return [
      client['street'] as String? ?? '',
      client['number'] as String? ?? '',
    ].where((part) => part.trim().isNotEmpty).join(', ');
  }
}

extension on Delivery {
  Delivery copyWithSequence(int sequence) => Delivery(
    id: id,
    orderNumber: orderNumber,
    customerName: customerName,
    phone: phone,
    address: address,
    neighborhood: neighborhood,
    city: city,
    sequence: sequence,
    status: status,
    scheduledAt: scheduledAt,
    items: items,
    notes: notes,
    receiverName: receiverName,
    failureReason: failureReason,
    proofPath: proofPath,
  );
}
