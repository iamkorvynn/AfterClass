import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { posts, toggleLike } = useAppData();

  const post = posts.find((p) => p.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Pressable style={[styles.backBtn, { marginLeft: 16 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>Post not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Post</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: post.authorColor }]}>
            <Text style={styles.avatarText}>{post.authorInitials}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{post.authorName}</Text>
            <Text style={[styles.authorMeta, { color: colors.mutedForeground }]}>
              {post.authorMajor} · {timeAgo(post.createdAt)}
            </Text>
          </View>
          <Pressable style={[styles.followBtn, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.followText, { color: colors.primary }]}>Follow</Text>
          </Pressable>
        </View>

        <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>

        {post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.stats, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{post.likeCount}</Text> likes
          </Text>
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{post.commentCount}</Text> comments
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: post.isLiked ? "#EF444420" : colors.muted }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleLike(post.id);
            }}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={post.isLiked ? "#EF4444" : colors.mutedForeground}
            />
            <Text style={[styles.actionText, { color: post.isLiked ? "#EF4444" : colors.mutedForeground }]}>
              {post.isLiked ? "Liked" : "Like"}
            </Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="share-social-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Share</Text>
          </Pressable>
        </View>

        <Text style={[styles.commentsHeader, { color: colors.foreground }]}>Comments</Text>
        <View style={[styles.emptyComments, { backgroundColor: colors.muted, borderRadius: 12 }]}>
          <Ionicons name="chatbubble-outline" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyCommentsText, { color: colors.mutedForeground }]}>No comments yet. Be first!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  authorMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  followText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  content: { fontFamily: "Inter_400Regular", fontSize: 17, lineHeight: 26, marginBottom: 16 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  stats: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  statText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  statNum: { fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  commentsHeader: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 14 },
  emptyComments: { alignItems: "center", padding: 32, gap: 10 },
  emptyCommentsText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
