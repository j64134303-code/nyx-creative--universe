
import React from "react";
import {
  Sparkles, Film, Music, BookOpen, Clapperboard,
  Compass, FolderOpen, Search, Mic, ArrowRight, Plus
} from "lucide-react";

export default function Home({ onNavigate = () => {}, onNewChat = () => {} }) {
  const sections = [
    { name: "Reels", description: "Discover creative videos", icon: Film, page: "reels", color: "#c084fc" },
    { name: "Studios, description: "Bring ideas to life", icon: Clapperboard, page: "studio", color: "#f472b6" },
    { name: "Projects", description: "Continue your creations", icon: FolderOpen, page: "projects", color: "#38bdf8" },
    { name: "Research", description: "Find ideas and inspiration", icon: Compass, page: "research", color: "#34d399" }
  ];

  const studios = [
    { name: "Film Studio", icon: Film },
    { name: "Music Studio", icon: Music },
    { name: "Book Studio", icon: BookOpen },
    { name: "Voice Studio", icon: Mic }
  ];

  return (
    <main className="nyx-home">
      <style>{`
        .nyx-home {
          min-height: 100vh;
          background: #08080d;
          color: #f5f0ff;
          padding: 22px 18px 110px;
          font-family: inherit;
          box-sizing: border-box;
        }
        .nyx-home * { box-sizing: border-box; }
        .nyx-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .nyx-logo {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 4px;
          color: #c084fc;
        }
        .nyx-tag { color: #9990a8; font-size: 12px; margin-top: 4px; }
        .nyx-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          display: grid; place-items: center;
          background: #21152f; color: #d8b4fe;
          border: 1px solid #60358a;
        }
        .nyx-hero {
          padding: 26px 22px;
          border-radius: 23px;
          background: radial-gradient(circle at 90% 10%, #54217a 0%, transparent 45%), linear-gradient(135deg, #191124, #100d19 70%);
          border: 1px solid #352344;
          margin-bottom: 30px;
        }
        .nyx-hero small { color: #c084fc; letter-spacing: 2px; font-weight: 700; }
        .nyx-hero h1 { font-size: 30px; line-height: 1.2; margin: 13px 0; }
        .nyx-hero p { color: #b7adbf; font-size: 14px; line-height: 1.6; }
        .nyx-primary {
          border: 0; border-radius: 12px; padding: 13px 18px;
          margin-top: 12px; background: #a855f7; color: white;
          font-weight: 800; display: inline-flex;
          align-items: center; gap: 9px; cursor: pointer;
        }
        .nyx-heading {
          display: flex; justify-content: space-between;
          align-items: center; margin: 28px 0 15px;
        }
        .nyx-heading h2 { font-size: 19px; margin: 0; }
        .nyx-heading span { color: #a78bfa; font-size: 11px; }
        .nyx-section-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
        }
        .nyx-section-card {
          text-align: left; min-height: 145px; padding: 17px;
          border-radius: 18px; border: 1px solid #292331;
          background: #121119; color: white; cursor: pointer;
        }
        .nyx-section-card:active { transform: scale(.98); }
        .nyx-section-icon {
          width: 43px; height: 43px; border-radius: 13px;
          display: grid; place-items: center; margin-bottom: 17px;
          background: #241832;
        }
        .nyx-section-card strong { display: block; font-size: 15px; margin-bottom: 6px; }
        .nyx-section-card p { color: #9c94a7; font-size: 12px; line-height: 1.5; margin: 0; }
        .nyx-studio-list {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
        }
        .nyx-studio-item {
          display: flex; align-items: center; gap: 10px;
          padding: 15px 12px; background: #121119;
          border: 1px solid #292331; border-radius: 14px;
          color: #eee6f8; font-size: 13px; cursor: pointer;
        }
        .nyx-studio-item svg { color: #c084fc; flex-shrink: 0; }
        .nyx-discover {
          margin-top: 28px; padding: 19px;
          background: #121119; border: 1px solid #30243d; border-radius: 18px;
        }
        .nyx-discover p { color: #aaa0b5; font-size: 13px; line-height: 1.5; }
        .nyx-discover button {
          background: transparent; border: 0; color: #c084fc;
          font-weight: 700; padding: 8px 0;
          display: flex; align-items: center; gap: 7px; cursor: pointer;
        }
        @media (min-width: 700px) {
          .nyx-home { padding: 32px 6%; }
          .nyx-section-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <header className="nyx-top">
        <div>
          <div className="nyx-logo">NYX</div>
          <div className="nyx-tag">Your creative universe</div>
        </div>
        <button className="nyx-avatar" onClick={() => onNavigate("settings")} aria-label="Open profile">
          <Sparkles size={20} />
        </button>
      </header>

      <section className="nyx-hero">
        <small>WELCOME TO NYX</small>
        <h1>Your imagination<br />has no limits.</h1>
        <p>Create films, music, stories, characters and entire creative worlds in one place.</p>
        <button className="nyx-primary" onClick={onNewChat}>
          <Plus size={18} /> Start creating
        </button>
      </section>

      <div className="nyx-heading">
        <h2>Explore NYX</h2>
        <span>YOUR UNIVERSE</span>
      </div>

      <div className="nyx-section-grid">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button className="nyx-section-card" key={section.name} onClick={() => onNavigate(section.page)}>
              <div className="nyx-section-icon">
                <Icon size={23} color={section.color} />
              </div>
              <strong>{section.name}</strong>
              <p>{section.description}</p>
            </button>
          );
        })}
      </div>

      <div className="nyx-heading">
        <h2>Creative Studios</h2>
        <span>MAKE SOMETHING</span>
      </div>

      <div className="nyx-studio-list">
        {studios.map((studio) => {
          const Icon = studio.icon;
          return (
            <button className="nyx-studio-item" key={studio.name} onClick={() => onNavigate("studio")}>
              <Icon size={19} /> {studio.name}
            </button>
          );
        })}
      </div>

      <section className="nyx-discover">
        <Search size={22} color="#c084fc" />
        <h3>Find your next inspiration</h3>
        <p>Explore ideas, styles, creative references and new directions for your next project.</p>
        <button onClick={() => onNavigate("research")}>
          Explore research <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}
