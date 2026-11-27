
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, Film, Music, BookOpen, Mic, Gamepad2,
  Megaphone, UserRound, AudioLines, Clapperboard, Laugh,
  Send, Paperclip, ArrowLeft, Trash2, ChevronRight,
  FolderOpen, Search, Headphones, Settings, LogOut,
  Link as LinkIcon, ExternalLink, House, Compass,
  CircleUserRound, Video, X
} from "lucide-react";

import { supabase } from "./lib/supabase";
import ResearchHub from "./ResearchHub";
import Home from "./Home";
import StudioWorkspace from "./studios/StudioWorkspace";
import MessageContent from "./components/MessageContent";

const STORAGE_KEY = "nyx-conversations-v1";

const STUDIOS = [
  { id: "film", name: "Film & Video", icon: Film, color: "#a78bfa", description: "Create films, scenes, videos and visual stories." },
  { id: "music", name: "Music", icon: Music, color: "#f472b6", description: "Create original songs, beats and sounds." },
  { id: "books", name: "Books & Writing", icon: BookOpen, color: "#fbbf24", description: "Write, edit and develop books and stories." },
  { id: "voice", name: "Storytelling & Voice", icon: Mic, color: "#22d3ee", description: "Create narration and distinctive character voices." },
  { id: "games", name: "Game Creation", icon: Gamepad2, color: "#4ade80", description: "Develop game concepts, characters and worlds." },
  { id: "marketing", name: "Marketing", icon: Megaphone, color: "#fb923c", description: "Build campaigns, brands and promotional content." },
  { id: "characters", name: "Character Studio", icon: UserRound, color: "#c4b5fd", description: "Design and develop consistent characters." },
  { id: "audio", name: "Audio Production", icon: AudioLines, color: "#2dd4bf", description: "Create sound effects and audio experiences." },
  { id: "animation", name: "Animation", icon: Clapperboard, color: "#e879f9", description: "Bring characters and ideas to life." },
  { id: "comedy", name: "Comedy & Entertainment", icon: Laugh, color: "#facc15", description: "Create comedy, sketches and entertainment." },
  { id: "audiobooks", name: "Audiobook Production", icon: Headphones, color: "#60a5fa", description: "Turn written books into chapter-based audiobooks." },
  { id: "research", name: "Research & Discovery", icon: Search, color: "#34d399", description: "Explore ideas, references, styles and creative direction." }
];

const NAVIGATION = [
  { name: "Home", page: "home", icon: House },
  { name: "Reels", page: "reels", icon: Film },
  { name: "Studios", page: "studio", icon: Clapperboard },
  { name: "Projects", page: "projects", icon: FolderOpen },
  { name: "Research", page: "research", icon: Compass },
  { name: "Account", page: "account", icon: CircleUserRound }
];

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const findStudio = (id) =>
  STUDIOS.find((studio) => studio.id === id);

const loadConversations = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "";

const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

const getTitle = (text) => {
  const clean = text.trim();
  return clean
    ? clean.length > 35 ? `${clean.slice(0, 35)}...` : clean
    : "New conversation";
};

function StudioCard({ studio, onClick }) {
  const Icon = studio.icon;

  return (
    <button className="nyx-studio-card" onClick={onClick} type="button">
      <span className="nyx-studio-icon" style={{ color: studio.color }}>
        <Icon size={25} />
      </span>
      <span className="nyx-studio-name">{studio.name}</span>
      <span className="nyx-studio-description">{studio.description}</span>
      <span className="nyx-studio-open">
        Explore studio <ChevronRight size={15} />
      </span>
    </button>
  );
}

function MessageBubble({ item, searchTerm = "" }) {
  const isUser = item.role === "user";

  const highlightText = (text) => {
    if (!searchTerm || !text) return text;

    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark>{text.slice(index, index + searchTerm.length)}</mark>
        {text.slice(index + searchTerm.length)}
      </>
    );
  };

  return (
    <div className={`nyx-message-row ${isUser ? "nyx-message-user" : "nyx-message-assistant"}`}>
      {!isUser && (
        <div className="nyx-message-avatar">
          <Sparkles size={15} />
        </div>
      )}

      <div className="nyx-message-bubble">
        {item.text && (searchTerm ? <p>{highlightText(item.text)}</p> : <MessageContent content={item.text} />)}

        {item.attachments?.map((file, index) => (
          <div className="nyx-message-attachment" key={index}>
            <Paperclip size={14} />
            <span>{file.name}</span>
          </div>
        ))}

        {item.references?.map((reference, index) => (
          <a key={index} href={reference.url} target="_blank" rel="noreferrer">
            <LinkIcon size={13} />
            {reference.label || reference.url}
            <ExternalLink size={12} />
          </a>
        ))}

        {item.audio && (
          <div className="nyx-audio-message">
            <Mic size={16} />
            <audio controls src={item.audio}>
              Audio playback is not supported.
            </audio>
          </div>
        )}

        <small>{formatTime(item.createdAt)}</small>
      </div>
    </div>
  );
}

function Composer({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const resizeTextarea = (element) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`;
    element.style.overflowY = element.scrollHeight > 132 ? "auto" : "hidden";
  };

  const submitMessage = (event) => {
    event.preventDefault();
    const clean = message.trim();

    if (!clean || disabled) return;

    onSend(clean);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "25px";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  return (
    <form className="nyx-composer" onSubmit={submitMessage}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          resizeTextarea(event.target);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Tell NYX what you're imagining..."
        rows={1}
        disabled={disabled}
        aria-label="Type your message to NYX"
      />

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </form>
  );
}

function BottomNavigation({ page, onNavigate }) {
  return (
    <nav className="nyx-bottom-nav">
      {NAVIGATION.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.page}
            type="button"
            className={`nyx-nav-item ${page === item.page ? "active" : ""}`}
            onClick={() => onNavigate(item.page)}
          >
            <Icon size={19} />
            <span>{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeStudio, setActiveStudio] = useState(null);
  const [workspaceStudioId, setWorkspaceStudioId] = useState(null);

  const [page, setPage] = useState("home");
  const [researchReturnPage, setResearchReturnPage] = useState("home");

  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setUser(data.session?.user || null);
      } catch (error) {
        console.error("NYX session error:", error);
      }
    };

    loadSession();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setUser(session?.user || null);
      });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const currentConversation = conversations.find(
    (conversation) => conversation.id === activeConversation
  );

  const visibleMessages = useMemo(() => {
    const messages = currentConversation?.messages || [];

    if (!chatSearch.trim()) return messages;

    return messages.filter((item) =>
      (item.text || "").toLowerCase().includes(chatSearch.toLowerCase())
    );
  }, [currentConversation, chatSearch]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, [visibleMessages, generating, page, activeConversation]);

  const startConversation = (studio) => {
    if (!studio) return;

    const conversation = {
      id: makeId(),
      studioId: studio.id,
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setConversations((previous) => [conversation, ...previous]);
    setActiveStudio(studio);
    setActiveConversation(conversation.id);
    setChatSearch("");
    setChatSearchOpen(false);
    setPage("chat");
  };

  const openStudioWorkspace = (studio) => {
    if (!studio) return;

    setWorkspaceStudioId(studio.id);
    setActiveStudio(studio);
    setPage("studio-workspace");
  };

  const openConversation = (conversation) => {
    const studio = findStudio(conversation.studioId) || STUDIOS[0];

    setActiveStudio(studio);
    setActiveConversation(conversation.id);
    setChatSearch("");
    setChatSearchOpen(false);
    setPage("chat");
  };

  const goHome = () => {
    setPage("home");
    setChatSearch("");
    setChatSearchOpen(false);
  };

  const openResearch = () => {
    if (page === "chat" && activeStudio) {
      setResearchReturnPage("chat");
    } else if (page === "studio-workspace") {
      setResearchReturnPage("studio-workspace");
    } else {
      setResearchReturnPage("home");
      setActiveStudio(findStudio("research"));
    }

    setPage("research");
  };

  const navigate = (nextPage) => {
    if (nextPage === "research") {
      openResearch();
      return;
    }

    setPage(nextPage);
  };

  const addAssistantMessage = (conversationId, text) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: makeId(),
                  role: "assistant",
                  text,
                  createdAt: new Date().toISOString()
                }
              ],
              updatedAt: new Date().toISOString()
            }
          : conversation
      )
    );
  };

  const getServerError = async (error) => {
    let message = error?.message || "Unknown server error.";

    try {
      const response = error?.context;

      if (response && typeof response.clone === "function") {
        const body = await response.clone().json();
        message = body?.error || body?.message || message;

        if (response.status) {
          message = `Server error (${response.status}): ${message}`;
        }
      }
    } catch {
      // Keep the original error.
    }

    return message;
  };

  const sendMessage = async (message) => {
    if (!activeStudio || generating) return;

    let conversationId = activeConversation;

    if (!conversationId) {
      const newConversation = {
        id: makeId(),
        studioId: activeStudio.id,
        title: getTitle(message),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      conversationId = newConversation.id;
      setActiveConversation(conversationId);
      setConversations((previous) => [newConversation, ...previous]);
    }

    const existingConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );

    const previousMessages = existingConversation?.messages || [];

    const userMessage = {
      id: makeId(),
      role: "user",
      text: message,
      createdAt: new Date().toISOString()
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: conversation.messages.length === 0
                ? getTitle(message)
                : conversation.title,
              messages: [...conversation.messages, userMessage],
              updatedAt: new Date().toISOString()
            }
          : conversation
      )
    );

    setGenerating(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Reuse the creator's selected shared project when starting a new
      // conversation. StudioWorkspace stores this selection across studios.
      // Existing conversations keep their original project association.
      let selectedSharedProjectId = null;
      try {
        selectedSharedProjectId = localStorage.getItem("nyx-active-project-id") || null;
      } catch {
        selectedSharedProjectId = null;
      }

      let cloudProjectId =
        existingConversation?.projectId || selectedSharedProjectId;
      let cloudConversationId = existingConversation?.cloudConversationId || null;

      if (cloudProjectId) {
        const { data: selectedProject, error: selectedProjectError } = await supabase
          .from("nyx_projects")
          .select("id")
          .eq("id", cloudProjectId)
          .eq("user_id", sessionData.session.user.id)
          .maybeSingle();

        if (selectedProjectError) throw selectedProjectError;
        if (!selectedProject) {
          throw new Error(
            "Your selected shared project could not be found. Open a studio and select the project again."
          );
        }
      } else {
        // Keep the existing standalone-project behaviour when the creator
        // has not selected a shared project.
        const { data: project, error: projectError } = await supabase
          .from("nyx_projects")
          .insert({
            user_id: sessionData.session.user.id,
            title: getTitle(message),
            lead_studio_id: activeStudio.id
          })
          .select("id")
          .single();

        if (projectError) throw projectError;
        cloudProjectId = project.id;
      }

      if (existingConversation?.projectId !== cloudProjectId) {
        setConversations((previous) => previous.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, projectId: cloudProjectId }
            : conversation
        ));
      }

      if (!cloudConversationId) {
        const { data: cloudConversation, error: conversationError } = await supabase
          .from("nyx_conversations")
          .insert({
            user_id: sessionData.session.user.id,
            project_id: cloudProjectId,
            studio_id: activeStudio.id,
            title: getTitle(message)
          })
          .select("id")
          .single();

        if (conversationError) throw conversationError;
        cloudConversationId = cloudConversation.id;

        setConversations((previous) => previous.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, cloudConversationId }
            : conversation
        ));
      }

      const { error: userMessageError } = await supabase
        .from("nyx_messages")
        .insert({
          conversation_id: cloudConversationId,
          user_id: sessionData.session.user.id,
          role: "user",
          content: message
        });

      if (userMessageError) throw userMessageError;

      const history = previousMessages
        .filter((item) =>
          ["user", "assistant"].includes(item.role) &&
          typeof item.text === "string" &&
          item.text.trim()
        )
        .slice(-12)
        .map((item) => ({
          role: item.role,
          content: item.text
        }));

      const { data, error } = await supabase.functions.invoke(
        "nyx-core",
        {
          body: {
            message,
            studioId: activeStudio.id,
            studioName: activeStudio.name,
            projectId: cloudProjectId,
            history
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (error) throw new Error(await getServerError(error));

      const result = data?.data && typeof data.data === "object"
        ? data.data
        : data;

      if (typeof result?.response !== "string" || !result.response.trim()) {
        throw new Error(data?.error || "NYX did not return a response.");
      }

      const { error: assistantMessageError } = await supabase
        .from("nyx_messages")
        .insert({
          conversation_id: cloudConversationId,
          user_id: sessionData.session.user.id,
          role: "assistant",
          content: result.response,
          metadata: {
            provider: result.provider || null,
            model: result.model || null,
            productionStatus: result.productionStatus || null
          }
        });

      if (assistantMessageError) throw assistantMessageError;
      addAssistantMessage(conversationId, result.response);
    } catch (error) {
      console.error("NYX CORE error:", error);

      addAssistantMessage(
        conversationId,
        `I couldn't complete that request. ${error.message || "Please try again."}`
      );
    } finally {
      setGenerating(false);
    }
  };

  const attachReferences = (references) => {
    if (!activeStudio) return;

    let conversationId = activeConversation;

    if (!conversationId) {
      const newConversation = {
        id: makeId(),
        studioId: activeStudio.id,
        title: "Research references",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      conversationId = newConversation.id;
      setActiveConversation(conversationId);
      setConversations((previous) => [newConversation, ...previous]);
    }

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: makeId(),
                  role: "user",
                  text: "Research references added to this project.",
                  references,
                  createdAt: new Date().toISOString()
                }
              ],
              updatedAt: new Date().toISOString()
            }
          : conversation
      )
    );

    setPage("chat");
  };

  const deleteConversation = (id) => {
    setConversations((previous) =>
      previous.filter((conversation) => conversation.id !== id)
    );

    if (activeConversation === id) {
      setActiveConversation(null);
      setActiveStudio(null);
      setPage("home");
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setAuthMessage("");

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        setAuthMessage(
          "Account created. Check your email if confirmation is required."
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setUser(data.user || null);
        setAuthMessage("Welcome back.");
        setPage("home");
      }
    } catch (error) {
      setAuthMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setPage("home");
    } catch (error) {
      setAuthMessage(error.message || "Could not sign out.");
    }
  };

  const filteredStudios = STUDIOS.filter((studio) =>
    `${studio.name} ${studio.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (page === "auth") {
    return (
      <main className="nyx-app">
        <section className="nyx-auth-page">
          <button
            className="nyx-back-button"
            onClick={() => setPage("account")}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="nyx-auth-card">
            <Sparkles size={35} />
            <h1>{authMode === "signup" ? "Join NYX" : "Welcome back"}</h1>
            <p>Your creative universe starts here.</p>

            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : authMode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            {authMessage && <p>{authMessage}</p>}

            <button
              className="nyx-text-button"
              onClick={() => {
                setAuthMode(authMode === "signup" ? "signin" : "signup");
                setAuthMessage("");
              }}
            >
              {authMode === "signup"
                ? "Already have an account? Sign in"
                : "New to NYX? Create an account"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (page === "studio-workspace" && workspaceStudioId) {
    return (
      <main className="nyx-app">
        <StudioWorkspace
          studioId={workspaceStudioId}
          onBack={() => setPage("studio")}
        />

        <BottomNavigation
          page="studio"
          onNavigate={navigate}
        />
      </main>
    );
  }

  if (page === "chat" && activeStudio) {
    const StudioIcon = activeStudio.icon;
    const hasMessages = (currentConversation?.messages || []).length > 0;

    return (
      <main className="nyx-app nyx-chat-screen">
        <header className="nyx-chat-header">
          <button
            className="nyx-chat-back"
            onClick={goHome}
            aria-label="Back to homepage"
            title="Back to homepage"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="nyx-chat-heading">
            <div
              className="nyx-chat-studio-icon"
              style={{ color: activeStudio.color }}
            >
              <StudioIcon size={20} />
            </div>

            <div>
              <strong>{activeStudio.name}</strong>
              <small>
                <span className="nyx-online-dot" />
                NYX creative assistant
              </small>
            </div>
          </div>

          <button
            className={`nyx-chat-search-button ${chatSearchOpen ? "selected" : ""}`}
            onClick={() => {
              setChatSearchOpen((open) => !open);
              setChatSearch("");
            }}
            aria-label="Search this conversation"
            title="Search conversation"
          >
            {chatSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </header>

        {chatSearchOpen && (
          <div className="nyx-chat-search-bar">
            <Search size={17} />

            <input
              autoFocus
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              placeholder="Search messages in this chat..."
            />

            {chatSearch && (
              <button
                onClick={() => setChatSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <section className="nyx-chat-main">
          <div
            ref={messagesContainerRef}
            className={`nyx-messages ${!hasMessages ? "nyx-messages-empty" : ""}`}
          >
            {!hasMessages ? (
              <div className="nyx-chat-welcome">
                <div className="nyx-welcome-orb">
                  <Sparkles size={30} />
                </div>

                <span className="nyx-welcome-eyebrow">
                  YOUR CREATIVE SPACE
                </span>

                <h1>
                  Let's make something <span>beautiful.</span>
                </h1>

                <p>
                  Tell me what's on your mind. We can explore your idea
                  and shape it together.
                </p>

                <div className="nyx-prompt-list">
                  {[
                    "Help me develop a creative idea",
                    "Let's plan a new project",
                    "I have a concept. Help me bring it to life."
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={generating}
                    >
                      <Sparkles size={15} />
                      <span>{prompt}</span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            ) : visibleMessages.length ? (
              visibleMessages.map((item) => (
                <MessageBubble
                  item={item}
                  key={item.id}
                  searchTerm={chatSearch}
                />
              ))
            ) : (
              <div className="nyx-no-search-results">
                <Search size={25} />
                <p>No matching messages found.</p>
              </div>
            )}

            {generating && (
              <div className="nyx-message-row nyx-message-assistant">
                <div className="nyx-message-avatar">
                  <Sparkles size={15} />
                </div>

                <div className="nyx-message-bubble nyx-typing-bubble">
                  <span className="nyx-typing-dots">
                    <i /><i /><i />
                  </span>
                  <small>NYX is thinking</small>
                </div>
              </div>
            )}
          </div>

          <div className="nyx-composer-area">
            <Composer onSend={sendMessage} disabled={generating} />
          </div>
        </section>
      </main>
    );
  }

  if (page === "research") {
    return (
      <main className="nyx-app">
        <header className="nyx-topbar">
          <button className="nyx-brand" onClick={goHome}>
            <Sparkles size={23} />
            <span>NYX</span>
          </button>

          <button
            className="nyx-icon-button"
            onClick={goHome}
            aria-label="Back home"
          >
            <ArrowLeft size={19} />
          </button>
        </header>

        <ResearchHub
          studio={activeStudio || findStudio("research")}
          onBack={() => setPage(researchReturnPage)}
          onAttach={attachReferences}
        />

        <BottomNavigation page="research" onNavigate={navigate} />
      </main>
    );
  }

  return (
    <main className="nyx-app">
      <header className="nyx-topbar">
        <button className="nyx-brand" onClick={goHome}>
          <Sparkles size={23} />
          <span>NYX</span>
        </button>

        <button
          className="nyx-account-button"
          onClick={() => setPage("account")}
        >
          <UserRound size={18} />
          {user ? "Account" : "Sign in"}
        </button>
      </header>

      {page === "home" ? (
        <Home
          onNavigate={navigate}
          onNewChat={() => startConversation(STUDIOS[0])}
        />
      ) : page === "studio" ? (
        <section className="nyx-page-content">
          <h1>Creative Studios</h1>
          <p>Choose a studio to bring your ideas to life.</p>

          <input
            className="nyx-search-input"
            type="search"
            placeholder="Find a studio..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="nyx-studio-grid">
            {filteredStudios.map((studio) => (
              <StudioCard
                key={studio.id}
                studio={studio}
                onClick={() => openStudioWorkspace(studio)}
              />
            ))}
          </div>
        </section>
      ) : page === "reels" ? (
        <section className="nyx-page-content">
          <div className="nyx-page-title">
            <Video size={25} />
            <h1>NYX Reels</h1>
          </div>

          <p>Discover creative videos, new ideas and inspiration.</p>

          <div className="nyx-empty-chat">
            <Film size={38} />
            <h3>Your creative feed starts here</h3>
            <p>
              The scrollable Reels feed and video creation features
              will be built in the next stage.
            </p>
          </div>
        </section>
      ) : page === "projects" ? (
        <section className="nyx-page-content">
          <h1>Your Projects</h1>
          <p>Continue working on your previous creations.</p>

          {conversations.length === 0 ? (
            <div className="nyx-empty-chat">
              <FolderOpen size={35} />
              <h3>No projects yet</h3>
              <p>Start a conversation in one of your studios.</p>
            </div>
          ) : conversations.map((conversation) => {
            const studio = findStudio(conversation.studioId);

            return (
              <div className="nyx-project-item" key={conversation.id}>
                <button onClick={() => openConversation(conversation)}>
                  <FolderOpen size={19} />

                  <span>
                    <strong>{conversation.title}</strong>
                    <small>
                      {studio?.name || "Studio"} · {formatDate(conversation.updatedAt)}
                    </small>
                  </span>
                </button>

                <button
                  onClick={() => deleteConversation(conversation.id)}
                  title="Delete project"
                  aria-label="Delete project"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </section>
      ) : page === "account" ? (
        <section className="nyx-page-content">
          <h1>Your Account</h1>
          <p>Manage your NYX account and preferences.</p>

          <div className="nyx-account-card">
            <div className="nyx-account-avatar">
              <UserRound size={28} />
            </div>

            <div>
              <strong>{user ? user.email : "Guest account"}</strong>
              <p>
                {user
                  ? "You are signed in to NYX."
                  : "Sign in to access your account."}
              </p>
            </div>
          </div>

          {!user && (
            <>
              <button
                className="nyx-action-button"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthMessage("");
                  setPage("auth");
                }}
              >
                Sign in
              </button>

              <button
                className="nyx-action-button"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthMessage("");
                  setPage("auth");
                }}
              >
                Create an account
              </button>
            </>
          )}

          <button
            className="nyx-action-button"
            onClick={() => setPage("settings")}
          >
            <Settings size={18} /> Settings
          </button>

          {user && (
            <button className="nyx-action-button" onClick={handleSignOut}>
              <LogOut size={18} /> Sign out
            </button>
          )}
        </section>
      ) : page === "settings" ? (
        <section className="nyx-page-content">
          <button
            className="nyx-back-button"
            onClick={() => setPage("account")}
          >
            <ArrowLeft size={18} /> Account
          </button>

          <h1>Settings</h1>
          <p>Manage your NYX preferences.</p>

          <div className="nyx-settings-item">
            <Sparkles size={19} />
            <span>
              <strong>Appearance</strong>
              <small>NYX uses its dark creative theme.</small>
            </span>
          </div>

          <div className="nyx-settings-item">
            <FolderOpen size={19} />
            <span>
              <strong>Conversation storage</strong>
              <small>
                Conversations are currently saved on this device.
              </small>
            </span>
          </div>

          <div className="nyx-settings-item">
            <Compass size={19} />
            <span>
              <strong>Research and discovery</strong>
              <small>
                Research tools are available through the Research section.
              </small>
            </span>
          </div>

          {user && (
            <button className="nyx-action-button" onClick={handleSignOut}>
              <LogOut size={18} /> Sign out
            </button>
          )}
        </section>
      ) : (
        <Home
          onNavigate={navigate}
          onNewChat={() => startConversation(STUDIOS[0])}
        />
      )}

      <BottomNavigation page={page} onNavigate={navigate} />
    </main>
  );
}
