import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/auth_state.dart';
import '../state/app_state.dart';
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
    final List<Widget> tabs = [
      const VerifiedFeedTab(),
      const CommunitiesTab(),
      const EventsTab(),
      const ConfessionsTab(),
      const ProfileTab(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF16162A),
        selectedItemColor: const Color(0xFF7C3AED),
        unselectedItemColor: const Color(0xFF9CA3AF),
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Feed'),
          BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Clubs'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_today_outlined), activeIcon: Icon(Icons.calendar_today), label: 'Events'),
          BottomNavigationBarItem(icon: Icon(Icons.security_outlined), activeIcon: Icon(Icons.security), label: 'Anon'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 1: VERIFIED FEED
// -----------------------------------------------------------------------------
class VerifiedFeedTab extends StatelessWidget {
  const VerifiedFeedTab({super.key});

  void _showCreatePostDialog(BuildContext context, AppState state) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF16162A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('New Verified Post', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                maxLines: 4,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "What's happening on campus?",
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF0F0F1A),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
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
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C3AED)),
                child: const Text('Post to Campus Feed', style: TextStyle(color: Colors.white)),
              ),
              const SizedBox(height: 20),
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

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('AfterClass', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(auth.user?.campusDomain ?? 'University Network', style: const TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
        backgroundColor: const Color(0xFF16162A),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.shuffle, color: Color(0xFFEC4899)),
            tooltip: 'Blind Chat Roulette',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const BlindChatScreen()));
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreatePostDialog(context, state),
        backgroundColor: const Color(0xFF7C3AED),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: () => state.fetchAllFeeds(),
        child: state.isFeedLoading && state.posts.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.posts.isEmpty
                ? const Center(child: Text('No campus posts yet.'))
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: state.posts.length,
                    itemBuilder: (context, index) {
                      final post = state.posts[index];
                      return Card(
                        color: const Color(0xFF16162A),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFF262642)),
                        ),
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: const Color(0xFF7C3AED),
                                    child: Text(post.authorName.substring(0, 2).toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 13)),
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(post.authorName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                      Text(post.authorMajor, style: const TextStyle(fontSize: 12, color: Colors.white70)),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(post.content, style: const TextStyle(fontSize: 14.5, height: 1.4)),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(
                                      post.isLiked ? Icons.favorite : Icons.favorite_border,
                                      color: post.isLiked ? Colors.red : Colors.grey,
                                      size: 20,
                                    ),
                                    onPressed: () => state.toggleLike(post.id),
                                  ),
                                  Text('${post.likeCount}'),
                                  const SizedBox(width: 24),
                                  const Icon(Icons.chat_bubble_outline, size: 18, color: Colors.grey),
                                  const SizedBox(width: 6),
                                  Text('${post.commentCount}'),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 2: COMMUNITIES
// -----------------------------------------------------------------------------
class CommunitiesTab extends StatelessWidget {
  const CommunitiesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Clubs & Communities', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF16162A),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => state.fetchAllFeeds(),
        child: state.communities.isEmpty
            ? const Center(child: Text('No communities found.'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: state.communities.length,
                itemBuilder: (context, index) {
                  final club = state.communities[index];
                  return Card(
                    color: const Color(0xFF16162A),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFF262642)),
                    ),
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7C3AED).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.laptop, color: Color(0xFF7C3AED)),
                      ),
                      title: Text(club.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(club.description.isEmpty ? 'Campus board group' : club.description),
                      trailing: ElevatedButton(
                        onPressed: () => state.toggleJoinCommunity(club.id),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF262642),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Joined'),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 3: EVENTS
// -----------------------------------------------------------------------------
class EventsTab extends StatelessWidget {
  const EventsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Events Calendar', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF16162A),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => state.fetchAllFeeds(),
        child: state.events.isEmpty
            ? const Center(child: Text('No campus events planned yet.'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: state.events.length,
                itemBuilder: (context, index) {
                  final event = state.events[index];
                  return Card(
                    color: const Color(0xFF16162A),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFF262642)),
                    ),
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3B82F6).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('ACADEMIC', style: TextStyle(fontSize: 11, color: Color(0xFF3B82F6), fontWeight: FontWeight.bold)),
                              ),
                              Text('${event.rsvpCount} Attending', style: const TextStyle(fontSize: 12, color: Colors.white70)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(event.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Text(event.description, style: const TextStyle(color: Colors.white70)),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(event.location, style: const TextStyle(fontSize: 13)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => state.toggleRsvpEvent(event.id),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: event.isRsvped ? const Color(0xFF262642) : const Color(0xFF7C3AED),
                              minimumSize: const Size(double.infinity, 38),
                            ),
                            child: Text(event.isRsvped ? 'Attending' : 'RSVP Event', style: const TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 4: CONFESSIONS (ANONYMOUS DISCUSSION BOARD)
// -----------------------------------------------------------------------------
class ConfessionsTab extends StatelessWidget {
  const ConfessionsTab({super.key});

  void _showCreateConfessionDialog(BuildContext context, AppState state) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF16162A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Submit Anonymous Confession', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFFA855F7))),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                maxLines: 4,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "Spill the tea. Completely anonymous.",
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF0F0F1A),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
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
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFA855F7)),
                child: const Text('Post Anonymously', style: TextStyle(color: Colors.white)),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Confessions Board', style: TextStyle(color: Color(0xFFA855F7), fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF16162A),
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateConfessionDialog(context, state),
        backgroundColor: const Color(0xFFA855F7),
        child: const Icon(Icons.visibility_off, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: () => state.fetchAllFeeds(),
        child: state.confessions.isEmpty
            ? const Center(child: Text('No confessions yet.'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: state.confessions.length,
                itemBuilder: (context, index) {
                  final confession = state.confessions[index];
                  return Card(
                    color: const Color(0xFF16162A),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFF262642)),
                    ),
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(color: Color(0xFFA855F7), shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 8),
                              Text(confession.alias, style: const TextStyle(color: Color(0xFFA855F7), fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(confession.content, style: const TextStyle(fontSize: 14.5, height: 1.4)),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              IconButton(
                                icon: Icon(
                                  Icons.keyboard_arrow_up,
                                  color: confession.userVote == 'up' ? const Color(0xFFA855F7) : Colors.grey,
                                  size: 24,
                                ),
                                onPressed: () => state.voteConfession(confession.id, 'up'),
                              ),
                              Text('${confession.upvotes - confession.downvotes}'),
                              IconButton(
                                icon: Icon(
                                  Icons.keyboard_arrow_down,
                                  color: confession.userVote == 'down' ? const Color(0xFFA855F7) : Colors.grey,
                                  size: 24,
                                ),
                                onPressed: () => state.voteConfession(confession.id, 'down'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TAB 5: PROFILE
// -----------------------------------------------------------------------------
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF16162A),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 46,
                    backgroundColor: const Color(0xFF7C3AED),
                    child: Text(
                      auth.user?.fullName.substring(0, 2).toUpperCase() ?? 'AJ',
                      style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(auth.user?.fullName ?? 'Alex Johnson', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(auth.user?.major ?? 'Computer Science', style: const TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    '${auth.user?.campusDomain ?? "campus.edu"} · Class of ${auth.user?.graduationYear ?? 2026}',
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text('142', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2),
                    Text('Connections', style: TextStyle(fontSize: 12, color: Colors.white70)),
                  ],
                ),
                Column(
                  children: [
                    Text('96', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2),
                    Text('Followers', style: TextStyle(fontSize: 12, color: Colors.white70)),
                  ],
                ),
                Column(
                  children: [
                    Text('108', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2),
                    Text('Following', style: TextStyle(fontSize: 12, color: Colors.white70)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 40),
            
            // Edit Profile Placeholder
            ListTile(
              leading: const Icon(Icons.edit, color: Colors.white70),
              title: const Text('Edit Profile'),
              trailing: const Icon(Icons.chevron_right, color: Colors.white30),
              onTap: () {},
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings, color: Colors.white70),
              title: const Text('Settings'),
              trailing: const Icon(Icons.chevron_right, color: Colors.white30),
              onTap: () {},
            ),
            const Divider(),
            const SizedBox(height: 20),

            OutlinedButton.icon(
              onPressed: () => auth.logout(),
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
