import 'package:flutter/material.dart';

import '../theme/odo_theme.dart';
import '../widgets/auth_scaffold.dart';

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: OdoColors.paper,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              OdoBrand(),
              SizedBox(height: 22),
              SizedBox(
                width: 25,
                height: 25,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: OdoColors.forest,
                ),
              ),
              SizedBox(height: 12),
              Text('Loading your account…'),
            ],
          ),
        ),
      ),
    );
  }
}
