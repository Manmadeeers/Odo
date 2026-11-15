import 'package:flutter/material.dart';

import '../auth/auth_controller.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/form_widgets.dart';
import '../widgets/validators.dart';
import 'check_email_page.dart';

enum _ConfirmationState { confirming, confirmed, failed }

class ConfirmEmailPage extends StatefulWidget {
  const ConfirmEmailPage({
    super.key,
    required this.authController,
    required this.token,
  });

  final AuthController authController;
  final String? token;

  @override
  State<ConfirmEmailPage> createState() => _ConfirmEmailPageState();
}

class _ConfirmEmailPageState extends State<ConfirmEmailPage> {
  late _ConfirmationState _state;
  late String _message;

  @override
  void initState() {
    super.initState();
    final token = widget.token;
    if (token == null || token.isEmpty) {
      _state = _ConfirmationState.failed;
      _message = 'This verification link is missing its token.';
    } else {
      _state = _ConfirmationState.confirming;
      _message = 'Confirming your email address…';
      _confirm(token);
    }
  }

  Future<void> _confirm(String token) async {
    try {
      final message = await widget.authController.api.confirmEmail(token);
      if (!mounted) return;
      setState(() {
        _state = _ConfirmationState.confirmed;
        _message = message;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _state = _ConfirmationState.failed;
        _message = errorMessage(error);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = switch (_state) {
      _ConfirmationState.confirmed => 'You are verified',
      _ConfirmationState.failed => 'This link did not work',
      _ConfirmationState.confirming => 'Confirming your email',
    };
    final tone = switch (_state) {
      _ConfirmationState.confirmed => StatusTone.success,
      _ConfirmationState.failed => StatusTone.error,
      _ConfirmationState.confirming => StatusTone.info,
    };

    return AuthScaffold(
      eyebrow: 'Email verification',
      title: title,
      description:
          'A verified email keeps your account secure and recoverable.',
      footer: _state == _ConfirmationState.confirmed
          ? FilledButton(
              onPressed: () =>
                  Navigator.of(context).popUntil((route) => route.isFirst),
              child: const Text('Continue to sign in'),
            )
          : TextButton(
              onPressed: () => Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (_) =>
                      CheckEmailPage(authController: widget.authController),
                ),
              ),
              child: const Text('Request another verification email'),
            ),
      child: StatusBanner(_message, tone: tone),
    );
  }
}
