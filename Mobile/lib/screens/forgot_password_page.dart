import 'package:flutter/material.dart';

import '../auth/auth_controller.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/form_widgets.dart';
import '../widgets/validators.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key, required this.authController});

  final AuthController authController;

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isSubmitting = false;
  String? _status;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _status = null;
      _error = null;
    });
    try {
      final message = await widget.authController.api.forgotPassword(
        _emailController.text.trim(),
      );
      if (mounted) setState(() => _status = message);
    } catch (error) {
      if (mounted) setState(() => _error = errorMessage(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      eyebrow: 'Account recovery',
      title: 'Reset your password',
      description:
          'Enter your account email and we will send you a secure reset link.',
      footer: TextButton(
        onPressed: () => Navigator.of(context).pop(),
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
            TextFormField(
              controller: _emailController,
              validator: validateEmail,
              autofillHints: const [AutofillHints.email],
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              autocorrect: false,
              decoration: const InputDecoration(labelText: 'Email address'),
            ),
            const SizedBox(height: 22),
            SubmitButton(
              label: 'Send reset link',
              busyLabel: 'Sending reset link…',
              isBusy: _isSubmitting,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
