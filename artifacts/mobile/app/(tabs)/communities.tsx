import React, { useState } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommunityCard } from "@/components/CommunityCard";
import { SearchBar } from "@/components/SearchBar";
import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function CommunitiesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { communities } = useAppData();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const joined = communities.filter((c) => c.isJoined);
  const filtered = search
    ? communities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : communities.filter((c) => !c.isJoined);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Communities</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Connect with your campus groups</Text>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <View style={styles.searchWrap}>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search communities..." />
            </View>

            {!search && joined.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Your Communities</Text>
                {joined.map((c) => <CommunityCard key={c.id} community={c} />)}
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Discover</Text>
              </>
            )}
            {filtered.map((c) => <CommunityCard key={c.id} community={c} />)}
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
  searchWrap: { paddingTop: 16 },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 6,
  },
});
