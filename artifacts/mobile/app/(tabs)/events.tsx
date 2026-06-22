import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventCard } from "@/components/EventCard";
import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

type EventFilter = "all" | "hackathon" | "workshop" | "competition" | "academic" | "social";

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { events } = useAppData();
  const [filter, setFilter] = useState<EventFilter>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filters: { key: EventFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "hackathon", label: "Hackathon" },
    { key: "workshop", label: "Workshop" },
    { key: "competition", label: "Competition" },
    { key: "academic", label: "Academic" },
  ];

  const filtered = filter === "all" ? events : events.filter((e) => e.category === filter);
  const rsvped = events.filter((e) => e.isRsvped);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Events</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {rsvped.length > 0 ? `You're going to ${rsvped.length} event${rsvped.length > 1 ? "s" : ""}` : "Discover what's happening"}
        </Text>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <View style={styles.filtersRow}>
              {filters.map((f) => (
                <Pressable
                  key={f.key}
                  style={[styles.filterPill, f.key === filter && { backgroundColor: colors.primary }]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.filterText, { color: f.key === filter ? "#fff" : colors.mutedForeground }]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!filter || filter === "all" ? (
              <>
                {rsvped.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Your RSVPs</Text>
                    {rsvped.map((e) => <EventCard key={e.id} event={e} />)}
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>All Events</Text>
                  </>
                )}
                {events.filter((e) => !e.isRsvped).map((e) => <EventCard key={e.id} event={e} />)}
              </>
            ) : (
              filtered.map((e) => <EventCard key={e.id} event={e} />)
            )}

            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No events found</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 84 + 34 + 12 : 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 2 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14 },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
