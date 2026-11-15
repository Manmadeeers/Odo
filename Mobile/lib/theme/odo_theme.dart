import 'package:flutter/material.dart';

abstract final class OdoColors {
  static const ink = Color(0xFF17211B);
  static const inkSoft = Color(0xFF526158);
  static const forest = Color(0xFF153F2C);
  static const forestDeep = Color(0xFF0D2A1D);
  static const lime = Color(0xFFC7F36B);
  static const paper = Color(0xFFF7F7F1);
  static const line = Color(0xFFD9DFD9);
  static const danger = Color(0xFFA93232);
  static const dangerBackground = Color(0xFFFFF0EF);
  static const success = Color(0xFF23653D);
  static const successBackground = Color(0xFFEDF8EF);
  static const info = Color(0xFF345B72);
  static const infoBackground = Color(0xFFEDF5F8);
}

ThemeData buildOdoTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: OdoColors.forest,
    primary: OdoColors.forest,
    onPrimary: Colors.white,
    secondary: OdoColors.lime,
    onSecondary: OdoColors.forestDeep,
    surface: Colors.white,
    error: OdoColors.danger,
  );
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: const BorderSide(color: OdoColors.line),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: OdoColors.paper,
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        color: OdoColors.ink,
        fontSize: 38,
        height: 1.08,
        fontWeight: FontWeight.w800,
        letterSpacing: -1.5,
      ),
      headlineSmall: TextStyle(
        color: OdoColors.ink,
        fontSize: 25,
        height: 1.15,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.6,
      ),
      bodyLarge: TextStyle(color: OdoColors.inkSoft, height: 1.55),
      bodyMedium: TextStyle(color: OdoColors.inkSoft, height: 1.5),
      labelLarge: TextStyle(fontWeight: FontWeight.w800),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
      border: border,
      enabledBorder: border,
      focusedBorder: border.copyWith(
        borderSide: const BorderSide(color: OdoColors.success, width: 1.5),
      ),
      errorBorder: border.copyWith(
        borderSide: const BorderSide(color: OdoColors.danger),
      ),
      focusedErrorBorder: border.copyWith(
        borderSide: const BorderSide(color: OdoColors.danger, width: 1.5),
      ),
      labelStyle: const TextStyle(color: OdoColors.inkSoft),
      floatingLabelStyle: const TextStyle(
        color: OdoColors.forest,
        fontWeight: FontWeight.w700,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        foregroundColor: OdoColors.forestDeep,
        backgroundColor: OdoColors.lime,
        disabledBackgroundColor: OdoColors.lime.withValues(alpha: 0.5),
        textStyle: const TextStyle(fontWeight: FontWeight.w800),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: OdoColors.forest,
        textStyle: const TextStyle(fontWeight: FontWeight.w800),
      ),
    ),
  );
}
