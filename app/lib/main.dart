// lib/main.dart
import 'package:flutter/material.dart';
import 'package:app/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';
import 'package:app/screens/auth/register_screen.dart';
import 'package:app/screens/splash_screen.dart';
import 'package:app/screens/customer_dashboard_screen.dart';
import 'package:app/screens/courier_dashboard_screen.dart';
import 'package:app/providers/shipments_provider.dart';
import 'package:app/providers/payments_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        // Add new providers
        ChangeNotifierProvider(create: (_) => ShipmentsProvider()),
        ChangeNotifierProvider(create: (_) => PaymentsProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'E-Courier',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF008080), // Teal primary
                primary: const Color(0xFF008080), // Teal
                secondary: const Color(0xFF4A90E2), // Blue
                surface: Colors.white,
                background: const Color(0xFFF0F8F8), // Light teal background
                onPrimary: Colors.white,
                onSecondary: Colors.white,
                onSurface: const Color(0xFF1A3C3C), // Dark teal text
                onBackground: const Color(0xFF1A3C3C), // Dark teal text
                brightness: Brightness.light,
                error: const Color(0xFFE53E3E), // Red
                onError: Colors.white,
              ),
              useMaterial3: true,
              appBarTheme: AppBarTheme(
                centerTitle: true,
                elevation: 0,
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF1A3C3C),
                titleTextStyle: const TextStyle(
                  color: Color(0xFF1A3C3C),
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF008080),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding:
                      const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              outlinedButtonTheme: OutlinedButtonThemeData(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF008080),
                  side: const BorderSide(color: Color(0xFF008080)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding:
                      const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: Color(0xFF008080), width: 2),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
              cardTheme: CardThemeData(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                color: Colors.white,
              ),
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/customer/dashboard': (context) =>
                  const CustomerDashboardScreen(),
              '/courier/dashboard': (context) => const CourierDashboardScreen(),
            },
            home: Builder(
              builder: (context) {
                final authProvider = Provider.of<AuthProvider>(context);
                if (!authProvider.isAuthenticated) {
                  return const SplashScreen();
                }
                final role = authProvider.userData?['role'];
                if (role == 'courier') {
                  return const CourierDashboardScreen();
                } else {
                  return const CustomerDashboardScreen();
                }
              },
            ),
          );
        },
      ),
    );
  }
}
