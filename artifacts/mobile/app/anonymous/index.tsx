import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfessionCard } from "@/components/ConfessionCard";
import { useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

export default function ConfessionsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { confessions, addConfession } = useAppData();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");

  const handlePost = () => {
    if (!text.trim()) return;
    addConfession(text.trim());
    setText("");
    setComposing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.anonymousBg }]}>
      <FlatList
        data={confessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConfessionCard confession={item} />}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: colors.anonymousMuted }]}>
            {confessions.length} anonymous confessions
          </Text>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === "web" ? 84 + 34 + 12 : 100 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.anonymousPrimary, bottom: (Platform.OS === "web" ? 84 + 34 : 70) + 16 }]}
        onPress={() => setComposing(true)}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <Modal visible={composing} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modal, { backgroundColor: colors.anonymousBg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.anonymousBorder }]}>
            <Pressable onPress={() => setComposing(false)}>
              <Text style={[styles.cancel, { color: colors.anonymousMuted }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.anonymousText }]}>Confess Anonymously</Text>
            <Pressable
              style={[styles.postBtn, { backgroundColor: text.trim() ? colors.anonymousPrimary : "rgba(255,255,255,0.1)" }]}
              onPress={handlePost}
              disabled={!text.trim()}
            >
              <Text style={[styles.postBtnText, { color: text.trim() ? "#fff" : colors.anonymousMuted }]}>Post</Text>
            </Pressable>
          </View>

          <View style={styles.anonInfo}>
            <View style={[styles.anonBadge, { backgroundColor: colors.anonymousPrimary + "20" }]}>
              <Ionicons name="shuffle-outline" size={14} color={colors.anonymousPrimary} />
              <Text style={[styles.anonBadgeText, { color: colors.anonymousPrimary }]}>
                You'll be assigned a random alias
              </Text>
            </View>
          </View>

          <TextInput
            style={[styles.input, { color: colors.anonymousText }]}
            placeholder="What's on your mind? Nobody will know it's you..."
            placeholderTextColor={colors.anonymousMuted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 20,
  },
  cancel: { fontFamily: "Inter_400Regular", fontSize: 16 },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  postBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  postBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  anonInfo: { padding: 16 },
  anonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  anonBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 26,
    padding: 16,
  },
});
