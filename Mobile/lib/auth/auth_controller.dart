import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/api_exception.dart';
import '../api/auth_api.dart';
import 'auth_models.dart';

class AuthController extends ChangeNotifier {
  AuthController({AuthApi? api, FlutterSecureStorage? storage})
    : api = api ?? AuthApi(),
      _storage = storage ?? const FlutterSecureStorage();

  static const _refreshTokenKey = 'odo.auth.refreshToken';

  final AuthApi api;
  final FlutterSecureStorage _storage;

  AuthSession? _session;
  Future<AuthSession>? _refreshOperation;
  bool _isInitializing = true;

  AuthenticatedUser? get user => _session?.user;
  bool get isAuthenticated => _session != null;
  bool get isInitializing => _isInitializing;

  Future<void> initialize() async {
    try {
      final refreshToken = await _storage.read(key: _refreshTokenKey);
      if (refreshToken != null) await _refresh(refreshToken);
    } catch (_) {
      await _clearSession();
    } finally {
      _isInitializing = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    await _saveSession(await api.login(email.trim(), password));
  }

  Future<void> logout() async {
    try {
      if (_session != null) {
        await _runAuthenticated((token) => api.logout(token));
      }
    } catch (_) {
      // Local sign-out must still succeed when the API is unavailable.
    } finally {
      await _clearSession();
    }
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await _runAuthenticated(
      (token) => api.changePassword(token, currentPassword, newPassword),
    );
  }

  Future<T> _runAuthenticated<T>(
    Future<T> Function(String accessToken) operation,
  ) async {
    var session = _session ?? await _refreshStoredSession();
    try {
      return await operation(session.accessToken);
    } on ApiException catch (error) {
      if (error.statusCode != 401 ||
          error.message == 'Current password is incorrect') {
        rethrow;
      }
      session = await _refreshStoredSession();
      return operation(session.accessToken);
    }
  }

  Future<AuthSession> _refreshStoredSession() async {
    final refreshToken = await _storage.read(key: _refreshTokenKey);
    if (refreshToken == null) {
      throw const ApiException(401, 'Your session has expired');
    }
    return _refresh(refreshToken);
  }

  Future<AuthSession> _refresh(String refreshToken) {
    final pending = _refreshOperation;
    if (pending != null) return pending;

    final operation = api
        .refresh(refreshToken)
        .then((session) async {
          await _saveSession(session);
          return session;
        })
        .catchError((Object error) async {
          await _clearSession();
          throw error;
        })
        .whenComplete(() => _refreshOperation = null);
    _refreshOperation = operation;
    return operation;
  }

  Future<void> _saveSession(AuthSession session) async {
    _session = session;
    await _storage.write(key: _refreshTokenKey, value: session.refreshToken);
    notifyListeners();
  }

  Future<void> _clearSession() async {
    _session = null;
    await _storage.delete(key: _refreshTokenKey);
    notifyListeners();
  }
}
