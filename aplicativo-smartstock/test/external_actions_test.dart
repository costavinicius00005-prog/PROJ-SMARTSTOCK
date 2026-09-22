import 'package:flutter_test/flutter_test.dart';
import 'package:smartstock_delivery/core/services/external_actions.dart';
import 'package:smartstock_delivery/domain/models.dart';

void main() {
  final delivery = Delivery(
    id: 'delivery-1',
    orderNumber: 'SS-1042',
    customerName: 'Mercado Oliveira',
    phone: '(11) 98765-4321',
    address: 'Rua das Acácias, 142',
    neighborhood: 'Centro',
    city: 'São Paulo - SP',
    sequence: 1,
    status: DeliveryStatus.onRoute,
    scheduledAt: DateTime(2026, 8, 27),
    items: [],
    notes: '',
  );

  test('monta rota do Google Maps com o destino completo', () {
    final uri = ExternalActions.googleMapsWebUri(delivery);

    expect(uri.scheme, 'https');
    expect(uri.host, 'www.google.com');
    expect(uri.path, '/maps/dir/');
    expect(uri.queryParameters['api'], '1');
    expect(uri.queryParameters['travelmode'], 'driving');
    expect(
      uri.queryParameters['destination'],
      'Rua das Acácias, 142, Centro, São Paulo - SP',
    );
  });

  test('normaliza telefone brasileiro na URL do WhatsApp', () {
    final uri = ExternalActions.whatsAppUri(delivery);

    expect(uri?.host, 'wa.me');
    expect(uri?.path, '/5511987654321');
    expect(uri?.queryParameters['text'], contains('SS-1042'));
  });
}
