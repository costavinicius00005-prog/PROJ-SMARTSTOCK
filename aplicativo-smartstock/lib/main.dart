import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import 'app/smartstock_app.dart';
import 'data/local/local_delivery_repository.dart';
import 'data/remote/api_delivery_repository.dart';
import 'domain/delivery_repository.dart';

String _effectiveApiBaseUrl(String configured) {
  if (!kIsWeb) {
    return configured;
  }
  // Na web o app descobre a origem em que esta hospedado e usa a API
  // da mesma origem — funciona do notebook, da LAN e da internet.
  if (const String.fromEnvironment('API_BASE_URL').isNotEmpty) {
    return configured;
  }
  return '${Uri.base.origin}/api';
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  const useApi = bool.fromEnvironment('USE_API', defaultValue: false);
  const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8081/api',
  );
  final DeliveryRepository repository = useApi
      ? ApiDeliveryRepository(baseUrl: _effectiveApiBaseUrl(apiBaseUrl))
      : LocalDeliveryRepository();
  await repository.initialize();
  runApp(SmartStockApp(repository: repository, usesRemoteApi: useApi));
}
