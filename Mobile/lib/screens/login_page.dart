import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/api_exception.dart';
import '../auth/auth_controller.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/form_widgets.dart';
import '../widgets/validators.dart';
import 'check_email_page.dart';
import 'forgot_password_page.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.authController});

  final AuthController authController;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;
  String? _unverifiedEmail;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      _isSubmitting = true;
      _error = null;
      _unverifiedEmail = null;
    });

    try {
      await widget.authController.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      TextInput.finishAutofillContext();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = errorMessage(error);
        if (error is ApiException && error.statusCode == 403) {
          _unverifiedEmail = _emailController.text.trim();
        }
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      showBack: false,
      eyebrow: 'Welcome back',
      title: 'Sign in to Odo',
      description: 'Pick up where your last ride ended.',
      footer: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('New to Odo?'),
          TextButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) =>
                    RegisterPage(authController: widget.authController),
              ),
            ),
            child: const Text('Create an account'),
          ),
        ],
      ),
      child: AutofillGroup(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) StatusBanner(_error!, tone: StatusTone.error),
              if (_unverifiedEmail != null)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CheckEmailPage(
                          authController: widget.authController,
                          initialEmail: _unverifiedEmail,
                        ),
                      ),
                    ),
                    child: const Text('Resend the verification email'),
                  ),
                ),
              TextFormField(
                controller: _emailController,
                validator: validateEmail,
                autofillHints: const [AutofillHints.email],
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autocorrect: false,
                decoration: const InputDecoration(labelText: 'Email address'),
              ),
              const SizedBox(height: 16),
              PasswordField(
                controller: _passwordController,
                label: 'Password',
                validator: validateRequiredPassword,
                autofillHints: const [AutofillHints.password],
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) => _submit(),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ForgotPasswordPage(
                        authController: widget.authController,
                      ),
                    ),
                  ),
                  child: const Text('Forgot password?'),
                ),
              ),
              const SizedBox(height: 8),
              SubmitButton(
                label: 'Sign in',
                busyLabel: 'Signing in…',
                isBusy: _isSubmitting,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
