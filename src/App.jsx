
import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles, Home, Compass, Film, MessageCircle, UserRound,
  Settings, Bell, Search, Plus, Mic, Square, Send,
  Music2, Gamepad2, BookOpen, Headphones, Users,
  Clapperboard, Image, Laugh, AudioLines, Layers3,
  Video, WandSparkles, Upload, ChevronRight, X,
  Play, Bookmark, Heart, Menu, ArrowLeft, Globe,
  Stars, Rocket, Palette, CircleHelp
} from "lucide-react";

const studios = [
  {
    id: "marketing",
    name: "Marketing & Advertising",
    short: "Ads, campaigns and brands",
    description: "Create campaigns, adverts, brand stories and promotional content.",
    icon: Sparkles,
    color: "pink"
  },
  {
    id: "video",
    name: "Video Editing",
    short: "Edit and transform videos",
    description: "Edit videos, add effects, transitions, captions and visual styles.",
    icon: Video,
    color: "blue"
  },
  {
    id: "film",
    name: "Film & Movie Production",
    short: "Bring films to life",
    description: "Bring film ideas, scenes, characters and complete productions to life.",
    icon: Clapperboard,
    color: "purple"
  },
  {
    id: "music",
    name: "Music & Beat Production",
    short: "Make original music",
    description: "Create original songs, beats, instrumentals and sounds across genres.",
    icon: Music2,
    color: "orange"
  },
  {
    id: "games",
    name: "Game Creation",
    short: "Build your game world",
    description: "Develop game concepts, worlds, characters and gameplay experiences.",
    icon: Gamepad2,
    color: "green"
  },
  {
    id: "story",
    name: "Storytelling & Voice",
    short: "Write stories and scripts",
    description: "Write novels, stories, scripts, dialogue and spoken content.",
    icon: BookOpen,
    color: "gold"
  },
  {
    id: "audiobook",
    name: "Audiobook Production",
    short: "Turn books into audio",
    description: "Turn written work into narrated, chapter-based audiobooks.",
    icon: Headphones,
    color: "cyan"
  },
  {
    id: "characters",
    name: "Character Creation",
    short: "Design original characters",
    description: "Design original characters and maintain their identity across projects.",
    icon: Users,
    color: "rose"
  },
  {
    id: "soundtrack",
    name: "Soundtrack & Background Music",
    short: "Give scenes a sound",
    description: "Create music and soundscapes for films, games and other projects.",
    icon: AudioLines,
    color: "indigo"
  },
  {
    id: "scene",
    name: "Step Into The Scene",
    short: "Enter your video scenes",
    description: "Place your chosen characters into video scenes you own or may edit.",
    icon: Layers3,
    color: "violet"
  },
  {
    id: "comedy",
    name: "Comedy & Humour",
    short: "Make people laugh",
    description: "Create jokes, skits, funny stories and entertaining characters.",
    icon: Laugh,
    color: "yellow"
  },
  {
    id: "import",
    name: "Import & Export",
    short: "Bring files in and out",
    description: "Bring in your creative files and export finished projects.",
    icon: Upload,
    color: "teal"
  }
];

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "create", label: "Create", icon: WandSparkles },
  { id: "reels", label: "Reels", icon: Film },
  { id: "inbox", label: "Inbox", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: UserRound }
];

function findStudios(message) {
  const text = message.toLowerCase();

  const rules = [
    { words: ["advert", "marketing", "campaign", "brand", "promote"], ids: ["marketing"] },
    { words: ["edit video", "video edit", "video", "clip", "transition"], ids: ["video"] },
    { words: ["film", "movie", "cinema"], ids: ["film"] },
    { words: ["song", "music", "beat", "instrumental", "gengetone", "mugithi", "urbantone"], ids: ["music"] },
    { words: ["game", "gaming", "gameplay"], ids: ["games"] },
    { words: ["novel", "book", "story", "script", "dialogue"], ids: ["story"] },
    { words: ["audiobook", "audio book", "narrate"], ids: ["audiobook"] },
    { words: ["character", "avatar"], ids: ["characters"] },
    { words: ["soundtrack", "background music", "film score"], ids: ["soundtrack"] },
    { words: ["put me in", "insert", "step into"], ids: ["scene"] },
    { words: ["comedy", "funny", "joke", "skit", "humour", "humor"], ids: ["comedy"] },
    { words: ["import", "export", "upload file", "download project"], ids: ["import"] }
  ];

  let found = rules
    .filter(rule => rule.words.some(word => text.includes(word)))
    .flatMap(rule => rule.ids);

  // Suggest connected studios for common multi-part projects.
  if (text.includes("music video")) {
    found.push("music", "video");
  }

  if (text.includes("audiobook")) {
    found.push("story", "audiobook");
  }

  if (text.includes("make a film") || text.includes("create a film")) {
    found.push("film", "story", "characters", "soundtrack", "video");
  }

  if (text.includes("movie scene") || text.includes("put my character")) {
    found.push("characters", "scene", "video");
  }

  if (text.includes("comedy skit")) {
    found.push("comedy", "story", "video");
  }

  if (text.includes("advert for") || text.includes("advertisement")) {
    found.push("marketing");
  }

  return [...new Set(found)];
}

export default function App() {
  const [page, setPage] = useState("home");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState([]);
  const [request, setRequest] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAllStudios, setShowAllStudios] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
    };
  }, [recordedAudio]);

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileMenu(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseStudio(id) {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );

    setPage("create");
    setNotice("Studio selection updated. You are in control of your creative team.");
  }

  function startRequest() {
    if (!message.trim() && !recordedAudio) {
      setNotice("Tell NYX what you would like to create first.");
      return;
    }

    if (!message.trim() && recordedAudio) {
      setNotice("Your voice note is recorded. Voice understanding will be connected in a later stage.");
      return;
    }

    const matches = findStudios(message);

    setRequest(message.trim());

    if (matches.length) {
      setSelected(current => [...new Set([...current, ...matches])]);
      setNotice("NYX has suggested studios based on your words. Review and change them before creating.");
    } else {
      setNotice("I need a little more detail or a studio selection to guide this project.");
    }

    setPage("create");
    setMessage("");
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice("Voice recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });

        setRecordedAudio(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());

        setNotice("Your voice note is ready. Voice-to-text understanding is not connected yet.");
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setNotice("Recording your voice note… tap the microphone button again to finish.");
    } catch {
      setNotice("Microphone access was not granted. Check your browser permissions.");
    }
  }

  function clearVoiceNote() {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
    }
    setRecordedAudio("");
    setNotice("Voice note removed.");
  }

  const filteredStudios = studios.filter(studio =>
    `${studio.name} ${studio.description} ${studio.short}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedStudios = studios.filter(studio =>
    selected.includes(studio.id)
  );

  function renderStudioCard(studio) {
    const Icon = studio.icon;
    const active = selected.includes(studio.id);

    return (
      <button
        type="button"
        key={studio.id}
        className={`studio-card studio-${studio.color} ${active ? "selected" : ""}`}
        onClick={() => chooseStudio(studio.id)}
      >
        <span className="studio-icon">
          <Icon size={23} />
        </span>

        <span className="studio-card-name">{studio.name}</span>
        <span className="studio-card-description">{studio.short}</span>

        <span className="studio-card-action">
          {active ? "Selected ✓" : "Explore studio"}
          <ChevronRight size={15} />
        </span>
      </button>
    );
  }

  return (
    <div className="nyx-app">

      {/* TOP BAR */}
      <header className="topbar">
        <button
          className="brand-button"
          onClick={() => navigate("home")}
          aria-label="NYX Home"
        >
          <span className="brand-symbol">
            <Sparkles size={22} />
          </span>
          <span className="brand-name">NYX</span>
          <span className="brand-subtitle">THE CREATIVE UNIVERSE</span>
        </button>

        <div className="topbar-actions">
          <button
            className="icon-button"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Help"
          >
            <CircleHelp size={19} />
          </button>

          <button
            className="icon-button"
            onClick={() => setNotice("Notifications will be connected with user accounts.")}
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>

          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Menu"
          >
            {mobileMenu ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="mobile-menu">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}>
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* HELP PANEL */}
      {showHelp && (
        <div className="help-panel">
          <button className="close-help" onClick={() => setShowHelp(false)}>
            <X size={17} />
          </button>
          <h3>Welcome to NYX ✨</h3>
          <p>
            Tell NYX what you imagine. Choose a studio yourself or let
            NYX suggest studios that could work together.
          </p>
          <p>
            Your projects remain under your control. Nothing is published
            automatically.
          </p>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* HOME */}
        {page === "home" && (
          <>
            <section className="welcome-section">
              <div className="welcome-copy">
                <span className="eyebrow">
                  <Stars size={14} /> YOUR IMAGINATION HAS NO LIMITS
                </span>

                <h1>
                  Imagine beyond.
                  <span>Create everything.</span>
                </h1>

                <p>
                  Welcome to NYX — your creative universe.
                  Bring your ideas, your voice and your imagination.
                  We'll help you find the right creative path.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("create")}
                >
                  <Rocket size={18} />
                  Start creating
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="cosmic-art">
                <div className="cosmic-orbit orbit-one" />
                <div className="cosmic-orbit orbit-two" />
                <div className="cosmic-planet">
                  <Sparkles size={42} />
                </div>
                <span className="cosmic-star star-one">✦</span>
                <span className="cosmic-star star-two">✧</span>
                <span className="cosmic-star star-three">✦</span>
                <span className="cosmic-caption">CREATE YOUR UNIVERSE</span>
              </div>
            </section>

            <section className="assistant-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR CREATIVE COMPANION</span>
                  <h2>Talk to NYX</h2>
                </div>
                <span className="assistant-status">
                  <span className="status-dot" /> Ready to explore
                </span>
              </div>

              <div className="assistant-card">
                <div className="assistant-intro">
                  <div className="assistant-avatar">
                    <Sparkles size={25} />
                  </div>
                  <div>
                    <h3>Hey, creator! 👋</h3>
                    <p>
                      What are we bringing to life today?
                      Tell me in your own words.
                    </p>
                  </div>
                </div>

                <div className="suggestion-chips">
                  {[
                    "Create a music video",
                    "Write a story",
                    "Make a funny skit",
                    "Design a character"
                  ].map(item => (
                    <button
                      key={item}
                      onClick={() => setMessage(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="composer">
                  <textarea
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                    placeholder="Describe anything you want to create..."
                    rows={2}
                    aria-label="Describe your creative idea"
                  />

                  <div className="composer-actions">
                    <button
                      className={`voice-button ${recording ? "recording" : ""}`}
                      onClick={toggleRecording}
                      aria-label={recording ? "Stop recording" : "Record voice note"}
                    >
                      {recording ? <Square size={19} /> : <Mic size={20} />}
                      <span>{recording ? "Stop" : "Voice note"}</span>
                    </button>

                    <button
                      className="send-button"
                      onClick={startRequest}
                      aria-label="Send idea"
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </div>

                {recordedAudio && (
                  <div className="voice-preview">
                    <audio controls src={recordedAudio} />
                    <button onClick={clearVoiceNote} aria-label="Remove voice note">
                      <X size={17} />
                    </button>
                  </div>
                )}
              </div>

              {notice && (
                <div className="notice-message">
                  <Sparkles size={16} />
                  {notice}
                </div>
              )}
            </section>

            <section className="studios-section" id="studios">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">12 CREATIVE WORLDS</span>
                  <h2>Explore the studios</h2>
                  <p className="section-description">
                    Twelve ways to turn imagination into something real.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setShowAllStudios(!showAllStudios)}
                >
                  {showAllStudios ? "Show less" : "Show all"}
                  <ChevronRight size={16} />
                </button>
              </div>

              {showAllStudios && (
                <div className="studio-grid">
                  {studios.map(renderStudioCard)}
                </div>
              )}
            </section>

            <section className="connection-section">
              <div className="connection-art">
                <div className="connection-orbit">
                  <Sparkles size={25} />
                </div>
                <span className="connection-node node-a"><Music2 size={17} /></span>
                <span className="connection-node node-b"><Video size={17} /></span>
                <span className="connection-node node-c"><BookOpen size={17} /></span>
                <span className="connection-node node-d"><Users size={17} /></span>
              </div>

              <div className="connection-copy">
                <span className="eyebrow">MORE THAN SEPARATE TOOLS</span>
                <h2>Studios that work together.</h2>
                <p>
                  A music video can use the Music and Video studios.
                  A novel can move into Audiobook Production.
                  A film can bring together stories, characters,
                  music and editing.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => navigate("create")}
                >
                  Explore connected creation
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="community-preview">
              <div>
                <span className="eyebrow">A UNIVERSE OF CREATORS</span>
                <h2>Your next creative chapter starts here.</h2>
                <p>
                  Reels, creator profiles and community features
                  will become part of the NYX experience.
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => navigate("reels")}
              >
                Explore Reels <Play size={16} />
              </button>
            </section>
          </>
        )}

        {/* CREATE */}
        {page === "create" && (
          <section className="create-page">
            <button className="back-button" onClick={() => navigate("home")}>
              <ArrowLeft size={17} /> Back home
            </button>

            <span className="eyebrow">YOUR CREATIVE WORKSPACE</span>
            <h1>Let's create something.</h1>
            <p className="page-intro">
              Choose one studio or combine several for a bigger project.
            </p>

            <div className="assistant-card create-assistant">
              <div className="assistant-intro">
                <div className="assistant-avatar">
                  <Sparkles size={25} />
                </div>
                <div>
                  <h3>Tell NYX your idea</h3>
                  <p>Use your own words. You don't need to know which studio to choose.</p>
                </div>
              </div>

              {request && (
                <div className="request-summary">
                  <strong>Your project idea</strong>
                  <p>{request}</p>
                </div>
              )}

              <div className="composer">
                <textarea
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="What would you like to make?"
                  rows={3}
                />
                <div className="composer-actions">
                  <button
                    className={`voice-button ${recording ? "recording" : ""}`}
                    onClick={toggleRecording}
                  >
                    {recording ? <Square size={19} /> : <Mic size={20} />}
                    <span>{recording ? "Stop" : "Voice note"}</span>
                  </button>
                  <button className="send-button" onClick={startRequest}>
                    <Send size={19} />
                  </button>
                </div>
              </div>

              {recordedAudio && (
                <div className="voice-preview">
                  <audio controls src={recordedAudio} />
                  <button onClick={clearVoiceNote}>
                    <X size={17} />
                  </button>
                </div>
              )}
            </div>

            {notice && (
              <div className="notice-message">
                <Sparkles size={16} /> {notice}
              </div>
            )}

            <div className="section-heading create-heading">
              <div>
                <span className="eyebrow">YOUR CREATIVE TEAM</span>
                <h2>Select your studios</h2>
              </div>
              <span className="selection-count">
                {selected.length} selected
              </span>
            </div>

            {selectedStudios.length > 0 && (
              <div className="selected-studios">
                {selectedStudios.map(studio => {
                  const Icon = studio.icon;
                  return (
                    <div className="selected-studio" key={studio.id}>
                      <Icon size={17} />
                      <span>{studio.name}</span>
                      <button onClick={() => chooseStudio(studio.id)}>
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="studio-grid">
              {studios.map(renderStudioCard)}
            </div>

            <div className="preview-panel">
              <div className="preview-heading">
                <Image size={20} />
                <h2>Creation preview</h2>
              </div>
              <div className="preview-empty">
                <div className="preview-symbol">
                  <Palette size={31} />
                </div>
                <h3>Your canvas awaits.</h3>
                <p>
                  Your actual creative work will appear here
                  when the generation engines are connected.
                </p>
                <span className="preview-status">
                  <span className="status-dot" />
                  Creative engines not connected yet
                </span>
              </div>
            </div>

            <div className="honest-note">
              <Sparkles size={17} />
              NYX will connect the studios through a shared creative
              engine. Your selections are saved in this session;
              actual generation and project saving will be added later.
            </div>
          </section>
        )}

        {/* REELS */}
        {page === "reels" && (
          <section className="simple-page">
            <span className="eyebrow">THE CREATOR COMMUNITY</span>
            <h1>NYX Reels</h1>
            <p className="page-intro">
              Discover short videos, follow creators and share your creations.
            </p>

            <div className="future-panel">
              <div className="future-icon"><Film size={34} /></div>
              <h2>Your creative feed is coming.</h2>
              <p>
                Video playback, creator profiles, likes, comments,
                saves, reposts and sharing will be developed
                as part of the social platform stage.
              </p>
              <span className="preview-status">
                <span className="status-dot" /> Social features not connected yet
              </span>
            </div>
          </section>
        )}

        {/* INBOX */}
        {page === "inbox" && (
          <section className="simple-page">
            <span className="eyebrow">YOUR CONVERSATIONS</span>
            <h1>Inbox</h1>
            <p className="page-intro">
              Connect and communicate with other creators.
            </p>

            <div className="future-panel">
              <div className="future-icon"><MessageCircle size={34} /></div>
              <h2>Your conversations will live here.</h2>
              <p>
                Private messages, voice messages, notifications,
                blocking and privacy controls will be connected
                when accounts and messaging are implemented.
              </p>
            </div>
          </section>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <section className="simple-page">
            <span className="eyebrow">YOUR CREATOR SPACE</span>
            <h1>Your profile</h1>

            <div className="future-panel">
              <div className="future-icon"><UserRound size={34} /></div>
              <h2>Your creative identity.</h2>
              <p>
                Your profile, published work, followers,
                saved creations and creator settings will be
                added with account functionality.
              </p>
            </div>
          </section>
        )}

      </main>

      {/* BOTTOM NAVIGATION */}
      <footer className="mobile-bottom-nav">
        {navItems.map(item => {
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
      </footer>

    </div>
  );
}
