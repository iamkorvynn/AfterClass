import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { verifyCode, pendingEmail } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, idx: number) => {
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);
    setError("");
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const full = code.join("");
    if (full.length < 6) return;
    setLoading(true);
    const success = await verifyCode(full);
    setLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      setError("Invalid code. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  const filled = code.every((c) => c !== "");

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
      </Pressable>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Ionicons name="mail" size={32} color={colors.primary} />
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>Check your email</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          We sent a 6-digit code to{"\n"}
          <Text style={[styles.email, { color: colors.foreground }]}>{pendingEmail}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[
                styles.codeBox,
                {
                  backgroundColor: colors.muted,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {error !== "" && (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        )}

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Tip: any 6-digit code works in demo mode
        </Text>

        <Pressable
          style={[styles.btn, { backgroundColor: filled ? colors.primary : colors.muted }]}
          onPress={handleVerify}
          disabled={!filled || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.btnText, { color: filled ? "#fff" : colors.mutedForeground }]}>
              Verify & Continue
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={[styles.resend, { color: colors.primary }]}>Resend code</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  back: { marginBottom: 32 },
  content: { alignItems: "center" },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 10, textAlign: "center" },
  sub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  email: { fontFamily: "Inter_600SemiBold" },
  codeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  error: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 32 },
  btn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  resend: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
