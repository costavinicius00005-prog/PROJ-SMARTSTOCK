import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/services/external_actions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/widgets/proof_preview.dart';
import '../../domain/delivery_repository.dart';
import '../../domain/models.dart';

class DeliveryDetailPage extends StatefulWidget {
  const DeliveryDetailPage({
    super.key,
    required this.repository,
    required this.delivery,
  });

  final DeliveryRepository repository;
  final Delivery delivery;

  @override
  State<DeliveryDetailPage> createState() => _DeliveryDetailPageState();
}

class _DeliveryDetailPageState extends State<DeliveryDetailPage> {
  late Delivery _delivery;
  bool _saving = false;
  Timer? _trackTimer;
  bool _tracking = false;
  DateTime? _lastSentAt;
  int _sentPoints = 0;

  @override
  void initState() {
    super.initState();
    _delivery = widget.delivery;
    if (_delivery.status == DeliveryStatus.onRoute &&
        widget.repository.supportsLiveTracking) {
      // Voltou para a tela com a rota ja em andamento: retoma o rastreio.
      WidgetsBinding.instance.addPostFrameCallback((_) => _enableTracking());
    }
  }

  @override
  void dispose() {
    _stopTracking();
    super.dispose();
  }

  Future<void> _enableTracking() async {
    if (!widget.repository.supportsLiveTracking || _tracking) return;
    if (!await Geolocator.isLocationServiceEnabled()) {
      _message('Ative a localização (GPS) do celular para o rastreamento.');
      return;
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      _message('Permita o acesso à localização para o rastreamento ao vivo.');
      return;
    }
    setState(() => _tracking = true);
    _trackTimer?.cancel();
    _trackTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _trackOnce(),
    );
    _trackOnce();
  }

  void _stopTracking() {
    _trackTimer?.cancel();
    _trackTimer = null;
  }

  Future<void> _trackOnce() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 12),
      );
      final ok = await widget.repository.sendLocation(
        _delivery.id,
        position.latitude,
        position.longitude,
      );
      if (ok && mounted) {
        setState(() {
          _lastSentAt = DateTime.now();
          _sentPoints += 1;
        });
      }
    } catch (_) {
      // Sem sinal agora: a proxima tentativa continua em 15s.
    }
  }

  Future<void> _openMaps() async {
    if (!_delivery.hasLocation) {
      _message('Cadastre uma localização no ERP antes de iniciar a navegação.');
      return;
    }
    final opened = await ExternalActions.openGoogleMaps(_delivery);
    if (!opened && mounted) {
      _message('Não foi possível abrir o Google Maps neste dispositivo.');
    }
  }

  Future<void> _call() async {
    final opened = await ExternalActions.call(_delivery.phone);
    if (!opened && mounted) {
      _message(
        _delivery.hasPhone
            ? 'Não foi possível abrir o telefone.'
            : 'O cliente não possui telefone cadastrado.',
      );
    }
  }

  Future<void> _whatsApp() async {
    final opened = await ExternalActions.openWhatsApp(_delivery);
    if (!opened && mounted) {
      _message(
        _delivery.hasPhone
            ? 'Não foi possível abrir o WhatsApp.'
            : 'O cliente não possui telefone cadastrado.',
      );
    }
  }

  Future<void> _save(
    DeliveryStatus status, {
    String? receiverName,
    String? proofPath,
    String? note,
  }) async {
    setState(() => _saving = true);
    final updated = _delivery.copyWith(
      status: status,
      receiverName: receiverName,
      failureReason: status == DeliveryStatus.failed ? note : null,
      proofPath: proofPath,
    );
    try {
      await widget.repository.updateDelivery(updated, eventNote: note);
      if (!mounted) return;
      setState(() => _delivery = updated);
      if (status == DeliveryStatus.onRoute) {
        _enableTracking();
      } else if (status == DeliveryStatus.delivered ||
          status == DeliveryStatus.failed) {
        _stopTracking();
        setState(() => _tracking = false);
      }
      final message = switch (status) {
        DeliveryStatus.onRoute => 'Entrega iniciada. Boa rota!',
        DeliveryStatus.delivered => 'Entrega concluída com sucesso.',
        DeliveryStatus.failed => 'Ocorrência registrada com sucesso.',
        DeliveryStatus.pending => 'Entrega atualizada.',
      };
      _message(message);
    } catch (_) {
      if (mounted) {
        _message(
          'Não foi possível salvar. Verifique a conexão e tente novamente.',
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _confirmDelivered() async {
    final result = await showModalBottomSheet<_CompletionResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _CompletionSheet(
        initialReceiver: _delivery.receiverName,
        initialProofPath: _delivery.proofPath,
        allowPhoto: widget.repository.supportsProofPhotos,
      ),
    );
    if (result == null) return;
    await _save(
      DeliveryStatus.delivered,
      receiverName: result.receiverName,
      proofPath: result.proofPath,
      note: 'Entrega recebida por ${result.receiverName}',
    );
  }

  Future<void> _markFailed() async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => const _FailureSheet(),
    );
    if (reason != null) {
      await _save(DeliveryStatus.failed, note: reason);
    }
  }

  void _message(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final editable =
        _delivery.status != DeliveryStatus.delivered &&
        _delivery.status != DeliveryStatus.failed;
    return Scaffold(
      appBar: AppBar(
        title: Text('Pedido ${_delivery.orderNumber}'),
        actions: [
          IconButton(
            tooltip: 'Abrir Google Maps',
            onPressed: _delivery.hasLocation ? _openMaps : null,
            icon: const Icon(Icons.map_outlined),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 4, 18, 28),
        children: [
          _DeliveryHero(delivery: _delivery),
          if (_delivery.status == DeliveryStatus.onRoute &&
              widget.repository.supportsLiveTracking) ...[
            const SizedBox(height: 14),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: _tracking
                            ? AppColors.successSoft
                            : AppColors.warningSoft,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: Icon(
                        _tracking
                            ? Icons.gps_fixed_rounded
                            : Icons.gps_off_rounded,
                        color: _tracking
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _tracking
                                ? 'Rastreamento ativo — o gerente acompanha ao vivo'
                                : 'Rastreamento pausado',
                            style: const TextStyle(
                              color: AppColors.ink,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            _tracking
                                ? _lastSentAt == null
                                      ? 'Buscando posição GPS…'
                                      : 'Posição enviada a cada 15 s · '
                                            'última: ${_lastSentAt!.hour.toString().padLeft(2, '0')}:${_lastSentAt!.minute.toString().padLeft(2, '0')}:${_lastSentAt!.second.toString().padLeft(2, '0')} · '
                                            '$_sentPoints pontos'
                                : 'Sem GPS ativo ou permissão negada',
                            style: TextStyle(
                              color: _tracking
                                  ? AppColors.muted
                                  : AppColors.danger,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
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
          const SizedBox(height: 14),
          _DestinationCard(
            delivery: _delivery,
            onNavigate: _delivery.hasLocation ? _openMaps : null,
            onCall: _delivery.hasPhone ? _call : null,
            onWhatsApp: _delivery.hasPhone ? _whatsApp : null,
          ),
          const SizedBox(height: 14),
          _SectionCard(
            icon: Icons.inventory_2_outlined,
            title: 'Itens do pedido',
            trailing: '${_delivery.itemCount} unidades',
            child: Column(
              children: [
                for (
                  var index = 0;
                  index < _delivery.items.length;
                  index++
                ) ...[
                  _OrderItemRow(item: _delivery.items[index]),
                  if (index != _delivery.items.length - 1)
                    const Divider(height: 17),
                ],
              ],
            ),
          ),
          if (_delivery.notes.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            _SectionCard(
              icon: Icons.sticky_note_2_outlined,
              title: 'Orientações',
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(13),
                decoration: BoxDecoration(
                  color: AppColors.warningSoft,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Text(
                  _delivery.notes,
                  style: const TextStyle(
                    color: Color(0xFF76500F),
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
          if (!editable) ...[
            const SizedBox(height: 14),
            _OutcomeCard(delivery: _delivery),
          ],
        ],
      ),
      bottomNavigationBar: editable
          ? _DeliveryActionBar(
              status: _delivery.status,
              saving: _saving,
              onStart: () =>
                  _save(DeliveryStatus.onRoute, note: 'Entrega iniciada'),
              onComplete: _confirmDelivered,
              onFailure: _markFailed,
            )
          : null,
    );
  }
}

class _DeliveryHero extends StatelessWidget {
  const _DeliveryHero({required this.delivery});

  final Delivery delivery;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(19),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF10233F), Color(0xFF174A83)],
      ),
      borderRadius: BorderRadius.circular(23),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .12),
                shape: BoxShape.circle,
              ),
              child: Text(
                '${delivery.sequence}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'PARADA DA ROTA',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Color(0xFFBFCDE0),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            StatusBadge(status: delivery.status, compact: true),
          ],
        ),
        const SizedBox(height: 19),
        Text(
          delivery.customerName,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            height: 1.1,
            fontWeight: FontWeight.w900,
            letterSpacing: -.5,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(
              Icons.receipt_long_rounded,
              color: Color(0xFFBFCDE0),
              size: 16,
            ),
            const SizedBox(width: 6),
            Text(
              delivery.orderNumber,
              style: const TextStyle(
                color: Color(0xFFDCE7F6),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 12),
            Container(width: 3, height: 3, color: const Color(0xFF8FA2BC)),
            const SizedBox(width: 12),
            Text(
              '${delivery.itemCount} itens',
              style: const TextStyle(color: Color(0xFFBFCDE0), fontSize: 12),
            ),
          ],
        ),
      ],
    ),
  );
}

class _DestinationCard extends StatelessWidget {
  const _DestinationCard({
    required this.delivery,
    required this.onNavigate,
    required this.onCall,
    required this.onWhatsApp,
  });

  final Delivery delivery;
  final VoidCallback? onNavigate;
  final VoidCallback? onCall;
  final VoidCallback? onWhatsApp;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(17),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionLabel('Destino'),
          const SizedBox(height: 13),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: delivery.hasLocation
                      ? AppColors.primarySoft
                      : AppColors.dangerSoft,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  delivery.hasLocation
                      ? Icons.location_on_rounded
                      : Icons.location_off_rounded,
                  color: delivery.hasLocation
                      ? AppColors.primary
                      : AppColors.danger,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      delivery.fullAddress,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 14,
                        height: 1.35,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      delivery.hasDetailedAddress
                          ? 'Endereço completo cadastrado'
                          : delivery.hasLocation
                          ? 'Localização aproximada'
                          : 'Atualize o cadastro do cliente no ERP',
                      style: TextStyle(
                        color: delivery.hasDetailedAddress
                            ? AppColors.success
                            : delivery.hasLocation
                            ? AppColors.warning
                            : AppColors.danger,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (!delivery.hasDetailedAddress && delivery.hasLocation) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.warningSoft,
                borderRadius: BorderRadius.circular(11),
              ),
              child: const Text(
                'O Google Maps abrirá a cidade informada. Confirme rua e número com o cliente.',
                style: TextStyle(
                  color: Color(0xFF805510),
                  fontSize: 10,
                  height: 1.35,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  onPressed: onNavigate,
                  icon: const Icon(Icons.navigation_rounded, size: 18),
                  label: const Text('Google Maps'),
                ),
              ),
              const SizedBox(width: 9),
              _QuickAction(
                tooltip: 'Ligar para o cliente',
                icon: Icons.call_outlined,
                onPressed: onCall,
              ),
              const SizedBox(width: 7),
              _QuickAction(
                tooltip: 'Abrir WhatsApp',
                icon: Icons.chat_bubble_outline_rounded,
                onPressed: onWhatsApp,
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => IconButton.outlined(
    tooltip: tooltip,
    onPressed: onPressed,
    icon: Icon(icon),
    style: IconButton.styleFrom(
      minimumSize: const Size(50, 52),
      foregroundColor: AppColors.primary,
      side: const BorderSide(color: AppColors.border),
    ),
  );
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String? trailing;
  final Widget child;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(17),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .8,
                  ),
                ),
              ),
              if (trailing != null)
                Text(
                  trailing!,
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    ),
  );
}

class _OrderItemRow extends StatelessWidget {
  const _OrderItemRow({required this.item});

  final DeliveryItem item;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 36,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.primarySoft,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Text(
          '${item.quantity}x',
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 11,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      const SizedBox(width: 11),
      Expanded(
        child: Text(
          item.name,
          style: const TextStyle(
            color: AppColors.ink,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    ],
  );
}

class _OutcomeCard extends StatelessWidget {
  const _OutcomeCard({required this.delivery});

  final Delivery delivery;

  @override
  Widget build(BuildContext context) {
    final delivered = delivery.status == DeliveryStatus.delivered;
    final color = delivered ? AppColors.success : AppColors.danger;
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .07),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: .18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                delivered
                    ? Icons.verified_rounded
                    : Icons.report_problem_rounded,
                color: color,
              ),
              const SizedBox(width: 9),
              Text(
                delivered ? 'Entrega concluída' : 'Entrega não realizada',
                style: TextStyle(
                  color: color,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 11),
          Text(
            delivered
                ? 'Recebido por ${delivery.receiverName?.trim().isNotEmpty == true ? delivery.receiverName : 'não informado'}'
                : delivery.failureReason ?? 'Motivo não informado',
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (delivered && delivery.proofPath != null) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: ProofPreview(path: delivery.proofPath!),
            ),
          ],
        ],
      ),
    );
  }
}

class _DeliveryActionBar extends StatelessWidget {
  const _DeliveryActionBar({
    required this.status,
    required this.saving,
    required this.onStart,
    required this.onComplete,
    required this.onFailure,
  });

  final DeliveryStatus status;
  final bool saving;
  final VoidCallback onStart;
  final VoidCallback onComplete;
  final VoidCallback onFailure;

  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: .08),
            blurRadius: 18,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: status == DeliveryStatus.pending
          ? FilledButton.icon(
              onPressed: saving ? null : onStart,
              icon: saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.play_arrow_rounded),
              label: Text(saving ? 'Iniciando...' : 'Iniciar esta entrega'),
            )
          : Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: saving ? null : onFailure,
                    icon: const Icon(Icons.report_problem_outlined, size: 18),
                    label: const Text('Ocorrência'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger,
                      side: BorderSide(
                        color: AppColors.danger.withValues(alpha: .25),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: FilledButton.icon(
                    onPressed: saving ? null : onComplete,
                    icon: saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(Icons.check_circle_rounded, size: 19),
                    label: Text(saving ? 'Salvando...' : 'Concluir entrega'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.success,
                    ),
                  ),
                ),
              ],
            ),
    ),
  );
}

class _CompletionResult {
  const _CompletionResult({required this.receiverName, this.proofPath});

  final String receiverName;
  final String? proofPath;
}

class _CompletionSheet extends StatefulWidget {
  const _CompletionSheet({
    this.initialReceiver,
    this.initialProofPath,
    required this.allowPhoto,
  });

  final String? initialReceiver;
  final String? initialProofPath;
  final bool allowPhoto;

  @override
  State<_CompletionSheet> createState() => _CompletionSheetState();
}

class _CompletionSheetState extends State<_CompletionSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _receiver;
  String? _proofPath;
  bool _cameraBusy = false;

  @override
  void initState() {
    super.initState();
    _receiver = TextEditingController(text: widget.initialReceiver ?? '');
    _proofPath = widget.initialProofPath;
  }

  @override
  void dispose() {
    _receiver.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    setState(() => _cameraBusy = true);
    try {
      final image = await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 78,
        maxWidth: 1600,
      );
      if (image != null && mounted) setState(() => _proofPath = image.path);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível acessar a câmera.')),
        );
      }
    } finally {
      if (mounted) setState(() => _cameraBusy = false);
    }
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    Navigator.pop(
      context,
      _CompletionResult(
        receiverName: _receiver.text.trim(),
        proofPath: _proofPath,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: EdgeInsets.fromLTRB(
      20,
      4,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 22,
    ),
    child: Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SheetTitle(
            icon: Icons.verified_rounded,
            iconColor: AppColors.success,
            title: 'Concluir entrega',
            subtitle: 'Confirme o recebimento antes de finalizar.',
          ),
          const SizedBox(height: 22),
          TextFormField(
            controller: _receiver,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _submit(),
            validator: (value) => value == null || value.trim().length < 2
                ? 'Informe quem recebeu o pedido.'
                : null,
            decoration: const InputDecoration(
              labelText: 'Nome de quem recebeu',
              prefixIcon: Icon(Icons.person_outline_rounded),
            ),
          ),
          const SizedBox(height: 13),
          if (widget.allowPhoto) ...[
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              child: _proofPath == null
                  ? OutlinedButton.icon(
                      key: const ValueKey('take-photo'),
                      onPressed: _cameraBusy ? null : _takePhoto,
                      icon: _cameraBusy
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.photo_camera_outlined),
                      label: const Text('Adicionar foto (opcional)'),
                    )
                  : Container(
                      key: const ValueKey('photo-ready'),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.successSoft,
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(
                          color: AppColors.success.withValues(alpha: .2),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 9),
                          const Expanded(
                            child: Text(
                              'Foto adicionada',
                              style: TextStyle(
                                color: AppColors.success,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _takePhoto,
                            child: const Text('Refazer'),
                          ),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 18),
          ],
          FilledButton.icon(
            onPressed: _submit,
            icon: const Icon(Icons.check_rounded),
            label: const Text('Confirmar recebimento'),
            style: FilledButton.styleFrom(backgroundColor: AppColors.success),
          ),
        ],
      ),
    ),
  );
}

class _FailureSheet extends StatefulWidget {
  const _FailureSheet();

  @override
  State<_FailureSheet> createState() => _FailureSheetState();
}

class _FailureSheetState extends State<_FailureSheet> {
  static const _reasons = [
    'Cliente ausente',
    'Endereço não localizado',
    'Estabelecimento fechado',
    'Recusa de recebimento',
    'Outro',
  ];

  String _reason = _reasons.first;
  final _details = TextEditingController();

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  void _submit() {
    if (_reason == 'Outro' && _details.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Descreva o motivo da ocorrência.')),
      );
      return;
    }
    Navigator.pop(context, _reason == 'Outro' ? _details.text.trim() : _reason);
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: EdgeInsets.fromLTRB(
      20,
      4,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 22,
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SheetTitle(
          icon: Icons.report_problem_rounded,
          iconColor: AppColors.danger,
          title: 'Registrar ocorrência',
          subtitle: 'Informe por que esta entrega não foi concluída.',
        ),
        const SizedBox(height: 18),
        RadioGroup<String>(
          groupValue: _reason,
          onChanged: (value) => setState(() => _reason = value!),
          child: Column(
            children: _reasons
                .map(
                  (reason) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: _reason == reason
                          ? AppColors.dangerSoft
                          : AppColors.surface,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: _reason == reason
                              ? AppColors.danger.withValues(alpha: .35)
                              : AppColors.border,
                        ),
                      ),
                      child: RadioListTile<String>(
                        value: reason,
                        activeColor: AppColors.danger,
                        dense: true,
                        title: Text(
                          reason,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        if (_reason == 'Outro') ...[
          const SizedBox(height: 4),
          TextField(
            controller: _details,
            autofocus: true,
            minLines: 2,
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'Descreva o motivo',
              alignLabelWithHint: true,
            ),
          ),
        ],
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: _submit,
          icon: const Icon(Icons.save_outlined),
          label: const Text('Salvar ocorrência'),
          style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
        ),
      ],
    ),
  );
}
