import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DirectMessageRow } from "@/components/DirectMessageRow";
import { SearchBar } from "@/components/SearchBar";
import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { directMessages } = useAppData();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const totalUnread = directMessages.reduce((sum, dm) => sum + dm.unreadCount, 0);
  const filtered = search
    ? directMessages.filter((dm) => dm.name.toLowerCase().includes(search.toLowerCase()))
    : directMessages;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
            {totalUnread > 0 && (
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                {totalUnread} unread
              </Text>
            )}
          </View>
          <Pressable style={[styles.newBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </Pressable>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search messages..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DirectMessageRow
            dm={item}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No conversations yet
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 0, borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 2 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 13 },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 1, marginLeft: 78 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
