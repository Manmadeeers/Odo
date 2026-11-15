import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../auth/auth_models.dart';
import '../config/app_config.dart';
import 'api_exception.dart';

class AuthApi {
  AuthApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<RegistrationResult> register(String email, String password) async {
    final json = await _post('/auth/register', {
      'email': email,
      'password': password,
    });
    return RegistrationResult.fromJson(json);
  }

  Future<AuthSession> login(String email, String password) async {
    final json = await _post('/auth/login', {
      'email': email,
      'password': password,
    });
    return AuthSession.fromJson(json);
  }

  Future<AuthSession> refresh(String refreshToken) async {
    final json = await _post('/auth/refresh-token', {
      'refreshToken': refreshToken,
    });
    return AuthSession.fromJson(json);
  }

  Future<String> logout(String accessToken) async {
    final json = await _post('/auth/logout', null, accessToken: accessToken);
    return json['message'] as String;
  }

  Future<String> confirmEmail(String token) async {
    final json = await _post('/auth/confirm-email', {'token': token});
    return json['message'] as String;
  }

  Future<String> resendVerificationEmail(String email) async {
    final json = await _post('/auth/resend-verification-email', {
      'email': email,
    });
    return json['message'] as String;
  }

  Future<String> forgotPassword(String email) async {
    final json = await _post('/auth/forgot-password', {'email': email});
    return json['message'] as String;
  }

  Future<String> resetPassword(String token, String newPassword) async {
    final json = await _post('/auth/reset-password', {
      'token': token,
      'newPassword': newPassword,
    });
    return json['message'] as String;
  }

  Future<String> changePassword(
    String accessToken,
    String currentPassword,
    String newPassword,
  ) async {
    final json = await _post('/auth/change-password', {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    }, accessToken: accessToken);
    return json['message'] as String;
  }

  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic>? body, {
    String? accessToken,
  }) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };

    late http.Response response;
    try {
      response = await _client
          .post(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          )
          .timeout(const Duration(seconds: 20));
    } on SocketException {
      throw const ApiException(
        0,
        'Unable to reach Odo. Check your connection and try again.',
      );
    } on TimeoutException {
      throw const ApiException(
        0,
        'Odo took too long to respond. Please try again.',
      );
    } on FormatException {
      throw const ApiException(0, 'The Odo server address is invalid.');
    } catch (error) {
      if (error is ApiException) rethrow;
      throw const ApiException(
        0,
        'Unable to reach Odo. Check your connection and try again.',
      );
    }

    final decoded = _decodeBody(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, _errorMessage(decoded));
    }
    if (decoded is! Map<String, dynamic>) {
      throw const ApiException(
        0,
        'The Odo server returned an invalid response.',
      );
    }
    return decoded;
  }

  Object? _decodeBody(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } on FormatException {
      return null;
    }
  }

  String _errorMessage(Object? body) {
    if (body is Map<String, dynamic>) {
      final message = body['message'];
      if (message is List) return message.join('. ');
      if (message is String && message.isNotEmpty) return message;

      final error = body['error'];
      if (error is String && error.isNotEmpty) return error;
    }
    return 'Something went wrong';
  }
}
