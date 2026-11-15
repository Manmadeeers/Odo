import 'package:flutter/material.dart';

import '../auth/auth_controller.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/form_widgets.dart';
import '../widgets/validators.dart';

class CheckEmailPage extends StatefulWidget {
  const CheckEmailPage({
    super.key,
    required this.authController,
    this.initialEmail,
    this.initialMessage,
  });

  final AuthController authController;
  final String? initialEmail;
  final String? initialMessage;

  @override
  State<CheckEmailPage> createState() => _CheckEmailPageState();
}

class _CheckEmailPageState extends State<CheckEmailPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  late String? _status;
  String? _error;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
    _status = widget.initialMessage;
  }

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
      final message = await widget.authController.api.resendVerificationEmail(
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
      eyebrow: 'One more step',
      title: 'Check your email',
      description:
          'Open the verification link we sent you, then return to sign in.',
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
            TextFormField(
              controller: _emailController,
              validator: validateEmail,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              autocorrect: false,
              decoration: const InputDecoration(labelText: 'Email address'),
            ),
            const SizedBox(height: 22),
            SubmitButton(
              label: 'Resend verification email',
              busyLabel: 'Sending…',
              isBusy: _isSubmitting,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
