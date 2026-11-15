import 'package:flutter_test/flutter_test.dart';
import 'package:odo_mobile/widgets/validators.dart';

void main() {
  group('email validation', () {
    test('accepts a normal email address', () {
      expect(validateEmail('rider@example.com'), isNull);
    });

    test('rejects malformed and blank addresses', () {
      expect(validateEmail(''), isNotNull);
      expect(validateEmail('rider@'), isNotNull);
    });
  });

  group('password validation', () {
    test('requires at least 12 characters', () {
      expect(validateNewPassword('short'), 'Use at least 12 characters');
      expect(validateNewPassword('long-enough-password'), isNull);
    });

    test('login validation only requires a value', () {
      expect(validateRequiredPassword(''), isNotNull);
      expect(validateRequiredPassword('x'), isNull);
    });
  });
}
