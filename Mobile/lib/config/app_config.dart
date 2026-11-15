abstract final class AppConfig {
  /// Override for a physical device with, for example:
  /// --dart-define=API_BASE_URL=http://192.168.1.20:3000
  static final apiBaseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  ).replaceFirst(RegExp(r'/$'), '');
}
