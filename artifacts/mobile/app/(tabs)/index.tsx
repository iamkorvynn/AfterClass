import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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

import { PostCard } from "@/components/PostCard";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type FeedFilter = "all" | "following" | "department";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { posts, addPost } = useAppData();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [composing, setComposing] = useState(false);
  const [postText, setPostText] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handlePost = () => {
    if (!postText.trim()) return;
    addPost(postText.trim());
    setPostText("");
    setComposing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.appTitle, { color: colors.primary }]}>CampusPulse</Text>
            <Text style={[styles.collegeName, { color: colors.mutedForeground }]}>
              {user?.campusDomain ?? "University"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.ghostBtn, { backgroundColor: colors.anonymousCard }]}
              onPress={() => router.push("/anonymous")}
            >
              <Ionicons name="glasses-outline" size={20} color="#A855F7" />
              <Text style={[styles.ghostLabel, { color: "#A855F7" }]}>Anon</Text>
            </Pressable>
            <Pressable style={[styles.notifBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
              <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.filters}>
          {(["all", "following", "department"] as FeedFilter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterBtn, f === filter && { backgroundColor: colors.primary }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: f === filter ? "#fff" : colors.mutedForeground }]}>
                {f === "all" ? "All" : f === "following" ? "Following" : "Dept"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomPad + 100 }}
        scrollEnabled={!!posts.length}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (Platform.OS === "web" ? 84 + 34 : 84) + 12 }]}
        onPress={() => setComposing(true)}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </Pressable>

      <Modal visible={composing} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setComposing(false)}>
              <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Post</Text>
            <Pressable
              style={[styles.postBtn, { backgroundColor: postText.trim() ? colors.primary : colors.muted }]}
              onPress={handlePost}
              disabled={!postText.trim()}
            >
              <Text style={[styles.postBtnText, { color: postText.trim() ? "#fff" : colors.mutedForeground }]}>
                Post
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{user?.fullName?.slice(0, 2) ?? "AJ"}</Text>
            </View>
            <TextInput
              style={[styles.postInput, { color: colors.foreground }]}
              placeholder="What's happening on campus?"
              placeholderTextColor={colors.mutedForeground}
              value={postText}
              onChangeText={setPostText}
              multiline
              autoFocus
            />
          </View>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <View style={[styles.visibilityPill, { backgroundColor: colors.secondary }]}>
              <Ionicons name="globe-outline" size={14} color={colors.primary} />
              <Text style={[styles.visibilityText, { color: colors.primary }]}>Campus</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, borderBottomWidth: 1 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  appTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  collegeName: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ghostLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  fab: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  postBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  postBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  modalBody: { flexDirection: "row", padding: 16, gap: 12, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  postInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  visibilityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  visibilityText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
