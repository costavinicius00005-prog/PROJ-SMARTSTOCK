import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../domain/delivery_repository.dart';
import '../../domain/models.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    required this.repository,
    required this.usesRemoteApi,
    required this.onLogin,
  });

  final DeliveryRepository repository;
  final bool usesRemoteApi;
  final ValueChanged<AppUser> onLogin;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController(text: 'admin@smartstock.com');
  final _password = TextEditingController(text: '123456');
  bool _loading = false;
  bool _obscure = true;
  String? _errorMessage;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_loading || !(_formKey.currentState?.validate() ?? false)) return;
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final user = await widget.repository.login(
        _email.text.trim(),
        _password.text,
      );
      if (mounted) widget.onLogin(user);
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorMessage = widget.usesRemoteApi
              ? 'Não foi possível acessar o SmartStock. Verifique a conexão e as credenciais.'
              : 'Não foi possível abrir a operação local. Tente novamente.';
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final wide = constraints.maxWidth >= 880;
      return Scaffold(
        backgroundColor: wide ? AppColors.canvas : AppColors.surface,
        body: SafeArea(
          child: wide
              ? Row(
                  children: [
                    const Expanded(flex: 11, child: _BrandPanel()),
                    Expanded(
                      flex: 9,
                      child: Center(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(48),
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 440),
                            child: _LoginCard(
                              formKey: _formKey,
                              email: _email,
                              password: _password,
                              obscure: _obscure,
                              loading: _loading,
                              remote: widget.usesRemoteApi,
                              errorMessage: _errorMessage,
                              onTogglePassword: () =>
                                  setState(() => _obscure = !_obscure),
                              onLogin: _login,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              : SingleChildScrollView(
                  child: Column(
                    children: [
                      const _MobileHero(),
                      Transform.translate(
                        offset: const Offset(0, -42),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 18),
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 480),
                            child: _LoginCard(
                              formKey: _formKey,
                              email: _email,
                              password: _password,
                              obscure: _obscure,
                              loading: _loading,
                              remote: widget.usesRemoteApi,
                              errorMessage: _errorMessage,
                              onTogglePassword: () =>
                                  setState(() => _obscure = !_obscure),
                              onLogin: _login,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      );
    },
  );
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({
    required this.formKey,
    required this.email,
    required this.password,
    required this.obscure,
    required this.loading,
    required this.remote,
    required this.errorMessage,
    required this.onTogglePassword,
    required this.onLogin,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController email;
  final TextEditingController password;
  final bool obscure;
  final bool loading;
  final bool remote;
  final String? errorMessage;
  final VoidCallback onTogglePassword;
  final Future<void> Function() onLogin;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(24, 26, 24, 22),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(26),
      border: Border.all(color: AppColors.border),
      boxShadow: [
        BoxShadow(
          color: AppColors.ink.withValues(alpha: .08),
          blurRadius: 32,
          offset: const Offset(0, 16),
        ),
      ],
    ),
    child: Form(
      key: formKey,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Entrar na operação',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: const BoxDecoration(
                    color: AppColors.primarySoft,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              remote
                  ? 'Use seu acesso do ERP para carregar a rota em tempo real.'
                  : 'Acesse a rota salva neste dispositivo.',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontSize: 13),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: email,
              enabled: !loading,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.username],
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Informe seu e-mail.';
                }
                if (!value.contains('@')) return 'Informe um e-mail válido.';
                return null;
              },
              decoration: const InputDecoration(
                labelText: 'E-mail',
                hintText: 'voce@empresa.com',
                prefixIcon: Icon(Icons.alternate_email_rounded),
              ),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: password,
              enabled: !loading,
              obscureText: obscure,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.password],
              onFieldSubmitted: (_) => onLogin(),
              validator: (value) =>
                  value == null || value.isEmpty ? 'Informe sua senha.' : null,
              decoration: InputDecoration(
                labelText: 'Senha',
                prefixIcon: const Icon(Icons.lock_outline_rounded),
                suffixIcon: IconButton(
                  tooltip: obscure ? 'Mostrar senha' : 'Ocultar senha',
                  icon: Icon(
                    obscure
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                  ),
                  onPressed: onTogglePassword,
                ),
              ),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 180),
              child: errorMessage == null
                  ? const SizedBox.shrink()
                  : Padding(
                      padding: const EdgeInsets.only(top: 14),
                      child: _LoginError(message: errorMessage!),
                    ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: loading ? null : onLogin,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: loading
                    ? const SizedBox(
                        key: ValueKey('loading'),
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.4,
                          color: Colors.white,
                        ),
                      )
                    : const FittedBox(
                        key: ValueKey('label'),
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Acessar minhas entregas'),
                            SizedBox(width: 9),
                            Icon(Icons.login_rounded, size: 19),
                          ],
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 17),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  remote ? Icons.lock_rounded : Icons.offline_bolt_rounded,
                  size: 15,
                  color: remote ? AppColors.success : AppColors.warning,
                ),
                const SizedBox(width: 7),
                Flexible(
                  child: Text(
                    remote ? 'Conexão segura com o ERP' : 'Operação local',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

class _LoginError extends StatelessWidget {
  const _LoginError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: AppColors.dangerSoft,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppColors.danger.withValues(alpha: .2)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.info_outline_rounded,
          color: AppColors.danger,
          size: 19,
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            message,
            style: const TextStyle(
              color: AppColors.danger,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );
}

class _MobileHero extends StatelessWidget {
  const _MobileHero();

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    height: 264,
    padding: const EdgeInsets.fromLTRB(24, 24, 24, 62),
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF081B36), Color(0xFF0B3D91), Color(0xFF1769E0)],
      ),
      borderRadius: BorderRadius.vertical(bottom: Radius.circular(34)),
    ),
    child: const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Brand(inverse: true),
        Spacer(),
        Text(
          'Sua rota.\nSeu ritmo.',
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            height: 1.04,
            fontWeight: FontWeight.w900,
            letterSpacing: -1,
          ),
        ),
      ],
    ),
  );
}

class _BrandPanel extends StatelessWidget {
  const _BrandPanel();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(58),
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF071A33), Color(0xFF0B3D91), Color(0xFF1769E0)],
      ),
    ),
    child: const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Brand(inverse: true),
        Spacer(),
        Text(
          'Entregas sem\ncomplicação.',
          style: TextStyle(
            color: Colors.white,
            fontSize: 48,
            height: 1.03,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.8,
          ),
        ),
        SizedBox(height: 18),
        SizedBox(
          width: 410,
          child: Text(
            'Priorize a próxima parada, navegue até o cliente e registre cada entrega em poucos toques.',
            style: TextStyle(
              color: Color(0xFFD8E6FF),
              fontSize: 16,
              height: 1.5,
            ),
          ),
        ),
        Spacer(),
        _Feature(icon: Icons.route_rounded, text: 'Rota clara e organizada'),
        SizedBox(height: 14),
        _Feature(icon: Icons.map_rounded, text: 'Navegação no Google Maps'),
        SizedBox(height: 14),
        _Feature(
          icon: Icons.verified_rounded,
          text: 'Baixa rápida de entregas',
        ),
      ],
    ),
  );
}

class _Brand extends StatelessWidget {
  const _Brand({required this.inverse});

  final bool inverse;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      AppLogo(inverse: inverse, size: 46),
      const SizedBox(width: 13),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SmartStock',
            style: TextStyle(
              color: inverse ? Colors.white : AppColors.ink,
              fontSize: 21,
              fontWeight: FontWeight.w900,
              letterSpacing: -.4,
            ),
          ),
          Text(
            'ENTREGAS',
            style: TextStyle(
              color: inverse ? const Color(0xFFBFD4FA) : AppColors.muted,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.8,
            ),
          ),
        ],
      ),
    ],
  );
}

class _Feature extends StatelessWidget {
  const _Feature({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: .12),
          borderRadius: BorderRadius.circular(11),
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
      const SizedBox(width: 11),
      Text(
        text,
        style: const TextStyle(
          color: Color(0xFFF2F6FF),
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
      ),
    ],
  );
}
