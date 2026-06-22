import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { directMessages, chatMessages, sendChatMessage } = useAppData();
  const [text, setText] = useState("");

  const dm = directMessages.find((d) => d.id === id);
  const msgs = chatMessages[id ?? ""] ?? [];
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSend = () => {
    if (!text.trim() || !id) return;
    sendChatMessage(id, text.trim());
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: dm?.avatarColor ?? colors.primary }]}>
          <Text style={styles.avatarText}>{dm?.initials ?? "??"}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{dm?.name ?? "User"}</Text>
          {dm?.isOnline && (
            <Text style={[styles.onlineLabel, { color: "#10B981" }]}>Online</Text>
          )}
        </View>
        <Pressable style={[styles.moreBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <FlatList
        data={[...msgs].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMine = item.senderId === "user-1";
          return (
            <View style={[styles.bubbleWrap, isMine && styles.bubbleMine]}>
              <View
                style={[
                  styles.bubble,
                  isMine
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.bubbleText, { color: isMine ? "#fff" : colors.foreground }]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, { color: isMine ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                  {timeLabel(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        inverted
        contentContainerStyle={{ padding: 12, gap: 6 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Message..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="arrow-up" size={20} color={text.trim() ? "#fff" : colors.mutedForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  headerInfo: { flex: 1 },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  onlineLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  moreBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleWrap: { flexDirection: "row", justifyContent: "flex-start", marginBottom: 4 },
  bubbleMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "76%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3, textAlign: "right" },
  inputBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    borderWidth: 1,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
