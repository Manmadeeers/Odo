import 'package:flutter/material.dart';

import '../auth/auth_controller.dart';
import '../theme/odo_theme.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/form_widgets.dart';
import '../widgets/validators.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key, required this.authController});

  final AuthController authController;

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmationController = TextEditingController();
  bool _isSubmitting = false;
  bool _isLoggingOut = false;
  String? _status;
  String? _error;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;
    if (_currentPasswordController.text == _newPasswordController.text) {
      setState(() {
        _error =
            'Your new password must be different from your current password';
      });
      return;
    }
    if (_newPasswordController.text != _confirmationController.text) {
      setState(() => _error = 'New passwords do not match');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _status = null;
      _error = null;
    });
    try {
      await widget.authController.changePassword(
        _currentPasswordController.text,
        _newPasswordController.text,
      );
      if (!mounted) return;
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmationController.clear();
      setState(() => _status = 'Password changed successfully');
    } catch (error) {
      if (mounted) setState(() => _error = errorMessage(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _logout() async {
    setState(() => _isLoggingOut = true);
    await widget.authController.logout();
    if (mounted) setState(() => _isLoggingOut = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        titleSpacing: 22,
        title: const OdoBrand(),
        actions: [
          TextButton.icon(
            onPressed: _isLoggingOut ? null : _logout,
            icon: _isLoggingOut
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.logout_rounded),
            label: Text(_isLoggingOut ? 'Signing out…' : 'Sign out'),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 36, 24, 48),
          children: [
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 580),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Eyebrow('Account'),
                    Text(
                      'Your Odo profile',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Signed in as ${widget.authController.user?.email ?? ''}',
                    ),
                    const SizedBox(height: 34),
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: OdoColors.line),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x0D1B3423),
                            blurRadius: 30,
                            offset: Offset(0, 14),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Eyebrow('Security'),
                            Text(
                              'Change password',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Updating it signs out your other Odo sessions.',
                            ),
                            const SizedBox(height: 22),
                            if (_status != null)
                              StatusBanner(_status!, tone: StatusTone.success),
                            if (_error != null)
                              StatusBanner(_error!, tone: StatusTone.error),
                            PasswordField(
                              controller: _currentPasswordController,
                              label: 'Current password',
                              validator: validateNewPassword,
                              autofillHints: const [AutofillHints.password],
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: 16),
                            PasswordField(
                              controller: _newPasswordController,
                              label: 'New password',
                              hint: 'Use at least 12 characters.',
                              validator: validateNewPassword,
                              autofillHints: const [AutofillHints.newPassword],
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: 16),
                            PasswordField(
                              controller: _confirmationController,
                              label: 'Confirm new password',
                              validator: validateNewPassword,
                              autofillHints: const [AutofillHints.newPassword],
                              textInputAction: TextInputAction.done,
                              onFieldSubmitted: (_) => _changePassword(),
                            ),
                            const SizedBox(height: 22),
                            SubmitButton(
                              label: 'Change password',
                              busyLabel: 'Changing password…',
                              isBusy: _isSubmitting,
                              onPressed: _changePassword,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
