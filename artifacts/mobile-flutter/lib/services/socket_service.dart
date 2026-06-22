import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_client.dart';

class BlindMessage {
  final String id;
  final String text;
  final bool isMine;
  final DateTime time;

  BlindMessage({
    required this.id,
    required this.text,
    required this.isMine,
    required this.time,
  });
}

enum ChatState { idle, searching, connected, disconnected }

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  String? _roomId;
  ChatState _state = ChatState.idle;
  List<BlindMessage> _messages = [];
  bool _isPartnerTyping = false;

  ChatState get state => _state;
  List<BlindMessage> get messages => _messages;
  bool get isPartnerTyping => _isPartnerTyping;

  Future<void> startMatching(String userId) async {
    _state = ChatState.searching;
    _messages.clear();
    _roomId = null;
    _isPartnerTyping = false;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final accessToken = prefs.getString('@campuspulse_access_token');
      final host = ApiClient().baseUrl;

      _socket = IO.io(host, IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': accessToken})
        .disableAutoConnect()
        .build()
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        _socket!.emit('join_queue');
      });

      _socket!.on('match_found', (data) {
        if (data is Map) {
          _roomId = data['roomId'];
          _state = ChatState.connected;
          notifyListeners();
        }
      });

      _socket!.on('receive_message', (data) {
        if (data is Map) {
          final senderId = data['senderId'];
          final content = data['content'];
          final timestamp = data['timestamp'] ?? DateTime.now().toIso8601String();

          final isMine = senderId == userId;
          final message = BlindMessage(
            id: UniqueKey().toString(),
            text: content ?? '',
            isMine: isMine,
            time: DateTime.tryParse(timestamp) ?? DateTime.now(),
          );

          _messages.insert(0, message);
          notifyListeners();
        }
      });

      _socket!.on('typing', (data) {
        if (data is Map) {
          final senderUserId = data['userId'];
          final partnerIsTyping = data['isTyping'] == true;

          if (senderUserId != userId) {
            _isPartnerTyping = partnerIsTyping;
            notifyListeners();
          }
        }
      });

      _socket!.on('partner_disconnected', (_) {
        _state = ChatState.disconnected;
        _isPartnerTyping = false;
        notifyListeners();
        _socket?.disconnect();
      });

      _socket!.onConnectError((_) {
        _state = ChatState.idle;
        notifyListeners();
        _socket?.disconnect();
      });

      _socket!.onDisconnect((_) {
        if (_state == ChatState.connected) {
          _state = ChatState.disconnected;
        }
        notifyListeners();
      });

    } catch (e) {
      _state = ChatState.idle;
      notifyListeners();
    }
  }

  void sendMessage(String text) {
    if (text.trim().isEmpty || _socket == null || _roomId == null) return;

    _socket!.emit('send_message', {
      'roomId': _roomId,
      'content': text.trim(),
    });
    
    // Reset typing
    _socket!.emit('typing', {
      'roomId': _roomId,
      'isTyping': false,
    });
  }

  void sendTypingStatus(bool isTyping) {
    if (_socket == null || _roomId == null) return;
    _socket!.emit('typing', {
      'roomId': _roomId,
      'isTyping': isTyping,
    });
  }

  void disconnect() {
    if (_socket != null) {
      if (_roomId != null) {
        _socket!.emit('report_chat', {'roomId': _roomId});
      }
      _socket!.disconnect();
    }
    _state = ChatState.disconnected;
    _isPartnerTyping = false;
    notifyListeners();
  }

  void rematch() {
    _messages.clear();
    _roomId = null;
    _isPartnerTyping = false;
    _state = ChatState.idle;
    notifyListeners();
  }

  @override
  void dispose() {
    _socket?.disconnect();
    super.dispose();
  }
}
