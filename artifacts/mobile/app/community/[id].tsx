import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard } from "@/components/PostCard";
import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { communities, posts, toggleJoinCommunity } = useAppData();

  const community = communities.find((c) => c.id === id);
  const communityPosts = posts.slice(0, 3);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!community) return null;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={communityPosts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      ListHeaderComponent={
        <>
          <View style={[styles.hero, { backgroundColor: community.color + "15", paddingTop: topPad + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.foreground} />
            </Pressable>
            <View style={[styles.iconWrap, { backgroundColor: community.color + "25" }]}>
              <Ionicons name={community.iconName as any} size={36} color={community.color} />
            </View>
            <Text style={[styles.name, { color: colors.foreground }]}>{community.name}</Text>
            <Text style={[styles.category, { color: community.color }]}>{community.category}</Text>
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>{community.description}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>
                  {community.memberCount.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{communityPosts.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
              </View>
            </View>
            <Pressable
              style={[styles.joinBtn, { backgroundColor: community.isJoined ? colors.secondary : community.color }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleJoinCommunity(community.id);
              }}
            >
              <Text style={[styles.joinText, { color: community.isJoined ? colors.primary : "#fff" }]}>
                {community.isJoined ? "Joined" : "Join Community"}
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.postsLabel, { color: colors.foreground }]}>Recent Posts</Text>
        </>
      }
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 20 : 40 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    padding: 4,
    marginBottom: 20,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 4, textAlign: "center" },
  category: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 10 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 16 },
  stats: { flexDirection: "row", gap: 24, marginBottom: 20, alignItems: "center" },
  stat: { alignItems: "center" },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  divider: { width: 1, height: 32 },
  joinBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  joinText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  postsLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
});
