import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function AnonymousLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.anonymousBg }}>
      <View style={[styles.anonHeader, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.anonymousText} />
        </Pressable>
        <View style={styles.anonTitleArea}>
          <Ionicons name="glasses-outline" size={22} color={colors.anonymousPrimary} />
          <Text style={[styles.anonTitle, { color: colors.anonymousText }]}>Anonymous Mode</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      <View style={[styles.warningBanner, { backgroundColor: colors.anonymousPrimary + "20", borderColor: colors.anonymousPrimary + "40" }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.anonymousPrimary} />
        <Text style={[styles.warningText, { color: colors.anonymousPrimary }]}>
          Your real identity is completely hidden
        </Text>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.anonymousBg,
            borderTopColor: colors.anonymousBorder,
            borderTopWidth: 1,
            ...(Platform.OS === "web" ? { height: 84 } : {}),
          },
          tabBarActiveTintColor: colors.anonymousPrimary,
          tabBarInactiveTintColor: "#6B7280",
          tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 10 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Confessions",
            tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="discussions"
          options={{
            title: "Discussions",
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="blind-chat"
          options={{
            title: "Blind Chat",
            tabBarIcon: ({ color }) => <Ionicons name="shuffle-outline" size={22} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  anonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  anonTitleArea: { flexDirection: "row", alignItems: "center", gap: 6 },
  anonTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  placeholder: { width: 36 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
