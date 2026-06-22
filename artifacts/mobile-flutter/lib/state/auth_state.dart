import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';

class UserProfile {
  final String id;
  final String email;
  final String fullName;
  final String major;
  final int graduationYear;
  final String? profilePicture;
  final String? bio;
  final String campusDomain;

  UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.major,
    required this.graduationYear,
    this.profilePicture,
    this.bio,
    required this.campusDomain,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      major: json['major'] ?? '',
      graduationYear: json['graduationYear'] is int
          ? json['graduationYear']
          : int.tryParse(json['graduationYear'].toString()) ?? 2026,
      profilePicture: json['profilePicture'],
      bio: json['bio'],
      campusDomain: json['campusDomain'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'major': major,
      'graduationYear': graduationYear,
      'profilePicture': profilePicture,
      'bio': bio,
      'campusDomain': campusDomain,
    };
  }
}

class AuthState extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  bool _isAuthenticated = false;
  bool _isLoading = true;
  UserProfile? _user;
  String? _pendingEmail;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  UserProfile? get user => _user;
  String? get pendingEmail => _pendingEmail;

  AuthState() {
    _hydrateSession();
  }

  Future<void> _hydrateSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final accessToken = prefs.getString('@campuspulse_access_token');
      final userString = prefs.getString('@campuspulse_user_profile');

      if (accessToken != null && userString != null) {
        // Simple JSON decode
        // Finalize state
        // Parse profile
        _isAuthenticated = true;
        // In a real app we'd decode properly
      }
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }

  Future<void> sendMagicLink(String email) async {
    await _apiClient.post('/auth/register', body: {'email': email});
    _pendingEmail = email;
    notifyListeners();
  }

  Future<bool> verifyCode(String code) async {
    if (_pendingEmail == null) return false;
    
    try {
      final response = await _apiClient.post('/auth/verify', body: {
        'email': _pendingEmail,
        'token': code,
      });

      if (response != null && response is Map) {
        final accessToken = response['accessToken'];
        final refreshToken = response['refreshToken'];
        final userJson = response['user'];

        if (accessToken != null && userJson != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('@campuspulse_access_token', accessToken);
          await prefs.setString('@campuspulse_refresh_token', refreshToken ?? '');
          
          // Parse User
          _user = UserProfile.fromJson(userJson);
          _isAuthenticated = true;
          _pendingEmail = null;
          notifyListeners();
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('@campuspulse_access_token');
    await prefs.remove('@campuspulse_refresh_token');
    await prefs.remove('@campuspulse_user_profile');
    
    _isAuthenticated = false;
    _user = null;
    _pendingEmail = null;
    notifyListeners();
  }

  Future<void> updateProfile({
    String? fullName,
    String? major,
    int? graduationYear,
    String? bio,
    String? profilePicture,
  }) async {
    if (_user == null) return;

    final response = await _apiClient.put('/profiles/me', body: {
      if (fullName != null) 'fullName': fullName,
      if (major != null) 'major': major,
      if (graduationYear != null) 'graduationYear': graduationYear,
      if (bio != null) 'bio': bio,
      if (profilePicture != null) 'profilePicture': profilePicture,
    });

    if (response != null && response is Map<String, dynamic>) {
      _user = UserProfile.fromJson(response);
      notifyListeners();
    }
  }
}
