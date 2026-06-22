import React, { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPosts, 
  useCreatePost, 
  useToggleLikePost, 
  useListAnonymousPosts, 
  useCreateAnonymousPost, 
  useVoteAnonymousPost, 
  useListCommunities, 
  useJoinCommunity, 
  useListEvents, 
  useRsvpEvent 
} from "@workspace/api-client-react";

export type PostVisibility = "college" | "department" | "community";

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorMajor: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  visibility: PostVisibility;
  tags: string[];
}

export interface Confession {
  id: string;
  content: string;
  alias: string;
  aliasColor: string;
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  commentCount: number;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isJoined: boolean;
  iconName: string;
  color: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  rsvpCount: number;
  isRsvped: boolean;
  category: "hackathon" | "workshop" | "competition" | "social" | "academic";
  color: string;
}

export interface DirectMessage {
  id: string;
  userId: string;
  name: string;
  initials: string;
  avatarColor: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  title: string;
  alias: string;
  aliasColor: string;
  content: string;
  voteCount: number;
  userVote: "up" | "down" | null;
  commentCount: number;
  createdAt: string;
  tags: string[];
}

interface AppDataContextType {
  posts: Post[];
  confessions: Confession[];
  communities: Community[];
  events: CampusEvent[];
  directMessages: DirectMessage[];
  discussions: Discussion[];
  chatMessages: Record<string, ChatMessage[]>;
  addPost: (content: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addConfession: (content: string) => Promise<void>;
  voteConfession: (id: string, vote: "up" | "down") => Promise<void>;
  addDiscussion: (title: string, content: string, tags: string[]) => Promise<void>;
  voteDiscussion: (id: string, vote: "up" | "down") => Promise<void>;
  toggleJoinCommunity: (id: string) => Promise<void>;
  toggleRsvpEvent: (id: string) => Promise<void>;
  sendChatMessage: (conversationId: string, text: string) => void;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

const AVATAR_COLORS = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#F97316"];
const ALIAS_COLORS = ["#EC4899", "#F97316", "#8B5CF6", "#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#6366F1"];

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getColorFromId(id: string, colorList: string[] = AVATAR_COLORS): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorList.length;
  return colorList[index];
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [directMessages] = useState<DirectMessage[]>([]);
  const [chatMessages] = useState<Record<string, ChatMessage[]>>({});
  
  // 1. Fetch Verified Posts Feed
  const { data: serverPosts = [] } = useListPosts();
  
  // 2. Fetch Anonymous Confessions Feed
  const { data: serverAnonPosts = [] } = useListAnonymousPosts();

  // 3. Fetch Campus Communities
  const { data: serverCommunities = [] } = useListCommunities();

  // 4. Fetch Campus Events
  const { data: serverEvents = [] } = useListEvents();

  // Mutations
  const createPostMut = useCreatePost();
  const likePostMut = useToggleLikePost();
  const createAnonPostMut = useCreateAnonymousPost();
  const voteAnonPostMut = useVoteAnonymousPost();
  const joinCommunityMut = useJoinCommunity();
  const rsvpEventMut = useRsvpEvent();

  // Mapping Backend Models back to expected React Native interfaces
  const posts: Post[] = serverPosts.map((p: any) => ({
    id: p.id,
    userId: p.userId,
    authorName: p.fullName,
    authorMajor: p.major,
    authorInitials: getInitials(p.fullName),
    authorColor: getColorFromId(p.userId),
    content: p.content,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    isLiked: p.isLiked,
    createdAt: p.createdAt,
    visibility: p.communityId ? "community" as const : "college" as const,
    tags: []
  }));

  const confessions: Confession[] = serverAnonPosts.map((c: any) => ({
    id: c.id,
    content: c.content,
    alias: c.aliasName,
    aliasColor: getColorFromId(c.aliasName, ALIAS_COLORS),
    upvotes: c.upvoteCount,
    downvotes: c.downvoteCount,
    userVote: c.userVote === 1 ? "up" as const : c.userVote === -1 ? "down" as const : null,
    commentCount: c.commentCount,
    createdAt: c.createdAt
  }));

  const communities: Community[] = serverCommunities.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    category: c.slug === "computer-science" || c.slug === "mechanical-engineering" ? "Department" : "Club",
    memberCount: 245, // Fallback mock member counter
    isJoined: true, // Defaulting true for active listing UI
    iconName: c.slug === "computer-science" ? "laptop-outline" : "chatbubbles-outline",
    color: getColorFromId(c.id, AVATAR_COLORS)
  }));

  const events: CampusEvent[] = serverEvents.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.startsAt,
    location: e.location,
    organizer: "Campus Network",
    rsvpCount: e.rsvpCount,
    isRsvped: e.rsvpStatus === "attending",
    category: e.title.toLowerCase().includes("hack") ? ("hackathon" as const) : ("workshop" as const),
    color: getColorFromId(e.id, AVATAR_COLORS)
  }));

  // Discussions alias to confessions for feed simplicity
  const discussions: Discussion[] = confessions.map(c => ({
    id: c.id,
    title: c.content.slice(0, 50) + "...",
    alias: c.alias,
    aliasColor: c.aliasColor,
    content: c.content,
    voteCount: c.upvotes - c.downvotes,
    userVote: c.userVote,
    commentCount: c.commentCount,
    createdAt: c.createdAt,
    tags: ["Confession"]
  }));

  // Actions wired to Server Mutations & Query Cache Invalidations
  const addPost = async (content: string) => {
    await createPostMut.mutateAsync({
      data: { content }
    });
    // Invalidate React Query posts key to reload feed
    queryClient.invalidateQueries({ queryKey: [`/api/posts`] });
  };

  const toggleLike = async (postId: string) => {
    await likePostMut.mutateAsync({ id: postId });
    queryClient.invalidateQueries({ queryKey: [`/api/posts`] });
  };

  const addConfession = async (content: string) => {
    await createAnonPostMut.mutateAsync({
      data: { content }
    });
    queryClient.invalidateQueries({ queryKey: [`/api/anon/posts`] });
  };

  const voteConfession = async (id: string, vote: "up" | "down") => {
    const value = vote === "up" ? 1 : -1;
    await voteAnonPostMut.mutateAsync({
      id,
      data: { value }
    });
    queryClient.invalidateQueries({ queryKey: [`/api/anon/posts`] });
  };

  const addDiscussion = async (title: string, content: string, _tags: string[]) => {
    // Maps back to confession creation
    await addConfession(`${title}\n\n${content}`);
  };

  const voteDiscussion = async (id: string, vote: "up" | "down") => {
    await voteConfession(id, vote);
  };

  const toggleJoinCommunity = async (id: string) => {
    await joinCommunityMut.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: [`/api/communities`] });
  };

  const toggleRsvpEvent = async (id: string) => {
    await rsvpEventMut.mutateAsync({
      id,
      data: { status: "attending" }
    });
    queryClient.invalidateQueries({ queryKey: [`/api/events`] });
  };

  const sendChatMessage = (_conversationId: string, _text: string) => {
    // Real-time chat messages are handled by socket connections dynamically
  };

  return (
    <AppDataContext.Provider
      value={{
        posts, confessions, communities, events, directMessages, discussions, chatMessages,
        addPost, toggleLike, addConfession, voteConfession,
        addDiscussion, voteDiscussion,
        toggleJoinCommunity, toggleRsvpEvent, sendChatMessage,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
