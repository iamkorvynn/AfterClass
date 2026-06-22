import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/socket_service.dart';
import 'state/app_state.dart';
import 'state/auth_state.dart';
import 'screens/auth_screen.dart';
import 'screens/navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()),
        ChangeNotifierProvider(create: (_) => AppState()),
        ChangeNotifierProvider(create: (_) => SocketService()),
      ],
      child: const CampusPulseApp(),
    ),
  );
}

class CampusPulseApp extends StatelessWidget {
  const CampusPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CampusPulse',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark, // Default to Dark mode for premium styling
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F0F1A), // Sleek midnight color
        cardColor: const Color(0xFF16162A), // Premium card tint
        dividerColor: const Color(0xFF262642),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF7C3AED), // Premium deep violet
          secondary: Color(0xFFEC4899), // Neon pink accents
          surface: Color(0xFF16162A),
          error: Color(0xFFEF4444),
        ),
        textTheme: GoogleFonts.interTextTheme(
          ThemeData.dark().textTheme.copyWith(
            bodyLarge: const TextStyle(color: Color(0xFFE5E7EB)),
            bodyMedium: const TextStyle(color: Color(0xFF9CA3AF)),
          ),
        ),
      ),
      home: Consumer<AuthState>(
        builder: (context, auth, _) {
          if (auth.isLoading) {
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(color: Color(0xFF7C3AED)),
              ),
            );
          }
          if (auth.isAuthenticated) {
            return const NavigationShell();
          }
          return const AuthScreen();
        },
      ),
    );
  }
}
