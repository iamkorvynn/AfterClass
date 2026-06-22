import 'package:flutter/material.dart';
import '../services/api_client.dart';

class Post {
  final String id;
  final String userId;
  final String authorName;
  final String authorMajor;
  final String content;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final String createdAt;

  Post({
    required this.id,
    required this.userId,
    required this.authorName,
    required this.authorMajor,
    required this.content,
    required this.likeCount,
    required this.commentCount,
    required this.isLiked,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      authorName: json['fullName'] ?? 'Alex',
      authorMajor: json['authorMajor'] ?? 'Undeclared',
      content: json['content'] ?? '',
      likeCount: json['likeCount'] is int ? json['likeCount'] : int.tryParse(json['likeCount'].toString()) ?? 0,
      commentCount: json['commentCount'] is int ? json['commentCount'] : int.tryParse(json['commentCount'].toString()) ?? 0,
      isLiked: json['isLiked'] == true,
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class Confession {
  final String id;
  final String content;
  final String alias;
  final String aliasColor;
  final int upvotes;
  final int downvotes;
  final String? userVote; // 'up', 'down', or null
  final int commentCount;
  final String createdAt;

  Confession({
    required this.id,
    required this.content,
    required this.alias,
    required this.aliasColor,
    required this.upvotes,
    required this.downvotes,
    this.userVote,
    required this.commentCount,
    required this.createdAt,
  });

  factory Confession.fromJson(Map<String, dynamic> json) {
    String? uv;
    if (json['userVote'] == 1) uv = 'up';
    if (json['userVote'] == -1) uv = 'down';

    return Confession(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      alias: json['aliasName'] ?? 'Anonymous',
      aliasColor: '#8B5CF6',
      upvotes: json['upvoteCount'] is int ? json['upvoteCount'] : int.tryParse(json['upvoteCount'].toString()) ?? 0,
      downvotes: json['downvoteCount'] is int ? json['downvoteCount'] : int.tryParse(json['downvoteCount'].toString()) ?? 0,
      userVote: uv,
      commentCount: json['commentCount'] is int ? json['commentCount'] : int.tryParse(json['commentCount'].toString()) ?? 0,
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class Community {
  final String id;
  final String name;
  final String description;
  final String category;
  final int memberCount;
  final bool isJoined;
  final String iconName;
  final String color;

  Community({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.memberCount,
    required this.isJoined,
    required this.iconName,
    required this.color,
  });

  factory Community.fromJson(Map<String, dynamic> json) {
    final slug = json['slug'] ?? '';
    final isDept = slug == 'computer-science' || slug == 'mechanical-engineering';
    return Community(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      category: isDept ? 'Department' : 'Club',
      memberCount: 245, // Fallback mock member counter
      isJoined: true, // Defaulting true for active listing UI
      iconName: isDept ? 'laptop-outline' : 'chatbubbles-outline',
      color: '#7C3AED',
    );
  }
}

class CampusEvent {
  final String id;
  final String title;
  final String description;
  final String date;
  final String location;
  final String organizer;
  final int rsvpCount;
  final bool isRsvped;
  final String category;
  final String color;

  CampusEvent({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.location,
    required this.organizer,
    required this.rsvpCount,
    required this.isRsvped,
    required this.category,
    required this.color,
  });

  factory CampusEvent.fromJson(Map<String, dynamic> json) {
    final titleLower = (json['title'] ?? '').toString().toLowerCase();
    return CampusEvent(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      date: json['startsAt'] ?? '',
      location: json['location'] ?? '',
      organizer: 'Campus Network',
      rsvpCount: json['rsvpCount'] is int ? json['rsvpCount'] : int.tryParse(json['rsvpCount'].toString()) ?? 0,
      isRsvped: json['rsvpStatus'] == 'attending',
      category: titleLower.contains('hack') ? 'hackathon' : 'workshop',
      color: '#3B82F6',
    );
  }
}

class AppState extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<Post> _posts = [];
  List<Confession> _confessions = [];
  List<Community> _communities = [];
  List<CampusEvent> _events = [];
  bool _isFeedLoading = false;

  List<Post> get posts => _posts;
  List<Confession> get confessions => _confessions;
  List<Community> get communities => _communities;
  List<CampusEvent> get events => _events;
  bool get isFeedLoading => _isFeedLoading;

  Future<void> fetchAllFeeds() async {
    _isFeedLoading = true;
    notifyListeners();

    try {
      final postsResponse = await _apiClient.get('/posts');
      if (postsResponse is List) {
        _posts = postsResponse.map((p) => Post.fromJson(p)).toList();
      }

      final confessionsResponse = await _apiClient.get('/anon/posts');
      if (confessionsResponse is List) {
        _confessions = confessionsResponse.map((c) => Confession.fromJson(c)).toList();
      }

      final communitiesResponse = await _apiClient.get('/communities');
      if (communitiesResponse is List) {
        _communities = communitiesResponse.map((c) => Community.fromJson(c)).toList();
      }

      final eventsResponse = await _apiClient.get('/events');
      if (eventsResponse is List) {
        _events = eventsResponse.map((e) => CampusEvent.fromJson(e)).toList();
      }
    } catch (_) {}

    _isFeedLoading = false;
    notifyListeners();
  }

  Future<void> addPost(String content) async {
    await _apiClient.post('/posts', body: {'content': content});
    await fetchAllFeeds();
  }

  Future<void> toggleLike(String postId) async {
    await _apiClient.post('/posts/$postId/like');
    await fetchAllFeeds();
  }

  Future<void> addConfession(String content) async {
    await _apiClient.post('/anon/posts', body: {'content': content});
    await fetchAllFeeds();
  }

  Future<void> voteConfession(String confessionId, String vote) async {
    final value = vote == 'up' ? 1 : -1;
    await _apiClient.post('/anon/posts/$confessionId/vote', body: {'value': value});
    await fetchAllFeeds();
  }

  Future<void> toggleJoinCommunity(String communityId) async {
    await _apiClient.post('/communities/$communityId/join');
    await fetchAllFeeds();
  }

  Future<void> toggleRsvpEvent(String eventId) async {
    await _apiClient.post('/events/$eventId/rsvp', body: {'status': 'attending'});
    await fetchAllFeeds();
  }
}
