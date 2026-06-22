import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Confession, useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface ConfessionCardProps {
  confession: Confession;
}

export function ConfessionCard({ confession }: ConfessionCardProps) {
  const colors = useColors();
  const { voteConfession } = useAppData();

  const handleVote = (vote: "up" | "down") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voteConfession(confession.id, vote);
  };

  const score = confession.upvotes - confession.downvotes;

  return (
    <View style={[styles.card, { backgroundColor: colors.anonymousCard, borderColor: colors.anonymousBorder }]}>
      <View style={styles.header}>
        <View style={[styles.aliasDot, { backgroundColor: confession.aliasColor }]} />
        <Text style={[styles.alias, { color: confession.aliasColor }]}>{confession.alias}</Text>
        <Text style={[styles.time, { color: colors.anonymousMuted }]}>{timeAgo(confession.createdAt)}</Text>
      </View>

      <Text style={[styles.content, { color: colors.anonymousText }]}>{confession.content}</Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.voteBtn, confession.userVote === "up" && styles.votedUp]}
          onPress={() => handleVote("up")}
        >
          <Ionicons
            name="arrow-up"
            size={16}
            color={confession.userVote === "up" ? "#10B981" : colors.anonymousMuted}
          />
          <Text style={[styles.voteCount, { color: confession.userVote === "up" ? "#10B981" : colors.anonymousMuted }]}>
            {confession.upvotes}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.voteBtn, confession.userVote === "down" && styles.votedDown]}
          onPress={() => handleVote("down")}
        >
          <Ionicons
            name="arrow-down"
            size={16}
            color={confession.userVote === "down" ? "#EF4444" : colors.anonymousMuted}
          />
          <Text style={[styles.voteCount, { color: confession.userVote === "down" ? "#EF4444" : colors.anonymousMuted }]}>
            {confession.downvotes}
          </Text>
        </Pressable>

        <View style={styles.commentBtn}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.anonymousMuted} />
          <Text style={[styles.voteCount, { color: colors.anonymousMuted }]}>{confession.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  aliasDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alias: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  content: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  votedUp: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  votedDown: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  commentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voteCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
