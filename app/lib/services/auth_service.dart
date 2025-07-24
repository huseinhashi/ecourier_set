// lib/services/auth_service.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app/services/api_client.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiClient _apiClient = ApiClient();

  // Auth state change notifier
  final ValueNotifier<bool> authStateChanges = ValueNotifier<bool>(false);

  // Store user data directly
  Map<String, dynamic>? _userData;
  String? _token;

  // Getters
  Map<String, dynamic>? get userData => _userData;
  String? get token => _token;
  bool get isAuthenticated => _token != null;

  // Singleton factory
  factory AuthService() => _instance;

  AuthService._internal();

  // Initialize the service by loading saved data
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');

      // Parse stored user data if available
      final userDataString = prefs.getString('userData');
      if (userDataString != null) {
        _userData = jsonDecode(userDataString) as Map<String, dynamic>;
      }

      if (_token != null) {
        _apiClient.setToken(_token!);
      }

      // Notify listeners about auth state
      authStateChanges.value = isAuthenticated;
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing auth service: $e');
      }
      rethrow;
    }
  }

  // Customer Registration
  Future<Map<String, dynamic>> registerCustomer(
    String name,
    String phone,
    String password,
    String address,
  ) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/register',
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          'address': address,
        },
      );

      // If registration is successful and data contains token, handle as login
      if (response['success'] &&
          response['data'] != null &&
          response['data']['token'] != null) {
        await _handleLoginSuccess(response['data']);
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // User Login (admin, courier, customer)
  Future<Map<String, dynamic>> loginUser(
      String phone, String password, String role) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/login',
        data: {
          'phone': phone,
          'password': password,
          'role': role,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data']);
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during login: $e',
      };
    }
  }

  // Handle successful login
  Future<void> _handleLoginSuccess(Map<String, dynamic> data) async {
    _token = data['token'];

    // Store user data
    _userData = data['user'] as Map<String, dynamic>;

    // Set token in API client with Bearer prefix
    _apiClient.setToken(_token!);

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);

    // Save user data as well
    if (_userData != null) {
      await prefs.setString('userData', jsonEncode(_userData));
    }

    // Notify listeners
    authStateChanges.value = true;
  }

  // Logout
  Future<Map<String, dynamic>> logout() async {
    try {
      // Clear data
      _token = null;
      _userData = null;

      // Clear token in API client
      _apiClient.clearToken();

      // Clear SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('userData');

      // Notify listeners
      authStateChanges.value = false;

      return {
        'success': true,
        'message': 'Logged out successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during logout: $e',
      };
    }
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? currentPassword,
    String? newPassword,
  }) async {
    try {
      Map<String, dynamic> data = {};
      if (name != null) data['name'] = name;
      if (phone != null) data['phone'] = phone;
      if (address != null) data['address'] = address;
      if (currentPassword != null) data['currentPassword'] = currentPassword;
      if (newPassword != null) data['newPassword'] = newPassword;

      final response = await _apiClient.request(
        method: 'PUT',
        path: '/users/profile',
        data: data,
      );

      // Update local user data if successful
      if (response['success'] && response['data'] != null) {
        _userData = response['data'] as Map<String, dynamic>;
        // Save updated user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userData', jsonEncode(_userData));
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating profile: $e',
      };
    }
  }
}
