import React, { useRef, useState } from "react";
import {
  Sparkles, Home, Compass, Film, MessageCircle, UserRound,
  Settings, Bell, Search, Plus, Mic, Square, Send,
  Music2, Gamepad2, BookOpen, Headphones, Users,
  Clapperboard, Image, Laugh, AudioLines, Layers3,
  Video, WandSparkles, Upload, ChevronRight, X,
  Play, Bookmark, Heart, Menu, ArrowLeft
} from "lucide-react";

const studios = [
  {
    id: "marketing",
    name: "Marketing & Advertising",
    description: "Create campaigns, adverts, brand stories and promotional content.",
    icon: Sparkles,
    color: "pink"
  },
  {
    id: "video",
    name: "Video Editing",
    description: "Edit videos, add effects, transitions, captions and visual styles.",
    icon: Video,
    color: "blue"
  },
  {
    id: "film",
    name: "Film & Movie Production",
    description: "Bring film ideas, scenes, characters and complete productions to life.",
    icon: Clapperboard,
    color: "purple"
  },
  {
    id: "music",
    name: "Music & Beat Production",
    description: "Create original songs, beats, instrumentals and sounds across genres.",
    icon: Music2,
    color: "orange"
  },
  {
    id: "games",
    name: "Game Creation",
    description: "Develop game concepts, worlds, characters and gameplay experiences.",
    icon: Gamepad2,
    color: "green"
  },
  {
    id: "story",
    name: "Storytelling & Voice",
    description: "Write novels, stories, scripts, dialogue and spoken content.",
    icon: BookOpen,
    color: "gold"
  },
  {
    id: "audiobook",
    name: "Audiobook Production",
    description: "Turn written work into narrated, chapter-based audiobooks.",
    icon: Headphones,
    color: "cyan"
  },
  {
    id: "characters",
    name: "Character Creation",
    description: "Design original characters and maintain their identity across projects.",
    icon: Users,
    color: "rose"
  },
  {
    id: "soundtrack",
    name: "Soundtrack & Background Music",
    description: "Create music and soundscapes for films, games and other projects.",
    icon: AudioLines,
    color: "indigo"
  },
  {
    id: "scene",
    name: "Step Into The Scene",
    description: "Place your chosen characters into video scenes you own or may edit.",
    icon: Layers3,
    color: "violet"
  },
  {
    id: "comedy",
    name: "Comedy & Humour",
    description: "Create jokes, skits, funny stories and entertaining characters.",
    icon: Laugh,
    color: "yellow"
  },
  {
    id: "import",
    name: "Import & Export",
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
    { words: ["edit video", "video edit", "clip", "transition"], ids: ["video"] },
    { words: ["film", "movie", "cinema", "scene"], ids: ["film"] },
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

  const found = rules
    .filter(rule => rule.words.some(word => text.includes(word)))
    .flatMap(rule => rule.ids);

  return [...new Set(found)];
}

export default function App() {
  const [page, setPage] = useState("home");
  const [intro, setIntro] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState([]);
  const [request, setRequest] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  function chooseStudio(id) {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
    setPage("create");
  }

  function startRequest() {
    if (!message.trim() && !recordedAudio) {
      setNotice("Tell NYX what you would like to create first.");
      return;
    }

    const matches = findStudios(message);
    if (matches.length) {
      setSelected(current => [...new Set([...current, ...matches])]);
    }
    setRequest(message.trim());
    setPage("create");
    setNotice(
      matches.length
        ? "Suggested studios are selected. You can change them before continuing."
        : "Choose the studio or studios you want to use."
    );
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
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        setRecordedAudio(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        setNotice("Voice note recorded. Voice understanding will be connected later.");
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setNotice("Recording your voice note…");
    } catch {
      setNotice("Microphone access was not granted. Check your browser permissions.");
    }
  }                    <div className="honest-note">
                      NYX's creative engines will be connected and tested
                      studio by studio. No fake generated results.
                    </div>
                  </section>
                </div>

                <aside className="preview-panel">
                  <div className="preview-heading">
                    <Image size={19} />
                    <h3>Creation preview</h3>
                  </div>

                  <div className="preview-empty">
                    <div className="preview-symbol">
                      <Sparkles size={30} />
                    </div>
                    <h3>Your canvas awaits.</h3>
                    <p>
                      Your actual creative work will appear here
                      when the generation engines are connected.
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {page === "reels" && (
            <section className="simple-page">
              <p className="eyebrow">THE CREATOR COMMUNITY</p>
              <h1>NYX Reels</h1>
              <p>
                Discover short videos, follow creators and share
                your own creations.
              </p>
              <div className="future-panel">
                <Film size={34} />
                <h2>Your creative feed is coming.</h2>
                <p>
                  Video publishing, playback, likes, comments,
                  sharing and creator profiles will be built
                  as part of the social platform stage.
                </p>
              </div>
            </section>
          )}

          {page === "inbox" && (
            <section className="simple-page">
              <p className="eyebrow">YOUR CONVERSATIONS</p>
              <h1>Inbox</h1>
              <p>Connect and communicate with other creators.</p>
              <div className="future-panel">
                <MessageCircle size={34} />
                <h2>Your conversations will live here.</h2>
                <p>
                  Private messages, creator conversations,
                  notifications and message controls will be
                  connected in the social platform stage.
                </p>
              </div>
            </section>
          )}

          {page === "profile" && (
            <section className="simple-page">
              <p className="eyebrow">YOUR CREATOR SPACE</p>
              <h1>Your profile</h1>
              <div className="future-panel">
                <UserRound size={34} />
                <h2>Your creative identity.</h2>
                <p>
                  Your profile, published work, followers,
                  saved creations and creator settings will
                  be added with account functionality.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="mobile-bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
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
