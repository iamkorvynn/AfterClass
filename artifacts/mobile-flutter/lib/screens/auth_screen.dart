import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    setState(() {
      _error = message;
    });
  }

  Future<void> _submitEmail(AuthState auth) async {
    final email = _emailController.text.trim().toLowerCase();
    if (email.isEmpty) {
      _showError('Email address cannot be empty');
      return;
    }
    
    // Validate domain
    final allowed = ['.edu', '.ac.in', '.edu.in', '.edu.co', '.edu.mo'];
    final isValid = allowed.any((domain) => email.endsWith(domain));
    if (!isValid) {
      _showError('Only approved college email domains (.edu, .ac.in) are permitted');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      await auth.sendMagicLink(email);
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Future<void> _submitCode(AuthState auth) async {
    final code = _codeController.text.trim();
    if (code.isEmpty || code.length < 6) {
      _showError('Please enter the full 6-digit magic code');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final success = await auth.verifyCode(code);
      if (!success) {
        _showError('Invalid or expired verification code');
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthState>(context);
    final isOtpStep = auth.pendingEmail != null;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF150D2A), // Deep sunset-purple dark tint
              Color(0xFF0B1020), // Deep navy
              Color(0xFF070B16), // Ultra deep navy
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(28.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo / Icon
                  Center(
                    child: Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C5CFF).withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF7C5CFF), width: 1.5),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo.jpg',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // App Title
                  const Text(
                    'AfterClass',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Subtitle
                  Text(
                    isOtpStep
                        ? 'We sent a verification code to ${auth.pendingEmail}'
                        : 'College exclusive social platform. Real identity network & zero-knowledge confessions.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF9CA3AF),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 36),

                  // Card Box (Frosted Glassmorphism)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF161C30).withOpacity(0.55),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFF2E3B68).withOpacity(0.35), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_error != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                            ),
                            child: Text(
                              _error!,
                              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        
                        // Input Field
                        Text(
                          isOtpStep ? 'Verification Code' : 'Campus Email Address',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 8),
                        
                        TextField(
                          controller: isOtpStep ? _codeController : _emailController,
                          keyboardType: isOtpStep ? TextInputType.number : TextInputType.emailAddress,
                          maxLength: isOtpStep ? 6 : null,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            counterText: '',
                            hintText: isOtpStep ? 'Enter 6-digit code' : 'username@college.edu',
                            hintStyle: const TextStyle(color: Colors.white24, fontSize: 14),
                            filled: true,
                            fillColor: const Color(0xFF070B16),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide(color: const Color(0xFF2E3B68).withOpacity(0.35)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Color(0xFF7C5CFF)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Action Button
                        ElevatedButton(
                          onPressed: _isSubmitting
                              ? null
                              : () => isOtpStep ? _submitCode(auth) : _submitEmail(auth),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7C5CFF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation(Colors.white),
                                  ),
                                )
                              : Text(
                                  isOtpStep ? 'Verify & Continue' : 'Get Magic Link',
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                        ),
                        
                        if (isOtpStep) ...[
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: () {
                              auth.logout(); // reset flow
                            },
                            child: const Text(
                              'Change Email Address',
                              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
