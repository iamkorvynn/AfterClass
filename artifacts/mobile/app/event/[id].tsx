import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { events, toggleRsvpEvent } = useAppData();

  const event = events.find((e) => e.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!event) return null;

  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: event.color + "15", borderBottomColor: event.color + "30" }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Event Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: event.color + "15" }]}>
          <View style={[styles.categoryBadge, { backgroundColor: event.color + "30" }]}>
            <Text style={[styles.categoryText, { color: event.color }]}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </Text>
          </View>
          <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
          <Text style={[styles.organizer, { color: colors.mutedForeground }]}>by {event.organizer}</Text>
        </View>

        <View style={styles.detailsCard}>
          {[
            { icon: "calendar-outline", label: "Date", value: dateStr },
            { icon: "time-outline", label: "Time", value: timeStr },
            { icon: "location-outline", label: "Location", value: event.location },
            { icon: "people-outline", label: "Attending", value: `${event.rsvpCount} students going` },
          ].map((item) => (
            <View key={item.label} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.detailIcon, { backgroundColor: event.color + "20" }]}>
                <Ionicons name={item.icon as any} size={18} color={event.color} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.descSection}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>About this Event</Text>
          <Text style={[styles.desc, { color: colors.foreground }]}>{event.description}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 + 12 : insets.bottom + 12 }]}>
        <View>
          <Text style={[styles.footerRsvp, { color: colors.foreground }]}>{event.rsvpCount} going</Text>
          <Text style={[styles.footerDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
        </View>
        <Pressable
          style={[styles.rsvpBtn, { backgroundColor: event.isRsvped ? colors.secondary : event.color }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleRsvpEvent(event.id);
          }}
        >
          <Ionicons name={event.isRsvped ? "checkmark" : "add"} size={20} color={event.isRsvped ? colors.primary : "#fff"} />
          <Text style={[styles.rsvpText, { color: event.isRsvped ? colors.primary : "#fff" }]}>
            {event.isRsvped ? "You're Going!" : "RSVP Now"}
          </Text>
        </Pressable>
      </View>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  hero: { padding: 24, paddingTop: 20 },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  eventTitle: { fontFamily: "Inter_700Bold", fontSize: 26, lineHeight: 33, marginBottom: 6 },
  organizer: { fontFamily: "Inter_400Regular", fontSize: 14 },
  detailsCard: { marginHorizontal: 16, marginTop: 16 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 },
  detailValue: { fontFamily: "Inter_500Medium", fontSize: 14 },
  descSection: { padding: 16, paddingTop: 20 },
  descTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 10 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 24 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerRsvp: { fontFamily: "Inter_700Bold", fontSize: 16 },
  footerDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  rsvpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rsvpText: { fontFamily: "Inter_700Bold", fontSize: 15 },
});
