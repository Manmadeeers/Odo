import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import 'auth/auth_controller.dart';
import 'screens/account_page.dart';
import 'screens/confirm_email_page.dart';
import 'screens/login_page.dart';
import 'screens/reset_password_page.dart';
import 'screens/splash_page.dart';
import 'theme/odo_theme.dart';

class OdoApp extends StatefulWidget {
  const OdoApp({super.key, required this.authController});

  final AuthController authController;

  @override
  State<OdoApp> createState() => _OdoAppState();
}

class _OdoAppState extends State<OdoApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSubscription;
  String? _lastHandledLink;

  @override
  void initState() {
    super.initState();
    _listenForLinks();
  }

  Future<void> _listenForLinks() async {
    try {
      final initialLink = await _appLinks.getInitialLink();
      if (initialLink != null) _scheduleLink(initialLink);
    } catch (_) {
      // The regular login flow remains available if native link lookup fails.
    }

    _linkSubscription = _appLinks.uriLinkStream.listen(
      _scheduleLink,
      onError: (_) {},
    );
  }

  void _scheduleLink(Uri uri) {
    if (_lastHandledLink == uri.toString()) return;
    _lastHandledLink = uri.toString();
    WidgetsBinding.instance.addPostFrameCallback((_) => _handleLink(uri));
  }

  void _handleLink(Uri uri) {
    final navigator = _navigatorKey.currentState;
    if (navigator == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _handleLink(uri));
      return;
    }

    final route = uri.scheme == 'odo'
        ? uri.host
        : (uri.pathSegments.isEmpty ? '' : uri.pathSegments.first);
    final token = uri.queryParameters['token'];

    if (route == 'confirm-email') {
      navigator.push(
        MaterialPageRoute(
          builder: (_) => ConfirmEmailPage(
            authController: widget.authController,
            token: token,
          ),
        ),
      );
    } else if (route == 'reset-password') {
      navigator.push(
        MaterialPageRoute(
          builder: (_) => ResetPasswordPage(
            authController: widget.authController,
            token: token,
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    widget.authController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Odo',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      theme: buildOdoTheme(),
      home: AnimatedBuilder(
        animation: widget.authController,
        builder: (context, _) {
          if (widget.authController.isInitializing) return const SplashPage();
          if (widget.authController.isAuthenticated) {
            return AccountPage(authController: widget.authController);
          }
          return LoginPage(authController: widget.authController);
        },
      ),
    );
  }
}
