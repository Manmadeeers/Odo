class AuthenticatedUser {
  const AuthenticatedUser({
    required this.id,
    required this.email,
    required this.emailVerified,
  });

  factory AuthenticatedUser.fromJson(Map<String, dynamic> json) {
    return AuthenticatedUser(
      id: json['id'] as String,
      email: json['email'] as String,
      emailVerified: json['emailVerified'] as bool,
    );
  }

  final String id;
  final String email;
  final bool emailVerified;
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      user: AuthenticatedUser.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresIn: json['expiresIn'] as int,
    );
  }

  final AuthenticatedUser user;
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
}

class RegistrationResult {
  const RegistrationResult({required this.user, required this.message});

  factory RegistrationResult.fromJson(Map<String, dynamic> json) {
    return RegistrationResult(
      user: AuthenticatedUser.fromJson(json['user'] as Map<String, dynamic>),
      message: json['message'] as String,
    );
  }

  final AuthenticatedUser user;
  final String message;
}
