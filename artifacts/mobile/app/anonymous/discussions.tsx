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

import { Discussion, useAppData } from "@/context/AppDataContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function DiscussionCard({ discussion }: { discussion: Discussion }) {
  const colors = useColors();
  const { voteDiscussion } = useAppData();

  const handleVote = (vote: "up" | "down") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voteDiscussion(discussion.id, vote);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.anonymousCard, borderColor: colors.anonymousBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.dot, { backgroundColor: discussion.aliasColor }]} />
        <Text style={[styles.alias, { color: discussion.aliasColor }]}>{discussion.alias}</Text>
        <Text style={[styles.time, { color: colors.anonymousMuted }]}>{timeAgo(discussion.createdAt)}</Text>
      </View>

      <Text style={[styles.title, { color: colors.anonymousText }]}>{discussion.title}</Text>
      <Text style={[styles.content, { color: colors.anonymousMuted }]} numberOfLines={2}>
        {discussion.content}
      </Text>

      {discussion.tags.length > 0 && (
        <View style={styles.tags}>
          {discussion.tags.map((t) => (
            <View key={t} style={[styles.tag, { backgroundColor: colors.anonymousPrimary + "20" }]}>
              <Text style={[styles.tagText, { color: colors.anonymousPrimary }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={[styles.voteBtn, discussion.userVote === "up" && styles.votedUp]} onPress={() => handleVote("up")}>
          <Ionicons name="arrow-up" size={15} color={discussion.userVote === "up" ? "#10B981" : colors.anonymousMuted} />
          <Text style={[styles.count, { color: discussion.userVote === "up" ? "#10B981" : colors.anonymousMuted }]}>
            {discussion.voteCount > 0 ? discussion.voteCount : 0}
          </Text>
        </Pressable>
        <Pressable style={[styles.voteBtn, discussion.userVote === "down" && styles.votedDown]} onPress={() => handleVote("down")}>
          <Ionicons name="arrow-down" size={15} color={discussion.userVote === "down" ? "#EF4444" : colors.anonymousMuted} />
        </Pressable>
        <View style={styles.commentCount}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.anonymousMuted} />
          <Text style={[styles.count, { color: colors.anonymousMuted }]}>{discussion.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DiscussionsScreen() {
  const colors = useColors();
  const { discussions, addDiscussion } = useAppData();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handlePost = () => {
    if (!title.trim()) return;
    addDiscussion(title.trim(), body.trim(), []);
    setTitle("");
    setBody("");
    setComposing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.anonymousBg }]}>
      <FlatList
        data={discussions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DiscussionCard discussion={item} />}
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
            <Text style={[styles.modalTitle, { color: colors.anonymousText }]}>Start Discussion</Text>
            <Pressable
              style={[styles.postBtn, { backgroundColor: title.trim() ? colors.anonymousPrimary : "rgba(255,255,255,0.1)" }]}
              onPress={handlePost}
              disabled={!title.trim()}
            >
              <Text style={[styles.postBtnText, { color: title.trim() ? "#fff" : colors.anonymousMuted }]}>Post</Text>
            </Pressable>
          </View>

          <View style={styles.fields}>
            <TextInput
              style={[styles.titleInput, { color: colors.anonymousText, borderBottomColor: colors.anonymousBorder }]}
              placeholder="Discussion title..."
              placeholderTextColor={colors.anonymousMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={[styles.bodyInput, { color: colors.anonymousText }]}
              placeholder="Share more context (optional)..."
              placeholderTextColor={colors.anonymousMuted}
              value={body}
              onChangeText={setBody}
              multiline
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  alias: { fontFamily: "Inter_600SemiBold", fontSize: 12, flex: 1 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
  title: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 5, lineHeight: 21 },
  content: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  tags: { flexDirection: "row", gap: 6, marginBottom: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  actions: { flexDirection: "row", gap: 10 },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  votedUp: { backgroundColor: "rgba(16,185,129,0.1)" },
  votedDown: { backgroundColor: "rgba(239,68,68,0.1)" },
  commentCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  count: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
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
  fields: { flex: 1, padding: 16 },
  titleInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  bodyInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});
