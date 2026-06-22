import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const COLLEGE_DOMAINS = ["edu", "ac.in", "ac.uk", "edu.au"];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidCollegeEmail = (e: string) => {
    const parts = e.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return COLLEGE_DOMAINS.some((d) => domain.endsWith(d));
  };

  const handleSend = async () => {
    setError("");
    if (!isValidCollegeEmail(email)) {
      setError("Please use your college email address (.edu or .ac.in)");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await sendMagicLink(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/(auth)/verify");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={[styles.logoRing, { borderColor: colors.primary + "30" }]}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Ionicons name="pulse" size={36} color="#fff" />
            </View>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>CampusPulse</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your campus. Your community.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Sign in</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            Use your college email to get a magic link
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: error ? colors.destructive : colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              placeholder="student@college.edu"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error !== "" && (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          )}

          <Pressable
            style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSend}
            disabled={loading || email.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Send Magic Link</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.divText, { color: colors.mutedForeground }]}>or continue with</Text>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              setEmail("alex@university.edu");
              setTimeout(handleSend, 100);
            }}
          >
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={[styles.socialBtnText, { color: colors.foreground }]}>Demo Account</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Only verified college students can join. Your real identity is always private in anonymous features.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  logoArea: { alignItems: "center", marginBottom: 48 },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 6 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" },
  form: { flex: 1 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 6 },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 24 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16 },
  error: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  btnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  divLine: { flex: 1, height: 1 },
  divText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    marginBottom: 32,
  },
  socialBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  footer: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },
});
