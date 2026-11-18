
import React, { useEffect, useRef, useState } from "react";
import {
  Home, Plus, Film, Music, BookOpen, Mic, Gamepad2,
  Megaphone, UserRound, AudioLines, Clapperboard, Laugh,
  Upload, Bell, MessageCircle, Send, Paperclip, ArrowLeft,
  X, Trash2, Clock, Sparkles, ChevronRight,
  FolderOpen, Search, WandSparkles, Headphones, Video,
  CircleStop
} from "lucide-react";

const STORAGE_KEY = "nyx-conversations-v1";

const STUDIOS = [
  { id: "marketing", name: "Marketing & Advertising", description: "Create campaigns, adverts and brand experiences.", icon: Megaphone },
  { id: "video", name: "Video Editing", description: "Turn your footage and ideas into finished videos.", icon: Video },
  { id: "film", name: "Film & Movie Production", description: "Bring films, scenes and stories to life.", icon: Clapperboard },
  { id: "music", name: "Music & Beat Production", description: "Create original songs, beats and instrumentals.", icon: Music },
  { id: "games", name: "Game Creation", description: "Create game worlds, characters and experiences.", icon: Gamepad2 },
  { id: "storytelling", name: "Storytelling & Voice", description: "Write books, stories, scripts and narration.", icon: BookOpen },
  { id: "audiobook", name: "Audiobook Production", description: "Turn books into narrated audiobooks.", icon: Headphones },
  { id: "characters", name: "Character Creation", description: "Create original characters and personalities.", icon: UserRound },
  { id: "soundtrack", name: "Soundtrack & Background Music", description: "Create music and sound for your scenes.", icon: AudioLines },
  { id: "scene", name: "Step Into The Scene", description: "Bring characters into creative scenes.", icon: Sparkles },
  { id: "comedy", name: "Comedy & Humour", description: "Create comedy, skits and entertaining content.", icon: Laugh },
  { id: "import", name: "Import & Export", description: "Bring in files and prepare your creations.", icon: Upload }
];

const GENRES = [
  "Afrobeats", "Amapiano", "Gengetone", "Urbantone",
  "Mugithi", "Bongo Flava", "Dancehall", "Reggae",
  "Hip-hop", "R&B", "Gospel", "Afro-house", "Rhumba",
  "Country", "Pop", "Jazz", "Rock", "EDM", "Soul",
  "Classical", "Trap", "Drill", "Boom bap", "Reggaeton", "Soca"
];

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function getTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "New conversation";
  return clean.length > 45 ? clean.slice(0, 45) + "…" : clean;
}

function findStudio(id) {
  return STUDIOS.find(studio => studio.id === id);
}

function StudioCard({ studio, onClick }) {
  const Icon = studio.icon;

  return (
    <button className="nyx-studio-card" onClick={onClick}>
      <div className="nyx-studio-art">
        <Icon size={25} strokeWidth={1.7} />
      </div>
      <strong>{studio.name}</strong>
      <p>{studio.description}</p>
      <span>Open studio <ChevronRight size={14} /></span>
    </button>
  );
}

function Composer({ onSend }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const recorder = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
    return () => {
      if (recorder.current?.state === "recording") {
        recorder.current.stop();
      }
      stream.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  function attachFiles(event) {
    setFiles(previous => [
      ...previous,
      ...Array.from(event.target.files || [])
    ]);
    event.target.value = "";
  }

  async function toggleRecording() {
    setError("");

    if (recording) {
      recorder.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording isn't supported by this browser.");
      return;
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = audioStream;
      chunks.current = [];

      const media = new MediaRecorder(audioStream);
      recorder.current = media;

      media.ondataavailable = event => {
        if (event.data.size) chunks.current.push(event.data);
      };

      media.onstop = async () => {
        const blob = new Blob(chunks.current, {
          type: media.mimeType || "audio/webm"
        });

        audioStream.getTracks().forEach(track => track.stop());
        stream.current = null;

        try {
          const audio = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          onSend({ text: "", audio, files: [] });
        } catch {
          setError("The voice note could not be saved.");
        }

        setRecording(false);
      };

      media.start();
      setRecording(true);
    } catch {
      setError("Microphone access was denied or unavailable.");
    }
  }

  function submit(event) {
    event?.preventDefault();
    if (!text.trim() && files.length === 0) return;

    onSend({
      text: text.trim(),
      audio: null,
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    });

    setText("");
    setFiles([]);
  }

  return (
    <div className="nyx-composer-area">
      {files.length > 0 && (
        <div className="nyx-file-list">
          {files.map((file, index) => (
            <span key={`${file.name}-${index}`}>
              <Paperclip size={13} />
              {file.name}
              <button type="button" onClick={() =>
                setFiles(previous => previous.filter((_, i) => i !== index))
              }>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="nyx-composer-error">{error}</p>}

      {recording && (
        <p className="nyx-recording-status">
          <span /> Recording your voice note. Tap stop when finished.
        </p>
      )}

      <form className="nyx-composer" onSubmit={submit}>
        <button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach files">
          <Paperclip size={19} />
        </button>

        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={attachFiles}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        <textarea
          rows={1}
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Tell NYX what you imagine..."
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
        />

        <button
          type="button"
          onClick={toggleRecording}
          aria-label={recording ? "Stop recording" : "Record voice note"}
          className={recording ? "recording" : ""}
        >
          {recording ? <CircleStop size={20} /> : <Mic size={20} />}
        </button>

        <button
          type="submit"
          className="nyx-send-button"
          disabled={!text.trim() && files.length === 0}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>

      <small className="nyx-composer-hint">
        Just describe what you want. No technical instructions needed.
      </small>
    </div>
  );
}

function MessageBubble({ item }) {
  return (
    <div className="nyx-message-row">
      <div className="nyx-message-avatar"><UserRound size={16} /></div>
      <div className="nyx-message-content">
        {item.text && <div className="nyx-message-bubble">{item.text}</div>}
        {item.audio && (
          <div className="nyx-audio-message">
            <Mic size={16} />
            <audio controls src={item.audio}>Audio playback is not supported.</audio>
          </div>
        )}
        {item.files?.map((file, index) => (
          <div className="nyx-message-file" key={index}>
            <Paperclip size={14} /> {file.name}
          </div>
        ))}
        <small>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </small>
      </div>
    </div>
  );
}

function ConversationHistory({
  conversations, activeId, onOpen, onNew, onDelete
}) {
  return (
    <aside className="nyx-history-panel">
      <div className="nyx-history-heading">
        <div>
          <span className="nyx-eyebrow">YOUR SPACE</span>
          <h3>Conversations</h3>
        </div>
        <button onClick={onNew} aria-label="New conversation"><Plus size={20} /></button>
      </div>

      <button className="nyx-new-chat" onClick={onNew}>
        <Plus size={17} /> New conversation
      </button>

      <div className="nyx-history-list">
        {conversations.length === 0 ? (
          <div className="nyx-empty-history">
            <MessageCircle size={25} />
            <p>Your conversations will appear here.</p>
            <small>Start an idea and return to it whenever you like.</small>
          </div>
        ) : conversations.map(chat => (
          <div
            className={`nyx-history-item ${activeId === chat.id ? "selected" : ""}`}
            key={chat.id}
          >
            <button className="nyx-history-open" onClick={() => onOpen(chat.id)}>
              <MessageCircle size={16} />
              <span>
                <strong>{chat.title}</strong>
                <small>{formatDate(chat.updatedAt)}</small>
              </span>
            </button>
            <button
              className="nyx-delete-chat"
              onClick={() => onDelete(chat.id)}
              aria-label="Delete conversation"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

function HomePage({ navigate, openStudio, search, setSearch, setNotice }) {
  const filteredStudios = STUDIOS.filter(studio =>
    `${studio.name} ${studio.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="nyx-main">
      <header className="nyx-header">
        <button className="nyx-logo" onClick={() => navigate("home")}>
          <span className="nyx-logo-mark">N</span><span>NYX</span>
        </button>
        <div className="nyx-header-actions">
          <button onClick={() => navigate("notifications")} aria-label="Notifications"><Bell size={19} /></button>
          <button onClick={() => navigate("profile")} aria-label="Profile"><UserRound size={19} /></button>
        </div>
      </header>

      <section className="nyx-hero">
        <span className="nyx-eyebrow"><Sparkles size={14} /> THE CREATIVE UNIVERSE</span>
        <h1>Imagine beyond.<br /><span>Create everything.</span></h1>
        <p>One idea can become a story, a film, a song or an entire world.</p>
        <button className="nyx-primary-button" onClick={() => navigate("create")}>
          <WandSparkles size={18} /> Start creating
        </button>
      </section>

      <section className="nyx-shortcuts">
        <button onClick={() => navigate("create")}>
          <Plus size={21} /><span><strong>Create something</strong><small>Talk to NYX</small></span>
        </button>
        <button onClick={() => setNotice("Your project library will be connected in the project-management stage.")}>
          <FolderOpen size={21} /><span><strong>My projects</strong><small>Your creative work</small></span>
        </button>
        <button onClick={() => navigate("reels")}>
          <Film size={21} /><span><strong>Explore Reels</strong><small>Discover creations</small></span>
        </button>
      </section>

      <section className="nyx-studios-section">
        <div className="nyx-section-heading">
          <div>
            <span className="nyx-eyebrow">YOUR IDEAS. YOUR UNIVERSE.</span>
            <h2>Explore the studios</h2>
            <p>Choose a studio or simply tell NYX what you want.</p>
          </div>
          <span className="nyx-studio-count">12 studios</span>
        </div>

        <div className="nyx-search">
          <Search size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Find a studio..."
          />
        </div>

        <div className="nyx-studio-grid">
          {filteredStudios.map(studio => (
            <StudioCard key={studio.id} studio={studio} onClick={() => openStudio(studio.id)} />
          ))}
        </div>
      </section>

      <footer className="nyx-home-footer">
        <Sparkles size={16} /> Your imagination leads. NYX brings the creative tools together.
      </footer>
    </main>
  );
}

function ChatPage({
  studio, chats, activeId, setActiveId, onBack, onNew, onSend, onDelete,
  genre, setGenre, setNotice
}) {
  const [mobileHistory, setMobileHistory] = useState(false);
  const activeChat = chats.find(chat => chat.id === activeId);
  const history = chats.filter(chat => chat.studioId === (studio?.id || null));

  function openChat(id) {
    setActiveId(id);
    setMobileHistory(false);
  }

  return (
    <main className="nyx-chat-page">
      <header className="nyx-chat-header">
        <button className="nyx-back-button" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="nyx-chat-brand">
          <div className="nyx-chat-brand-icon">
            {studio ? React.createElement(studio.icon, { size: 21 }) : <Sparkles size={21} />}
          </div>
          <div>
            <strong>{studio ? studio.name : "Talk to NYX"}</strong>
            <small>{studio ? "Your creative studio" : "Your creative space"}</small>
          </div>
        </div>
        <button className="nyx-header-icon" onClick={() => setMobileHistory(value => !value)} aria-label="Conversation history">
          <Clock size={19} />
        </button>
        <button className="nyx-header-icon" onClick={onNew} aria-label="New conversation">
          <Plus size={21} />
        </button>
      </header>

      <div className="nyx-chat-layout">
        <div className={`nyx-history-wrapper ${mobileHistory ? "mobile-open" : ""}`}>
          <ConversationHistory
            conversations={history}
            activeId={activeId}
            onOpen={openChat}
            onNew={onNew}
            onDelete={onDelete}
          />
          <button className="nyx-history-close" onClick={() => setMobileHistory(false)}>
            <X size={18} /> Close
          </button>
        </div>

        <section className="nyx-chat-main">
          <div className="nyx-messages">
            {!activeChat || activeChat.messages.length === 0 ? (
              <div className="nyx-chat-welcome">
                <div className="nyx-welcome-symbol"><Sparkles size={32} /></div>
                <span className="nyx-eyebrow">WELCOME TO NYX</span>
                <h1>{studio ? `Let's create in ${studio.name}.` : "What are we imagining today?"}</h1>
                <p>
                  {studio
                    ? `${studio.description} Tell NYX what you imagine, in your own words.`
                    : "Tell NYX your idea naturally. You don't need to learn complicated software or technical terms."}
                </p>

                {studio?.id === "music" && (
                  <div className="nyx-genre-section">
                    <span>Explore music styles (optional)</span>
                    <div className="nyx-genre-list">
                      {GENRES.map(item => (
                        <button
                          key={item}
                          className={genre === item ? "selected" : ""}
                          onClick={() => {
                            setGenre(item);
                            setNotice(`${item} selected as a music style.`);
                          }}
                        >{item}</button>
                      ))}
                    </div>
                  </div>
                )}

                {studio?.id === "storytelling" && (
                  <div className="nyx-feature-note"><BookOpen size={18} /> Write books, develop chapters, edit stories and scripts.</div>
                )}
                {studio?.id === "audiobook" && (
                  <div className="nyx-feature-note"><Headphones size={18} /> Plan narration, voice selection and chapter-level audiobooks.</div>
                )}
                {studio?.id === "scene" && (
                  <div className="nyx-feature-note"><Film size={18} /> Describe the character and scene you want to bring together.</div>
                )}
              </div>
            ) : (
              <div className="nyx-message-list">
                <h3 className="nyx-active-chat-title">{activeChat.title}</h3>
                {activeChat.messages.map(item => <MessageBubble key={item.id} item={item} />)}
                <div className="nyx-engine-notice">
                  <Sparkles size={15} />
                  Your conversation is saved on this device. The AI response and creative-generation engine still need to be connected.
                </div>
              </div>
            )}
          </div>
          <Composer onSend={onSend} />
        </section>
      </div>
    </main>
  );
}

function PlaceholderPage({ page, navigate }) {
  const details = {
    reels: { title: "Explore Reels", description: "Discover short-form videos and creative work from the NYX community.", icon: Film },
    inbox: { title: "Your Inbox", description: "Messages and conversations with other creators will appear here.", icon: MessageCircle },
    profile: { title: "Your Profile", description: "Your creative identity, projects and creator information.", icon: UserRound },
    notifications: { title: "Notifications", description: "Your NYX notifications will appear here.", icon: Bell }
  };

  const detail = details[page] || details.profile;
  const Icon = detail.icon;

  return (
    <main className="nyx-placeholder-page">
      <div className="nyx-placeholder-icon"><Icon size={32} /></div>
      <span className="nyx-eyebrow">THE CREATIVE UNIVERSE</span>
      <h1>{detail.title}</h1>
      <p>{detail.description}</p>
      <small>THIS AREA WILL BE CONNECTED IN A FUTURE DEVELOPMENT STAGE.</small>
      <button className="nyx-primary-button" onClick={() => navigate("home")}>
        <ArrowLeft size={17} /> Return home
      </button>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [studioId, setStudioId] = useState(null);
  const [chats, setChats] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      setNotice("Your device could not save more conversations.");
    }
  }, [chats]);

  const currentStudio = findStudio(studioId);

  function navigate(destination) {
    setPage(destination);
    setStudioId(null);
    setActiveId(null);
    setNotice("");
  }

  function openStudio(id) {
    setStudioId(id);
    setPage("studio");
    setActiveId(null);
    setGenre("");
    setNotice("");
  }

  function createChat(targetStudio = null) {
    const studio = targetStudio ? findStudio(targetStudio) : null;
    const now = Date.now();

    const chat = {
      id: makeId(),
      title: "New conversation",
      studioId: targetStudio,
      studioName: studio?.name || null,
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    setChats(previous => [chat, ...previous]);
    setActiveId(chat.id);
  }

  function newConversation() {
    createChat(page === "studio" ? studioId : null);
  }

  function sendMessage(payload) {
    const targetStudio = page === "studio" ? studioId : null;
    let chat = chats.find(item => item.id === activeId);

    if (!chat || chat.studioId !== targetStudio) {
      const studio = targetStudio ? findStudio(targetStudio) : null;
      const now = Date.now();

      chat = {
        id: makeId(),
        title: "New conversation",
        studioId: targetStudio,
        studioName: studio?.name || null,
        createdAt: now,
        updatedAt: now,
        messages: []
      };
    }

    const now = Date.now();
    const newMessage = {
      id: makeId(),
      role: "user",
      text: payload.text || "",
      audio: payload.audio || null,
      files: payload.files || [],
      createdAt: now
    };

    const updated = {
      ...chat,
      title: chat.messages.length === 0 && payload.text ? getTitle(payload.text) : chat.title,
      messages: [...chat.messages, newMessage],
      updatedAt: now
    };

    setChats(previous => {
      const exists = previous.some(item => item.id === chat.id);
      return exists
        ? previous.map(item => item.id === chat.id ? updated : item)
        : [updated, ...previous];
    });

    setActiveId(chat.id);
  }

  function deleteChat(id) {
    setChats(previous => previous.filter(chat => chat.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="nyx-app">
      {page === "home" && (
        <HomePage
          navigate={navigate}
          openStudio={openStudio}
          search={search}
          setSearch={setSearch}
          setNotice={setNotice}
        />
      )}

      {page === "create" && (
        <ChatPage
          key="general-chat"
          studio={null}
          chats={chats.filter(chat => chat.studioId === null)}
          activeId={activeId}
          setActiveId={setActiveId}
          onBack={() => navigate("home")}
          onNew={newConversation}
          onSend={sendMessage}
          onDelete={deleteChat}
          genre={genre}
          setGenre={setGenre}
          setNotice={setNotice}
        />
      )}

      {page === "studio" && currentStudio && (
        <ChatPage
          key={currentStudio.id}
          studio={currentStudio}
          chats={chats.filter(chat => chat.studioId === currentStudio.id)}
          activeId={activeId}
          setActiveId={setActiveId}
          onBack={() => navigate("home")}
          onNew={newConversation}
          onSend={sendMessage}
          onDelete={deleteChat}
          genre={genre}
          setGenre={setGenre}
          setNotice={setNotice}
        />
      )}

      {["reels", "inbox", "profile", "notifications"].includes(page) && (
        <PlaceholderPage page={page} navigate={navigate} />
      )}

      {["home", "create", "reels", "inbox", "profile"].includes(page) && (
        <nav className="nyx-bottom-nav">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "create", label: "Create", icon: Plus },
            { id: "reels", label: "Reels", icon: Film },
            { id: "inbox", label: "Inbox", icon: MessageCircle },
            { id: "profile", label: "Profile", icon: UserRound }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={page === item.id ? "active" : ""}
                onClick={() => navigate(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {notice && (
        <div className="nyx-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
