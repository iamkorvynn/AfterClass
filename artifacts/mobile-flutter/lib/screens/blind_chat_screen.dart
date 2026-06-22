import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../services/socket_service.dart';
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

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthState>(context, listen: false);
    final socket = Provider.of<SocketService>(context);
    final isWin = socket.state == ChatState.connected;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          isWin ? 'Anonymous Stranger' : 'Blind Chat Roulette',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF16162A),
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
        color: const Color(0xFF0F0F1A),
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
                  color: const Color(0xFFA855F7).withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.shuffle, size: 52, color: Color(0xFFA855F7)),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Blind Chat Roulette',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              'Get matched with a random verified student from your campus. No names. No profiles. Just conversation.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, height: 1.4),
            ),
            const SizedBox(height: 32),
            
            // Rules
            _buildRuleRow('Completely anonymous'),
            _buildRuleRow('Messages expire in 24 hours'),
            _buildRuleRow('Leave anytime, no pressure'),
            const SizedBox(height: 36),

            ElevatedButton(
              onPressed: () => socket.startMatching(auth.user?.id ?? ''),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA855F7),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Find a Match', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRuleRow(String rule) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Color(0xFFA855F7), size: 18),
          const SizedBox(width: 8),
          Text(rule, style: const TextStyle(fontSize: 14, color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildSearchingView(BuildContext context, SocketService socket) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: Color(0xFFA855F7)),
          const SizedBox(height: 24),
          const Text('Finding your match...', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Searching among verified campus students', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 32),
          TextButton(
            onPressed: () => socket.disconnect(),
            child: const Text('Cancel Search', style: TextStyle(color: Colors.white38)),
          ),
        ],
      ),
    );
  }

  Widget _buildDisconnectedView(BuildContext context, SocketService socket) {
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
              style: TextStyle(color: Colors.white70, height: 1.4),
            ),
            const SizedBox(height: 36),
            ElevatedButton(
              onPressed: () => socket.rematch(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA855F7),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Find New Match', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatView(BuildContext context, AuthState auth, SocketService socket) {
    return Column(
      children: [
        // Sub-header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: const Color(0xFF16162A),
          child: Row(
            children: [
              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  socket.isPartnerTyping ? 'Typing...' : 'Connected · Verified Student',
                  style: const TextStyle(fontSize: 12, color: Colors.green),
                ),
              ),
            ],
          ),
        ),
        
        // Message list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            reverse: true,
            itemCount: socket.messages.length,
            itemBuilder: (context, index) {
              final msg = socket.messages[index];
              return Align(
                alignment: msg.isMine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: msg.isMine ? const Color(0xFFA855F7) : const Color(0xFF16162A),
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight: msg.isMine ? const Radius.circular(0) : const Radius.circular(16),
                      topLeft: !msg.isMine ? const Radius.circular(0) : const Radius.circular(16),
                    ),
                    border: msg.isMine ? null : Border.all(color: const Color(0xFF262642)),
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
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(
            color: Color(0xFF16162A),
            border: Border(top: BorderSide(color: Color(0xFF262642))),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textController,
                  onChanged: (val) => socket.sendTypingStatus(val.trim().isNotEmpty),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: const TextStyle(color: Colors.white24),
                    filled: true,
                    fillColor: const Color(0xFF0F0F1A),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.send, color: Color(0xFFA855F7)),
                onPressed: () => _sendMessage(socket),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
