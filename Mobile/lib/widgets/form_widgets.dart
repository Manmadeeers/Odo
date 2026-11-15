import 'package:flutter/material.dart';

import '../theme/odo_theme.dart';

enum StatusTone { error, success, info }

class StatusBanner extends StatelessWidget {
  const StatusBanner(this.message, {super.key, required this.tone});

  final String message;
  final StatusTone tone;

  @override
  Widget build(BuildContext context) {
    final (foreground, background, icon) = switch (tone) {
      StatusTone.error => (
        OdoColors.danger,
        OdoColors.dangerBackground,
        Icons.error_outline_rounded,
      ),
      StatusTone.success => (
        OdoColors.success,
        OdoColors.successBackground,
        Icons.check_circle_outline_rounded,
      ),
      StatusTone.info => (
        OdoColors.info,
        OdoColors.infoBackground,
        Icons.info_outline_rounded,
      ),
    };

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: background,
        border: Border.all(color: foreground.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground, size: 21),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: foreground, height: 1.45),
            ),
          ),
        ],
      ),
    );
  }
}

class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.validator,
    this.textInputAction,
    this.onFieldSubmitted,
    this.enabled = true,
    this.autofillHints,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;
  final bool enabled;
  final Iterable<String>? autofillHints;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      enabled: widget.enabled,
      obscureText: _obscure,
      keyboardType: TextInputType.visiblePassword,
      textInputAction: widget.textInputAction,
      autofillHints: widget.autofillHints,
      validator: widget.validator,
      onFieldSubmitted: widget.onFieldSubmitted,
      decoration: InputDecoration(
        labelText: widget.label,
        helperText: widget.hint,
        suffixIcon: IconButton(
          tooltip: _obscure ? 'Show password' : 'Hide password',
          onPressed: widget.enabled
              ? () => setState(() => _obscure = !_obscure)
              : null,
          icon: Icon(
            _obscure
                ? Icons.visibility_outlined
                : Icons.visibility_off_outlined,
          ),
        ),
      ),
    );
  }
}

class SubmitButton extends StatelessWidget {
  const SubmitButton({
    super.key,
    required this.label,
    required this.busyLabel,
    required this.isBusy,
    required this.onPressed,
  });

  final String label;
  final String busyLabel;
  final bool isBusy;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: isBusy ? null : onPressed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (isBusy) ...[
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.3,
                color: OdoColors.forestDeep,
              ),
            ),
            const SizedBox(width: 10),
          ],
          Text(isBusy ? busyLabel : label),
        ],
      ),
    );
  }
}
