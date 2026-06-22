import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String? _customBaseUrl;

  // ---------------------------------------------------------------------------
  // REMOTE/PRODUCTION HOST URL
  // If you are using a public tunnel (e.g. ngrok, localtunnel) or have deployed
  // the server (e.g. on Render/Railway), paste the HTTPS URL here:
  // Example: 'https://campuspulse-api.localtunnel.me'
  // ---------------------------------------------------------------------------
  static const String remoteUrl = 'https://campuspulse-api-production.up.railway.app/api';

  String get baseUrl {
    if (_customBaseUrl != null) return _customBaseUrl!;
    if (remoteUrl.isNotEmpty) return remoteUrl;
    
    // In Flutter, default to local server hosts
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  void setBaseUrl(String url) {
    _customBaseUrl = url.replaceAll(RegExp(r'/+$'), '');
  }

  Future<String?> get _token async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('@campuspulse_access_token');
  }

  Future<Map<String, String>> _headers() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'bypass-tunnel-reminder': 'true',
      'ngrok-skip-browser-warning': 'true',
    };
    final token = await _token;
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  dynamic _processResponse(http.Response response) {
    final statusCode = response.statusCode;
    final body = response.body;

    if (statusCode >= 200 && statusCode < 300) {
      if (body.isEmpty) return null;
      try {
        return jsonDecode(body);
      } catch (e) {
        return body;
      }
    } else {
      String errorMessage = 'HTTP $statusCode';
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map && decoded.containsKey('error')) {
          errorMessage = decoded['error'];
        }
      } catch (_) {}
      throw ApiException(statusCode, errorMessage);
    }
  }

  Future<dynamic> get(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final response = await http.get(url, headers: await _headers());
    return _processResponse(response);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$path');
    final response = await http.post(
      url,
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _processResponse(response);
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$path');
    final response = await http.put(
      url,
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _processResponse(response);
  }

  Future<dynamic> delete(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final response = await http.delete(url, headers: await _headers());
    return _processResponse(response);
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}
