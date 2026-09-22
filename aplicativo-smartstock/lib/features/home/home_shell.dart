import 'package:flutter/material.dart';

import '../../core/config/app_info.dart';
import '../../core/services/external_actions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../domain/delivery_repository.dart';
import '../../domain/models.dart';
import '../deliveries/delivery_detail_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({
    super.key,
    required this.repository,
    required this.user,
    required this.usesRemoteApi,
    required this.onLogout,
  });

  final DeliveryRepository repository;
  final AppUser user;
  final bool usesRemoteApi;
  final VoidCallback onLogout;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  bool _loading = true;
  bool _refreshing = false;
  List<Delivery> _deliveries = [];
  int _pendingSync = 0;
  DateTime? _lastSync;
  String? _error;

  @override
  void initState() {
    super.initState();
    _reload(showLoader: true);
  }

  Future<void> _reload({bool showLoader = false}) async {
    if (showLoader) {
      setState(() {
        _loading = true;
        _error = null;
      });
    } else {
      setState(() => _refreshing = true);
    }
    try {
      final results = await Future.wait<Object>([
        widget.repository.getDeliveries(),
        widget.repository.pendingSyncCount(),
      ]);
      if (!mounted) return;
      setState(() {
        _deliveries = results[0] as List<Delivery>;
        _pendingSync = results[1] as int;
        _lastSync = DateTime.now();
        _loading = false;
        _refreshing = false;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _refreshing = false;
        _error =
            'Não foi possível carregar sua operação. Confira a internet e tente novamente.';
      });
    }
  }

  Future<void> _open(Delivery delivery) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DeliveryDetailPage(
          repository: widget.repository,
          delivery: delivery,
        ),
      ),
    );
    await _reload();
  }

  Future<void> _navigate(Delivery delivery) async {
    if (!delivery.hasLocation) {
      _message('Esta entrega ainda não possui localização cadastrada.');
      return;
    }
    final opened = await ExternalActions.openGoogleMaps(delivery);
    if (!opened && mounted) {
      _message('Não foi possível abrir o Google Maps neste dispositivo.');
    }
  }

  void _message(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _DashboardPage(
        key: const PageStorageKey('dashboard'),
        user: widget.user,
        deliveries: _deliveries,
        pendingSync: _pendingSync,
        usesRemoteApi: widget.usesRemoteApi,
        lastSync: _lastSync,
        refreshing: _refreshing,
        onOpen: _open,
        onNavigate: _navigate,
        onRefresh: _reload,
        onOpenProfile: () => setState(() => _tab = 3),
      ),
      _DeliveryListPage(
        key: const PageStorageKey('deliveries'),
        deliveries: _deliveries,
        refreshing: _refreshing,
        onOpen: _open,
        onNavigate: _navigate,
        onRefresh: _reload,
      ),
      _RoutePage(
        key: const PageStorageKey('route'),
        deliveries: _deliveries,
        onOpen: _open,
        onNavigate: _navigate,
        onRefresh: _reload,
      ),
      _ProfilePage(
        key: const PageStorageKey('profile'),
        user: widget.user,
        pendingSync: _pendingSync,
        usesRemoteApi: widget.usesRemoteApi,
        lastSync: _lastSync,
        onRefresh: _reload,
        onLogout: widget.onLogout,
      ),
    ];

    final content = _loading
        ? const _LoadingView()
        : _error != null
        ? _LoadError(message: _error!, onRetry: () => _reload(showLoader: true))
        : IndexedStack(index: _tab, children: pages);

    return LayoutBuilder(
      builder: (context, constraints) {
        final desktop = constraints.maxWidth >= 900;
        return Scaffold(
          body: SafeArea(
            child: desktop
                ? Row(
                    children: [
                      _DesktopNavigation(
                        selectedIndex: _tab,
                        user: widget.user,
                        usesRemoteApi: widget.usesRemoteApi,
                        onSelected: (value) => setState(() => _tab = value),
                      ),
                      const VerticalDivider(width: 1),
                      Expanded(
                        child: Align(
                          alignment: Alignment.topCenter,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 1120),
                            child: content,
                          ),
                        ),
                      ),
                    ],
                  )
                : content,
          ),
          bottomNavigationBar: desktop
              ? null
              : NavigationBar(
                  selectedIndex: _tab,
                  onDestinationSelected: (value) =>
                      setState(() => _tab = value),
                  destinations: const [
                    NavigationDestination(
                      icon: Icon(Icons.space_dashboard_outlined),
                      selectedIcon: Icon(Icons.space_dashboard_rounded),
                      label: 'Início',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.inventory_2_outlined),
                      selectedIcon: Icon(Icons.inventory_2_rounded),
                      label: 'Entregas',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.route_outlined),
                      selectedIcon: Icon(Icons.route_rounded),
                      label: 'Rota',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.person_outline_rounded),
                      selectedIcon: Icon(Icons.person_rounded),
                      label: 'Perfil',
                    ),
                  ],
                ),
        );
      },
    );
  }
}

class _DesktopNavigation extends StatelessWidget {
  const _DesktopNavigation({
    required this.selectedIndex,
    required this.user,
    required this.usesRemoteApi,
    required this.onSelected,
  });

  final int selectedIndex;
  final AppUser user;
  final bool usesRemoteApi;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => Container(
    width: 258,
    color: AppColors.surface,
    child: Column(
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(24, 28, 24, 26),
          child: Row(
            children: [
              AppLogo(size: 42),
              SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SmartStock',
                    style: TextStyle(
                      color: AppColors.ink,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -.4,
                    ),
                  ),
                  Text(
                    'ENTREGAS',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.7,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: NavigationRail(
            extended: true,
            minExtendedWidth: 258,
            selectedIndex: selectedIndex,
            onDestinationSelected: onSelected,
            backgroundColor: Colors.transparent,
            indicatorColor: AppColors.primarySoft,
            useIndicator: true,
            labelType: NavigationRailLabelType.none,
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.space_dashboard_outlined),
                selectedIcon: Icon(Icons.space_dashboard_rounded),
                label: Text('Visão geral'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.inventory_2_outlined),
                selectedIcon: Icon(Icons.inventory_2_rounded),
                label: Text('Minhas entregas'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.route_outlined),
                selectedIcon: Icon(Icons.route_rounded),
                label: Text('Rota do dia'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.person_outline_rounded),
                selectedIcon: Icon(Icons.person_rounded),
                label: Text('Perfil'),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(18),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                _Avatar(name: user.name, radius: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        usesRemoteApi ? 'ERP conectado' : 'Modo local',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _DashboardPage extends StatelessWidget {
  const _DashboardPage({
    super.key,
    required this.user,
    required this.deliveries,
    required this.pendingSync,
    required this.usesRemoteApi,
    required this.lastSync,
    required this.refreshing,
    required this.onOpen,
    required this.onNavigate,
    required this.onRefresh,
    required this.onOpenProfile,
  });

  final AppUser user;
  final List<Delivery> deliveries;
  final int pendingSync;
  final bool usesRemoteApi;
  final DateTime? lastSync;
  final bool refreshing;
  final ValueChanged<Delivery> onOpen;
  final ValueChanged<Delivery> onNavigate;
  final Future<void> Function() onRefresh;
  final VoidCallback onOpenProfile;

  @override
  Widget build(BuildContext context) {
    final completed = _count(deliveries, DeliveryStatus.delivered);
    final active = _count(deliveries, DeliveryStatus.onRoute);
    final failed = _count(deliveries, DeliveryStatus.failed);
    final pending = _count(deliveries, DeliveryStatus.pending);
    final next = deliveries
        .where(
          (delivery) =>
              delivery.status == DeliveryStatus.onRoute ||
              delivery.status == DeliveryStatus.pending,
        )
        .firstOrNull;
    final progress = deliveries.isEmpty ? 0.0 : completed / deliveries.length;

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.primary,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting(user.name),
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 5),
                    Text(
                      _todayLabel(),
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(fontSize: 13),
                    ),
                  ],
                ),
              ),
              Semantics(
                button: true,
                label: 'Abrir perfil',
                child: InkWell(
                  onTap: onOpenProfile,
                  borderRadius: BorderRadius.circular(99),
                  child: _Avatar(name: user.name, radius: 23),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          _OperationHero(
            total: deliveries.length,
            completed: completed,
            progress: progress,
            usesRemoteApi: usesRemoteApi,
            pendingSync: pendingSync,
            lastSync: lastSync,
            refreshing: refreshing,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  value: '$pending',
                  label: 'Pendentes',
                  icon: Icons.schedule_rounded,
                  color: AppColors.warning,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricCard(
                  value: '$active',
                  label: 'Em rota',
                  icon: Icons.local_shipping_rounded,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricCard(
                  value: '${completed + failed}',
                  label: 'Finalizadas',
                  icon: Icons.task_alt_rounded,
                  color: AppColors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          const SectionLabel('Próxima parada'),
          const SizedBox(height: 10),
          if (next == null)
            const EmptyState(
              icon: Icons.celebration_rounded,
              title: 'Rota finalizada',
              message: 'Todas as entregas desta operação foram tratadas.',
            )
          else
            _NextStopCard(
              delivery: next,
              onOpen: () => onOpen(next),
              onNavigate: next.hasLocation ? () => onNavigate(next) : null,
            ),
          const SizedBox(height: 28),
          SectionLabel(
            'Visão rápida',
            trailing: TextButton(
              onPressed: deliveries.isEmpty
                  ? null
                  : () => onOpen(deliveries.first),
              child: const Text('Ver primeira'),
            ),
          ),
          const SizedBox(height: 8),
          if (deliveries.isEmpty)
            const EmptyState(
              icon: Icons.inventory_2_outlined,
              title: 'Nenhuma entrega',
              message: 'A rota ainda não possui pedidos cadastrados.',
            )
          else
            ...deliveries
                .take(3)
                .map(
                  (delivery) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _DeliveryCard(
                      delivery: delivery,
                      onTap: () => onOpen(delivery),
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class _OperationHero extends StatelessWidget {
  const _OperationHero({
    required this.total,
    required this.completed,
    required this.progress,
    required this.usesRemoteApi,
    required this.pendingSync,
    required this.lastSync,
    required this.refreshing,
  });

  final int total;
  final int completed;
  final double progress;
  final bool usesRemoteApi;
  final int pendingSync;
  final DateTime? lastSync;
  final bool refreshing;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(21),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF092B63), Color(0xFF0E55B8), Color(0xFF2379EB)],
      ),
      borderRadius: BorderRadius.circular(24),
      boxShadow: [
        BoxShadow(
          color: AppColors.primary.withValues(alpha: .22),
          blurRadius: 24,
          offset: const Offset(0, 12),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .13),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: Colors.white24),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    usesRemoteApi
                        ? Icons.cloud_done_rounded
                        : Icons.offline_bolt_rounded,
                    color: Colors.white,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    usesRemoteApi ? 'ERP AO VIVO' : 'MODO LOCAL',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: .8,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            if (refreshing)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            else
              const Icon(Icons.route_rounded, color: Colors.white70, size: 25),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          '$completed de $total entregas',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.w900,
            letterSpacing: -.6,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          total == 0
              ? 'Aguardando programação da operação'
              : completed == total
              ? 'Operação concluída com sucesso'
              : 'Continue avançando pela rota do dia',
          style: const TextStyle(color: Color(0xFFD6E5FF), fontSize: 13),
        ),
        const SizedBox(height: 18),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 9,
            color: Colors.white,
            backgroundColor: Colors.white24,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Text(
                '${(progress * 100).round()}% concluído',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                pendingSync > 0
                    ? '$pendingSync aguardando envio'
                    : _syncLabel(lastSync),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.end,
                style: const TextStyle(color: Color(0xFFC4D8FA), fontSize: 10),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  final String value;
  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(
      children: [
        Icon(icon, color: color, size: 19),
        const SizedBox(height: 7),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 21,
            height: 1,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 5),
        FittedBox(
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.muted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class _NextStopCard extends StatelessWidget {
  const _NextStopCard({
    required this.delivery,
    required this.onOpen,
    required this.onNavigate,
  });

  final Delivery delivery;
  final VoidCallback onOpen;
  final VoidCallback? onNavigate;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AppColors.primary.withValues(alpha: .22)),
      boxShadow: [
        BoxShadow(
          color: AppColors.ink.withValues(alpha: .05),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ],
    ),
    child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(17, 17, 17, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${delivery.sequence}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          delivery.customerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Pedido ${delivery.orderNumber} • ${delivery.itemCount} itens',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(status: delivery.status, compact: true),
                ],
              ),
              const SizedBox(height: 15),
              _LocationLine(delivery: delivery),
              if (!delivery.hasDetailedAddress && delivery.hasLocation) ...[
                const SizedBox(height: 9),
                const _ApproximateLocationNote(),
              ],
            ],
          ),
        ),
        const Divider(height: 1),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onOpen,
                  icon: const Icon(Icons.receipt_long_outlined, size: 18),
                  label: const Text('Detalhes'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: onNavigate,
                  icon: const Icon(Icons.navigation_rounded, size: 18),
                  label: const Text('Navegar'),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _DeliveryListPage extends StatefulWidget {
  const _DeliveryListPage({
    super.key,
    required this.deliveries,
    required this.refreshing,
    required this.onOpen,
    required this.onNavigate,
    required this.onRefresh,
  });

  final List<Delivery> deliveries;
  final bool refreshing;
  final ValueChanged<Delivery> onOpen;
  final ValueChanged<Delivery> onNavigate;
  final Future<void> Function() onRefresh;

  @override
  State<_DeliveryListPage> createState() => _DeliveryListPageState();
}

class _DeliveryListPageState extends State<_DeliveryListPage> {
  DeliveryStatus? _filter;
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final normalized = _query.trim().toLowerCase();
    final list = widget.deliveries.where((delivery) {
      final matchesStatus = _filter == null || delivery.status == _filter;
      final searchable =
          '${delivery.customerName} ${delivery.orderNumber} ${delivery.fullAddress}'
              .toLowerCase();
      return matchesStatus && searchable.contains(normalized);
    }).toList();

    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 20, 18, 30),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Minhas entregas',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 5),
                    Text(
                      '${widget.deliveries.length} paradas carregadas do ERP',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              if (widget.refreshing)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          const SizedBox(height: 20),
          TextField(
            onChanged: (value) => setState(() => _query = value),
            decoration: const InputDecoration(
              hintText: 'Cliente, pedido ou endereço',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: 13),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _CountFilter(
                  label: 'Todas',
                  count: widget.deliveries.length,
                  active: _filter == null,
                  onTap: () => setState(() => _filter = null),
                ),
                ...DeliveryStatus.values.map(
                  (status) => _CountFilter(
                    label: status.label,
                    count: _count(widget.deliveries, status),
                    active: _filter == status,
                    onTap: () => setState(() => _filter = status),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Text(
                '${list.length} resultado${list.length == 1 ? '' : 's'}',
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              if (_filter != null || normalized.isNotEmpty)
                TextButton(
                  onPressed: () => setState(() {
                    _filter = null;
                    _query = '';
                  }),
                  child: const Text('Limpar filtros'),
                ),
            ],
          ),
          const SizedBox(height: 6),
          if (list.isEmpty)
            const EmptyState(
              icon: Icons.search_off_rounded,
              title: 'Nenhuma entrega encontrada',
              message: 'Ajuste a busca ou selecione outro status.',
            )
          else
            ...list.map(
              (delivery) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _DeliveryCard(
                  delivery: delivery,
                  onTap: () => widget.onOpen(delivery),
                  onNavigate:
                      delivery.hasLocation &&
                          delivery.status != DeliveryStatus.delivered
                      ? () => widget.onNavigate(delivery)
                      : null,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RoutePage extends StatelessWidget {
  const _RoutePage({
    super.key,
    required this.deliveries,
    required this.onOpen,
    required this.onNavigate,
    required this.onRefresh,
  });

  final List<Delivery> deliveries;
  final ValueChanged<Delivery> onOpen;
  final ValueChanged<Delivery> onNavigate;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final completed = _count(deliveries, DeliveryStatus.delivered);
    final next = deliveries
        .where(
          (delivery) =>
              delivery.status == DeliveryStatus.onRoute ||
              delivery.status == DeliveryStatus.pending,
        )
        .firstOrNull;
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 20, 18, 30),
        children: [
          Text('Rota do dia', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 5),
          Text(
            'Siga a sequência e mantenha cada parada atualizada.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.ink,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.route_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$completed de ${deliveries.length} concluídas',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        next == null
                            ? 'Nenhuma parada pendente'
                            : 'Próxima: ${next.customerName}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFFBFCBDD),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (next?.hasLocation == true)
                  IconButton.filled(
                    tooltip: 'Navegar para próxima parada',
                    onPressed: () => onNavigate(next!),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                    ),
                    icon: const Icon(Icons.navigation_rounded),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 26),
          const SectionLabel('Sequência de paradas'),
          const SizedBox(height: 13),
          if (deliveries.isEmpty)
            const EmptyState(
              icon: Icons.route_outlined,
              title: 'Rota não cadastrada',
              message:
                  'As paradas aparecerão aqui quando forem criadas no ERP.',
            )
          else
            ...List.generate(deliveries.length, (index) {
              final delivery = deliveries[index];
              return _RouteStop(
                delivery: delivery,
                isLast: index == deliveries.length - 1,
                isNext: delivery.id == next?.id,
                onTap: () => onOpen(delivery),
                onNavigate:
                    delivery.hasLocation &&
                        delivery.status != DeliveryStatus.delivered
                    ? () => onNavigate(delivery)
                    : null,
              );
            }),
        ],
      ),
    );
  }
}

class _RouteStop extends StatelessWidget {
  const _RouteStop({
    required this.delivery,
    required this.isLast,
    required this.isNext,
    required this.onTap,
    required this.onNavigate,
  });

  final Delivery delivery;
  final bool isLast;
  final bool isNext;
  final VoidCallback onTap;
  final VoidCallback? onNavigate;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(delivery.status);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 38,
            child: Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isNext
                        ? AppColors.primary
                        : color.withValues(alpha: .1),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isNext
                          ? AppColors.primary
                          : color.withValues(alpha: .28),
                    ),
                  ),
                  child: delivery.status == DeliveryStatus.delivered
                      ? Icon(Icons.check_rounded, color: color, size: 17)
                      : Text(
                          '${delivery.sequence}',
                          style: TextStyle(
                            color: isNext ? Colors.white : color,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 5),
                      color: delivery.status == DeliveryStatus.delivered
                          ? AppColors.success.withValues(alpha: .35)
                          : AppColors.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isNext
                        ? AppColors.primary.withValues(alpha: .4)
                        : AppColors.border,
                  ),
                ),
                child: InkWell(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(18),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (isNext) ...[
                                const Text(
                                  'PRÓXIMA PARADA',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: .8,
                                  ),
                                ),
                                const SizedBox(height: 4),
                              ],
                              Text(
                                delivery.customerName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.ink,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                delivery.fullAddress,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (onNavigate != null)
                          IconButton(
                            tooltip: 'Abrir no Google Maps',
                            onPressed: onNavigate,
                            icon: const Icon(Icons.navigation_rounded),
                            color: AppColors.primary,
                          )
                        else
                          StatusBadge(status: delivery.status, compact: true),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfilePage extends StatelessWidget {
  const _ProfilePage({
    super.key,
    required this.user,
    required this.pendingSync,
    required this.usesRemoteApi,
    required this.lastSync,
    required this.onRefresh,
    required this.onLogout,
  });

  final AppUser user;
  final int pendingSync;
  final bool usesRemoteApi;
  final DateTime? lastSync;
  final Future<void> Function() onRefresh;
  final VoidCallback onLogout;

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair da operação?'),
        content: const Text(
          'Você precisará informar as credenciais novamente para acessar a rota.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Sair'),
          ),
        ],
      ),
    );
    if (confirmed == true) onLogout();
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: onRefresh,
    child: ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 30),
      children: [
        Text('Perfil', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF10233F), Color(0xFF183B68)],
            ),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              _Avatar(name: user.name, radius: 30, inverse: true),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      user.email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFC3CFE0),
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .1),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: const Text(
                        'ENTREGADOR',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: .8,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const SectionLabel('Aplicativo'),
        const SizedBox(height: 9),
        _SettingTile(
          icon: usesRemoteApi
              ? Icons.cloud_done_rounded
              : Icons.offline_bolt_rounded,
          color: usesRemoteApi ? AppColors.success : AppColors.warning,
          title: usesRemoteApi ? 'ERP conectado' : 'Modo local',
          subtitle: pendingSync > 0
              ? '$pendingSync ações aguardando sincronização'
              : _syncLabel(lastSync),
        ),
        const SizedBox(height: 9),
        const _SettingTile(
          icon: Icons.map_rounded,
          color: AppColors.primary,
          title: 'Navegação externa',
          subtitle: 'Rotas abertas pelo Google Maps',
        ),
        const SizedBox(height: 9),
        _SettingTile(
          icon: Icons.info_outline_rounded,
          color: AppColors.muted,
          title: 'SmartStock Entregas',
          subtitle: 'Versão ${AppInfo.formattedVersion}',
        ),
        const SizedBox(height: 26),
        OutlinedButton.icon(
          onPressed: () => _confirmLogout(context),
          icon: const Icon(Icons.logout_rounded),
          label: const Text('Sair da conta'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.danger,
            side: BorderSide(color: AppColors.danger.withValues(alpha: .25)),
          ),
        ),
      ],
    ),
  );
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .1),
            borderRadius: BorderRadius.circular(13),
          ),
          child: Icon(icon, color: color, size: 21),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 3),
              Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    ),
  );
}

class _DeliveryCard extends StatelessWidget {
  const _DeliveryCard({
    required this.delivery,
    required this.onTap,
    this.onNavigate,
  });

  final Delivery delivery;
  final VoidCallback onTap;
  final VoidCallback? onNavigate;

  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: statusColor(delivery.status).withValues(alpha: .1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                '${delivery.sequence}',
                style: TextStyle(
                  color: statusColor(delivery.status),
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          delivery.customerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const SizedBox(width: 7),
                      StatusBadge(status: delivery.status, compact: true),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Pedido ${delivery.orderNumber} • ${delivery.itemCount} itens',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 7),
                  _LocationLine(delivery: delivery, compact: true),
                ],
              ),
            ),
            if (onNavigate != null)
              Padding(
                padding: const EdgeInsets.only(left: 4, top: 28),
                child: IconButton(
                  tooltip: 'Abrir no Google Maps',
                  onPressed: onNavigate,
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primarySoft,
                    foregroundColor: AppColors.primary,
                  ),
                  icon: const Icon(Icons.navigation_rounded, size: 19),
                ),
              )
            else
              const Padding(
                padding: EdgeInsets.only(left: 4, top: 28),
                child: Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.muted,
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

class _LocationLine extends StatelessWidget {
  const _LocationLine({required this.delivery, this.compact = false});

  final Delivery delivery;
  final bool compact;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(
        delivery.hasLocation
            ? Icons.location_on_outlined
            : Icons.location_off_outlined,
        size: compact ? 16 : 18,
        color: delivery.hasLocation ? AppColors.primary : AppColors.muted,
      ),
      const SizedBox(width: 6),
      Expanded(
        child: Text(
          delivery.fullAddress,
          maxLines: compact ? 1 : 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: delivery.hasLocation ? AppColors.muted : AppColors.danger,
            fontSize: compact ? 11 : 13,
            height: 1.3,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    ],
  );
}

class _ApproximateLocationNote extends StatelessWidget {
  const _ApproximateLocationNote();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    decoration: BoxDecoration(
      color: AppColors.warningSoft,
      borderRadius: BorderRadius.circular(10),
    ),
    child: const Row(
      children: [
        Icon(Icons.info_outline_rounded, size: 15, color: AppColors.warning),
        SizedBox(width: 6),
        Expanded(
          child: Text(
            'O ERP informou apenas a cidade; confirme o endereço com o cliente.',
            style: TextStyle(
              color: Color(0xFF8A5607),
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class _CountFilter extends StatelessWidget {
  const _CountFilter({
    required this.label,
    required this.count,
    required this.active,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(right: 8),
    child: ChoiceChip(
      label: Text('$label  $count'),
      selected: active,
      showCheckmark: false,
      onSelected: (_) => onTap(),
      labelStyle: TextStyle(
        color: active ? AppColors.primary : AppColors.muted,
        fontSize: 11,
        fontWeight: FontWeight.w800,
      ),
      side: BorderSide(
        color: active
            ? AppColors.primary.withValues(alpha: .25)
            : AppColors.border,
      ),
    ),
  );
}

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.name,
    required this.radius,
    this.inverse = false,
  });

  final String name;
  final double radius;
  final bool inverse;

  @override
  Widget build(BuildContext context) => CircleAvatar(
    radius: radius,
    backgroundColor: inverse
        ? Colors.white.withValues(alpha: .14)
        : AppColors.primarySoft,
    child: Text(
      name.trim().isEmpty ? 'S' : name.trim()[0].toUpperCase(),
      style: TextStyle(
        color: inverse ? Colors.white : AppColors.primary,
        fontSize: radius * .72,
        fontWeight: FontWeight.w900,
      ),
    ),
  );
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: const [
      _Skeleton(height: 32, width: 190),
      SizedBox(height: 9),
      _Skeleton(height: 15, width: 150),
      SizedBox(height: 24),
      _Skeleton(height: 190),
      SizedBox(height: 14),
      Row(
        children: [
          Expanded(child: _Skeleton(height: 94)),
          SizedBox(width: 10),
          Expanded(child: _Skeleton(height: 94)),
          SizedBox(width: 10),
          Expanded(child: _Skeleton(height: 94)),
        ],
      ),
      SizedBox(height: 28),
      _Skeleton(height: 18, width: 130),
      SizedBox(height: 10),
      _Skeleton(height: 190),
    ],
  );
}

class _Skeleton extends StatelessWidget {
  const _Skeleton({required this.height, this.width});

  final double height;
  final double? width;

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: Container(
      width: width ?? double.infinity,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE7ECF2),
        borderRadius: BorderRadius.circular(18),
      ),
    ),
  );
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 430),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: AppColors.warningSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                color: AppColors.warning,
                size: 34,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Operação indisponível',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    ),
  );
}

int _count(List<Delivery> deliveries, DeliveryStatus status) =>
    deliveries.where((delivery) => delivery.status == status).length;

String _greeting(String name) {
  final hour = DateTime.now().hour;
  final salutation = hour < 12
      ? 'Bom dia'
      : hour < 18
      ? 'Boa tarde'
      : 'Boa noite';
  final firstName =
      name.trim().split(RegExp(r'\s+')).firstOrNull ?? 'entregador';
  return '$salutation, $firstName';
}

String _todayLabel() {
  const weekdays = [
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
    'domingo',
  ];
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  final now = DateTime.now();
  return '${weekdays[now.weekday - 1]}, ${now.day} de ${months[now.month - 1]}';
}

String _syncLabel(DateTime? time) {
  if (time == null) return 'Ainda não sincronizado';
  final hour = time.hour.toString().padLeft(2, '0');
  final minute = time.minute.toString().padLeft(2, '0');
  return 'Atualizado às $hour:$minute';
}
