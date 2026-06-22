import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DirectMessage } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

interface DirectMessageRowProps {
  dm: DirectMessage;
  onPress: () => void;
}

export function DirectMessageRow({ dm, onPress }: DirectMessageRowProps) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.muted : colors.background }]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: dm.avatarColor }]}>
          <Text style={styles.avatarText}>{dm.initials}</Text>
        </View>
        {dm.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }]}>{dm.name}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(dm.lastMessageTime)}</Text>
        </View>
        <Text style={[styles.lastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
          {dm.lastMessage}
        </Text>
      </View>
      {dm.unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{dm.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  lastMsg: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
});
