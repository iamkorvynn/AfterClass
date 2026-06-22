import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../services/socket_service.dart';
import '../services/theme_service.dart';
import '../state/auth_state.dart';

class BlindChatScreen extends StatefulWidget {
  const BlindChatScreen({super.key});

  @override
  State<BlindChatScreen> createState() => _BlindChatScreenState();
}

class _BlindChatScreenState extends State<BlindChatScreen> {
  final _textController = TextEditingController();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _sendMessage(SocketService socket) {
    final text = _textController.text.trim();
    if (text.isNotEmpty) {
      socket.sendMessage(text);
      _textController.clear();
    }
  }

  String _getPartnerAlias(String? roomId) {
    if (roomId == null) return 'Anonymous Stranger';
    final index = roomId.hashCode.abs() % 6;
    switch (index) {
      case 0:
        return 'Anonymous Fox 🦊';
      case 1:
        return 'Anonymous Owl 🦉';
      case 2:
        return 'Anonymous Panda 🐼';
      case 3:
        return 'Anonymous Wolf 🐺';
      case 4:
        return 'Anonymous Axolotl 🦎';
      default:
        return 'Anonymous Raven 🐦';
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthState>(context, listen: false);
    final socket = Provider.of<SocketService>(context);
    final isWin = socket.state == ChatState.connected;
    final partnerAlias = _getPartnerAlias(socket.messages.isNotEmpty ? socket.messages.first.id : null);

    return Scaffold(
      backgroundColor: AfterClassTheme.background,
      appBar: AppBar(
        title: Text(
          isWin ? partnerAlias : 'Blind Match',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        backgroundColor: const Color(0xFF0F1326),
        elevation: 0,
        actions: isWin
            ? [
                TextButton(
                  onPressed: () => socket.disconnect(),
                  child: const Text('Leave', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                ),
              ]
            : null,
      ),
      body: Container(
        color: AfterClassTheme.background,
        child: _buildBody(context, auth, socket),
      ),
    );
  }

  Widget _buildBody(BuildContext context, AuthState auth, SocketService socket) {
    switch (socket.state) {
      case ChatState.idle:
        return _buildIdleView(context, auth, socket);
      case ChatState.searching:
        return _buildSearchingView(context, socket);
      case ChatState.disconnected:
        return _buildDisconnectedView(context, socket);
      case ChatState.connected:
        return _buildChatView(context, auth, socket);
    }
  }

  Widget _buildIdleView(BuildContext context, AuthState auth, SocketService socket) {
    final accentColor = AfterClassTheme.accentColor;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.12),
                  shape: BoxShape.circle,
                  border: Border.all(color: accentColor.withOpacity(0.3), width: 1.5),
                ),
                child: Icon(Icons.shuffle, size: 52, color: accentColor),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'Blind Match',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -0.5),
            ),
            const SizedBox(height: 12),
            const Text(
              'Get matched with a random verified student from your campus. No names. No profiles. Just raw conversation.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white60, height: 1.4, fontSize: 14.5),
            ),
            const SizedBox(height: 36),
            
            // Rules box
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF161C30).withOpacity(0.55),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFF2E3B68).withOpacity(0.35), width: 1.5),
              ),
              child: Column(
                children: [
                  _buildRuleRow('Completely anonymous'),
                  const SizedBox(height: 12),
                  _buildRuleRow('Messages expire in 24 hours'),
                  const SizedBox(height: 12),
                  _buildRuleRow('Leave anytime, no pressure'),
                ],
              ),
            ),
            const SizedBox(height: 36),

            ElevatedButton(
              onPressed: () => socket.startMatching(auth.user?.id ?? ''),
              style: ElevatedButton.styleFrom(
                backgroundColor: accentColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Find a Match', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRuleRow(String rule) {
    final accentColor = AfterClassTheme.accentColor;
    return Row(
      children: [
        Icon(Icons.check_circle_outline, color: accentColor, size: 20),
        const SizedBox(width: 12),
        Expanded(child: Text(rule, style: const TextStyle(fontSize: 14, color: Colors.white70))),
      ],
    );
  }

  Widget _buildSearchingView(BuildContext context, SocketService socket) {
    final highlightColor = AfterClassTheme.highlightColor;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              '🎭 Blind Match',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -0.5),
            ),
            const SizedBox(height: 32),
            const Text(
              'Searching...',
              style: TextStyle(fontSize: 18, color: Colors.white70, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 20),
            
            // Pulsing dot animations or simple indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildSearchingDot(highlightColor),
                _buildSearchingDot(highlightColor.withOpacity(0.5)),
                _buildSearchingDot(highlightColor.withOpacity(0.2)),
              ],
            ),
            
            const SizedBox(height: 32),
            const Text(
              'Finding another student...',
              style: TextStyle(color: Colors.white38, fontSize: 14),
            ),
            const SizedBox(height: 48),
            
            OutlinedButton(
              onPressed: () => socket.disconnect(),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.white24),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('Cancel Search', style: TextStyle(color: Colors.white60)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchingDot(Color color) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 6),
      width: 12,
      height: 12,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }

  Widget _buildDisconnectedView(BuildContext context, SocketService socket) {
    final accentColor = AfterClassTheme.accentColor;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cancel_outlined, size: 64, color: Colors.white24),
            const SizedBox(height: 24),
            const Text('Chat Ended', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            const Text(
              'This conversation has ended. All messages will expire automatically.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white60, height: 1.4),
            ),
            const SizedBox(height: 36),
            ElevatedButton(
              onPressed: () => socket.rematch(),
              style: ElevatedButton.styleFrom(
                backgroundColor: accentColor,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Find New Match', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatView(BuildContext context, AuthState auth, SocketService socket) {
    final accentColor = AfterClassTheme.accentColor;

    return Column(
      children: [
        // Sub-header displaying partner name and online status
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF0F1326),
            border: Border(
              bottom: BorderSide(
                color: const Color(0xFF2E3B68).withOpacity(0.25),
                width: 1.5,
              ),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  socket.isPartnerTyping ? 'Typing...' : 'Online',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        
        // Message list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(20),
            reverse: true,
            itemCount: socket.messages.length,
            itemBuilder: (context, index) {
              final msg = socket.messages[index];
              return Align(
                alignment: msg.isMine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: msg.isMine ? accentColor : const Color(0xFF161C30).withOpacity(0.55),
                    borderRadius: BorderRadius.circular(20).copyWith(
                      bottomRight: msg.isMine ? const Radius.circular(0) : const Radius.circular(20),
                      topLeft: !msg.isMine ? const Radius.circular(0) : const Radius.circular(20),
                    ),
                    border: msg.isMine
                        ? null
                        : Border.all(color: const Color(0xFF2E3B68).withOpacity(0.35), width: 1.5),
                  ),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.76),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(msg.text, style: const TextStyle(color: Colors.white, fontSize: 14.5, height: 1.35)),
                      const SizedBox(height: 4),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Text(
                          DateFormat('hh:mm a').format(msg.time),
                          style: TextStyle(color: msg.isMine ? Colors.white60 : Colors.white30, fontSize: 9),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        
        // Input bar
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0F1326),
            border: Border(
              top: BorderSide(
                color: const Color(0xFF2E3B68).withOpacity(0.25),
                width: 1.5,
              ),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textController,
                  onChanged: (val) => socket.sendTypingStatus(val.trim().isNotEmpty),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Type Message...',
                    hintStyle: const TextStyle(color: Colors.white24),
                    filled: true,
                    fillColor: const Color(0xFF070B16),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: BorderSide(color: const Color(0xFF2E3B68).withOpacity(0.15)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: BorderSide(color: accentColor.withOpacity(0.5)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              IconButton(
                icon: Icon(Icons.send, color: accentColor),
                onPressed: () => _sendMessage(socket),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
