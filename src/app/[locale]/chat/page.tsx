"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Users, Plus, ArrowLeft, Send, Paperclip, X, Settings, UserPlus, Image as ImageIcon, UserMinus, Search, Smile, Reply, Forward, MoreVertical, Edit } from "lucide-react";
import { UserStatus } from "@/components/UserStatus";
import { localeLink, type Locale } from "@/lib/localeLink";

interface Message {
  _id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  message: string;
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
  reactions?: {
    emoji: string;
    userId: string;
  }[];
  sender?: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
}

interface Connection {
  _id: string;
  status: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: string;
  };
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy?: string;
  members: any[];
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const userId = searchParams.get("userId");
  const groupId = searchParams.get("groupId");

  // Extract locale from pathname
  const locale: Locale = (() => {
    const match = pathname?.match(/^\/([^\/]+)/);
    if (match && ["me", "en", "it", "sq"].includes(match[1])) {
      return match[1] as Locale;
    }
    return "me";
  })();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ users: Record<string, number>; groups: Record<string, number> }>({ users: {}, groups: {} });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupImages, setGroupImages] = useState<string[]>([]);
  const [newMemberId, setNewMemberId] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showGallery, setShowGallery] = useState(false);
  const [chatImages, setChatImages] = useState<string[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstMessageIdRef, setFirstMessageIdRef] = useState<string>("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingTo, setForwardingTo] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [tappedMessageId, setTappedMessageId] = useState<string | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string>("");

  useEffect(() => {
    setLoadingChats(true);
    // Load data in parallel for better performance
    Promise.all([
      loadCurrentUser(),
      loadConnections(),
      loadGroups(),
      loadUnreadCounts(),
    ]).then(() => {
      setLoadingChats(false);
      if (userId) {
        loadMessages(userId, null);
      } else if (groupId) {
        loadMessages(null, groupId);
      }
    });

    // Update user activity every 2 minutes (only if user is authenticated)
    let activityInterval: NodeJS.Timeout | null = null;
    if (currentUserId) {
      activityInterval = setInterval(async () => {
        try {
          await fetch("/api/users/activity", { method: "POST" });
        } catch (error) {
          // Silently fail - don't spam console
        }
      }, 120000); // 2 minutes

      // Initial activity update (only once)
      fetch("/api/users/activity", { method: "POST" }).catch(() => {});
    }

    return () => {
      if (activityInterval) {
        clearInterval(activityInterval);
      }
    };
  }, [userId, groupId]);

  async function loadCurrentUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUserId(data.user._id);
        }
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  }

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        loadNewMessages(userId, null);
      } else if (groupId) {
        loadNewMessages(null, groupId);
      }
      loadUnreadCounts();
    }, 2000);

    return () => clearInterval(interval);
  }, [userId, groupId]);

  // Refresh unread counts immediately when opening a chat
  useEffect(() => {
    if (userId || groupId) {
      // Small delay to ensure messages are loaded and marked as read first
      const timeout = setTimeout(() => {
        loadUnreadCounts();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [userId, groupId]);

  // Handle scroll to load older messages with debouncing
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || (!userId && !groupId)) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (container.scrollTop < 100 && hasMore && !loadingMore) {
          loadOlderMessages(userId, groupId);
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [userId, groupId, hasMore, loadingMore, firstMessageIdRef]);

  // Close sidebar on mobile when route changes or when navigating back
  useEffect(() => {
    setShowSidebar(false);
  }, [userId, groupId, pathname]);

  // Close emoji picker and message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showEmojiPicker && !(e.target as HTMLElement).closest('.emoji-picker-container')) {
        setShowEmojiPicker(null);
      }
      if (messageMenuOpen) {
        const messageMenu = document.querySelector(`[data-message-menu="${messageMenuOpen}"]`);
        if (messageMenu && !messageMenu.contains(e.target as HTMLElement)) {
          setMessageMenuOpen(null);
        }
      }
    };
    if (showEmojiPicker || messageMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEmojiPicker, messageMenuOpen]);

  // Close chat sidebar when hamburger menu is opened (check for mobile menu)
  useEffect(() => {
    const checkMobileMenu = () => {
      const mobileMenu = document.getElementById("mobileMenu");
      if (mobileMenu && mobileMenu.classList.contains("active")) {
        setShowSidebar(false);
        // Hide chat content when mobile menu is open
        const chatMainContent = document.querySelector(".chat-main-content");
        if (chatMainContent) {
          (chatMainContent as HTMLElement).style.display = "none";
        }
      } else {
        // Show chat content when mobile menu is closed
        const chatMainContent = document.querySelector(".chat-main-content");
        if (chatMainContent) {
          (chatMainContent as HTMLElement).style.display = "flex";
        }
      }
    };
    
    const observer = new MutationObserver(checkMobileMenu);
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      observer.observe(mobileMenu, { attributes: true, attributeFilter: ["class"] });
      checkMobileMenu(); // Check initial state
    }
    
    return () => observer.disconnect();
  }, []);

  async function loadConnections() {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        const accepted = data.connections.filter((c: Connection) => c.status === "accepted");
        setConnections(accepted);
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  }

  async function loadMessages(receiverId: string | null, groupIdParam: string | null) {
    setLoading(true);
    try {
      // Ensure currentUserId is loaded before loading messages
      if (!currentUserId) {
        await loadCurrentUser();
      }
      
      const url = receiverId
        ? `/api/messages?receiverId=${receiverId}`
        : `/api/messages?groupId=${groupIdParam}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.messages && data.messages.length > 0) {
          lastMessageIdRef.current = data.messages[data.messages.length - 1]._id;
          setFirstMessageIdRef(data.messages[0]._id);
          setHasMore(data.hasMore !== false);
        } else {
          setHasMore(false);
        }
        // Mark as read
        if (receiverId) {
          await fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ receiverId }),
          });
          // Immediately refresh unread counts after marking as read
          await loadUnreadCounts();
        } else if (groupIdParam) {
          await fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: groupIdParam }),
          });
          // Immediately refresh unread counts after marking as read
          await loadUnreadCounts();
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
      // Scroll to bottom after loading is complete
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }

  async function loadNewMessages(receiverId: string | null, groupIdParam: string | null) {
    if (!lastMessageIdRef.current) return;

    try {
      const url = receiverId
        ? `/api/messages?receiverId=${receiverId}&lastId=${lastMessageIdRef.current}`
        : `/api/messages?groupId=${groupIdParam}&lastId=${lastMessageIdRef.current}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [...prev, ...data.messages]);
          lastMessageIdRef.current = data.messages[data.messages.length - 1]._id;
        }
      }
    } catch (error) {
      console.error("Error loading new messages:", error);
    }
  }

  async function loadOlderMessages(receiverId: string | null, groupIdParam: string | null) {
    if (!firstMessageIdRef || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const url = receiverId
        ? `/api/messages?receiverId=${receiverId}&beforeId=${firstMessageIdRef}`
        : `/api/messages?groupId=${groupIdParam}&beforeId=${firstMessageIdRef}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const previousScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
          setMessages((prev) => [...data.messages, ...prev]);
          setFirstMessageIdRef(data.messages[0]._id);
          setHasMore(data.hasMore !== false);
          
          // Maintain scroll position
          setTimeout(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
            }
          }, 0);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadUnreadCounts() {
    try {
      const res = await fetch("/api/messages/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts(data);
      }
    } catch (error) {
      console.error("Error loading unread counts:", error);
    }
  }

  async function sendMessage() {
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      const formData = new FormData();
      if (userId) {
        formData.append("receiverId", userId);
      } else if (groupId) {
        formData.append("groupId", groupId);
      }
      let messageToSend = messageText;
      if (replyingTo) {
        messageToSend = `Replying to: ${replyingTo.sender?.displayName || replyingTo.sender?.username || "User"}\n${replyingTo.message || "[File]"}\n\n${messageText}`;
      }
      formData.append("message", messageToSend);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Ensure we have currentUserId before creating message
        if (!currentUserId) {
          await loadCurrentUser();
        }
        const newMessage: Message = {
          _id: data._id,
          senderId: currentUserId || data.senderId || "",
          receiverId: userId || undefined,
          groupId: groupId || undefined,
          message: data.message,
          fileUrl: data.fileUrl,
          isRead: false,
          createdAt: data.createdAt,
        };
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        setSelectedFile(null);
        setImagePreview(null);
        setReplyingTo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px";
        }
        lastMessageIdRef.current = data._id;
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  }

  async function createGroup() {
    if (!groupName.trim()) {
      alert("Group name is required");
      return;
    }

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          memberIds: selectedMembers,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [...prev, data]);
        setShowCreateGroup(false);
        setGroupName("");
        setGroupDescription("");
        setSelectedMembers([]);
        router.push(localeLink(`/chat?groupId=${data._id}`, locale));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error creating group");
    }
  }

  async function loadAvailableUsers() {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        const accepted = data.connections
          .filter((c: Connection) => c.status === "accepted")
          .map((c: Connection) => c.user);
        setAvailableUsers(accepted);
      }
    } catch (error) {
      console.error("Error loading available users:", error);
    }
  }

  async function loadGroupImages() {
    if (!groupId) return;
    
    try {
      const res = await fetch(`/api/messages?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        const images = data.messages
          ?.filter((msg: Message) => msg.fileUrl && msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map((msg: Message) => msg.fileUrl) || [];
        setGroupImages(images);
      }
    } catch (error) {
      console.error("Error loading group images:", error);
    }
  }

  async function addMemberToGroup() {
    if (!groupId || !newMemberId) {
      alert("Please select a user to add");
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newMemberId }),
      });

      if (res.ok) {
        await loadGroups();
        setNewMemberId("");
        alert("Member added successfully");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Error adding member");
    }
  }

  async function removeMemberFromGroup(memberId: string) {
    if (!groupId) return;
    
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members?userId=${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadGroups();
        alert("Member removed successfully");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Error removing member");
    }
  }

  async function loadChatImages() {
    if (!userId && !groupId) return;
    
    try {
      const url = userId
        ? `/api/messages?receiverId=${userId}`
        : `/api/messages?groupId=${groupId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const images = data.messages
          ?.filter((msg: Message) => msg.fileUrl && msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map((msg: Message) => msg.fileUrl) || [];
        setChatImages(images);
      }
    } catch (error) {
      console.error("Error loading chat images:", error);
    }
  }

  function scrollToBottom() {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!currentUserId) return;

    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update message in state
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
          )
        );
        setShowEmojiPicker(null);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  }

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];

  function getReactionCounts(reactions: { emoji: string; userId: string }[] | undefined) {
    if (!reactions || reactions.length === 0) return {};
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  }

  function hasUserReacted(reactions: { emoji: string; userId: string }[] | undefined, emoji: string) {
    if (!reactions || !currentUserId) return false;
    return reactions.some((r) => r.emoji === emoji && r.userId === currentUserId);
  }

  const currentUser = connections.find((c) => c.user._id === userId)?.user;
  const currentGroup = groups.find((g) => g._id === groupId);

  return (
    <main 
      data-chat-page="true"
      style={{ 
        padding: "0", 
        margin: "0", 
        height: "calc(100vh - 80px)",
        maxHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
        position: "relative"
      }}>
      <div style={{ 
        display: "flex", 
        gap: (userId || groupId) ? "20px" : "0",
        height: "100%",
        width: "100%",
        margin: "0",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative"
      }}>

        {/* Sidebar Overlay (Mobile) */}
        {showSidebar && (userId || groupId) && (
          <div
            onClick={() => setShowSidebar(false)}
            style={{
              display: "none",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 998,
            }}
            className="sidebar-overlay"
          />
        )}

        {/* Sidebar - Only show when chat is selected on desktop */}
        {(userId || groupId) && (
          <div
            className={`chat-sidebar ${showSidebar ? "sidebar-open" : ""}`}
            style={{
              width: "300px",
              minWidth: "300px",
              background: "white",
              borderRadius: "8px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              overflowY: "auto",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.3s ease",
              flexShrink: 0,
            }}
          >
          {/* Contacts */}
          <div style={{ marginBottom: "24px", flexShrink: 0 }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={18} />
              Contacts
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, overflowY: "auto" }}>
              {connections.map((conn) => {
                const unread = unreadCounts.users[conn.user._id] || 0;
                return (
                  <li key={conn._id} style={{ marginBottom: "8px" }}>
                    <Link
                      href={localeLink(`/chat?userId=${conn.user._id}`, locale)}
                      onClick={() => setShowSidebar(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "inherit",
                        background: userId === conn.user._id ? "#e3f2fd" : "transparent",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (userId !== conn.user._id) {
                          e.currentTarget.style.background = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (userId !== conn.user._id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "32px",
                          height: "32px",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: conn.user.profilePicture
                              ? `url(${conn.user.profilePicture}) center/cover`
                              : "#e4e4e4",
                          }}
                        />
                        <UserStatus userId={conn.user._id} size="small" />
                      </div>
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>
                        {conn.user.displayName || conn.user.username}
                      </span>
                      {unread > 0 && (
                        <span
                          style={{
                            background: "#0a66c2",
                            color: "white",
                            borderRadius: "12px",
                            padding: "2px 6px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Groups */}
          <div style={{ marginBottom: "24px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} />
                Groups
              </h3>
              <button
                onClick={() => {
                  setShowCreateGroup(true);
                  loadAvailableUsers();
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Plus size={18} color="#0a66c2" />
              </button>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {groups.map((group) => {
                const unread = unreadCounts.groups[group._id] || 0;
                return (
                  <li key={group._id} style={{ marginBottom: "8px" }}>
                    <Link
                      href={localeLink(`/chat?groupId=${group._id}`, locale)}
                      onClick={() => setShowSidebar(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "inherit",
                        background: groupId === group._id ? "#e3f2fd" : "transparent",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (groupId !== group._id) {
                          e.currentTarget.style.background = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (groupId !== group._id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#0a66c2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "600",
                          flexShrink: 0,
                        }}
                      >
                        {group.name && group.name.length > 0 ? group.name[0].toUpperCase() : "G"}
                      </div>
                      <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{group.name || "Group"}</span>
                      {unread > 0 && (
                        <span
                          style={{
                            background: "#0a66c2",
                            color: "white",
                            borderRadius: "12px",
                            padding: "2px 6px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          </div>
        )}

        {/* Chat Box */}
        <div
          className="chat-main-content"
          style={{
            flex: 1,
            width: userId || groupId ? "auto" : "100%",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minWidth: 0,
            transition: "all 0.3s ease",
          }}
        >
          {userId || groupId ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  <button
                    onClick={() => {
                      setShowSidebar(false);
                      if (userId || groupId) {
                        router.push(localeLink("/chat", locale));
                      }
                    }}
                    style={{
                      display: "none",
                      alignItems: "center",
                      padding: "4px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                    }}
                    className="mobile-back-button"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <Link
                    href={localeLink("/chat", locale)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                    className="desktop-back-button"
                  >
                    <ArrowLeft size={20} />
                  </Link>
                  {currentUser && (
                    <>
                      <div
                        style={{
                          position: "relative",
                          width: "40px",
                          height: "40px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: currentUser.profilePicture
                              ? `url(${currentUser.profilePicture}) center/cover`
                              : "#e4e4e4",
                          }}
                        />
                        <UserStatus userId={currentUser._id} size="medium" />
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "600" }}>
                          {currentUser.displayName || currentUser.username}
                        </div>
                      </div>
                    </>
                  )}
                  {currentGroup && (
                    <>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#0a66c2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        {currentGroup.name && currentGroup.name.length > 0 ? currentGroup.name[0].toUpperCase() : "G"}
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "600" }}>{currentGroup.name || "Group"}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {currentGroup.members?.length || 0} members
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {/* Search button */}
                  <button
                    onClick={() => {
                      setShowSearchInput(!showSearchInput);
                      if (showSearchInput) {
                        setSearchTerm("");
                      }
                    }}
                    style={{
                      border: "none",
                      background: showSearchInput ? "#e3f2fd" : "transparent",
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!showSearchInput) {
                        e.currentTarget.style.transform = "scale(1.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="Search messages"
                  >
                    <Search size={20} color={showSearchInput ? "#0a66c2" : "#666"} />
                  </button>
                  
                  {/* Gallery button */}
                  {(currentUser || currentGroup) && (
                    <button
                      onClick={() => {
                        setShowGallery(true);
                        loadChatImages();
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="View gallery"
                    >
                      <ImageIcon size={20} color="#666" />
                    </button>
                  )}
                  
                  {/* Settings button (only for groups) */}
                  {currentGroup && (
                    <button
                      onClick={() => {
                        setShowGroupSettings(true);
                        loadGroupImages();
                        loadAvailableUsers();
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Group settings"
                    >
                      <Settings size={20} color="#666" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Input */}
              {showSearchInput && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e0e0e0",
                    background: "#f9f9f9",
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search size={18} color="#666" style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
                    <input
                      id="chat-search-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search messages..."
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 40px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "20px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        style={{
                          position: "absolute",
                          right: "8px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <X size={16} color="#666" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {loading ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>Loading...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <>
                    {loadingMore && (
                      <div style={{ textAlign: "center", padding: "12px", color: "#666", fontSize: "14px" }}>
                        Loading older messages...
                      </div>
                    )}
                    {messages
                    .filter((msg) => {
                      if (!searchTerm.trim()) return true;
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        msg.message?.toLowerCase().includes(searchLower) ||
                        msg.sender?.displayName?.toLowerCase().includes(searchLower) ||
                        msg.sender?.username?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((msg) => {
                    // Check if message is sent by current user
                    const isOwn = currentUserId && msg.senderId === currentUserId;
                    
                    return (
                      <div
                        key={msg._id}
                        onMouseEnter={() => !isMobile && setHoveredMessageId(msg._id)}
                        onMouseLeave={() => !isMobile && setHoveredMessageId(null)}
                        onClick={() => {
                          if (isMobile) {
                            setTappedMessageId(tappedMessageId === msg._id ? null : msg._id);
                          }
                        }}
                        style={{
                          display: "flex",
                          justifyContent: isOwn ? "flex-end" : "flex-start",
                          alignItems: "flex-start",
                          gap: "8px",
                          marginBottom: "12px",
                          width: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          position: "relative",
                          cursor: isMobile ? "pointer" : "default",
                        }}
                      >
                        {/* Action buttons - right side for received messages (after message) */}
                        {!isOwn && (hoveredMessageId === msg._id || (isMobile && tappedMessageId === msg._id)) && (
                          <div style={{ display: "flex", gap: "4px", alignSelf: "center", order: 2 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                                if (textareaRef.current) {
                                  textareaRef.current.focus();
                                }
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="Reply"
                            >
                              <Reply size={16} color="#666" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id);
                                setMessageMenuOpen(null);
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="React"
                            >
                              <Smile size={16} color="#666" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setForwardingTo(msg);
                                setShowForwardModal(true);
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="Forward"
                            >
                              <Forward size={16} color="#666" />
                            </button>
                            {showEmojiPicker === msg._id && (
                              <div
                                className="emoji-picker-container"
                                style={{
                                  position: "absolute",
                                  bottom: "100%",
                                  left: "0",
                                  background: "white",
                                  borderRadius: "8px",
                                  padding: "8px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                  display: "flex",
                                  gap: "4px",
                                  zIndex: 1000,
                                  marginBottom: "4px",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {commonEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      toggleReaction(msg._id, emoji);
                                      setShowEmojiPicker(null);
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "18px",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#f0f0f0";
                                      e.currentTarget.style.transform = "scale(1.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "transparent";
                                      e.currentTarget.style.transform = "scale(1)";
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Action buttons - left side for sent messages (before message) */}
                        {isOwn && (hoveredMessageId === msg._id || (isMobile && tappedMessageId === msg._id)) && (
                          <div style={{ display: "flex", gap: "4px", alignSelf: "center" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                                if (textareaRef.current) {
                                  textareaRef.current.focus();
                                }
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="Reply"
                            >
                              <Reply size={16} color="#666" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id);
                                setMessageMenuOpen(null);
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="React"
                            >
                              <Smile size={16} color="#666" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement edit functionality
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="Edit"
                            >
                              <Edit size={16} color="#666" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setForwardingTo(msg);
                                setShowForwardModal(true);
                              }}
                              style={{
                                background: "white",
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f0f0f0";
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                              }}
                              title="Forward"
                            >
                              <Forward size={16} color="#666" />
                            </button>
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%", minWidth: 0, width: "fit-content" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            {!isOwn && msg.sender && (
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: msg.sender.profilePicture
                                    ? `url(${msg.sender.profilePicture}) center/cover`
                                    : "#e4e4e4",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div
                              style={{
                                width: "fit-content",
                                padding: "8px 12px",
                                borderRadius: "12px",
                                background: isOwn ? "#0a66c2" : "#f0f0f0",
                                color: isOwn ? "white" : "inherit",
                                boxSizing: "border-box",
                                overflow: "hidden",
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                position: "relative",
                              }}
                            >
                          {!isOwn && msg.sender && (
                            <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#0a66c2" }}>
                              {msg.sender.displayName || msg.sender.username}
                            </div>
                          )}
                          {msg.message && (
                            <div 
                              style={{ 
                                marginBottom: msg.fileUrl ? "8px" : "0",
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                                overflowWrap: "break-word",
                                wordBreak: "break-word",
                                maxWidth: "100%",
                                overflow: "hidden",
                              }}
                            >
                              {msg.message}
                            </div>
                          )}
                          {msg.fileUrl && (
                            <div>
                              {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img
                                  src={msg.fileUrl}
                                  alt="Attachment"
                                  style={{ maxWidth: "200px", borderRadius: "8px", marginTop: "4px" }}
                                />
                              ) : (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: isOwn ? "white" : "#0a66c2", textDecoration: "underline" }}
                                >
                                  📎 File
                                </a>
                              )}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.7,
                              marginTop: "4px",
                            }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        </div>
                      </div>
                      {/* Reactions - shown below message */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "4px", 
                            marginTop: "4px",
                            marginLeft: isOwn ? "auto" : "0",
                            marginRight: isOwn ? "0" : "auto",
                            maxWidth: "70%",
                          }}>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {Object.entries(getReactionCounts(msg.reactions)).map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg._id, emoji)}
                                  style={{
                                    background: hasUserReacted(msg.reactions, emoji) 
                                      ? "#e3f2fd"
                                      : "white",
                                    border: `1px solid ${hasUserReacted(msg.reactions, emoji) 
                                      ? "#0a66c2"
                                      : "#e0e0e0"}`,
                                    borderRadius: "12px",
                                    padding: "2px 6px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.1)";
                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span style={{ fontSize: "11px", opacity: 0.8 }}>{count}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {isOwn && msg.sender && (
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: msg.sender.profilePicture
                                ? `url(${msg.sender.profilePicture}) center/cover`
                                : "#e4e4e4",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid #e0e0e0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Reply preview */}
                {replyingTo && (
                  <div
                    style={{
                      background: "#f0f7ff",
                      border: "1px solid #0a66c2",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#0a66c2", marginBottom: "4px" }}>
                        Replying to {replyingTo.sender?.displayName || replyingTo.sender?.username || "User"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {replyingTo.message || (replyingTo.fileUrl ? "[File]" : "")}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={16} color="#666" />
                    </button>
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && file.type.startsWith("image/")) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Attach file"
                >
                  <Paperclip size={20} color="#666" />
                </button>
                {imagePreview && (
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                      marginRight: "8px",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        border: "none",
                        background: "#dc3545",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {selectedFile && !imagePreview && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666" }}>
                    {selectedFile.name}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    // Auto-resize textarea
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "auto";
                      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
                      textareaRef.current.style.height = `${newHeight}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "20px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "none",
                    overflow: "hidden",
                    minHeight: "40px",
                    maxHeight: "120px",
                    fontFamily: "inherit",
                    lineHeight: "1.4",
                    height: "40px",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || (!messageText.trim() && !selectedFile)}
                  style={{
                    border: "none",
                    background: "#0a66c2",
                    color: "white",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: sending || (!messageText.trim() && !selectedFile) ? "not-allowed" : "pointer",
                    opacity: sending || (!messageText.trim() && !selectedFile) ? 0.5 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!sending && (messageText.trim() || selectedFile)) {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <Send size={18} />
                </button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="chat-main-content"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "0",
                overflow: "hidden",
                background: "#ffffff",
                width: "100%",
                boxSizing: "border-box",
                zIndex: 1,
              }}
            >
              <div 
                className="chat-list-header"
                style={{ 
                  padding: "32px 40px", 
                  background: "#ffffff",
                  borderBottom: "1px solid #e5e7eb",
                  position: "sticky",
                  top: 0,
                  zIndex: 10
                }}
              >
                <h2 style={{ 
                  fontSize: "28px", 
                  fontWeight: "700", 
                  marginBottom: "8px", 
                  color: "#1a1a1a", 
                  lineHeight: "1.3"
                }}>
                  Moji Chatovi
                </h2>
                <p style={{ 
                  fontSize: "15px", 
                  color: "#6b7280", 
                  margin: 0, 
                  lineHeight: "1.5"
                }}>
                  Odaberite kontakt ili grupu da započnete razgovor
                </p>
              </div>
              
              <div 
                className="chat-list-content"
                style={{ 
                  padding: "24px 40px", 
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  minHeight: 0
                }}
              >

              {/* Contacts List */}
              {loadingChats ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  <div style={{ 
                    display: "inline-block",
                    width: "30px",
                    height: "30px",
                    border: "3px solid #0a66c2",
                    borderTop: "3px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                </div>
              ) : (
                <>
              {connections.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 className="chat-section-title" style={{ 
                    fontSize: "18px", 
                    fontWeight: "600", 
                    marginBottom: "20px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    color: "#1a1a1a"
                  }}>
                    <MessageSquare size={20} color="#0a66c2" />
                    <span>Kontakti ({connections.length})</span>
                  </h3>
                  <div className="chat-grid" style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
                    gap: "16px",
                    width: "100%"
                  }}>
                    {connections.map((conn) => {
                      const unread = unreadCounts.users[conn.user._id] || 0;
                      return (
                        <Link
                          key={conn._id}
                          href={localeLink(`/chat?userId=${conn.user._id}`, locale)}
                          onClick={() => setShowSidebar(false)}
                          className="chat-list-item"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "16px",
                            borderRadius: "12px",
                            textDecoration: "none",
                            color: "inherit",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f0f7ff";
                            e.currentTarget.style.borderColor = "#0a66c2";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.15)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            className="chat-item-avatar"
                            style={{
                              position: "relative",
                              width: "56px",
                              height: "56px",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              className="chat-item-avatar-img"
                              style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "50%",
                                background: conn.user.profilePicture
                                  ? `url(${conn.user.profilePicture}) center/cover`
                                  : "#e4e4e4",
                                border: "2px solid #f0f0f0",
                              }}
                            />
                            <UserStatus userId={conn.user._id} size="small" />
                          </div>
                          <div className="chat-item-text" style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                            <div className="chat-item-name" style={{ fontSize: "17px", fontWeight: "600", color: "#1a1a1a", marginBottom: "4px", lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {conn.user.displayName || conn.user.username}
                            </div>
                          </div>
                          {unread > 0 && (
                            <span
                              className="chat-item-badge"
                              style={{
                                background: "#0a66c2",
                                color: "white",
                                borderRadius: "50%",
                                padding: "4px 8px",
                                fontSize: "12px",
                                fontWeight: "700",
                                minWidth: "24px",
                                height: "24px",
                                textAlign: "center",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 4px rgba(10, 102, 194, 0.3)",
                              }}
                            >
                              {unread}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Groups List */}
              {groups.length > 0 && (
                <div>
                  <h3 className="chat-section-title" style={{ 
                    fontSize: "18px", 
                    fontWeight: "600", 
                    marginBottom: "20px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    color: "#1a1a1a"
                  }}>
                    <Users size={20} color="#0a66c2" />
                    <span>Grupe ({groups.length})</span>
                  </h3>
                  <div className="chat-grid" style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
                    gap: "16px",
                    width: "100%"
                  }}>
                    {groups.map((group) => {
                      const unread = unreadCounts.groups[group._id] || 0;
                      return (
                        <Link
                          key={group._id}
                          href={localeLink(`/chat?groupId=${group._id}`, locale)}
                          onClick={() => setShowSidebar(false)}
                          className="chat-list-item"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "20px",
                            borderRadius: "12px",
                            textDecoration: "none",
                            color: "inherit",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f0f7ff";
                            e.currentTarget.style.borderColor = "#0a66c2";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.15)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            className="chat-item-avatar chat-item-avatar-group"
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "20px",
                              fontWeight: "700",
                              flexShrink: 0,
                              boxShadow: "0 2px 8px rgba(10, 102, 194, 0.3)",
                            }}
                          >
                            {group.name && group.name.length > 0 ? group.name[0].toUpperCase() : "G"}
                          </div>
                          <div className="chat-item-text" style={{ flex: 1, minWidth: 0 }}>
                            <div className="chat-item-name" style={{ fontSize: "17px", fontWeight: "600", color: "#1a1a1a", marginBottom: "6px", lineHeight: "1.3" }}>
                              {group.name || "Group"}
                            </div>
                            {group.description && (
                              <div className="chat-item-description" style={{ fontSize: "14px", color: "#666", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.4" }}>
                                {group.description}
                              </div>
                            )}
                            <div className="chat-item-meta" style={{ fontSize: "13px", color: "#999", marginTop: "6px", lineHeight: "1.4" }}>
                              {group.members?.length || 0} {(!group.members || group.members.length === 1) ? "član" : "članova"}
                            </div>
                          </div>
                          {unread > 0 && (
                            <span
                              className="chat-item-badge"
                              style={{
                                background: "#0a66c2",
                                color: "white",
                                borderRadius: "50%",
                                padding: "4px 8px",
                                fontSize: "12px",
                                fontWeight: "700",
                                minWidth: "24px",
                                height: "24px",
                                textAlign: "center",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 4px rgba(10, 102, 194, 0.3)",
                              }}
                            >
                              {unread}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {connections.length === 0 && groups.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: "14px",
                    textAlign: "center",
                    padding: "60px 20px",
                  }}
                >
                  <MessageSquare size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <p style={{ marginBottom: "8px" }}>Nemate još chatova.</p>
                  <p style={{ fontSize: "13px", color: "#999" }}>
                    Pošaljite zahtjev za konekciju ili kreirajte grupu da biste započeli razgovor.
                  </p>
                </div>
              )}
                </>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Create New Group</h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    minHeight: "80px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                  Members
                </label>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "8px" }}>
                  {availableUsers.map((user) => (
                    <label
                      key={user._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, user._id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter((id) => id !== user._id));
                          }
                        }}
                      />
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: user.profilePicture
                            ? `url(${user.profilePicture}) center/cover`
                            : "#e4e4e4",
                        }}
                      />
                      <span style={{ fontSize: "14px" }}>{user.displayName || user.username}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={createGroup}
                style={{
                  padding: "10px 20px",
                  background: "#0a66c2",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#004182";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0a66c2";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGallery && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowGallery(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                <ImageIcon size={20} />
                Gallery ({chatImages.length})
              </h2>
              <button
                onClick={() => setShowGallery(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {chatImages.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {chatImages.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "8px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: "1px solid #e0e0e0",
                      transition: "transform 0.2s ease",
                    }}
                    onClick={() => window.open(img, "_blank")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <img
                      src={img}
                      alt={`Gallery image ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                No images in this chat yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && currentGroup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowGroupSettings(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Group Settings</h2>
              <button
                onClick={() => setShowGroupSettings(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Group Info */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Group Information</h3>
              <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "8px" }}>
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <strong>Name:</strong> {currentGroup.name || "Group"}
                </p>
                {currentGroup.description && (
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    <strong>Description:</strong> {currentGroup.description}
                  </p>
                )}
                <p style={{ margin: "4px 0", fontSize: "14px" }}>
                  <strong>Members:</strong> {currentGroup.members?.length || 0}
                </p>
              </div>
            </div>

            {/* Members List */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} />
                Members ({currentGroup.members?.length || 0})
              </h3>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "8px" }}>
                {(currentGroup.members || []).map((member: any) => {
                  if (!member) return null;
                  const isCreator = currentGroup.createdBy === member._id;
                  const canRemove = currentUserId === currentGroup.createdBy && member._id !== currentUserId && currentGroup.createdBy;
                  
                  return (
                    <div
                      key={member._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px",
                        marginBottom: "4px",
                        background: "#f9f9f9",
                        borderRadius: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: member.profilePicture
                              ? `url(${member.profilePicture}) center/cover`
                              : "#e4e4e4",
                          }}
                        />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "500" }}>
                            {member.displayName || member.username}
                            {isCreator && (
                              <span style={{ fontSize: "12px", color: "#0a66c2", marginLeft: "4px" }}>
                                (Creator)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {canRemove && (
                        <button
                          onClick={() => removeMemberFromGroup(member._id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "4px",
                            color: "#dc3545",
                          }}
                          title="Remove member"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Member */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} />
                Add New Member
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Select a user...</option>
                  {availableUsers
                    .filter((user) => !(currentGroup.members || []).some((m: any) => m?._id === user._id))
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.displayName || user.username}
                      </option>
                    ))}
                </select>
                <button
                  onClick={addMemberToGroup}
                  disabled={!newMemberId}
                  style={{
                    padding: "8px 16px",
                    background: newMemberId ? "#0a66c2" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: newMemberId ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (newMemberId) {
                      e.currentTarget.style.background = "#004182";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMemberId) {
                      e.currentTarget.style.background = "#0a66c2";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ImageIcon size={18} />
                Gallery ({groupImages.length})
              </h3>
              {groupImages.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    padding: "8px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                  }}
                >
                  {groupImages.map((img, index) => (
                    <div
                      key={index}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "1px solid #e0e0e0",
                      }}
                      onClick={() => window.open(img, "_blank")}
                    >
                      <img
                        src={img}
                        alt={`Gallery image ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                  No images in this group yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && forwardingTo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowForwardModal(false);
            setForwardingTo(null);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Forward Message</h2>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardingTo(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Message preview */}
            <div
              style={{
                background: "#f5f5f5",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                {forwardingTo.sender?.displayName || forwardingTo.sender?.username || "User"}
              </div>
              <div style={{ color: "#666" }}>{forwardingTo.message || (forwardingTo.fileUrl ? "[File]" : "")}</div>
            </div>

            {/* Select recipient */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Forward to:
              </label>
              <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                {connections.map((conn) => (
                  <button
                    key={conn._id}
                    onClick={async () => {
                      // Forward message
                      const forwardText = `Forwarded from ${forwardingTo.sender?.displayName || forwardingTo.sender?.username || "User"}\n${forwardingTo.message || (forwardingTo.fileUrl ? "[File]" : "")}`;
                      
                      try {
                        const formData = new FormData();
                        formData.append("receiverId", conn.user._id);
                        formData.append("message", forwardText);
                        if (forwardingTo.fileUrl) {
                          formData.append("message", `${forwardText}\n\nFile: ${forwardingTo.fileUrl}`);
                        }

                        const res = await fetch("/api/messages", {
                          method: "POST",
                          body: formData,
                        });

                        if (res.ok) {
                          setShowForwardModal(false);
                          setForwardingTo(null);
                          router.push(localeLink(`/chat?userId=${conn.user._id}`, locale));
                        } else {
                          alert("Failed to forward message");
                        }
                      } catch (error) {
                        console.error("Error forwarding message:", error);
                        alert("Error forwarding message");
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: conn.user.profilePicture
                          ? `url(${conn.user.profilePicture}) center/cover`
                          : "#e4e4e4",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>
                        {conn.user.displayName || conn.user.username}
                      </div>
                    </div>
                  </button>
                ))}
                {groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={async () => {
                      // Forward message to group
                      const forwardText = `Forwarded from ${forwardingTo.sender?.displayName || forwardingTo.sender?.username || "User"}\n${forwardingTo.message || (forwardingTo.fileUrl ? "[File]" : "")}`;
                      
                      try {
                        const formData = new FormData();
                        formData.append("groupId", group._id);
                        formData.append("message", forwardText);
                        if (forwardingTo.fileUrl) {
                          formData.append("message", `${forwardText}\n\nFile: ${forwardingTo.fileUrl}`);
                        }

                        const res = await fetch("/api/messages", {
                          method: "POST",
                          body: formData,
                        });

                        if (res.ok) {
                          setShowForwardModal(false);
                          setForwardingTo(null);
                          router.push(localeLink(`/chat?groupId=${group._id}`, locale));
                        } else {
                          alert("Failed to forward message");
                        }
                      } catch (error) {
                        console.error("Error forwarding message:", error);
                        alert("Error forwarding message");
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#0a66c2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {group.name && group.name.length > 0 ? group.name[0].toUpperCase() : "G"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>{group.name || "Group"}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ChatPage() {
  // Next.js requires useSearchParams() to be used under a Suspense boundary
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
