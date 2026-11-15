import 'package:flutter/material.dart';

import 'app.dart';
import 'auth/auth_controller.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final authController = AuthController();
  runApp(OdoApp(authController: authController));
  authController.initialize();
}
