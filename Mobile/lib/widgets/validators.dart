String? validateEmail(String? value) {
  final email = value?.trim() ?? '';
  if (email.isEmpty) return 'Enter your email address';
  final valid = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
  return valid ? null : 'Enter a valid email address';
}

String? validateRequiredPassword(String? value) {
  if (value == null || value.isEmpty) return 'Enter your password';
  return null;
}

String? validateNewPassword(String? value) {
  if (value == null || value.isEmpty) return 'Enter a password';
  if (value.length < 12) return 'Use at least 12 characters';
  if (value.length > 128) return 'Use no more than 128 characters';
  return null;
}

String errorMessage(Object error) {
  final message = error.toString();
  return message.startsWith('Exception: ') ? message.substring(11) : message;
}
