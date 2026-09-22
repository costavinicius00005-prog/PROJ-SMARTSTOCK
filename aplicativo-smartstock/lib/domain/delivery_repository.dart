import 'models.dart';

abstract class DeliveryRepository {
  bool get supportsProofPhotos => false;

  /// Habilita o envio de posicao GPS durante a rota (rastreamento ao vivo).
  bool get supportsLiveTracking => false;

  Future<void> initialize();
  Future<AppUser> login(String email, String password);
  Future<List<Delivery>> getDeliveries();
  Future<List<DeliveryEvent>> getEvents(String deliveryId);
  Future<void> updateDelivery(Delivery delivery, {String? eventNote});
  Future<int> pendingSyncCount();

  /// Envia a posicao atual do entregador para a rota. Retorna false quando o
  /// repositorio nao suporta rastreamento (ex.: modo local).
  Future<bool> sendLocation(
    String deliveryId,
    double latitude,
    double longitude,
  ) async => false;
}
