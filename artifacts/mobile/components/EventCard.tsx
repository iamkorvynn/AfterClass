import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CampusEvent, useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_ICONS: Record<string, string> = {
  hackathon: "code-slash-outline",
  workshop: "book-outline",
  competition: "trophy-outline",
  social: "people-outline",
  academic: "school-outline",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface EventCardProps {
  event: CampusEvent;
}

export function EventCard({ event }: EventCardProps) {
  const colors = useColors();
  const { toggleRsvpEvent } = useAppData();

  const handleRsvp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleRsvpEvent(event.id);
  };

  const icon = CATEGORY_ICONS[event.category] ?? "calendar-outline";

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/event/[id]", params: { id: event.id } })}
    >
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.categoryBadge, { backgroundColor: event.color + "20" }]}>
            <Ionicons name={icon as any} size={13} color={event.color} />
            <Text style={[styles.categoryText, { color: event.color }]}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </Text>
          </View>
          <Text style={[styles.dateLabel, { color: colors.primary }]}>{formatDate(event.date)}</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.rsvpCount} going</Text>
          </View>
        </View>

        <Pressable
          style={[styles.rsvpBtn, { backgroundColor: event.isRsvped ? colors.secondary : event.color }]}
          onPress={handleRsvp}
        >
          <Ionicons
            name={event.isRsvped ? "checkmark" : "add"}
            size={15}
            color={event.isRsvped ? colors.primary : "#fff"}
          />
          <Text style={[styles.rsvpText, { color: event.isRsvped ? colors.primary : "#fff" }]}>
            {event.isRsvped ? "Going" : "RSVP"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorBar: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  dateLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 5,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  meta: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  rsvpBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  rsvpText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
