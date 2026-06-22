import 'package:flutter/material.dart';

class AfterClassTheme {
  static Color get background => const Color(0xFF0B1020);
  static Color get cardBackground => const Color(0xFF161C30).withOpacity(0.55);
  static Color get cardBorder => const Color(0xFF2E3B68).withOpacity(0.35);

  static Color get accentColor {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return const Color(0xFFFF8A3D); // Morning → Sunset orange
    } else if (hour >= 12 && hour < 17) {
      return const Color(0xFF3B82F6); // Afternoon → Blue
    } else {
      return const Color(0xFF7C5CFF); // Evening/Night → Purple
    }
  }

  static Color get secondaryAccentColor {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return const Color(0xFFFFB076); // Light orange
    } else if (hour >= 12 && hour < 17) {
      return const Color(0xFF60A5FA); // Light blue
    } else if (hour >= 17 && hour < 21) {
      return const Color(0xFFFF8A3D); // Evening → Sunset orange
    } else {
      return const Color(0xFFFF5E9A); // Night → Soft pink
    }
  }

  static Color get highlightColor => const Color(0xFFFF5E9A); // Soft pink

  static String get greeting {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return 'Good Morning 👋';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon 👋';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening 👋';
    } else {
      return 'Good Night 👋';
    }
  }

  static BoxDecoration glassDecoration({double radius = 22}) {
    return BoxDecoration(
      color: const Color(0xFF161C30).withOpacity(0.55),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: const Color(0xFF2E3B68).withOpacity(0.35),
        width: 1.5,
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.12),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }
}
