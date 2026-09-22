import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/models.dart';

abstract final class ExternalActions {
  static Future<bool> openGoogleMaps(Delivery delivery) async {
    if (!delivery.hasLocation) return false;

    final destination = delivery.navigationAddress;
    final webDirections = googleMapsWebUri(delivery);
    final candidates = <Uri>[];

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      candidates.add(
        Uri.parse(
          'google.navigation:q=${Uri.encodeComponent(destination)}&mode=d',
        ),
      );
    } else if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      candidates.add(
        Uri.parse(
          'comgooglemaps://?daddr=${Uri.encodeComponent(destination)}&directionsmode=driving',
        ),
      );
    }
    candidates.add(webDirections);

    for (final uri in candidates) {
      try {
        if (await launchUrl(uri, mode: LaunchMode.externalApplication)) {
          return true;
        }
      } catch (_) {
        // Tenta o próximo formato até chegar ao link web universal.
      }
    }
    return false;
  }

  static Future<bool> call(String phone) async {
    final digits = phoneDigits(phone);
    if (digits.isEmpty) return false;
    return _launch(Uri(scheme: 'tel', path: digits));
  }

  static Future<bool> openWhatsApp(Delivery delivery) async {
    final uri = whatsAppUri(delivery);
    return uri == null ? false : _launch(uri);
  }

  static Uri googleMapsWebUri(Delivery delivery) =>
      Uri.https('www.google.com', '/maps/dir/', {
        'api': '1',
        'destination': delivery.navigationAddress,
        'travelmode': 'driving',
      });

  static Uri? whatsAppUri(Delivery delivery) {
    final digits = phoneDigits(delivery.phone);
    if (digits.isEmpty) return null;
    final international = digits.startsWith('55') ? digits : '55$digits';
    final message =
        'Olá! Sou da entrega SmartStock sobre o pedido ${delivery.orderNumber}.';
    return Uri.https('wa.me', '/$international', {'text': message});
  }

  static String phoneDigits(String value) =>
      value.replaceAll(RegExp(r'\D'), '');

  static Future<bool> _launch(Uri uri) async {
    try {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      return false;
    }
  }
}
