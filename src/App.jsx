import React, { useEffect, useRef, useState } from "react";
import {
  Home, Plus, Film, Music, BookOpen, Mic, Gamepad2,
  Megaphone, UserRound, AudioLines, Clapperboard, Laugh,
  Upload, Bell, MessageCircle, Send, Paperclip, ArrowLeft,
  X, Trash2, Clock, Sparkles, ChevronRight, FolderOpen,
  Search, WandSparkles, Headphones, Video, CircleStop,
  Camera, Layers, Volume2, Image, Star, Disc3, Palette,
  Radio, PenTool, Play, Compass, Settings
} from "lucide-react";

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

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

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

function Composer({ onSend }) {
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
    setFiles(previous=>[
      ...previous,
      ...Array.from(event.target.files||[])
    ]);

    event.target.value="";
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
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio:true
      });

      stream.current = audioStream;
      chunks.current = [];

      const media = new MediaRecorder(audioStream);
      recorder.current = media;

      media.ondataavailable = event => {
        if (event.data.size) {
          chunks.current.push(event.data);
        }
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

          onSend({
            text:"",
            audio,
            files:[]
          });
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

      {error && (
        <p className="nyx-composer-error">{error}</p>
      )}

      {recording && (
        <p className="nyx-recording-status">
          <span/>
          Recording your voice note. Tap stop when finished.
        </p>
      )}

      <form className="nyx-composer" onSubmit={submit}>

        <button
          type="button"
          onClick={()=>fileInput.current?.click()}
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
          placeholder="Tell NYX what you imagine..."
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
        >
          {recording
            ? <CircleStop size={20}/>
            : <Mic size={20}/>
          }
        </button>

        <button
          type="submit"
          className="nyx-send-button"
          disabled={!text.trim()&&files.length===0}
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
          <div className="nyx-message-bubble">
            {item.text}
          </div>
        )}

        {item.audio && (
          <div className="nyx-audio-message">
            <Mic size={16}/>
            <audio controls src={item.audio}>
              Audio playback is not supported.
            </audio>
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

/* CONVERSATION HISTORY */

function ConversationHistory({
  conversations,
  activeId,
  onOpen,
  onNew,
  onDelete
}) {
  return (
    <aside className="nyx-history-panel">

      <div className="nyx-history-heading">
        <div>
          <span className="nyx-eyebrow">YOUR SPACE</span>
          <h3>Conversations</h3>
        </div>

        <button onClick={onNew} aria-label="New conversation">
          <Plus size={20}/>
        </button>
      </div>

      <button className="nyx-new-chat" onClick={onNew}>
        <Plus size={17}/>
        New conversation
      </button>

      <div className="nyx-history-list">

        {conversations.length===0 ? (
          <div className="nyx-empty-history">
            <MessageCircle size={25}/>
            <p>Your conversations will appear here.</p>
            <small>
              Start an idea and return to it whenever you like.
            </small>
          </div>
        ) : (
          conversations.map(chat=>(
            <div
              className={`nyx-history-item ${
                activeId===chat.id?"selected":""
              }`}
              key={chat.id}
            >

              <button
                className="nyx-history-open"
                onClick={()=>onOpen(chat.id)}
              >
                <MessageCircle size={16}/>

                <span>
                  <strong>{chat.title}</strong>
                  <small>{formatDate(chat.updatedAt)}</small>
                </span>
              </button>

              <button
                className="nyx-delete-chat"
                onClick={()=>onDelete(chat.id)}
                aria-label="Delete conversation"
              >
                <Trash2 size={14}/>
              </button>

            </div>
          ))
        )}

      </div>
    </aside>
  );
}

/* HOME PAGE */

function HomePage({
  navigate,
  openStudio,
  search,
  setSearch,
  setNotice
}) {
  const filtered = STUDIOS.filter(studio=>
    `${studio.name} ${studio.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="nyx-main">

      <header className="nyx-header">

        <button
          className="nyx-logo"
          onClick={()=>navigate("home")}
        >
          <span className="nyx-logo-mark">N</span>
          <span>NYX</span>
        </button>

        <div className="nyx-header-actions">
          <button
            onClick={()=>navigate("notifications")}
            aria-label="Notifications"
          >
            <Bell size={19}/>
          </button>

          <button
            onClick={()=>navigate("profile")}
            aria-label="Profile"
          >
            <UserRound size={19}/>
          </button>
        </div>

      </header>

      <section className="nyx-hero">

        <span className="nyx-eyebrow">
          <Sparkles size={14}/>
          THE CREATIVE UNIVERSE
        </span>

        <h1>
          Imagine beyond.
          <br/>
          <span>Create everything.</span>
        </h1>

        <p>
          One idea can become a story, a film, a song or an entire world.
        </p>

        <button
          className="nyx-primary-button"
          onClick={()=>navigate("create")}
        >
          <WandSparkles size={18}/>
          Start creating
        </button>

      </section>

      <section className="nyx-shortcuts">

        <button onClick={()=>navigate("create")}>
          <Plus size={21}/>
          <span>
            <strong>Create something</strong>
            <small>Talk to NYX</small>
          </span>
        </button>

        <button
          onClick={()=>setNotice(
            "Your project library will be connected in the project-management stage."
          )}
        >
          <FolderOpen size={21}/>
          <span>
            <strong>My projects</strong>
            <small>Your creative work</small>
          </span>
        </button>

        <button onClick={()=>navigate("real")}>
          <Film size={21}/>
          <span>
            <strong>Real</strong>
            <small>Explore creative work</small>
          </span>
        </button>

      </section>

      <section className="nyx-studios-section">

        <div className="nyx-section-heading">
          <div>
            <span className="nyx-eyebrow">
              YOUR IDEAS. YOUR UNIVERSE.
            </span>

            <h2>Explore the studios</h2>

            <p>
              Choose a studio or simply tell NYX what you want.
            </p>
          </div>

          <span className="nyx-studio-count">
            12 studios
          </span>
        </div>

        <div className="nyx-search">
          <Search size={17}/>

          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Find a studio..."
          />
        </div>

        <div className="nyx-studio-grid">
          {filtered.map(studio=>(
            <StudioCard
              key={studio.id}
              studio={studio}
              onClick={()=>openStudio(studio.id)}
            />
          ))}
        </div>

        {filtered.length===0 && (
          <p className="nyx-empty-search">
            No studios match that search.
          </p>
        )}

      </section>

      <footer className="nyx-home-footer">
        <Sparkles size={16}/>
        Your imagination leads. NYX brings the creative tools together.
      </footer>

    </main>
  );
}

/* CHAT PAGE */

function ChatPage({
  studio,
  chats,
  activeId,
  setActiveId,
  onBack,
  onNew,
  onSend,
  onDelete,
  genre,
  setGenre,
  setNotice
}) {
  const [mobileHistory,setMobileHistory] = useState(false);

  const activeChat = chats.find(chat=>chat.id===activeId);

  const history = chats.filter(chat=>
    chat.studioId===(studio?.id||null)
  );

  const Icon = studio?.icon || Sparkles;

  function openChat(id) {
    setActiveId(id);
    setMobileHistory(false);
  }

  return (
    <main className="nyx-chat-page">

      <header className="nyx-chat-header">

        <button
          className="nyx-back-button"
          onClick={onBack}
          aria-label="Back to home"
        >
          <ArrowLeft size={20}/>
        </button>

        <div className="nyx-chat-brand">

          <div className="nyx-chat-brand-icon">
            <Icon size={21}/>
          </div>

          <div>
            <strong>
              {studio?studio.name:"Talk to NYX"}
            </strong>

            <small>
              {studio?"Your creative studio":"Your creative space"}
            </small>
          </div>

        </div>

        <button
          className="nyx-header-icon"
          onClick={()=>setMobileHistory(v=>!v)}
          aria-label="Conversation history"
        >
          <Clock size={19}/>
        </button>

        <button
          className="nyx-header-icon"
          onClick={onNew}
          aria-label="New conversation"
        >
          <Plus size={21}/>
        </button>

      </header>

      <div className="nyx-chat-layout">

        <div className={`nyx-history-wrapper ${
          mobileHistory?"mobile-open":""
        }`}>

          <ConversationHistory
            conversations={history}
            activeId={activeId}
            onOpen={openChat}
            onNew={onNew}
            onDelete={onDelete}
          />

          <button
            className="nyx-history-close"
            onClick={()=>setMobileHistory(false)}
          >
            <X size={18}/>
            Close
          </button>

        </div>

        <section className="nyx-chat-main">

          <div className="nyx-messages">

            {!activeChat || activeChat.messages.length===0 ? (

              <div className="nyx-chat-welcome">

                <div className="nyx-welcome-symbol">
                  <Icon size={34}/>
                </div>

                <span className="nyx-eyebrow">
                  WELCOME TO NYX
                </span>

                <h1>
                  {studio
                    ? `Let's create in ${studio.name}.`
                    : "What are we imagining today?"
                  }
                </h1>

                <p>
                  {studio
                    ? `${studio.description} Tell NYX what you imagine, in your own words.`
                    : "Tell NYX your idea naturally. You don't need to learn complicated software or technical terms."
                  }
                </p>

                <div className="nyx-feature-note">
                  <Sparkles size={18}/>
                  NYX is designed to coordinate the studios for a project,
                  so you won't have to move your ideas and assets between
                  them yourself.
                </div>

                {studio?.id==="music" && (
                  <div className="nyx-genre-section">
                    <span>Explore music styles (optional)</span>

                    <div className="nyx-genre-list">
                      {GENRES.map(item=>(
                        <button
                          key={item}
                          className={genre===item?"selected":""}
                          onClick={()=>{
                            setGenre(item);
                            setNotice(`${item} selected as a music style.`);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {studio?.id==="storytelling" && (
                  <div className="nyx-feature-note">
                    <BookOpen size={18}/>
                    Write books, develop chapters, edit stories and scripts.
                  </div>
                )}

                {studio?.id==="audiobook" && (
                  <div className="nyx-feature-note">
                    <Headphones size={18}/>
                    Plan chapter-level audiobooks with distinct character
                    dialogue voices as well as narration. Voice profiles
                    can describe tone, pitch, accent, pacing and emotion.
                  </div>
                )}

                {studio?.id==="characters" && (
                  <div className="nyx-feature-note">
                    <UserRound size={18}/>
                    Build character personalities and voice profiles that
                    can be shared with the Storytelling, Film and Audiobook
                    studios.
                  </div>
                )}

                {studio?.id==="scene" && (
                  <div className="nyx-feature-note">
                    <Film size={18}/>
                    Describe the character and scene you want to bring together.
                  </div>
                )}

              </div>

            ) : (

              <div className="nyx-message-list">

                <h3 className="nyx-active-chat-title">
                  {activeChat.title}
                </h3>

                {activeChat.messages.map(item=>(
                  <MessageBubble key={item.id} item={item}/>
                ))}

                <div className="nyx-engine-notice">
                  <Sparkles size={15}/>
                  Your conversation is saved on this device. Connect the
                  AI and generation services to enable live creative responses.
                </div>

              </div>

            )}

          </div>

          <Composer onSend={onSend}/>

        </section>

      </div>

    </main>
  );
}

/* SECONDARY PAGES */

function SecondaryPage({ page, navigate }) {

  const details = {
    real:{
      title:"Real",
      description:"A space for real creative work, videos and projects. Community publishing will be connected in a later stage.",
      icon:Film
    },

    showme:{
      title:"Show Me",
      description:"Explore what NYX can help you create, discover studio examples and learn how the creative tools work.",
      icon:Compass
    },

    settings:{
      title:"Settings",
      description:"Your account, appearance, privacy and app preferences will live here.",
      icon:Settings
    },

    inbox:{
      title:"Your Inbox",
      description:"Messages and conversations with other creators will appear here.",
      icon:MessageCircle
    },

    profile:{
      title:"Your Profile",
      description:"Your creative identity, projects and creator information.",
      icon:UserRound
    },

    notifications:{
      title:"Notifications",
      description:"Your NYX notifications will appear here.",
      icon:Bell
    }
  };

  const detail=details[page]||details.showme;
  const Icon=detail.icon;

  return (
    <main className="nyx-placeholder-page">

      <div className="nyx-placeholder-icon">
        <Icon size={32}/>
      </div>

      <span className="nyx-eyebrow">
        THE CREATIVE UNIVERSE
      </span>

      <h1>{detail.title}</h1>

      <p>{detail.description}</p>

      <small>
        THIS AREA WILL BE CONNECTED IN A FUTURE DEVELOPMENT STAGE.
      </small>

      <button
        className="nyx-primary-button"
        onClick={()=>navigate("home")}
      >
        <ArrowLeft size={17}/>
        Return home
      </button>

    </main>
  );
}

/* MAIN APP */

export default function App() {

  const [page,setPage] = useState("home");
  const [studioId,setStudioId] = useState(null);
  const [chats,setChats] = useState(loadConversations);
  const [activeId,setActiveId] = useState(null);
  const [search,setSearch] = useState("");
  const [genre,setGenre] = useState("");
  const [notice,setNotice] = useState("");

  useEffect(()=>{
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
      );
    } catch {
      setNotice("Your device could not save more conversations.");
    }
  },[chats]);

  const currentStudio=findStudio(studioId);

  // Navigation deliberately preserves the selected conversation.
  function navigate(destination) {
    setPage(destination);

    if(destination!=="studio") {
      setStudioId(null);
    }

    setNotice("");
  }

  function openStudio(id) {
    setStudioId(id);
    setPage("studio");
    setGenre("");
    setNotice("");

    const activeBelongsHere = chats.some(
      chat=>chat.id===activeId && chat.studioId===id
    );

    if(!activeBelongsHere) {
      const latest = chats.find(chat=>chat.studioId===id);
      setActiveId(latest?.id || null);
    }
  }

  function createChat(targetStudio=null) {

    const studio=targetStudio
      ? findStudio(targetStudio)
      : null;

    const now=Date.now();

    const chat={
      id:makeId(),
      title:"New conversation",
      studioId:targetStudio,
      studioName:studio?.name||null,
      createdAt:now,
      updatedAt:now,
      messages:[]
    };

    setChats(previous=>[chat,...previous]);
    setActiveId(chat.id);
  }

  function newConversation() {
    createChat(page==="studio"?studioId:null);
  }

  function sendMessage(payload) {

    const targetStudio=page==="studio"
      ? studioId
      : null;

    let chat=chats.find(
      item=>item.id===activeId &&
      item.studioId===targetStudio
    );

    if(!chat) {

      const studio=targetStudio
        ? findStudio(targetStudio)
        : null;

      const now=Date.now();

      chat={
        id:makeId(),
        title:"New conversation",
        studioId:targetStudio,
        studioName:studio?.name||null,
        createdAt:now,
        updatedAt:now,
        messages:[]
      };
    }

    const now=Date.now();

    const message={
      id:makeId(),
      role:"user",
      text:payload.text||"",
      audio:payload.audio||null,
      files:payload.files||[],
      createdAt:now
    };

    const updated={
      ...chat,

      title:
        chat.messages.length===0 && payload.text
          ? getTitle(payload.text)
          : chat.title,

      messages:[...chat.messages,message],
      updatedAt:now
    };

    setChats(previous=>{

      const exists=previous.some(
        item=>item.id===chat.id
      );

      return exists
        ? previous.map(item=>
            item.id===chat.id ? updated : item
          )
        : [updated,...previous];

    });

    setActiveId(chat.id);
  }

  function deleteChat(id) {

    setChats(previous=>
      previous.filter(chat=>chat.id!==id)
    );

    if(activeId===id) {
      setActiveId(null);
    }
  }

  return (
    <div className="nyx-app">

      {page==="home" && (
        <HomePage
          navigate={navigate}
          openStudio={openStudio}
          search={search}
          setSearch={setSearch}
          setNotice={setNotice}
        />
      )}

      {page==="create" && (
        <ChatPage
          key="general-chat"
          studio={null}
          chats={chats.filter(chat=>chat.studioId===null)}
          activeId={activeId}
          setActiveId={setActiveId}
          onBack={()=>navigate("home")}
          onNew={newConversation}
          onSend={sendMessage}
          onDelete={deleteChat}
          genre={genre}
          setGenre={setGenre}
          setNotice={setNotice}
        />
      )}

      {page==="studio" && currentStudio && (
        <ChatPage
          key={currentStudio.id}
          studio={currentStudio}
          chats={chats.filter(
            chat=>chat.studioId===currentStudio.id
          )}
          activeId={activeId}
          setActiveId={setActiveId}
          onBack={()=>navigate("home")}
          onNew={newConversation}
          onSend={sendMessage}
          onDelete={deleteChat}
          genre={genre}
          setGenre={setGenre}
          setNotice={setNotice}
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
          navigate={navigate}
        />
      )}

      {/* Navigation remains visible on every page, including studios. */}

      <nav className="nyx-bottom-nav">

        {NAV_ITEMS.map(item=>{

          const Icon=item.icon;

          return (
            <button
              key={item.id}
              className={page===item.id?"active":""}
              onClick={()=>navigate(item.id)}
            >
              <Icon size={20}/>
              <span>{item.label}</span>
            </button>
          );

        })}

      </nav>

      {notice && (
        <div className="nyx-notice">
          <span>{notice}</span>

          <button onClick={()=>setNotice("")}>
            <X size={16}/>
          </button>
        </div>
      )}

    </div>
  );
}
