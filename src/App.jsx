
import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles, Home, Film, MessageCircle, UserRound, Bell,
  Mic, Square, Send, Music2, Gamepad2, BookOpen, Headphones,
  Users, Clapperboard, Laugh, AudioLines, Layers3, Video,
  WandSparkles, Upload, ChevronRight, X, Play, Menu,
  ArrowLeft, Rocket, Image, Check, CircleHelp, Plus,
  Clock3, Download, Palette, Lightbulb, ArrowRight,
  MoreHorizontal, Headphones as AudioIcon
} from "lucide-react";

const studios = [
  { id:"marketing", name:"Marketing & Advertising", short:"Campaigns, adverts and brands", icon:Sparkles, color:"pink", example:"Create a product advert, campaign or brand launch." },
  { id:"video", name:"Video Editing", short:"Transform your video clips", icon:Video, color:"blue", example:"Combine clips, music, transitions, motion and colour." },
  { id:"film", name:"Film & Movie Production", short:"Build complete film projects", icon:Clapperboard, color:"purple", example:"Develop scenes, characters, dialogue and a film." },
  { id:"music", name:"Music & Beat Production", short:"Create original music", icon:Music2, color:"orange", example:"Make beats, songs, instrumentals and sound." },
  { id:"games", name:"Game Creation", short:"Build interactive worlds", icon:Gamepad2, color:"green", example:"Design a game world, characters and gameplay." },
  { id:"story", name:"Storytelling & Voice", short:"Stories, books and scripts", icon:BookOpen, color:"gold", example:"Write a novel, script, dialogue or story." },
  { id:"audiobook", name:"Audiobook Production", short:"Turn books into audio", icon:Headphones, color:"cyan", example:"Prepare chapters, narration and downloadable audio." },
  { id:"characters", name:"Character Creation", short:"Design original characters", icon:Users, color:"rose", example:"Create a character and maintain their identity." },
  { id:"soundtrack", name:"Soundtrack & Background Music", short:"Give scenes their sound", icon:AudioLines, color:"indigo", example:"Create music and soundscapes for a scene." },
  { id:"scene", name:"Step Into The Scene", short:"Place characters in scenes", icon:Layers3, color:"violet", example:"Add a chosen character to footage you can edit." },
  { id:"comedy", name:"Comedy & Humour", short:"Create entertaining content", icon:Laugh, color:"yellow", example:"Develop jokes, skits and funny characters." },
  { id:"import", name:"Import & Export", short:"Move creative files", icon:Upload, color:"teal", example:"Import source files and export finished work." }
];

const nav = [
  { id:"home", label:"Home", icon:Home },
  { id:"create", label:"Create", icon:WandSparkles },
  { id:"reels", label:"Reels", icon:Film },
  { id:"inbox", label:"Inbox", icon:MessageCircle },
  { id:"profile", label:"Profile", icon:UserRound }
];

function routeStudios(value) {
  const text = value.toLowerCase();
  const ids = [];
  const has = (...words) => words.some(word => text.includes(word));

  if (has("music video")) ids.push("music","video");
  if (has("video","clip","edit","transition","montage")) ids.push("video");
  if (has("song","music","beat","instrumental","gengetone","mugithi","urbantone")) ids.push("music");
  if (has("advert","marketing","campaign","brand","promote")) ids.push("marketing");
  if (has("film","movie","cinema")) ids.push("film","story","characters","soundtrack","video");
  if (has("novel","book","story","script","dialogue")) ids.push("story");
  if (has("audiobook","audio book","narrate")) ids.push("story","audiobook");
  if (has("game","gaming","gameplay")) ids.push("games");
  if (has("character","avatar")) ids.push("characters");
  if (has("soundtrack","background music","film score")) ids.push("soundtrack");
  if (has("put me in","insert","step into","movie scene")) ids.push("characters","scene","video");
  if (has("comedy","funny","joke","skit","humour","humor")) ids.push("comedy","story");
  if (has("upload","import","export","download")) ids.push("import");

  return [...new Set(ids)];
}

function makeSequence(ids) {
  const order = [
    "marketing","story","characters","music","soundtrack",
    "film","games","scene","video","audiobook","comedy","import"
  ];
  return order.filter(id => ids.includes(id));
}

export default function App() {
  const [page,setPage] = useState("home");
  const [idea,setIdea] = useState("");
  const [project,setProject] = useState(null);
  const [step,setStep] = useState(0);
  const [chat,setChat] = useState([]);
  const [recording,setRecording] = useState(false);
  const [audioUrl,setAudioUrl] = useState("");
  const [notice,setNotice] = useState("");
  const [menuOpen,setMenuOpen] = useState(false);
  const [studioSearch,setStudioSearch] = useState("");
  const recorder = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
    return () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  },[audioUrl]);

  function go(next) {
    setPage(next);
    setMenuOpen(false);
    setNotice("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function beginProject(text) {
    const clean = text.trim();
    if (!clean) {
      setNotice("Tell NYX what you want to create first.");
      return;
    }

    const matches = routeStudios(clean);
    const chosen = matches.length ? matches : ["story"];

    setProject({
      id:Date.now(),
      title:clean.length > 48 ? clean.slice(0,48) + "…" : clean,
      idea:clean,
      studios:makeSequence(chosen),
      created:new Date().toLocaleDateString()
    });

    setChat([
      { role:"creator", text:clean },
      {
        role:"nyx",
        text:matches.length
          ? "I've identified some studios that may be involved. Let's review the production journey together."
          : "I need a little more direction to choose the right studios. I've opened a starting workspace so we can shape the idea."
      }
    ]);
    setStep(0);
    setIdea("");
    setPage("workspace");
    setNotice("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function addStudio(id) {
    if (!project) return;
    setProject(current => ({
      ...current,
      studios:makeSequence([...current.studios,id])
    }));
  }

  function removeStudio(id) {
    if (!project) return;
    setProject(current => ({
      ...current,
      studios:current.studios.filter(item => item !== id)
    }));
    setStep(0);
  }

  function sendMessage() {
    if (!idea.trim()) return;
    const text = idea.trim();
    setChat(current => [...current,{role:"creator",text}]);
    setIdea("");
    setChat(current => [...current,{
      role:"nyx",
      text:"I've added your instruction to this project's conversation. The connected AI coordinator will be needed to interpret it and update the production automatically."
    }]);
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice("Voice recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mediaRecorder = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data.size) chunks.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current,{type:mediaRecorder.mimeType || "audio/webm"});
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch {
      setNotice("Please allow microphone access to record a voice note.");
    }
  }

  const activeStudio = project?.studios?.[step]
    ? studios.find(item => item.id === project.studios[step])
    : null;

  const filteredStudios = studios.filter(item =>
    `${item.name} ${item.short}`.toLowerCase().includes(studioSearch.toLowerCase())
  );

  function StudioTile({studio,compact=false}) {
    const Icon = studio.icon;
    const selected = project?.studios?.includes(studio.id);
    return (
      <button
        className={`studio-tile studio-${studio.color} ${selected ? "is-selected" : ""}`}
        onClick={() => project ? addStudio(studio.id) : beginProject(`I want to explore ${studio.name}.`)}
      >
        <span className="tile-art"><Icon size={27}/></span>
        <strong>{studio.name}</strong>
        <span>{compact ? studio.short : studio.example}</span>
        <small>{selected ? "In this project" : "Explore studio"} <ChevronRight size={13}/></small>
      </button>
    );
  }

  return (
    <div className="nyx-app">
      <header className="topbar">
        <button className="brand-button" onClick={() => go("home")}>
          <span className="brand-symbol"><Sparkles size={22}/></span>
          <span className="brand-name">NYX</span>
          <span className="brand-subtitle">THE CREATIVE UNIVERSE</span>
        </button>
        <div className="topbar-actions">
          <button className="icon-button" aria-label="Help" onClick={() => setNotice("NYX helps organise your creative journey. Some AI and generation services are not connected yet.")}><CircleHelp size={19}/></button>
          <button className="icon-button" aria-label="Notifications" onClick={() => go("notifications")}><Bell size={19}/></button>
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20}/></button>
        </div>
      </header>

      {menuOpen && <div className="mobile-menu">
        {nav.map(item => {
          const Icon = item.icon;
          return <button key={item.id} onClick={() => go(item.id)}><Icon size={18}/>{item.label}</button>;
        })}
      </div>}

      {notice && <div className="global-notice"><Sparkles size={16}/>{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}

      <main className="main-content">
        {page === "home" && <>
          <section className="home-hero">
            <div>
              <span className="eyebrow"><Sparkles size={14}/> THE CREATIVE UNIVERSE</span>
              <h1>Imagine beyond.<br/><span>Create everything.</span></h1>
              <p>One idea can become a story, a film, a song or an entire world.</p>
              <button className="primary-button" onClick={() => go("create")}><Rocket size={18}/> Start creating <ArrowRight size={17}/></button>
            </div>
            <div className="home-planet">
              <div className="planet-orbit"></div>
              <div className="planet-core"><Sparkles size={38}/></div>
              <span>YOUR IDEAS. YOUR UNIVERSE.</span>
            </div>
          </section>

          <section className="dashboard-grid">
            <button className="dashboard-card create-dashboard" onClick={() => go("create")}>
              <WandSparkles size={24}/><strong>Create something</strong><span>Start a new creative project</span><ChevronRight/>
            </button>
            <button className="dashboard-card" onClick={() => project ? go("workspace") : go("create")}>
              <Layers3 size={24}/><strong>My projects</strong><span>{project ? "Continue your current project" : "Your projects will appear here"}</span><ChevronRight/>
            </button>
            <button className="dashboard-card" onClick={() => go("reels")}>
              <Film size={24}/><strong>Explore Reels</strong><span>Discover creator videos</span><ChevronRight/>
            </button>
          </section>

          <section className="home-studios">
            <div className="section-heading">
              <div><span className="eyebrow">THE CREATIVE TOOLS</span><h2>Explore the studios</h2></div>
              <button className="text-button" onClick={() => go("studios")}>View all <ChevronRight size={15}/></button>
            </div>
            <div className="studio-grid home-studio-grid">
              {studios.slice(0,4).map(studio => <StudioTile key={studio.id} studio={studio} compact/>)}
            </div>
          </section>
        </>}

        {page === "create" && <>
          <button className="back-button" onClick={() => go("home")}><ArrowLeft size={17}/> Home</button>
          <section className="create-intro">
            <span className="eyebrow">YOUR CREATIVE WORKSPACE</span>
            <h1>What are we creating?</h1>
            <p>Tell NYX your idea. You don't need to know which studios you need.</p>
          </section>
          <section className="idea-panel">
            <div className="idea-assistant"><span className="assistant-avatar"><Sparkles size={23}/></span><div><strong>NYX Creative Guide</strong><p>Start with your idea. We can shape it together.</p></div></div>
            <div className="idea-examples">
              {["Edit several clips into one video","Create a music video for my song","Write a story and make an audiobook","Create an advert for my brand"].map(example =>
                <button key={example} onClick={() => setIdea(example)}>{example}<ArrowRight size={14}/></button>
              )}
            </div>
            <div className="composer">
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe what you want to create..." rows={3}/>
              <div className="composer-actions">
                <button className={`voice-button ${recording ? "recording" : ""}`} onClick={toggleRecording}>{recording ? <Square size={18}/> : <Mic size={18}/>} {recording ? "Stop recording" : "Voice note"}</button>
                <button className="send-button" onClick={() => beginProject(idea)} aria-label="Start project"><Send size={19}/></button>
              </div>
              {audioUrl && <div className="voice-preview"><audio controls src={audioUrl}/><button onClick={() => {URL.revokeObjectURL(audioUrl);setAudioUrl("");}}><X size={16}/></button><span>Voice note saved locally; transcription is not connected yet.</span></div>}
            </div>
          </section>
          <section className="studio-directory">
            <div className="section-heading"><div><span className="eyebrow">12 CREATIVE WORLDS</span><h2>Explore by studio</h2></div></div>
            <input className="studio-search" value={studioSearch} onChange={e => setStudioSearch(e.target.value)} placeholder="Find a studio..."/>
            <div className="studio-grid">{filteredStudios.map(studio => <StudioTile key={studio.id} studio={studio}/>)}</div>
          </section>
        </>}

        {page === "workspace" && project && <>
          <button className="back-button" onClick={() => go("create")}><ArrowLeft size={17}/> All creation options</button>
          <div className="project-heading">
            <span className="eyebrow">YOUR PROJECT WORKSPACE</span>
            <h1>{project.title}</h1>
            <p>NYX will guide you through the stages. You stay in control.</p>
          </div>

          <section className="journey-panel">
            <div className="journey-top"><div><span className="eyebrow">PRODUCTION JOURNEY</span><h2>Your creative team</h2></div><span className="step-count">{project.studios.length} stages</span></div>
            <div className="journey-track">
              {project.studios.map((id,index) => {
                const studio = studios.find(item => item.id === id);
                const Icon = studio.icon;
                return <button key={id} className={`journey-step ${index === step ? "current" : ""} ${index < step ? "complete" : ""}`} onClick={() => setStep(index)}>
                  <span className="journey-number">{index < step ? <Check size={15}/> : index+1}</span>
                  <Icon size={19}/><span>{studio.name}</span>
                  {index < project.studios.length-1 && <ChevronRight size={15}/>}
                </button>;
              })}
            </div>
            <div className="journey-controls">
              <button className="text-button" onClick={() => go("studios")}><Plus size={15}/> Add another studio</button>
              {activeStudio && <span>Stage {step+1} of {project.studios.length}</span>}
            </div>
          </section>

          {activeStudio && <section className="stage-panel">
            <div className="stage-header">
              <div className={`stage-icon studio-${activeStudio.color}`}><activeStudio.icon size={27}/></div>
              <div><span className="eyebrow">CURRENT STAGE</span><h2>{activeStudio.name}</h2><p>{activeStudio.example}</p></div>
            </div>
            <div className="stage-illustration">
              <div className="stage-visual-icon"><activeStudio.icon size={45}/></div>
              <div><strong>Let's shape this part of your project.</strong><p>Review the examples and decide what you want this studio to do.</p></div>
            </div>
            <div className="stage-suggestions">
              <h3><Lightbulb size={17}/> Ideas to consider</h3>
              <div className="suggestion-list">
                <div><Check size={15}/> Choose the style and direction</div>
                <div><Check size={15}/> Review the source material you want to use</div>
                <div><Check size={15}/> Decide what you want to change or keep</div>
              </div>
            </div>
            <div className="stage-actions">
              <button className="secondary-button" onClick={() => removeStudio(activeStudio.id)}>Remove this stage</button>
              <div>
                <button className="secondary-button" disabled={step===0} onClick={() => setStep(s => s-1)}>Previous</button>
                <button className="primary-button" onClick={() => step < project.studios.length-1 ? setStep(s => s+1) : setNotice("You've reached the end of the planned stages. Actual generation and export still need to be connected.")}>{step < project.studios.length-1 ? "Next stage" : "Review journey"} <ChevronRight size={16}/></button>
              </div>
            </div>
          </section>}

          <section className="project-chat">
            <div className="chat-title"><span className="assistant-avatar"><Sparkles size={20}/></span><div><strong>Talk with NYX</strong><p>Your project guide</p></div></div>
            <div className="chat-messages">
              {chat.map((item,index) => <div key={index} className={`chat-message ${item.role}`}>{item.role==="nyx" && <span className="chat-mini-avatar"><Sparkles size={14}/></span>}<p>{item.text}</p></div>)}
            </div>
            <div className="composer workspace-composer">
              <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Ask NYX to change something or explain your idea..." rows={2}/>
              <div className="composer-actions">
                <button className={`voice-button ${recording ? "recording" : ""}`} onClick={toggleRecording}>{recording ? <Square size={17}/> : <Mic size={17}/>} {recording ? "Stop" : "Voice note"}</button>
                <button className="send-button" onClick={sendMessage}><Send size={18}/></button>
              </div>
            </div>
          </section>
        </>}

        {page === "studios" && <>
          <button className="back-button" onClick={() => go(project ? "workspace" : "create")}><ArrowLeft size={17}/> Back to project</button>
          <span className="eyebrow">12 CREATIVE WORLDS</span><h1 className="page-title">Explore all studios</h1>
          <div className="studio-grid">{studios.map(studio => <StudioTile key={studio.id} studio={studio}/>)}</div>
        </>}

        {page === "reels" && <section className="simple-page">
          <span className="eyebrow">THE CREATOR COMMUNITY</span><h1>NYX Reels</h1><p>Discover short videos and creator work.</p>
          <div className="future-panel"><Film size={38}/><h2>Your creative feed</h2><p>Video playback, creator profiles, likes, comments, saves and sharing will be connected in the social platform stage.</p></div>
        </section>}

        {page === "inbox" && <section className="simple-page">
          <span className="eyebrow">CREATOR MESSAGES</span><h1>Inbox</h1><p>Conversations with other NYX creators will live here.</p>
          <div className="future-panel"><MessageCircle size={38}/><h2>Your messages</h2><p>Project conversations with NYX stay inside each project. This inbox is reserved for messages from other creators.</p></div>
        </section>}

        {page === "notifications" && <section className="simple-page">
          <button className="back-button" onClick={() => go("home")}><ArrowLeft size={17}/> Home</button>
          <span className="eyebrow">YOUR ACTIVITY</span><h1>Notifications</h1>
          <div className="future-panel"><Bell size={38}/><h2>You're all caught up</h2><p>Likes, comments, follows, mentions and account alerts will appear here when notifications are connected.</p></div>
        </section>}

        {page === "profile" && <section className="simple-page">
          <span className="eyebrow">YOUR CREATOR SPACE</span><h1>Your profile</h1>
          <div className="future-panel"><UserRound size={38}/><h2>Your creative identity</h2><p>Your profile, published work, followers and creator settings will be connected with accounts.</p></div>
        </section>}
      </main>

      <footer className="mobile-bottom-nav">
        {nav.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={page===item.id || (page==="workspace" && item.id==="create") || (page==="studios" && item.id==="create") ? "active" : ""} onClick={() => go(item.id)}><Icon size={20}/><span>{item.label}</span></button>;
        })}
      </footer>
    </div>
  );
}
