import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Community, useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface CommunityCardProps {
  community: Community;
  onPress?: () => void;
}

export function CommunityCard({ community, onPress }: CommunityCardProps) {
  const colors = useColors();
  const { toggleJoinCommunity } = useAppData();

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleJoinCommunity(community.id);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: community.color + "20" }]}>
        <Ionicons name={community.iconName as IoniconsName} size={22} color={community.color} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>{community.name}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {community.description}
        </Text>
        <Text style={[styles.members, { color: colors.mutedForeground }]}>
          {community.memberCount.toLocaleString()} members · {community.category}
        </Text>
      </View>
      <Pressable
        style={[
          styles.joinBtn,
          { backgroundColor: community.isJoined ? colors.secondary : colors.primary },
        ]}
        onPress={handleJoin}
      >
        <Text
          style={[
            styles.joinText,
            { color: community.isJoined ? colors.primary : colors.primaryForeground },
          ]}
        >
          {community.isJoined ? "Joined" : "Join"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 2,
  },
  members: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  joinText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
