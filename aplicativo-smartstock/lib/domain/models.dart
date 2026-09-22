enum DeliveryStatus { pending, onRoute, delivered, failed }

extension DeliveryStatusLabel on DeliveryStatus {
  String get label => switch (this) {
    DeliveryStatus.pending => 'Pendente',
    DeliveryStatus.onRoute => 'Em rota',
    DeliveryStatus.delivered => 'Entregue',
    DeliveryStatus.failed => 'Não entregue',
  };
}

class AppUser {
  const AppUser({required this.id, required this.name, required this.email});
  final String id;
  final String name;
  final String email;
}

class Delivery {
  const Delivery({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.phone,
    required this.address,
    required this.neighborhood,
    required this.city,
    required this.sequence,
    required this.status,
    required this.scheduledAt,
    required this.items,
    required this.notes,
    this.receiverName,
    this.failureReason,
    this.proofPath,
  });

  final String id;
  final String orderNumber;
  final String customerName;
  final String phone;
  final String address;
  final String neighborhood;
  final String city;
  final int sequence;
  final DeliveryStatus status;
  final DateTime scheduledAt;
  final List<DeliveryItem> items;
  final String notes;
  final String? receiverName;
  final String? failureReason;
  final String? proofPath;

  /// O ERP atual armazena apenas a cidade do destino. Esta composição evita
  /// repetir a cidade ou exibir um endereço que não existe no banco.
  String get fullAddress {
    final parts = <String>[];
    for (final part in [address, neighborhood, city]) {
      final value = part.trim();
      if (value.isNotEmpty && !parts.contains(value)) parts.add(value);
    }
    return parts.isEmpty
        ? 'Localização não informada no ERP'
        : parts.join(' • ');
  }

  /// Formato apropriado para mecanismos de navegação e geocodificação.
  String get navigationAddress => [
    address.trim(),
    neighborhood.trim(),
    city.trim(),
  ].where((part) => part.isNotEmpty).join(', ');

  bool get hasDetailedAddress =>
      address.trim().isNotEmpty || neighborhood.trim().isNotEmpty;
  bool get hasLocation => navigationAddress.isNotEmpty;
  bool get hasPhone => phone.replaceAll(RegExp(r'\D'), '').isNotEmpty;
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  Delivery copyWith({
    DeliveryStatus? status,
    String? receiverName,
    String? failureReason,
    String? proofPath,
  }) => Delivery(
    id: id,
    orderNumber: orderNumber,
    customerName: customerName,
    phone: phone,
    address: address,
    neighborhood: neighborhood,
    city: city,
    sequence: sequence,
    status: status ?? this.status,
    scheduledAt: scheduledAt,
    items: items,
    notes: notes,
    receiverName: receiverName ?? this.receiverName,
    failureReason: failureReason ?? this.failureReason,
    proofPath: proofPath ?? this.proofPath,
  );
}

class DeliveryItem {
  const DeliveryItem({required this.name, required this.quantity});
  final String name;
  final int quantity;
}

class DeliveryEvent {
  const DeliveryEvent({
    required this.id,
    required this.deliveryId,
    required this.status,
    required this.createdAt,
    this.note,
  });
  final String id;
  final String deliveryId;
  final DeliveryStatus status;
  final DateTime createdAt;
  final String? note;
}
