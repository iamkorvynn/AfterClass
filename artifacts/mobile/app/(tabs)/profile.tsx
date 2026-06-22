import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, logout } = useAuth();
  const { posts, communities } = useAppData();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const myPosts = posts.filter((p) => p.userId === user?.id);
  const joinedCommunities = communities.filter((c) => c.isJoined);

  const mockInterests = ["Coding", "Hackathons", "Chess", "Design"];

  const stats = [
    { label: "Posts", value: myPosts.length },
    { label: "Connections", value: 142 },
    { label: "Followers", value: 96 },
    { label: "Following", value: 108 },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 84 + 34 + 20 : 120 }}
    >
      <View style={[styles.hero, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
          <Pressable onPress={() => router.push("/settings")} style={[styles.settingsBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="settings-outline" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.fullName?.slice(0, 2) ?? "AJ"}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{user?.fullName ?? "Alex Johnson"}</Text>
            <Text style={[styles.major, { color: colors.primary }]}>{user?.major ?? "Computer Science"}</Text>
            <Text style={[styles.college, { color: colors.mutedForeground }]}>
              {user?.campusDomain ?? "University"} · Class of {user?.graduationYear ?? 2026}
            </Text>
          </View>
        </View>

        {user?.bio && (
          <Text style={[styles.bio, { color: colors.foreground }]}>{user.bio}</Text>
        )}

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {mockInterests.length > 0 && (
          <View style={styles.interests}>
            {mockInterests.map((interest) => (
              <View key={interest} style={[styles.interestTag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.interestText, { color: colors.primary }]}>{interest}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {joinedCommunities.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Communities</Text>
          {joinedCommunities.map((c) => (
            <View key={c.id} style={[styles.communityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.communityIcon, { backgroundColor: c.color + "20" }]}>
                <Ionicons name={c.iconName as any} size={18} color={c.color} />
              </View>
              <View style={styles.communityInfo}>
                <Text style={[styles.communityName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.communityMeta, { color: colors.mutedForeground }]}>
                  {c.memberCount.toLocaleString()} members
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {myPosts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Posts</Text>
          {myPosts.map((post) => (
            <Pressable
              key={post.id}
              style={[styles.postRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
            >
              <Text style={[styles.postContent, { color: colors.foreground }]} numberOfLines={2}>
                {post.content}
              </Text>
              <View style={styles.postMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="heart" size={13} color={colors.destructive} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{post.likeCount}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="chatbubble-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{post.commentCount}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 20, borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: { flexDirection: "row", gap: 14, marginBottom: 14, alignItems: "flex-start" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 22 },
  profileInfo: { flex: 1, justifyContent: "center", paddingTop: 4 },
  name: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 3 },
  major: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  college: { fontFamily: "Inter_400Regular", fontSize: 12 },
  bio: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  stat: { alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  interests: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  interestText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 12 },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  communityInfo: { flex: 1 },
  communityName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  communityMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  postRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  postContent: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  postMeta: { flexDirection: "row", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
