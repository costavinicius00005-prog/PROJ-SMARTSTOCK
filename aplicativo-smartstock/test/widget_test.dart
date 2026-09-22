import 'package:flutter_test/flutter_test.dart';
import 'package:smartstock_delivery/domain/models.dart';

void main() {
  test('status de entrega possui rótulo em português', () {
    expect(DeliveryStatus.onRoute.label, 'Em rota');
    expect(DeliveryStatus.delivered.label, 'Entregue');
  });
}
