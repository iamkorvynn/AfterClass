import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useRef, useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type ChatState = "idle" | "searching" | "connected" | "disconnected";

interface BlindMessage {
  id: string;
  text: string;
  isMine: boolean;
  time: string;
}

export default function BlindChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  
  const [state, setState] = useState<ChatState>("idle");
  const [messages, setMessages] = useState<BlindMessage[]>([]);
  const [text, setText] = useState("");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // Clean up socket connection on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const getApiHost = (): string => {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    if (Platform.OS === "android") {
      return "http://10.0.2.2:5000";
    }
    return "http://localhost:5000";
  };

  const startMatching = async () => {
    setState("searching");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const accessToken = await AsyncStorage.getItem("@campuspulse_access_token");
      const host = getApiHost();

      // Establish Socket connection
      const socket = io(host, {
        auth: { token: accessToken },
        transports: ["websocket"]
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        // Enqueue user
        socket.emit("join_queue");
      });

      socket.on("match_found", (data: { roomId: string; partnerId: string }) => {
        roomIdRef.current = data.roomId;
        setState("connected");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });

      socket.on("receive_message", (msg: { senderId: string; content: string; timestamp: string }) => {
        const isMine = msg.senderId === user?.id;
        const formattedMsg: BlindMessage = {
          id: Math.random().toString(),
          text: msg.content,
          isMine,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [formattedMsg, ...prev]);
        
        if (!isMine) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });

      socket.on("typing", (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== user?.id) {
          setIsPartnerTyping(data.isTyping);
        }
      });

      socket.on("partner_disconnected", () => {
        setState("disconnected");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        socket.disconnect();
      });

      socket.on("connect_error", () => {
        setState("idle");
        socket.disconnect();
      });

    } catch (err) {
      setState("idle");
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      if (roomIdRef.current) {
        socketRef.current.emit("report_chat", { roomId: roomIdRef.current });
      }
      socketRef.current.disconnect();
    }
    setState("disconnected");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const rematch = () => {
    setMessages([]);
    roomIdRef.current = null;
    setIsPartnerTyping(false);
    setState("idle");
  };

  const sendMessage = () => {
    if (!text.trim() || !socketRef.current || !roomIdRef.current) return;

    socketRef.current.emit("send_message", {
      roomId: roomIdRef.current,
      content: text.trim(),
    });
    
    // Stop typing broadcast
    socketRef.current.emit("typing", {
      roomId: roomIdRef.current,
      isTyping: false
    });

    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit("typing", {
        roomId: roomIdRef.current,
        isTyping: val.length > 0
      });
    }
  };

  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom;

  if (state === "idle") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.anonymousBg }]}>
        <View style={[styles.matchIcon, { backgroundColor: colors.anonymousPrimary + "20" }]}>
          <Ionicons name="shuffle-outline" size={52} color={colors.anonymousPrimary} />
        </View>
        <Text style={[styles.matchTitle, { color: colors.anonymousText }]}>Blind Chat Roulette</Text>
        <Text style={[styles.matchSub, { color: colors.anonymousMuted }]}>
          Get matched with a random verified student from your campus. No names. No profiles. Just conversation.
        </Text>
        <View style={styles.rules}>
          {["Completely anonymous", "Messages expire in 24 hours", "Leave anytime, no pressure"].map((r) => (
            <View key={r} style={styles.ruleRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.anonymousPrimary} />
              <Text style={[styles.ruleText, { color: colors.anonymousMuted }]}>{r}</Text>
            </View>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.startBtn, { backgroundColor: colors.anonymousPrimary, opacity: pressed ? 0.85 : 1 }]}
          onPress={startMatching}
        >
          <Ionicons name="shuffle-outline" size={20} color="#fff" />
          <Text style={styles.startBtnText}>Find a Match</Text>
        </Pressable>
      </View>
    );
  }

  if (state === "searching") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.anonymousBg }]}>
        <View style={[styles.pulseRing, { borderColor: colors.anonymousPrimary }]}>
          <View style={[styles.pulseCore, { backgroundColor: colors.anonymousPrimary }]}>
            <Ionicons name="person-outline" size={28} color="#fff" />
          </View>
        </View>
        <Text style={[styles.searchingText, { color: colors.anonymousText }]}>Finding your match...</Text>
        <Text style={[styles.searchingSub, { color: colors.anonymousMuted }]}>Searching among verified campus students</Text>
        <Pressable onPress={disconnect} style={styles.cancelSearch}>
          <Text style={[styles.cancelSearchText, { color: colors.anonymousMuted }]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (state === "disconnected") {
    return (
      <View style={[styles.centered, { backgroundColor: colors.anonymousBg }]}>
        <Ionicons name="close-circle-outline" size={64} color={colors.anonymousMuted} />
        <Text style={[styles.matchTitle, { color: colors.anonymousText }]}>Chat Ended</Text>
        <Text style={[styles.matchSub, { color: colors.anonymousMuted }]}>
          This conversation has ended. All messages will expire automatically.
        </Text>
        <Pressable
          style={[styles.startBtn, { backgroundColor: colors.anonymousPrimary }]}
          onPress={rematch}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.startBtnText}>Find New Match</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.chatContainer, { backgroundColor: colors.anonymousBg }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.chatHeader, { borderBottomColor: colors.anonymousBorder }]}>
        <View style={[styles.strangerDot, { backgroundColor: "#10B981" }]} />
        <View>
          <Text style={[styles.strangerLabel, { color: colors.anonymousText }]}>Anonymous Stranger</Text>
          <Text style={[styles.strangerSub, { color: "#10B981" }]}>
            {isPartnerTyping ? "Typing..." : "Verified campus student · Connected"}
          </Text>
        </View>
        <Pressable style={[styles.leaveBtn, { backgroundColor: "#EF444420" }]} onPress={disconnect}>
          <Text style={[styles.leaveText, { color: "#EF4444" }]}>Leave</Text>
        </Pressable>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubbleWrap, item.isMine && styles.bubbleMine]}>
            <View
              style={[
                styles.bubble,
                item.isMine
                  ? { backgroundColor: colors.anonymousPrimary }
                  : { backgroundColor: colors.anonymousCard, borderColor: colors.anonymousBorder, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.bubbleText, { color: item.isMine ? "#fff" : colors.anonymousText }]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, { color: item.isMine ? "rgba(255,255,255,0.6)" : colors.anonymousMuted }]}>
                {item.time}
              </Text>
            </View>
          </View>
        )}
        inverted
        contentContainerStyle={{ padding: 12, gap: 8 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View style={[styles.inputBar, { borderTopColor: colors.anonymousBorder, paddingBottom: bottomPad + 8 }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.anonymousCard, color: colors.anonymousText, borderColor: colors.anonymousBorder }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.anonymousMuted}
          value={text}
          onChangeText={handleTextChange}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.anonymousPrimary : "rgba(255,255,255,0.1)" }]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Ionicons name="arrow-up" size={20} color={text.trim() ? "#fff" : colors.anonymousMuted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  matchIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  matchTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 10, textAlign: "center" },
  matchSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  rules: { gap: 10, marginBottom: 32, alignSelf: "stretch" },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  pulseRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchingText: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 },
  searchingSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  cancelSearch: { marginTop: 24 },
  cancelSearchText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
  },
  strangerDot: { width: 10, height: 10, borderRadius: 5 },
  strangerLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  strangerSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  leaveBtn: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leaveText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  bubbleWrap: { flexDirection: "row", justifyContent: "flex-start" },
  bubbleMine: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 3, textAlign: "right" },
  inputBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  chatInput: {
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
