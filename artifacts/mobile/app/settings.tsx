import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  onPress?: () => void;
}

function SettingRow({ icon, label, value, hasSwitch, switchValue, onToggle, danger, onPress }: SettingRowProps) {
  const colors = useColors();
  return (
    <Pressable
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: danger ? "#EF444420" : colors.muted }]}>
        <Ionicons name={icon as any} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.label, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      {value && <Text style={[styles.value, { color: colors.mutedForeground }]}>{value}</Text>}
      {hasSwitch && <Switch value={switchValue} onValueChange={onToggle} />}
      {!hasSwitch && !value && (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, logout } = useAuth();
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [anonymousActivity, setAnonymousActivity] = React.useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 20 : 40 }}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{user?.fullName?.slice(0, 2) ?? "AJ"}</Text>
        </View>
        <View>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.fullName}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="person-outline" label="Edit Profile" onPress={() => {}} />
        <SettingRow icon="mail-outline" label="Email" value={user?.email ?? ""} />
        <SettingRow icon="school-outline" label="College" value={user?.campusDomain ?? ""} />
        <SettingRow icon="shield-checkmark-outline" label="Verification Status" value="Verified" />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTIFICATIONS</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="notifications-outline" label="Push Notifications" hasSwitch switchValue={pushEnabled} onToggle={setPushEnabled} />
        <SettingRow icon="chatbubble-outline" label="Message Alerts" hasSwitch switchValue={true} />
        <SettingRow icon="calendar-outline" label="Event Reminders" hasSwitch switchValue={true} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRIVACY</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="eye-outline" label="Profile Visibility" value="Public" onPress={() => {}} />
        <SettingRow icon="glasses-outline" label="Anonymous Activity" hasSwitch switchValue={anonymousActivity} onToggle={setAnonymousActivity} />
        <SettingRow icon="lock-closed-outline" label="Block List" onPress={() => {}} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
        <SettingRow icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
        <SettingRow icon="information-circle-outline" label="App Version" value="1.0.0" />
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
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
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 18 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    paddingHorizontal: 20,
    marginBottom: 6,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  value: { fontFamily: "Inter_400Regular", fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 8,
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
