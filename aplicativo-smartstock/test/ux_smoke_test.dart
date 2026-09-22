import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartstock_delivery/app/smartstock_app.dart';
import 'package:smartstock_delivery/domain/delivery_repository.dart';
import 'package:smartstock_delivery/domain/models.dart';

void main() {
  testWidgets('fluxo móvel permite iniciar e concluir uma entrega', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final repository = _OperationRepository();
    await tester.pumpWidget(
      SmartStockApp(repository: repository, usesRemoteApi: true),
    );

    await tester.tap(find.text('Acessar minhas entregas'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Entregas'));
    await tester.pumpAndSettle();
    expect(find.text('Mercado Oliveira'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Mercado Oliveira'));
    await tester.pumpAndSettle();
    expect(find.text('Google Maps'), findsOneWidget);
    expect(find.text('Iniciar esta entrega'), findsOneWidget);
    _expectCleanLayout(tester, 'detalhe pendente');

    await tester.tap(find.text('Iniciar esta entrega'));
    await tester.pumpAndSettle();
    expect(find.text('Concluir entrega'), findsOneWidget);
    expect(repository.current.status, DeliveryStatus.onRoute);
    expect(tester.takeException(), isNull, reason: 'barra em rota');

    await tester.tap(find.text('Concluir entrega'));
    await tester.pumpAndSettle();
    expect(find.text('Confirmar recebimento'), findsOneWidget);
    expect(tester.takeException(), isNull, reason: 'modal de confirmação');

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Nome de quem recebeu'),
      'Maria Souza',
    );
    await tester.tap(find.text('Confirmar recebimento'));
    await tester.pumpAndSettle();

    expect(repository.current.status, DeliveryStatus.delivered);
    expect(repository.current.receiverName, 'Maria Souza');
    expect(find.text('Entrega concluída'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

void _expectCleanLayout(WidgetTester tester, String reason) {
  final exception = tester.takeException();
  if (exception != null) {
    for (final renderObject in tester.allRenderObjects.where(
      (renderObject) => renderObject.toStringShort().contains('OVERFLOWING'),
    )) {
      debugPrint(renderObject.toStringDeep());
    }
  }
  expect(exception, isNull, reason: reason);
}

class _OperationRepository extends DeliveryRepository {
  Delivery current = Delivery(
    id: 'delivery-1',
    orderNumber: 'SS-1042',
    customerName: 'Mercado Oliveira',
    phone: '11987654321',
    address: 'Rua das Acácias, 142',
    neighborhood: 'Centro',
    city: 'São Paulo - SP',
    sequence: 1,
    status: DeliveryStatus.pending,
    scheduledAt: DateTime(2026, 8, 27),
    items: const [DeliveryItem(name: 'Café Premium 500 g', quantity: 6)],
    notes: 'Receber pela entrada lateral.',
  );

  @override
  Future<void> initialize() async {}

  @override
  Future<AppUser> login(String email, String password) async => const AppUser(
    id: 'driver-1',
    name: 'Marcos Silva',
    email: 'admin@smartstock.com',
  );

  @override
  Future<List<Delivery>> getDeliveries() async => [current];

  @override
  Future<List<DeliveryEvent>> getEvents(String deliveryId) async => const [];

  @override
  Future<int> pendingSyncCount() async => 0;

  @override
  Future<void> updateDelivery(Delivery delivery, {String? eventNote}) async {
    current = delivery;
  }
}
