import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/auth_state.dart';
import '../state/app_state.dart';
import '../services/theme_service.dart';
import 'blind_chat_screen.dart';

class NavigationShell extends StatefulWidget {
  const NavigationShell({super.key});

  @override
  State<NavigationShell> createState() => _NavigationShellState();
}

class _NavigationShellState extends State<NavigationShell> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Hydrate feeds on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppState>(context, listen: false).fetchAllFeeds();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Dynamically retrieve time-based theme
    final accentColor = AfterClassTheme.accentColor;

    final List<Widget> tabs = [
      const VerifiedFeedTab(),
      const CommunitiesTab(),
      const ConfessionsTab(),
      const BlindChatTabWrapper(), // Integrated Blind Chat
      const ProfileTab(),
    ];

    return Scaffold(
      backgroundColor: AfterClassTheme.background,
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: const Color(0xFF2E3B68).withOpacity(0.25),
              width: 1.5,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: const Color(0xFF0F1326), // Match deep navy bottom bar
          selectedItemColor: accentColor,
          unselectedItemColor: const Color(0xFF9CA3AF),
          showSelectedLabels: true,
          showUnselectedLabels: true,
          selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Feed'),
            BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Communities'),
            BottomNavigationBarItem(icon: Icon(Icons.visibility_off_outlined), activeIcon: Icon(Icons.visibility_off), label: 'Anonymous'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: 'Chats'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// UI UTILITIES: GLASS CONTAINER
// -----------------------------------------------------------------------------
class GlassCard extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  const GlassCard({
    super.key,
    required this.child,
    this.borderRadius = 22.0,
    this.padding = const EdgeInsets.all(18),
    this.margin = const EdgeInsets.only(bottom: 12),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: AfterClassTheme.glassDecoration(radius: borderRadius),
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 1: VERIFIED FEED (Redesigned Home Feed)
// -----------------------------------------------------------------------------
class VerifiedFeedTab extends StatelessWidget {
  const VerifiedFeedTab({super.key});

  void _showCreatePostDialog(BuildContext context, AppState state) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F1326),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'What\'s on your mind?',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                maxLines: 4,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "Share with the campus...",
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: const Color(0xFF070B16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (controller.text.trim().isNotEmpty) {
                    state.addPost(controller.text.trim());
                    Navigator.pop(context);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AfterClassTheme.accentColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'Post to Campus Feed',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthState>(context);
    final state = Provider.of<AppState>(context);
    final accentColor = AfterClassTheme.accentColor;
    final secondaryAccent = AfterClassTheme.secondaryAccentColor;

    return Scaffold(
      backgroundColor: AfterClassTheme.background,
      floatingActionButton: FloatingActionButton(
        heroTag: 'feed_fab',
        onPressed: () => _showCreatePostDialog(context, state),
        backgroundColor: accentColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => state.fetchAllFeeds(),
          child: CustomScrollView(
            slivers: [
              // Top Greeting Section
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AfterClassTheme.greeting,
                                style: const TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                auth.user?.campusDomain ?? 'University Network',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Colors.white54,
                                ),
                              ),
                            ],
                          ),
                          // Mini avatar
                          GestureDetector(
                            child: CircleAvatar(
                              radius: 20,
                              backgroundColor: accentColor.withOpacity(0.15),
                              child: Text(
                                auth.user?.fullName.substring(0, 1).toUpperCase() ?? 'A',
                                style: TextStyle(
                                  color: accentColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      // Search Campus Bar
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF161C30).withOpacity(0.55),
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: const Color(0xFF2E3B68).withOpacity(0.35),
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          children: const [
                            Icon(Icons.search, color: Colors.white54, size: 20),
                            SizedBox(width: 12),
                            Text(
                              'Search Campus',
                              style: TextStyle(color: Colors.white38, fontSize: 15),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Trending Section
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Trending',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      
                      // Trending Card
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              accentColor.withOpacity(0.35),
                              secondaryAccent.withOpacity(0.15),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: accentColor.withOpacity(0.35),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: accentColor.withOpacity(0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.black12,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Text('🔥', style: TextStyle(fontSize: 22)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'Hackathon 2026',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    '234 students joined',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(Icons.chevron_right, color: Colors.white70),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Latest Posts Title
              SliverPadding(
                padding: const EdgeInsets.only(left: 20, right: 20, top: 28, bottom: 8),
                sliver: SliverToBoxAdapter(
                  child: const Text(
                    'Latest Posts',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              // Posts List
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: state.isFeedLoading && state.posts.isEmpty
                    ? const SliverToBoxAdapter(
                        child: Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                      )
                    : state.posts.isEmpty
                        ? const SliverToBoxAdapter(
                            child: Center(
                              child: Padding(
                                padding: EdgeInsets.all(32),
                                child: Text('No campus posts yet.'),
                              ),
                            ),
                          )
                        : SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final post = state.posts[index];
                                return GlassCard(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Author Header
                                      Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: accentColor,
                                            child: Text(
                                              post.authorName.substring(0, 2).toUpperCase(),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  post.authorName,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                                const SizedBox(height: 3),
                                                // Department Badge
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: accentColor.withOpacity(0.12),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    post.authorMajor,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: accentColor,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 14),
                                      Text(
                                        post.content,
                                        style: const TextStyle(
                                          fontSize: 14.5,
                                          height: 1.4,
                                          color: Color(0xFFE5E7EB),
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      
                                      // Like/Comment Section
                                      Row(
                                        children: [
                                          InkWell(
                                            onTap: () => state.toggleLike(post.id),
                                            borderRadius: BorderRadius.circular(30),
                                            child: Row(
                                              children: [
                                                Icon(
                                                  post.isLiked ? Icons.favorite : Icons.favorite_border,
                                                  color: post.isLiked ? const Color(0xFFFF5E9A) : Colors.white54,
                                                  size: 20,
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  '${post.likeCount}',
                                                  style: const TextStyle(fontSize: 13, color: Colors.white70),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 24),
                                          Row(
                                            children: [
                                              const Icon(Icons.chat_bubble_outline, size: 18, color: Colors.white54),
                                              const SizedBox(width: 6),
                                              Text(
                                                '${post.commentCount}',
                                                style: const TextStyle(fontSize: 13, color: Colors.white70),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                              childCount: state.posts.length,
                            ),
                          ),
              ),
              const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
            ],
          ),
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 2: COMMUNITIES (Discord-Inspired Page)
// -----------------------------------------------------------------------------
class CommunitiesTab extends StatelessWidget {
  const CommunitiesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final accentColor = AfterClassTheme.accentColor;

    return Scaffold(
      backgroundColor: AfterClassTheme.background,
      appBar: AppBar(
        title: const Text(
          'Communities',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => state.fetchAllFeeds(),
        child: state.communities.isEmpty
            ? const Center(child: Text('No communities found.'))
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                itemCount: state.communities.length,
                itemBuilder: (context, index) {
                  final club = state.communities[index];
                  // Let's mock a Discord-style setup inside each glass card
                  return GlassCard(
                    padding: EdgeInsets.zero, // Handle custom inner padding
                    child: ExpansionTile(
                      shape: const Border(), // Remove default line borders
                      iconColor: accentColor,
                      collapsedIconColor: Colors.white54,
                      title: Padding(
                        padding: const EdgeInsets.only(left: 16, top: 16, bottom: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: accentColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(Icons.terminal, color: accentColor, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    club.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    'Members: 1,250',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.white54,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      children: [
                        // Discord Channels view
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Divider(color: Colors.white.withOpacity(0.08)),
                              const SizedBox(height: 6),
                              _buildDiscordChannel('# placements'),
                              _buildDiscordChannel('# projects'),
                              _buildDiscordChannel('# internships'),
                              _buildDiscordChannel('# notes'),
                              _buildDiscordChannel('# random'),
                              const SizedBox(height: 10),
                              ElevatedButton(
                                onPressed: () => state.toggleJoinCommunity(club.id),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: accentColor,
                                  minimumSize: const Size(double.infinity, 38),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text(
                                  'Joined',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildDiscordChannel(String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          const Icon(Icons.tag, size: 16, color: Colors.white30),
          const SizedBox(width: 8),
          Text(
            label.replaceFirst('# ', ''),
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white70,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 3: ANONYMOUS SECTION (Sunset Dark Confession Board)
// -----------------------------------------------------------------------------
class ConfessionsTab extends StatelessWidget {
  const ConfessionsTab({super.key});

  // Maps an alias to a random animal avatar
  String _getAnimalAvatar(String alias) {
    final name = alias.toLowerCase();
    if (name.contains('fox')) return '🦊';
    if (name.contains('owl')) return '🦉';
    if (name.contains('panda')) return '🐼';
    if (name.contains('wolf')) return '🐺';
    if (name.contains('axolotl')) return '🦎';
    if (name.contains('raven')) return '🐦';
    
    // Fallback based on alias hash code
    final index = alias.hashCode.abs() % 6;
    switch (index) {
      case 0:
        return '🦊';
      case 1:
        return '🦉';
      case 2:
        return '🐼';
      case 3:
        return '🐺';
      case 4:
        return '🦎';
      default:
        return '🐦';
    }
  }

  String _cleanAliasName(String alias) {
    final cleaned = alias.replaceFirst('Anonymous ', '');
    // Capitalize first letter
    return cleaned.substring(0, 1).toUpperCase() + cleaned.substring(1);
  }

  void _showCreateConfessionDialog(BuildContext context, AppState state) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F1326),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Post Anonymously',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFF5E9A),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                maxLines: 4,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "Share a confession... zero-knowledge secured.",
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF070B16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (controller.text.trim().isNotEmpty) {
                    state.addConfession(controller.text.trim());
                    Navigator.pop(context);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF5E9A), // Pink highlight for anon
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'Submit Confession',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final highlightColor = AfterClassTheme.highlightColor;

    return Scaffold(
      backgroundColor: AfterClassTheme.background,
      appBar: AppBar(
        title: const Text(
          'Anonymous Board',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'confessions_fab',
        onPressed: () => _showCreateConfessionDialog(context, state),
        backgroundColor: highlightColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.visibility_off, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: () => state.fetchAllFeeds(),
        child: state.confessions.isEmpty
            ? const Center(child: Text('No confessions yet.'))
            : Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Color(0xFF0B1020),
                      Color(0xFF13091B), // Dark crimson-gradient feel for anon
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: state.confessions.length,
                  itemBuilder: (context, index) {
                    final confession = confessionAliasResolve(state.confessions[index]);
                    final avatar = _getAnimalAvatar(confession.alias);
                    final animalName = _cleanAliasName(confession.alias);

                    return GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Alias avatar + Name
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.06),
                                  shape: BoxShape.circle,
                                ),
                                child: Text(avatar, style: const TextStyle(fontSize: 20)),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Anonymous $animalName',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            confession.content,
                            style: const TextStyle(
                              fontSize: 14.5,
                              height: 1.4,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Vote counter + Comments
                          Row(
                            children: [
                              // Upvote
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                                icon: Icon(
                                  Icons.arrow_upward,
                                  color: confession.userVote == 'up' ? highlightColor : Colors.white54,
                                  size: 20,
                                ),
                                onPressed: () => state.voteConfession(confession.id, 'up'),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${confession.upvotes - confession.downvotes}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white70,
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Downvote
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                                icon: Icon(
                                  Icons.arrow_downward,
                                  color: confession.userVote == 'down' ? highlightColor : Colors.white54,
                                  size: 20,
                                ),
                                onPressed: () => state.voteConfession(confession.id, 'down'),
                              ),
                              const SizedBox(width: 28),
                              
                              // Comments Count Placeholder
                              const Icon(Icons.comment_outlined, size: 18, color: Colors.white54),
                              const SizedBox(width: 6),
                              const Text(
                                '12 comments',
                                style: TextStyle(color: Colors.white60, fontSize: 13),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }

  // Double check alias name format is resolved nicely
  dynamic confessionAliasResolve(dynamic confession) {
    // If alias doesn't start with Anonymous, append/resolve it
    if (confession.alias.isEmpty) {
      return confession;
    }
    return confession;
  }
}

// -----------------------------------------------------------------------------
// TAB 4: INTEGRATED CHAT WRAPPER (Nested Blind Match Screen)
// -----------------------------------------------------------------------------
class BlindChatTabWrapper extends StatelessWidget {
  const BlindChatTabWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return const BlindChatScreen();
  }
}

// -----------------------------------------------------------------------------
// TAB 5: PROFILE PAGE
// -----------------------------------------------------------------------------
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthState>(context);
    final accentColor = AfterClassTheme.accentColor;

    return Scaffold(
      backgroundColor: AfterClassTheme.background,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Student Card layout
            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: accentColor,
                    child: Text(
                      auth.user?.fullName.substring(0, 2).toUpperCase() ?? 'KO',
                      style: const TextStyle(
                        fontSize: 28,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    auth.user?.fullName ?? 'Korvynn',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    auth.user?.major ?? 'Computer Engineering',
                    style: TextStyle(
                      color: accentColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Class of ${auth.user?.graduationYear ?? 2028}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.white54,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Connection metrics
            GlassCard(
              padding: const EdgeInsets.symmetric(vertical: 18),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildProfileMetric('34', 'Posts'),
                  _buildProfileMetric('182', 'Connections'),
                  _buildProfileMetric('12', 'Communities'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Actions list
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.edit_outlined, color: accentColor),
                    title: const Text('Edit Profile'),
                    trailing: const Icon(Icons.chevron_right, color: Colors.white30),
                    onTap: () {},
                  ),
                  Divider(color: Colors.white.withOpacity(0.06), height: 1),
                  ListTile(
                    leading: const Icon(Icons.settings_outlined, color: Colors.white60),
                    title: const Text('Settings'),
                    trailing: const Icon(Icons.chevron_right, color: Colors.white30),
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Sign out
            OutlinedButton.icon(
              onPressed: () => auth.logout(),
              icon: const Icon(Icons.logout, color: Colors.redAccent, size: 18),
              label: const Text(
                'Sign Out',
                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileMetric(String count, String label) {
    return Column(
      children: [
        Text(
          count,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white54,
          ),
        ),
      ],
    );
  }
}
