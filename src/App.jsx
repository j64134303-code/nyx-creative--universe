import React, { useEffect, useRef, useState } from "react";
import {
  Home, Plus, Film, Music, BookOpen, Mic, Gamepad2,
  Megaphone, UserRound, AudioLines, Clapperboard, Laugh,
  Upload, Bell, MessageCircle, Send, Paperclip, ArrowLeft,
  X, Trash2, Clock, Sparkles, ChevronRight, FolderOpen,
  Search, Headphones, Video, CircleStop, Camera, Layers,
  Star, Compass, Settings, LogOut, Pencil, Check,
  Link as LinkIcon, ExternalLink
} from "lucide-react";

import { supabase } from "./lib/supabase";
import ResearchHub from "./ResearchHub";
import Home from "./Home";
const STORAGE_KEY = "nyx-conversations-v1";

const STUDIOS = [
  {
    id: "film",
    name: "Film & Video",
    icon: Film,
    color: "#8b5cf6",
    description: "Create films, scenes, videos and visual stories."
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    color: "#ec4899",
    description: "Create original songs, beats and sounds."
  },
  {
    id: "books",
    name: "Books & Writing",
    icon: BookOpen,
    color: "#f59e0b",
    description: "Write, edit and develop books and stories."
  },
  {
    id: "voice",
    name: "Storytelling & Voice",
    icon: Mic,
    color: "#06b6d4",
    description: "Create narration and distinctive character voices."
  },
  {
    id: "games",
    name: "Game Creation",
    icon: Gamepad2,
    color: "#22c55e",
    description: "Develop game concepts, characters and worlds."
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: Megaphone,
    color: "#f97316",
    description: "Build campaigns, brands and promotional content."
  },
  {
    id: "characters",
    name: "Character Studio",
    icon: UserRound,
    color: "#a78bfa",
    description: "Design and develop consistent characters."
  },
  {
    id: "audio",
    name: "Audio Production",
    icon: AudioLines,
    color: "#14b8a6",
    description: "Create sound effects and audio experiences."
  },
  {
    id: "animation",
    name: "Animation",
    icon: Clapperboard,
    color: "#e879f9",
    description: "Bring characters and ideas to life."
  },
  {
    id: "comedy",
    name: "Comedy & Entertainment",
    icon: Laugh,
    color: "#eab308",
    description: "Create comedy, sketches and entertainment."
  },
  {
    id: "audiobooks",
    name: "Audiobook Production",
    icon: Headphones,
    color: "#60a5fa",
    description: "Turn written books into chapter-based audiobooks."
  },
  {
    id: "research",
    name: "Research & Discovery",
    icon: Search,
    color: "#34d399",
    description: "Explore ideas, references, styles and creative direction."
  }
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

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

const getTitle = (text) => {
  const clean = text.trim();
  if (!clean) return "New conversation";
  return clean.length > 35 ? `${clean.slice(0, 35)}...` : clean;
};

function StudioCard({ studio, onClick }) {
  const Icon = studio.icon;

  return (
    <button
      className="nyx-studio-card"
      onClick={onClick}
      type="button"
    >
      <span
        className="nyx-studio-icon"
        style={{ color: studio.color }}
      >
        <Icon size={25} />
      </span>

      <span className="nyx-studio-name">
        {studio.name}
      </span>

      <span className="nyx-studio-description">
        {studio.description}
      </span>

      <span className="nyx-studio-open">
        Explore studio <ChevronRight size={15} />
      </span>
    </button>
  );
}

function MessageBubble({ item }) {
  const isUser = item.role === "user";

  return (
    <div
      className={`nyx-message-row ${
        isUser ? "nyx-message-user" : "nyx-message-assistant"
      }`}
    >
      <div className="nyx-message-bubble">
        {item.text && (
          <p>{item.text}</p>
        )}

        {item.attachments?.map((file, index) => (
          <div className="nyx-message-attachment" key={index}>
            <Paperclip size={14} />
            <span>{file.name}</span>
          </div>
        ))}

        {item.references?.map((reference, index) => (
          <a
            key={index}
            href={reference.url}
            target="_blank"
            rel="noreferrer"
          >
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

        <small>{formatDate(item.createdAt)}</small>
      </div>
    </div>
  );
}

function Composer({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");

  const submitMessage = (event) => {
    event.preventDefault();

    const clean = message.trim();
    if (!clean || disabled) return;

    onSend(clean);
    setMessage("");
  };

  return (
    <form
      className="nyx-composer"
      onSubmit={submitMessage}
    >
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell NYX what you want to create..."
        rows={2}
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        aria-label="Send message"
      >
        <Send size={19} />
      </button>
    </form>
  );}

export default function App() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeStudio, setActiveStudio] = useState(null);
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    let subscription;

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);

      const result = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );

      subscription = result.data.subscription;
    };

    loadUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const startConversation = (studio) => {
    const conversation = {
      id: makeId(),
      studioId: studio.id,
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setConversations((previous) => [
      conversation,
      ...previous
    ]);

    setActiveStudio(studio);
    setActiveConversation(conversation.id);
    setPage("chat");
  };

  const openConversation = (conversation) => {
    const studio = findStudio(conversation.studioId);

    setActiveStudio(studio);
    setActiveConversation(conversation.id);
    setPage("chat");
  };

  const sendMessage = (message) => {
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

      setConversations((previous) => [
        newConversation,
        ...previous
      ]);
    }

    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        const firstMessage = conversation.messages.length === 0;

        return {
          ...conversation,
          title: firstMessage
            ? getTitle(message)
            : conversation.title,
          messages: [
            ...conversation.messages,
            {
              id: makeId(),
              role: "user",
              text: message,
              createdAt: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const attachReferences = (references) => {
    let conversationId = activeConversation;

    if (!conversationId && activeStudio) {
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

      setConversations((previous) => [
        newConversation,
        ...previous
      ]);
    }

    if (!conversationId) return;

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
        const { error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        setAuthMessage(
          "Account created. Check your email if confirmation is required."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setAuthMessage("Welcome back.");
      }
    } catch (error) {
      setAuthMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("home");
  };

  const currentConversation = conversations.find(
    (conversation) => conversation.id === activeConversation
  );

  const filteredStudios = STUDIOS.filter((studio) =>
    `${studio.name} ${studio.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const studioConversations = conversations.filter(
    (conversation) => conversation.studioId === activeStudio?.id
  );

  if (page === "auth") {
    return (
      <main className="nyx-app">
        <section className="nyx-auth-page">
          <button
            className="nyx-back-button"
            onClick={() => setPage("home")}
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
                setAuthMode(
                  authMode === "signup" ? "signin" : "signup"
                );
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

  if (page === "research" && activeStudio) {
    return (
      <main className="nyx-app">
        <ResearchHub
          studio={activeStudio}
          onBack={() => setPage("chat")}
          onAttach={attachReferences}
        />
      </main>
    );
  }

  if (page === "chat" && activeStudio) {
    const StudioIcon = activeStudio.icon;

    return (
      <main className="nyx-app">
        <header className="nyx-topbar">
          <button
            onClick={() => setPage("home")}
            className="nyx-back-button"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="nyx-topbar-title">
            <StudioIcon size={22} />
            <span>{activeStudio.name}</span>
          </div>

          <button
            onClick={() => setPage("research")}
            className="nyx-icon-button"
            title="Research and discovery"
          >
            <Search size={20} />
          </button>
        </header>

        <div className="nyx-chat-layout">
          <aside className="nyx-chat-sidebar">
            <button
              className="nyx-new-chat-button"
              onClick={() => startConversation(activeStudio)}
            >
              <Plus size={17} /> New chat
            </button>

            <h3>Conversations</h3>

            {studioConversations.map((conversation) => (
              <div
                className={`nyx-history-item ${
                  conversation.id === activeConversation
                    ? "active"
                    : ""
                }`}
                key={conversation.id}
              >
                <button
                  onClick={() => openConversation(conversation)}
                >
                  <MessageCircle size={15} />
                  <span>{conversation.title}</span>
                </button>

                <button
                  onClick={() => deleteConversation(conversation.id)}
                  title="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </aside>

          <section className="nyx-chat-main">
            <div className="nyx-chat-heading">
              <h2>{activeStudio.name}</h2>
              <p>{activeStudio.description}</p>
            </div>

            <div className="nyx-messages">
              {currentConversation?.messages?.length ? (
                currentConversation.messages.map((item) => (
                  <MessageBubble item={item} key={item.id} />
                ))
              ) : (
                <div className="nyx-empty-chat">
                  <Sparkles size={35} />
                  <h3>What are we creating today?</h3>
                  <p>
                    Tell NYX your idea. You can also explore research
                    and references for this studio.
                  </p>
                  <button onClick={() => setPage("research")}>
                    <Search size={16} /> Explore research
                  </button>
                </div>
              )}
            </div>

            <Composer onSend={sendMessage} />

            <p className="nyx-service-note">
              Your conversations are saved on this device.
              AI creation services are still being connected.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="nyx-app">
      <header className="nyx-topbar">
        <button
          className="nyx-brand"
          onClick={() => setPage("home")}
        >
          <Sparkles size={24} />
          <span>NYX</span>
        </button>

        <nav className="nyx-navigation">
          <button onClick={() => setPage("home")}>
            <Home size={17} /> Home
          </button>

          <button onClick={() => setPage("projects")}>
            <FolderOpen size={17} /> Projects
          </button>

          <button onClick={() => setPage("settings")}>
            <Settings size={17} /> Settings
          </button>
        </nav>

        <button
          className="nyx-account-button"
          onClick={() => setPage(user ? "settings" : "auth")}
        >
          <UserRound size={18} />
          {user ? "Account" : "Sign in"}
        </button>
      </header>

      {page === "projects" ? (
        <section className="nyx-page-content">
          <button onClick={() => setPage("home")}>
            <ArrowLeft size={17} /> Back
          </button>

          <h1>Your projects</h1>
          <p>Continue working on a previous conversation.</p>

          {conversations.length === 0 ? (
            <p>No projects yet. Start by exploring a studio.</p>
          ) : (
            conversations.map((conversation) => {
              const studio = findStudio(conversation.studioId);

              return (
                <div className="nyx-project-item" key={conversation.id}>
                  <button onClick={() => openConversation(conversation)}>
                    <FolderOpen size={19} />
                    <span>
                      <strong>{conversation.title}</strong>
                      <small>
                        {studio?.name || "Studio"} ·{" "}
                        {formatDate(conversation.updatedAt)}
                      </small>
                    </span>
                  </button>

                  <button
                    onClick={() => deleteConversation(conversation.id)}
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </section>
      ) : page === "settings" ? (
        <section className="nyx-page-content">
          <h1>Settings</h1>
          <p>
            {user
              ? `Signed in as ${user.email}`
              : "You are currently exploring NYX without an account."}
          </p>

          {user ? (
            <button onClick={handleSignOut}>
              <LogOut size={17} /> Sign out
            </button>
          ) : (
            <button onClick={() => setPage("auth")}>
              Sign in or create an account
            </button>
          )}

          <p className="nyx-service-note">
            Conversation storage is currently local to this device.
            Account-based cloud project syncing is not connected yet.
          </p>
        </section>
      ) : (
        <Home
          onNavigate={(nextPage) => {
            if (nextPage === "studio") {
              startConversation(STUDIOS[0]);
            } else if (nextPage === "research") {
              setActiveStudio(findStudio("research"));
              setPage("research");
            } else {
              setPage(nextPage);
            }
          }}
          onNewChat={() => startConversation(STUDIOS[0])}
        />
      )}
    </main>
  );
}
