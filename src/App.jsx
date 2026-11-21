
import React, { useEffect, useState } from "react";
import {
  Sparkles, Plus, Film, Music, BookOpen, Mic, Gamepad2,
  Megaphone, UserRound, AudioLines, Clapperboard, Laugh,
  MessageCircle, Send, Paperclip, ArrowLeft, Trash2,
  ChevronRight, FolderOpen, Search, Headphones, Settings,
  LogOut, Link as LinkIcon, ExternalLink, House, Compass,
  CircleUserRound, Video
} from "lucide-react";

import { supabase } from "./lib/supabase";
import ResearchHub from "./ResearchHub";
import Home from "./Home";

const STORAGE_KEY = "nyx-conversations-v1";

const STUDIOS = [
  { id: "film", name: "Film & Video", icon: Film, color: "#8b5cf6", description: "Create films, scenes, videos and visual stories." },
  { id: "music", name: "Music", icon: Music, color: "#ec4899", description: "Create original songs, beats and sounds." },
  { id: "books", name: "Books & Writing", icon: BookOpen, color: "#f59e0b", description: "Write, edit and develop books and stories." },
  { id: "voice", name: "Storytelling & Voice", icon: Mic, color: "#06b6d4", description: "Create narration and distinctive character voices." },
  { id: "games", name: "Game Creation", icon: Gamepad2, color: "#22c55e", description: "Develop game concepts, characters and worlds." },
  { id: "marketing", name: "Marketing", icon: Megaphone, color: "#f97316", description: "Build campaigns, brands and promotional content." },
  { id: "characters", name: "Character Studio", icon: UserRound, color: "#a78bfa", description: "Design and develop consistent characters." },
  { id: "audio", name: "Audio Production", icon: AudioLines, color: "#14b8a6", description: "Create sound effects and audio experiences." },
  { id: "animation", name: "Animation", icon: Clapperboard, color: "#e879f9", description: "Bring characters and ideas to life." },
  { id: "comedy", name: "Comedy & Entertainment", icon: Laugh, color: "#eab308", description: "Create comedy, sketches and entertainment." },
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

function MessageBubble({ item }) {
  const isUser = item.role === "user";

  return (
    <div className={`nyx-message-row ${isUser ? "nyx-message-user" : "nyx-message-assistant"}`}>
      <div className="nyx-message-bubble">
        {item.text && <p>{item.text}</p>}

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
    <form className="nyx-composer" onSubmit={submitMessage}>
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    let subscription;

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);

        const result = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });

        subscription = result.data.subscription;
      } catch (error) {
        console.error("NYX authentication error:", error);
      }
    };

    loadUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
    setPage("chat");
  };

  const openConversation = (conversation) => {
    const studio = findStudio(conversation.studioId) || STUDIOS[0];

    setActiveStudio(studio);
    setActiveConversation(conversation.id);
    setPage("chat");
  };

  const openResearch = () => {
    if (page === "chat" && activeStudio) {
      setResearchReturnPage("chat");
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

  // Add an assistant message to the active conversation.
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

  // Send the user's message to the real NYX Supabase AI function.
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

    // The deployed function requires an authenticated Supabase user.
    if (!user) {
      addAssistantMessage(
        conversationId,
        "Please sign in to your NYX account before using the AI studios. Your message has been saved in this conversation."
      );
      return;
    }

    setGenerating(true);

    try {
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
        "nyx-intelligence",
        {
          body: {
            message,
            studioName: activeStudio.name,
            history
          }
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.response) {
        throw new Error(data?.error || "NYX did not return a response.");
      }

      addAssistantMessage(conversationId, data.response);
    } catch (error) {
      console.error("NYX AI error:", error);

      addAssistantMessage(
        conversationId,
        `I couldn't reach the AI service just now. ${error.message || "Please try again."}`
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setPage("home");
    } catch (error) {
      setAuthMessage(error.message || "Could not sign out.");
    }
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
          <button className="nyx-back-button" onClick={() => setPage("account")}>
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
                {loading ? "Please wait..." : authMode === "signup" ? "Create account" : "Sign in"}
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

  if (page === "chat" && activeStudio) {
    const StudioIcon = activeStudio.icon;

    return (
      <main className="nyx-app">
        <header className="nyx-topbar">
          <button onClick={() => setPage("home")} className="nyx-back-button">
            <ArrowLeft size={19} />
          </button>

          <div className="nyx-topbar-title">
            <StudioIcon size={22} />
            <span>{activeStudio.name}</span>
          </div>

          <button onClick={openResearch} className="nyx-icon-button" title="Research and discovery">
            <Search size={20} />
          </button>
        </header>

        <div className="nyx-chat-layout">
          <aside className="nyx-chat-sidebar">
            <button className="nyx-new-chat-button" onClick={() => startConversation(activeStudio)}>
              <Plus size={17} /> New chat
            </button>

            <h3>Conversations</h3>

            {studioConversations.map((conversation) => (
              <div
                className={`nyx-history-item ${conversation.id === activeConversation ? "active" : ""}`}
                key={conversation.id}
              >
                <button onClick={() => openConversation(conversation)}>
                  <MessageCircle size={15} />
                  <span>{conversation.title}</span>
                </button>

                <button onClick={() => deleteConversation(conversation.id)} title="Delete conversation">
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
                    Tell NYX your idea. You can also explore research and references for this studio.
                  </p>
                  <button onClick={openResearch}>
                    <Search size={16} /> Explore research
                  </button>
                </div>
              )}

              {generating && (
                <div className="nyx-message-row nyx-message-assistant">
                  <div className="nyx-message-bubble">
                    <p>NYX is thinking...</p>
                  </div>
                </div>
              )}
            </div>

            <Composer onSend={sendMessage} disabled={generating} />

            <p className="nyx-service-note">
              {generating
                ? "NYX is preparing a response..."
                : user
                  ? "NYX AI is connected. Your conversations are saved on this device."
                  : "Sign in to use NYX AI. Your conversations are saved on this device."}
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (page === "research") {
    return (
      <main className="nyx-app">
        <header className="nyx-topbar">
          <button className="nyx-brand" onClick={() => setPage("home")}>
            <Sparkles size={23} />
            <span>NYX</span>
          </button>

          <button className="nyx-icon-button" onClick={() => setPage("home")} aria-label="Back home">
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
        <button className="nyx-brand" onClick={() => setPage("home")}>
          <Sparkles size={23} />
          <span>NYX</span>
        </button>

        <button className="nyx-account-button" onClick={() => setPage("account")}>
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
                onClick={() => startConversation(studio)}
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
              The scrollable Reels feed and video creation features will be built in the next stage.
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
                        {studio?.name || "Studio"} · {formatDate(conversation.updatedAt)}
                      </small>
                    </span>
                  </button>

                  <button onClick={() => deleteConversation(conversation.id)} title="Delete project">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
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
              <p>{user ? "You are signed in to NYX." : "Sign in to access your account."}</p>
            </div>
          </div>

          {!user && (
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
          )}

          {!user && (
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
          )}

          <button className="nyx-action-button" onClick={() => setPage("settings")}>
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
          <button className="nyx-back-button" onClick={() => setPage("account")}>
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
              <small>Conversations are currently saved on this device.</small>
            </span>
          </div>

          <div className="nyx-settings-item">
            <Compass size={19} />
            <span>
              <strong>Research and discovery</strong>
              <small>Research tools are available through the Research section.</small>
            </span>
          </div>

          {user && (
            <button className="nyx-action-button" onClick={handleSignOut}>
              <LogOut size={18} /> Sign out
            </button>
          )}
        </section>
      ) : (
        <Home onNavigate={navigate} onNewChat={() => startConversation(STUDIOS[0])} />
      )}

      <BottomNavigation page={page} onNavigate={navigate} />
    </main>
  );
}
