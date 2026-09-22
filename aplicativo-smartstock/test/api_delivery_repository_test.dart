import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smartstock_delivery/data/remote/api_delivery_repository.dart';
import 'package:smartstock_delivery/domain/models.dart';

void main() {
  test('integra o aplicativo com os endpoints atuais do Spring Boot', () async {
    String? updatedStatus;
    String? receiverName;
    final client = MockClient((request) async {
      if (request.method == 'POST' && request.url.path == '/api/auth/login') {
        return _json({
          'userName': 'Marcos Silva',
          'email': 'entregador@smartstock.com',
        });
      }
      if (request.method == 'GET' && request.url.path == '/api/deliveries') {
        return _json([
          {
            'id': 'delivery-1',
            'orderId': 'order-1',
            'clientId': 'client-1',
            'city': 'São Paulo - SP',
            'status': 'Pendente',
            'scheduledDate': '2026-08-21',
          },
        ]);
      }
      if (request.method == 'GET' && request.url.path == '/api/clients') {
        return _json([
          {
            'id': 'client-1',
            'name': 'Mercado Oliveira',
            'phone': '11987654321',
            'city': 'São Paulo - SP',
          },
        ]);
      }
      if (request.method == 'GET' && request.url.path == '/api/orders') {
        return _json([
          {
            'id': 'order-1',
            'number': 'SS-1042',
            'items': [
              {'productId': 10, 'quantity': 6},
            ],
          },
        ]);
      }
      if (request.method == 'GET' && request.url.path == '/api/products') {
        return _json([
          {'id': 10, 'name': 'Café Premium 500 g'},
        ]);
      }
      if (request.method == 'PUT' &&
          request.url.path == '/api/deliveries/delivery-1/status') {
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        updatedStatus = body['status'] as String;
        receiverName = body['receiverName'] as String?;
        return _json({'id': 'delivery-1', 'status': updatedStatus});
      }
      return http.Response(
        'Rota não esperada: ${request.method} ${request.url}',
        404,
      );
    });
    final repository = ApiDeliveryRepository(
      baseUrl: 'http://api-teste.local/api',
      client: client,
    );

    final user = await repository.login('entregador@smartstock.com', '123456');
    final deliveries = await repository.getDeliveries();
    await repository.updateDelivery(
      deliveries.single.copyWith(
        status: DeliveryStatus.delivered,
        receiverName: 'Maria Souza',
      ),
    );

    expect(user.name, 'Marcos Silva');
    expect(deliveries.single.customerName, 'Mercado Oliveira');
    expect(deliveries.single.orderNumber, 'SS-1042');
    expect(deliveries.single.items.single.name, 'Café Premium 500 g');
    expect(updatedStatus, 'Entregue');
    expect(receiverName, 'Maria Souza');
  });
}

http.Response _json(Object body) => http.Response(
  jsonEncode(body),
  200,
  headers: const {'content-type': 'application/json'},
);
