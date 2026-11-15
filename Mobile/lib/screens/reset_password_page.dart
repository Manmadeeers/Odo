import 'package:flutter/material.dart';

import '../auth/auth_controller.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/form_widgets.dart';
import '../widgets/validators.dart';

class ResetPasswordPage extends StatefulWidget {
  const ResetPasswordPage({
    super.key,
    required this.authController,
    required this.token,
  });

  final AuthController authController;
  final String? token;

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmationController = TextEditingController();
  bool _isSubmitting = false;
  String? _status;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.token == null || widget.token!.isEmpty) {
      _error = 'This password reset link is missing its token.';
    }
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.token == null || !_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmationController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() {
      _isSubmitting = true;
      _status = null;
      _error = null;
    });
    try {
      final message = await widget.authController.api.resetPassword(
        widget.token!,
        _passwordController.text,
      );
      if (!mounted) return;
      _passwordController.clear();
      _confirmationController.clear();
      setState(() => _status = message);
    } catch (error) {
      if (mounted) setState(() => _error = errorMessage(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasToken = widget.token != null && widget.token!.isNotEmpty;
    return AuthScaffold(
      eyebrow: 'Choose a new password',
      title: 'Secure your account',
      description: 'Your new password will sign out any other active sessions.',
      footer: TextButton(
        onPressed: () =>
            Navigator.of(context).popUntil((route) => route.isFirst),
        child: const Text('Back to sign in'),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_status != null)
              StatusBanner(_status!, tone: StatusTone.success),
            if (_error != null) StatusBanner(_error!, tone: StatusTone.error),
            if (_status == null) ...[
              PasswordField(
                controller: _passwordController,
                enabled: hasToken,
                label: 'New password',
                hint: 'Use at least 12 characters.',
                validator: validateNewPassword,
                autofillHints: const [AutofillHints.newPassword],
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),
              PasswordField(
                controller: _confirmationController,
                enabled: hasToken,
                label: 'Confirm new password',
                validator: validateNewPassword,
                autofillHints: const [AutofillHints.newPassword],
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 22),
              SubmitButton(
                label: 'Update password',
                busyLabel: 'Updating password…',
                isBusy: _isSubmitting,
                onPressed: hasToken ? _submit : null,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
