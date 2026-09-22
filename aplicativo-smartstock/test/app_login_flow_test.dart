import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartstock_delivery/app/smartstock_app.dart';
import 'package:smartstock_delivery/domain/delivery_repository.dart';
import 'package:smartstock_delivery/domain/models.dart';

void main() {
  testWidgets('entra na operação após autenticação válida', (tester) async {
    await tester.pumpWidget(
      SmartStockApp(repository: _RepositoryStub(), usesRemoteApi: true),
    );

    await tester.tap(find.text('Acessar minhas entregas'));
    await tester.pumpAndSettle();

    expect(find.text('Acessar minhas entregas'), findsNothing);
    expect(find.text('Início'), findsOneWidget);
    expect(find.byIcon(Icons.space_dashboard_rounded), findsOneWidget);
  });
}

class _RepositoryStub extends DeliveryRepository {
  @override
  Future<void> initialize() async {}

  @override
  Future<AppUser> login(String email, String password) async => const AppUser(
    id: 'test-user',
    name: 'Admin SmartStock',
    email: 'admin@smartstock.com',
  );

  @override
  Future<List<Delivery>> getDeliveries() async => const [];

  @override
  Future<List<DeliveryEvent>> getEvents(String deliveryId) async => const [];

  @override
  Future<int> pendingSyncCount() async => 0;

  @override
  Future<void> updateDelivery(Delivery delivery, {String? eventNote}) async {}
}
