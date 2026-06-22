import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

import { Post, useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const { toggleLike } = useAppData();

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(post.id);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.authorColor }]}>
          <Text style={styles.avatarText}>{post.authorInitials}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: colors.foreground }]}>{post.authorName}</Text>
          <Text style={[styles.authorMeta, { color: colors.mutedForeground }]}>
            {post.authorMajor} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        <View style={[styles.visibilityBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.visibilityText, { color: colors.secondaryForeground }]}>
            {post.visibility === "college" ? "Campus" : post.visibility === "department" ? "Dept" : "Community"}
          </Text>
        </View>
      </View>

      <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>

      {post.tags.length > 0 && (
        <View style={styles.tags}>
          {post.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={post.isLiked ? "#EF4444" : colors.mutedForeground}
          />
          <Text style={[styles.actionCount, { color: post.isLiked ? "#EF4444" : colors.mutedForeground }]}>
            {post.likeCount}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}>
          <Ionicons name="chatbubble-outline" size={19} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.commentCount}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  authorMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 1,
  },
  visibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  visibilityText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  content: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
