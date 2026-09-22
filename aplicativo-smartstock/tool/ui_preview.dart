import 'package:flutter/material.dart';
import 'package:smartstock_delivery/core/theme/app_theme.dart';
import 'package:smartstock_delivery/domain/delivery_repository.dart';
import 'package:smartstock_delivery/domain/models.dart';
import 'package:smartstock_delivery/features/home/home_shell.dart';

void main() => runApp(const _PreviewApp());

class _PreviewApp extends StatelessWidget {
  const _PreviewApp();

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: AppTheme.light(),
    home: HomeShell(
      repository: _PreviewRepository(),
      user: const AppUser(
        id: 'preview',
        name: 'Marcos Silva',
        email: 'marcos@smartstock.com',
      ),
      usesRemoteApi: true,
      onLogout: _noop,
    ),
  );
}

void _noop() {}

class _PreviewRepository extends DeliveryRepository {
  final _deliveries = [
    Delivery(
      id: '1',
      orderNumber: 'SS-1042',
      customerName: 'Mercado Oliveira',
      phone: '11987654321',
      address: 'Rua das Acácias, 142',
      neighborhood: 'Centro',
      city: 'São Paulo - SP',
      sequence: 1,
      status: DeliveryStatus.onRoute,
      scheduledAt: DateTime.now(),
      items: const [
        DeliveryItem(name: 'Café Premium 500 g', quantity: 6),
        DeliveryItem(name: 'Açúcar Refinado 1 kg', quantity: 12),
      ],
      notes: 'Receber pela entrada lateral.',
    ),
    Delivery(
      id: '2',
      orderNumber: 'SS-1048',
      customerName: 'Padaria Pão Quente',
      phone: '11976543210',
      address: 'Av. Brasil, 890',
      neighborhood: 'Jardins',
      city: 'São Paulo - SP',
      sequence: 2,
      status: DeliveryStatus.pending,
      scheduledAt: DateTime.now(),
      items: const [DeliveryItem(name: 'Leite Integral 1 L', quantity: 24)],
      notes: '',
    ),
    Delivery(
      id: '3',
      orderNumber: 'SS-1051',
      customerName: 'Restaurante Sabor Caseiro',
      phone: '11991234567',
      address: '',
      neighborhood: '',
      city: 'Campinas - SP',
      sequence: 3,
      status: DeliveryStatus.pending,
      scheduledAt: DateTime.now(),
      items: const [DeliveryItem(name: 'Óleo de Soja 900 ml', quantity: 18)],
      notes: '',
    ),
    Delivery(
      id: '4',
      orderNumber: 'SS-1039',
      customerName: 'Empório Verde',
      phone: '11995550011',
      address: 'Alameda das Flores, 320',
      neighborhood: 'Moema',
      city: 'São Paulo - SP',
      sequence: 4,
      status: DeliveryStatus.delivered,
      scheduledAt: DateTime.now(),
      receiverName: 'Carla Mendes',
      items: const [DeliveryItem(name: 'Granola 1 kg', quantity: 4)],
      notes: '',
    ),
  ];

  @override
  Future<void> initialize() async {}

  @override
  Future<AppUser> login(String email, String password) async => const AppUser(
    id: 'preview',
    name: 'Marcos Silva',
    email: 'marcos@smartstock.com',
  );

  @override
  Future<List<Delivery>> getDeliveries() async => _deliveries;

  @override
  Future<List<DeliveryEvent>> getEvents(String deliveryId) async => const [];

  @override
  Future<int> pendingSyncCount() async => 0;

  @override
  Future<void> updateDelivery(Delivery delivery, {String? eventNote}) async {}
}
