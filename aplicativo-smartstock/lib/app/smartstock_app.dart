import 'package:flutter/material.dart';

import '../domain/delivery_repository.dart';
import '../domain/models.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/login_page.dart';
import '../features/home/home_shell.dart';

class SmartStockApp extends StatefulWidget {
  const SmartStockApp({
    super.key,
    required this.repository,
    required this.usesRemoteApi,
  });
  final DeliveryRepository repository;
  final bool usesRemoteApi;

  @override
  State<SmartStockApp> createState() => _SmartStockAppState();
}

class _SmartStockAppState extends State<SmartStockApp> {
  AppUser? _user;

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'SmartStock Entregas',
    debugShowCheckedModeBanner: false,
    theme: AppTheme.light(),
    home: _user == null
        ? LoginPage(
            repository: widget.repository,
            usesRemoteApi: widget.usesRemoteApi,
            onLogin: (user) => setState(() => _user = user),
          )
        : HomeShell(
            repository: widget.repository,
            user: _user!,
            usesRemoteApi: widget.usesRemoteApi,
            onLogout: () => setState(() => _user = null),
          ),
  );
}
