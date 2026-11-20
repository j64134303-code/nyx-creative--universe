
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home, Plus, Film, Music, BookOpen, Mic, Gamepad2,
  Megaphone, UserRound, AudioLines, Clapperboard, Laugh,
  Upload, Bell, MessageCircle, Send, Paperclip, ArrowLeft,
  X, Trash2, Clock, Sparkles, ChevronRight, FolderOpen,
  Search, WandSparkles, Headphones, Video, CircleStop,
  Camera, Layers, Volume2, Image, Star, Disc3, Palette,
  Radio, PenTool, Play, Compass, Settings, LogOut,
  Lock, Mail, User, Pencil, Check, Link as LinkIcon
} from "lucide-react";

import { supabase } from "./lib/supabase";
import ResearchHub from "./ResearchHub";

const STORAGE_KEY = "nyx-conversations-v1";

const STUDIOS = [
  { id:"marketing", name:"Marketing & Advertising", description:"Create campaigns, adverts and brand experiences.", icon:Megaphone, art:"campaign", colors:["#32164f","#d99aff"] },
  { id:"video", name:"Video Editing", description:"Turn your footage and ideas into finished videos.", icon:Video, art:"video", colors:["#102e50","#7edaff"] },
  { id:"film", name:"Film & Movie Production", description:"Bring films, scenes and stories to life.", icon:Clapperboard, art:"film", colors:["#42172f","#ff9ebc"] },
  { id:"music", name:"Music & Beat Production", description:"Create original songs, beats and instrumentals.", icon:Music, art:"music", colors:["#32145f","#d0a0ff"] },
  { id:"games", name:"Game Creation", description:"Create game worlds, characters and experiences.", icon:Gamepad2, art:"games", colors:["#103c35","#81f0c1"] },
  { id:"storytelling", name:"Storytelling & Voice", description:"Write books, stories, scripts and narration.", icon:BookOpen, art:"story", colors:["#593016","#ffd095"] },
  { id:"audiobook", name:"Audiobook Production", description:"Turn books into narrated audiobooks.", icon:Headphones, art:"audio", colors:["#252d63","#aebdff"] },
  { id:"characters", name:"Character Creation", description:"Create original characters and personalities.", icon:UserRound, art:"character", colors:["#4c2054","#f2aaff"] },
  { id:"soundtrack", name:"Soundtrack & Background Music", description:"Create music and sound for your scenes.", icon:AudioLines, art:"sound", colors:["#123e52","#8ceaff"] },
  { id:"scene", name:"Step Into The Scene", description:"Bring characters into creative scenes.", icon:Sparkles, art:"scene", colors:["#38215d","#d4b4ff"] },
  { id:"comedy", name:"Comedy & Humour", description:"Create comedy, skits and entertaining content.", icon:Laugh, art:"comedy", colors:["#634016","#ffe29b"] },
  { id:"import", name:"Import & Export", description:"Bring in files and prepare your creations.", icon:Upload, art:"import", colors:["#293653","#b6ceff"] }
];

const GENRES = [
  "Afrobeats","Amapiano","Gengetone","Urbantone","Mugithi",
  "Bongo Flava","Dancehall","Reggae","Hip-hop","R&B",
  "Gospel","Afro-house","Rhumba","Country","Pop","Jazz",
  "Rock","EDM","Soul","Classical","Trap","Drill",
  "Boom bap","Reggaeton","Soca"
];

const NAV_ITEMS = [
  { id:"home", label:"Home", icon:Home },
  { id:"real", label:"Real", icon:Film },
  { id:"create", label:"Create", icon:Plus },
  { id:"showme", label:"Show Me", icon:Compass },
  { id:"settings", label:"Settings", icon:Settings }
];

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], {
    month:"short",
    day:"numeric"
  });
}

function getTitle(text) {
  const clean = text.trim().replace(/\s+/g," ");
  return !clean
    ? "New conversation"
    : clean.length > 45
      ? clean.slice(0,45)+"…"
      : clean;
}

function findStudio(id) {
  return STUDIOS.find(studio => studio.id === id);
}

/* VISUAL STUDIO ARTWORK */

function StudioArtwork({ studio }) {
  const [base, glow] = studio.colors;
  const art = studio.art;

  const iconMap = {
    campaign:Megaphone,
    video:Video,
    film:Camera,
    music:Headphones,
    games:Gamepad2,
    story:BookOpen,
    audio:Mic,
    character:UserRound,
    sound:AudioLines,
    scene:Layers,
    comedy:Laugh,
    import:Upload
  };

  const MainIcon = iconMap[art] || Sparkles;

  const captions = {
    campaign:"MAKE YOUR IDEA KNOWN",
    video:"EDIT. CREATE. SHARE.",
    film:"YOUR STORY. YOUR FILM.",
    music:"CREATE YOUR SOUND",
    games:"BUILD YOUR WORLD",
    story:"EVERY WORLD STARTS WITH A STORY",
    audio:"GIVE STORIES A VOICE",
    character:"CREATE SOMEONE ORIGINAL",
    sound:"SOUND FOR EVERY SCENE",
    scene:"STEP INTO YOUR IMAGINATION",
    comedy:"MAKE THEM LAUGH",
    import:"BRING YOUR WORK TOGETHER"
  };

  return (
    <div
      className={`nyx-artwork nyx-art-${art}`}
      style={{
        background:`radial-gradient(circle at 50% 45%, ${glow}45, transparent 55%), linear-gradient(140deg,${base},#100b19)`
      }}
    >
      <div className="nyx-art-orbit orbit-one" />
      <div className="nyx-art-orbit orbit-two" />

      <div className="nyx-art-floating floating-left">
        <Sparkles size={27}/>
      </div>

      <div className="nyx-art-main">
        <MainIcon size={61}/>
      </div>

      <div className="nyx-art-floating floating-right">
        <Star size={28}/>
      </div>

      {["music","audio","sound"].includes(art) && (
        <div className="nyx-wave">
          {[12,24,35,19,43,29,48,22,38,16,31,12,25].map((h,i)=>(
            <span key={i} style={{height:h}} />
          ))}
        </div>
      )}

      {art==="film" && (
        <div className="nyx-film-strip">
          <i/><i/><i/><i/><i/>
        </div>
      )}

      {art==="video" && (
        <div className="nyx-edit-bars">
          <i/><i/><i/>
        </div>
      )}

      {art==="story" && (
        <div className="nyx-book-lines">
          <i/><i/><i/>
        </div>
      )}

      <span className="nyx-art-caption">{captions[art]}</span>
      <span className="nyx-art-label">NYX STUDIO</span>
    </div>
  );
}

function StudioCard({ studio, onClick }) {
  return (
    <button className="nyx-studio-card" onClick={onClick}>
      <StudioArtwork studio={studio}/>
      <strong>{studio.name}</strong>
      <p>{studio.description}</p>
      <span className="nyx-open-studio">
        Open studio <ChevronRight size={15}/>
      </span>
    </button>
  );
}

/* MESSAGE COMPOSER */

function Composer({ onSend, disabled=false, onRequireAuth }) {
  const [text,setText] = useState("");
  const [files,setFiles] = useState([]);
  const [recording,setRecording] = useState(false);
  const [error,setError] = useState("");

  const fileInput = useRef(null);
  const recorder = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);

  useEffect(() => () => {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
    }
    stream.current?.getTracks().forEach(track=>track.stop());
  },[]);

  function attachFiles(event) {
    if (disabled) {
      onRequireAuth?.();
      return;
    }

    setFiles(previous=>[
      ...previous,
      ...Array.from(event.target.files||[])
    ]);
    event.target.value="";
  }

  async function toggleRecording() {
    if (disabled) {
      onRequireAuth?.();
      return;
    }

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
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio:true
      });

      stream.current = audioStream;
      chunks.current = [];

      const media = new MediaRecorder(audioStream);
      recorder.current = media;

      media.ondataavailable = event => {
        if (event.data.size) chunks.current.push(event.data);
      };

      media.onstop = async () => {
        const blob = new Blob(chunks.current, {
          type:media.mimeType || "audio/webm"
        });

        audioStream.getTracks().forEach(track=>track.stop());
        stream.current=null;

        try {
          const audio = await new Promise((resolve,reject)=>{
            const reader = new FileReader();
            reader.onload=()=>resolve(reader.result);
            reader.onerror=reject;
            reader.readAsDataURL(blob);
          });

          onSend({ text:"", audio, files:[] });
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

    if (disabled) {
      onRequireAuth?.();
      return;
    }

    if (!text.trim() && files.length===0) return;

    onSend({
      text:text.trim(),
      audio:null,
      files:files.map(file=>({
        name:file.name,
        type:file.type,
        size:file.size
      }))
    });

    setText("");
    setFiles([]);
  }

  return (
    <div className="nyx-composer-area">

      {disabled && (
        <div className="nyx-signin-prompt">
          <p>Explore NYX freely. Sign in to create and save your work.</p>
          <button type="button" onClick={onRequireAuth}>
            Sign in or create account
          </button>
        </div>
      )}

      {files.length>0 && (
        <div className="nyx-file-list">
          {files.map((file,index)=>(
            <span key={`${file.name}-${index}`}>
              <Paperclip size={13}/>
              {file.name}
              <button
                type="button"
                onClick={()=>setFiles(p=>p.filter((_,i)=>i!==index))}
              >
                <X size={13}/>
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="nyx-composer-error">{error}</p>}

      {recording && (
        <p className="nyx-recording-status">
          <span/>
          Recording your voice note. Tap stop when finished.
        </p>
      )}

      <form className="nyx-composer" onSubmit={submit}>
        <button
          type="button"
          onClick={()=>disabled ? onRequireAuth?.() : fileInput.current?.click()}
          aria-label="Attach files"
        >
          <Paperclip size={19}/>
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
          onChange={e=>setText(e.target.value)}
          placeholder={disabled?"Sign in to start creating...":"Tell NYX what you imagine..."}
          disabled={disabled}
          onKeyDown={e=>{
            if(e.key==="Enter"&&!e.shiftKey){
              e.preventDefault();
              submit(e);
            }
          }}
        />

        <button
          type="button"
          onClick={toggleRecording}
          aria-label={recording?"Stop recording":"Record voice note"}
          className={recording?"recording":""}
          disabled={disabled}
        >
          {recording?<CircleStop size={20}/>:<Mic size={20}/>}
        </button>

        <button
          type="submit"
          className="nyx-send-button"
          disabled={disabled || (!text.trim()&&files.length===0)}
          aria-label="Send message"
        >
          <Send size={18}/>
        </button>
      </form>

      <small className="nyx-composer-hint">
        Just describe what you want. No technical instructions needed.
      </small>
    </div>
  );
}

/* MESSAGE DISPLAY */

function MessageBubble({ item }) {
  return (
    <div className="nyx-message-row">
      <div className="nyx-message-avatar">
        <UserRound size={16}/>
      </div>

      <div className="nyx-message-content">
        {item.text && (
          <div className="nyx-message-bubble">{item.text}</div>
        )}

        {item.audio && (
          <div className="nyx-audio-message">
            <Mic size={16}/>
            <audio controls src={item.audio}>
              Audio playback is not supported.
            </audio>
          </div>
        )}

        {item.audioSavedOnDevice && !item.audio && (
          <div className="nyx-message-file">
            <Mic size={14}/>
            Voice note saved on original device.
          </div>
        )}

        {item.files?.map((file,index)=>(
          <div className="nyx-message-file" key={index}>
            <Paperclip size={14}/>
            {file.name}
          </div>
        ))}

        <small>
          {new Date(item.createdAt).toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit"
          })}
        </small>
      </div>
    </div>
  );
}
function ConversationHistory({
  chats,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose
}) {
  return (
    <div className="nyx-history-panel">
      <div className="nyx-history-heading">
        <div>
          <h3>Conversations</h3>
          <p>Your studio workspace</p>
        </div>
        <button onClick={onClose} className="nyx-icon-button" title="Close">
          <X size={18} />
        </button>
      </div>

      <button className="nyx-new-chat-button" onClick={onNew}>
        <Plus size={17} />
        New conversation
      </button>

      <div className="nyx-history-list">
        {chats.length === 0 ? (
          <div className="nyx-empty-state">
            <MessageCircle size={25} />
            <p>No conversations yet.</p>
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`nyx-history-item ${
                chat.id === activeId ? "active" : ""
              }`}
            >
              <button
                className="nyx-history-select"
                onClick={() => {
                  onSelect(chat.id);
                  onClose();
                }}
              >
                <MessageCircle size={17} />
                <span>
                  <strong>{chat.title || "New conversation"}</strong>
                  <small>{formatDate(chat.updatedAt || chat.createdAt)}</small>
                </span>
              </button>

              <button
                className="nyx-icon-button nyx-delete-button"
                title="Delete conversation"
                onClick={() => onDelete(chat.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HomePage({
  onOpenStudio,
  onNavigate,
  user
}) {
  const [studioSearch, setStudioSearch] = useState("");

  const filteredStudios = STUDIOS.filter(studio =>
    `${studio.name} ${studio.description}`
      .toLowerCase()
      .includes(studioSearch.toLowerCase())
  );

  return (
    <div className="nyx-page nyx-home-page">
      <header className="nyx-topbar">
        <div className="nyx-brand">
          <span className="nyx-brand-symbol">N</span>
          <span>NYX</span>
        </div>

        <div className="nyx-topbar-actions">
          <button
            className="nyx-icon-button"
            title="Notifications"
            onClick={() => onNavigate("notifications")}
          >
            <Bell size={19} />
          </button>

          <button
            className="nyx-profile-button"
            title="Profile"
            onClick={() => onNavigate(user ? "profile" : "auth")}
          >
            <UserRound size={19} />
          </button>
        </div>
      </header>

      <main className="nyx-home-content">
        <section className="nyx-hero">
          <div className="nyx-hero-glow" />
          <span className="nyx-eyebrow">
            <Sparkles size={14} />
            YOUR CREATIVE UNIVERSE
          </span>

          <h1>
            Imagine beyond.
            <br />
            <span>Create everything.</span>
          </h1>

          <p>
            You imagine. NYX brings it to life.
            Explore your ideas, discover possibilities and create
            from one connected creative space.
          </p>

          <button
            className="nyx-primary-button"
            onClick={() => onNavigate("create")}
          >
            Start creating
            <ChevronRight size={18} />
          </button>
        </section>

        <section className="nyx-quick-actions">
          <button onClick={() => onNavigate("create")}>
            <span className="nyx-quick-icon">
              <Plus size={20} />
            </span>
            <span>Create</span>
          </button>

          <button onClick={() => onNavigate("projects")}>
            <span className="nyx-quick-icon">
              <FolderOpen size={20} />
            </span>
            <span>My projects</span>
          </button>

          <button onClick={() => onNavigate("real")}>
            <span className="nyx-quick-icon">
              <Compass size={20} />
            </span>
            <span>Explore</span>
          </button>
        </section>

        <section className="nyx-studios-section">
          <div className="nyx-section-heading">
            <div>
              <span className="nyx-eyebrow">THE CREATIVE WORKSPACE</span>
              <h2>Explore the studios</h2>
              <p>Every studio has its own purpose and tools.</p>
            </div>
          </div>

          <div className="nyx-search-box">
            <Search size={18} />
            <input
              value={studioSearch}
              onChange={event => setStudioSearch(event.target.value)}
              placeholder="Find a studio..."
            />
            {studioSearch && (
              <button
                className="nyx-icon-button"
                onClick={() => setStudioSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="nyx-studio-grid">
            {filteredStudios.map(studio => (
              <StudioCard
                key={studio.id}
                studio={studio}
                onClick={() => onOpenStudio(studio.id)}
              />
            ))}
          </div>

          {filteredStudios.length === 0 && (
            <div className="nyx-empty-state">
              <Search size={24} />
              <p>No studios match that search.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ChatPage({
  studio,
  chats,
  activeId,
  setActiveId,
  onBack,
  onNew,
  onSend,
  onDelete,
  onResearch,
  genre,
  setGenre,
  user,
  onRequireAuth
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const studioChats = chats
    .filter(chat => chat.studio === studio?.id)
    .sort((a, b) =>
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
    );

  const activeChat = studioChats.find(chat => chat.id === activeId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!studio) {
    return (
      <div className="nyx-page">
        <button className="nyx-back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <p>Studio not found.</p>
      </div>
    );
  }

  const submitMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (!user) {
      onRequireAuth();
      return;
    }

    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className="nyx-page nyx-chat-page">
      <header className="nyx-chat-header">
        <button
          className="nyx-icon-button"
          onClick={onBack}
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="nyx-chat-studio">
          <span className="nyx-chat-studio-icon">
            {studio.icon || <Sparkles size={20} />}
          </span>
          <div>
            <strong>{studio.name}</strong>
            <small>NYX Creative Studio</small>
          </div>
        </div>

        <div className="nyx-chat-header-actions">
          <button
            className="nyx-icon-button"
            title="Research"
            onClick={onResearch}
          >
            <Compass size={19} />
          </button>

          <button
            className="nyx-icon-button"
            title="Conversation history"
            onClick={() => setShowHistory(true)}
          >
            <Clock size={19} />
          </button>

          <button
            className="nyx-icon-button"
            title="New conversation"
            onClick={onNew}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {showHistory && (
        <div className="nyx-history-overlay">
          <ConversationHistory
            chats={studioChats}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={() => {
              setShowHistory(false);
              onNew();
            }}
            onDelete={onDelete}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      <main className="nyx-chat-content">
        {!activeChat || messages.length === 0 ? (
          <div className="nyx-chat-welcome">
            <div className="nyx-welcome-art">
              <Sparkles size={34} />
            </div>

            <span className="nyx-eyebrow">
              WELCOME TO {studio.name.toUpperCase()}
            </span>

            <h1>What are we creating today?</h1>

            <p>
              {studio.description ||
                "Tell NYX what you have in mind. You can start with a simple idea."}
            </p>

            <div className="nyx-research-prompt">
              <div className="nyx-research-prompt-icon">
                <Compass size={20} />
              </div>
              <div>
                <strong>Research before you create</strong>
                <p>
                  Gather references, links, inspiration and useful
                  information for this project.
                </p>
                <button onClick={onResearch}>
                  Open Research Hub
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {studio.id === "music" && (
              <div className="nyx-genre-picker">
                <strong>Choose a music direction</strong>
                <div className="nyx-genre-options">
                  {GENRES.map(item => (
                    <button
                      key={item}
                      className={genre === item ? "selected" : ""}
                      onClick={() => setGenre(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {["storytelling", "audiobook", "characters", "scene"].includes(
              studio.id
            ) && (
              <div className="nyx-studio-tip">
                <Sparkles size={17} />
                <span>
                  You can describe your idea naturally. NYX will help
                  organise the creative direction.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="nyx-message-list">
            {messages.map((item, index) => (
              <MessageBubble
                key={item.id || index}
                message={item}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {activeChat?.researchReferences?.length > 0 && (
        <section className="nyx-attached-research">
          <div className="nyx-attached-research-heading">
            <Compass size={16} />
            <strong>Project research</strong>
            <span>{activeChat.researchReferences.length}</span>
          </div>

          <div className="nyx-attached-research-list">
            {activeChat.researchReferences.map((reference, index) => (
              <a
                key={reference.id || reference.url || index}
                href={reference.url}
                target="_blank"
                rel="noreferrer"
              >
                <LinkIcon size={14} />
                <span>{reference.label || reference.url}</span>
                <ExternalLink size={13} />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="nyx-chat-composer-wrap">
        <div className="nyx-service-note">
          NYX workspace · Some AI and creation services are still being connected.
        </div>

        <div className="nyx-chat-composer">
          <button
            className="nyx-icon-button"
            title="Research"
            onClick={onResearch}
          >
            <Compass size={19} />
          </button>

          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${studio.name}...`}
            rows={1}
          />

          <button
            className="nyx-send-button"
            onClick={submitMessage}
            disabled={!message.trim()}
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}function AuthPage({
  mode,
  setMode,
  onSignIn,
  onSignUp,
  busy,
  error,
  notice,
  onBack
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const submit = event => {
    event.preventDefault();

    if (mode === "signup") {
      onSignUp(email.trim(), password, displayName.trim());
    } else {
      onSignIn(email.trim(), password);
    }
  };

  return (
    <div className="nyx-page nyx-auth-page">
      <header className="nyx-topbar">
        <button className="nyx-back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="nyx-brand">
          <span className="nyx-brand-symbol">N</span>
          <span>NYX</span>
        </div>
      </header>

      <main className="nyx-auth-content">
        <div className="nyx-auth-icon">
          <Sparkles size={30} />
        </div>

        <span className="nyx-eyebrow">YOUR CREATIVE SPACE</span>

        <h1>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>

        <p>
          {mode === "signup"
            ? "Create an account to save your conversations and projects."
            : "Sign in to continue working on your creative projects."}
        </p>

        <form onSubmit={submit} className="nyx-auth-form">
          {mode === "signup" && (
            <label>
              Your name
              <input
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                placeholder="Enter your name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Enter your password"
              minLength={6}
              required
            />
          </label>

          {error && <div className="nyx-form-error">{error}</div>}
          {notice && <div className="nyx-form-notice">{notice}</div>}

          <button
            className="nyx-primary-button nyx-auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
            {!busy && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="nyx-auth-switch">
          {mode === "signup"
            ? "Already have an account?"
            : "New to NYX?"}

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </div>
      </main>
    </div>
  );
}

function ProjectsPage({
  projects,
  onOpen,
  onRename,
  onDelete,
  onImport,
  importing,
  onBack
}) {
  return (
    <div className="nyx-page nyx-projects-page">
      <header className="nyx-topbar">
        <button className="nyx-back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="nyx-brand">
          <span className="nyx-brand-symbol">N</span>
          <span>My projects</span>
        </div>

        <button
          className="nyx-icon-button"
          onClick={onImport}
          disabled={importing}
          title="Import conversations"
        >
          <Upload size={19} />
        </button>
      </header>

      <main className="nyx-projects-content">
        <div className="nyx-section-heading">
          <div>
            <span className="nyx-eyebrow">YOUR WORKSPACE</span>
            <h1>My projects</h1>
            <p>Your saved creative conversations and work.</p>
          </div>
        </div>

        {importing && (
          <div className="nyx-form-notice">Importing your conversations...</div>
        )}

        {projects.length === 0 ? (
          <div className="nyx-empty-state nyx-projects-empty">
            <FolderOpen size={36} />
            <h3>Your projects will appear here</h3>
            <p>
              Start a conversation in any studio. Your saved projects
              will be listed here.
            </p>
          </div>
        ) : (
          <div className="nyx-project-list">
            {projects.map(project => {
              const studio = findStudio(project.studio);

              return (
                <article className="nyx-project-card" key={project.id}>
                  <button
                    className="nyx-project-open"
                    onClick={() => onOpen(project)}
                  >
                    <div className="nyx-project-icon">
                      {studio?.icon || <FolderOpen size={20} />}
                    </div>

                    <div className="nyx-project-info">
                      <strong>{project.title || "Untitled project"}</strong>
                      <span>{studio?.name || "Creative project"}</span>
                      <small>
                        Updated {formatDate(project.updatedAt || project.createdAt)}
                      </small>
                    </div>

                    <ChevronRight size={18} />
                  </button>

                  <div className="nyx-project-actions">
                    <button onClick={() => onRename(project)}>
                      <Pencil size={14} />
                      Rename
                    </button>

                    <button onClick={() => onDelete(project.id)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function SecondaryPage({
  page,
  user,
  onBack,
  onNavigate,
  onSignOut
}) {
  const content = {
    real: {
      icon: <Compass size={28} />,
      title: "Explore",
      description:
        "Discover creative ideas, possibilities and inspiration for your next project.",
      details: [
        "Explore the creative studios",
        "Start a new project",
        "Collect references in the Research Hub"
      ]
    },
    showme: {
      icon: <Sparkles size={28} />,
      title: "Show me",
      description:
        "A place to explore what NYX can help you create.",
      details: [
        "Films and videos",
        "Music and sound",
        "Stories and audiobooks",
        "Characters, scenes and games"
      ]
    },
    settings: {
      icon: <Settings size={28} />,
      title: "Settings",
      description:
        "Your account and workspace settings.",
      details: [
        "Your account is managed through your NYX sign-in.",
        "More workspace controls will be added as the platform grows."
      ]
    },
    inbox: {
      icon: <MessageCircle size={28} />,
      title: "Inbox",
      description:
        "Your NYX messages and updates.",
      details: [
        "You don't have any new messages yet."
      ]
    },
    profile: {
      icon: <UserRound size={28} />,
      title: "Your profile",
      description:
        user?.email || "Sign in to access your profile.",
      details: [
        user?.user_metadata?.full_name
          ? `Name: ${user.user_metadata.full_name}`
          : "Your NYX account"
      ]
    },
    notifications: {
      icon: <Bell size={28} />,
      title: "Notifications",
      description:
        "Important updates from your creative workspace.",
      details: [
        "You're all caught up. New notifications will appear here."
      ]
    }
  };

  const current = content[page] || content.real;

  return (
    <div className="nyx-page nyx-secondary-page">
      <header className="nyx-topbar">
        <button className="nyx-back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="nyx-brand">
          <span className="nyx-brand-symbol">N</span>
          <span>NYX</span>
        </div>
      </header>

      <main className="nyx-secondary-content">
        <div className="nyx-secondary-icon">{current.icon}</div>

        <span className="nyx-eyebrow">NYX WORKSPACE</span>
        <h1>{current.title}</h1>
        <p>{current.description}</p>

        <div className="nyx-secondary-details">
          {current.details.map((detail, index) => (
            <div className="nyx-secondary-detail" key={index}>
              <span className="nyx-detail-check">
                <Check size={15} />
              </span>
              {detail}
            </div>
          ))}
        </div>

        {page === "profile" && user && (
          <button
            className="nyx-secondary-action"
            onClick={onSignOut}
          >
            <LogOut size={17} />
            Sign out
          </button>
        )}

        {page === "profile" && !user && (
          <button
            className="nyx-primary-button"
            onClick={() => onNavigate("auth")}
          >
            Sign in
            <ChevronRight size={18} />
          </button>
        )}

        {["real", "showme"].includes(page) && (
          <button
            className="nyx-primary-button"
            onClick={() => onNavigate("create")}
          >
            Explore studios
            <ChevronRight size={18} />
          </button>
        )}
      </main>
    </div>
  );
}    } finally {
      setImporting(false);
    }
  };

  const signIn = async (email, password) => {
    setAuthBusy(true);
    setAuthError("");
    setAuthNotice("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setPage("home");
      setNotice("Welcome back to NYX.");
    } catch (error) {
      setAuthError(error.message || "Unable to sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signUp = async (email, password, displayName) => {
    setAuthBusy(true);
    setAuthError("");
    setAuthNotice("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName
          }
        }
      });

      if (error) throw error;

      if (data?.session) {
        setPage("home");
        setNotice("Your NYX account has been created.");
      } else {
        setAuthNotice(
          "Account created. Check your email to confirm your account, then sign in."
        );
        setAuthMode("signin");
      }
    } catch (error) {
      setAuthError(error.message || "Unable to create your account.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setNotice("Unable to sign out. Please try again.");
      return;
    }

    setUser(null);
    setActiveId(null);
    setStudioId(null);
    setPage("home");
    setNotice("You have signed out.");
  };

  const openProject = project => {
    setStudioId(project.studio);
    setActiveId(project.id);
    setPage("studio");
    setNotice("");
  };

  const openResearch = () => {
    if (!user) {
      setAuthMode("signin");
      setPage("auth");
      setAuthError("");
      setAuthNotice("Sign in to add research to your projects.");
      return;
    }

    setPage("research");
    setNotice("");
  };

  const attachResearch = async references => {
    if (!user) {
      setPage("auth");
      setAuthNotice("Sign in to save research to your projects.");
      return;
    }

    if (!references?.length) {
      setPage("studio");
      return;
    }

    let chat = chats.find(item => item.id === activeId);

    if (!chat || chat.studio !== studioId) {
      const now = new Date().toISOString();

      chat = {
        id: makeId(),
        cloudId: null,
        title: "Research project",
        studio: studioId || "storytelling",
        messages: [],
        genre,
        researchReferences: [],
        createdAt: now,
        updatedAt: now
      };
    }

    const existingReferences = chat.researchReferences || [];
    const existingUrls = new Set(
      existingReferences.map(reference => reference.url)
    );

    const newReferences = references.filter(
      reference => !existingUrls.has(reference.url)
    );

    const updatedChat = {
      ...chat,
      researchReferences: [
        ...existingReferences,
        ...newReferences
      ],
      updatedAt: new Date().toISOString()
    };

    setChats(previous => {
      const exists = previous.some(item => item.id === updatedChat.id);

      return exists
        ? previous.map(item =>
            item.id === updatedChat.id ? updatedChat : item
          )
        : [updatedChat, ...previous];
    });

    setActiveId(updatedChat.id);
    setStudioId(updatedChat.studio);
    setPage("studio");

    await saveChatToCloud(updatedChat);

    setNotice(
      newReferences.length
        ? `${newReferences.length} research reference(s) attached to your project.`
        : "Those references are already attached to this project."
    );
  };

  const navigate = targetPage => {
    setPage(targetPage);
    setNotice("");
  };

  if (authLoading) {
    return (
      <div className="nyx-loading-screen">
        <div className="nyx-loading-logo">N</div>
        <strong>NYX</strong>
        <span>Preparing your creative space...</span>
      </div>
    );
  }

  return (
    <div className="nyx-app">
      {page === "home" && (
        <HomePage
          onOpenStudio={openStudio}
          onNavigate={navigate}
          user={user}
        />
      )}

      {page === "create" && (
        <HomePage
          onOpenStudio={openStudio}
          onNavigate={navigate}
          user={user}
        />
      )}

      {page === "studio" && (
        <ChatPage
          studio={currentStudio}
          chats={chats}
          activeId={activeId}
          setActiveId={setActiveId}
          onBack={() => navigate("home")}
          onNew={() => createChat(studioId)}
          onSend={sendMessage}
          onDelete={deleteChat}
          onResearch={openResearch}
          genre={genre}
          setGenre={setGenre}
          user={user}
          onRequireAuth={() => {
            setAuthMode("signin");
            setPage("auth");
          }}
        />
      )}

      {page === "research" && (
        <ResearchHub
          studio={currentStudio}
          onBack={() => navigate(studioId ? "studio" : "home")}
          onAttach={attachResearch}
        />
      )}

      {page === "auth" && (
        <AuthPage
          mode={authMode}
          setMode={setAuthMode}
          onSignIn={signIn}
          onSignUp={signUp}
          busy={authBusy}
          error={authError}
          notice={authNotice}
          onBack={() => navigate("home")}
        />
      )}

      {page === "projects" && (
        <ProjectsPage
          projects={projects}
          onOpen={openProject}
          onRename={renameProject}
          onDelete={deleteChat}
          onImport={importConversations}
          importing={importing}
          onBack={() => navigate("home")}
        />
      )}

      {[
        "real",
        "showme",
        "settings",
        "inbox",
        "profile",
        "notifications"
      ].includes(page) && (
        <SecondaryPage
          page={page}
          user={user}
          onBack={() => navigate("home")}
          onNavigate={navigate}
          onSignOut={signOut}
        />
      )}

      {notice && (
        <div className="nyx-toast">
          <span>{notice}</span>
          <button
            className="nyx-icon-button"
            onClick={() => setNotice("")}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {["home", "create"].includes(page) && (
        <nav className="nyx-bottom-nav">
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => navigate("home")}
          >
            <Home size={19} />
            <span>Home</span>
          </button>

          <button
            className={page === "create" ? "active" : ""}
            onClick={() => navigate("create")}
          >
            <Plus size={19} />
            <span>Create</span>
          </button>

          <button
            onClick={() => navigate("projects")}
          >
            <FolderOpen size={19} />
            <span>Projects</span>
          </button>

          <button
            onClick={() => navigate(user ? "profile" : "auth")}
          >
            <UserRound size={19} />
            <span>Account</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
