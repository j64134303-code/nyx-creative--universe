
import React from "react";
import {
  Sparkles,
  Film,
  Music,
  BookOpen,
  Clapperboard,
  Compass,
  FolderOpen,
  Search,
  Mic,
  ArrowRight,
  Plus,
  UserRound
} from "lucide-react";

export default function Home({
  onNavigate = () => {},
  onNewChat = () => {}
}) {
  const sections = [
    {
      name: "Reels",
      description: "Discover creative videos",
      icon: Film,
      page: "reels",
      color: "#c084fc"
    },
    {
      name: "Studios",
      description: "Bring your ideas to life",
      icon: Clapperboard,
      page: "studio",
      color: "#f472b6"
    },
    {
      name: "Projects",
      description: "Continue your creations",
      icon: FolderOpen,
      page: "projects",
      color: "#38bdf8"
    },
    {
      name: "Research",
      description: "Find ideas and inspiration",
      icon: Compass,
      page: "research",
      color: "#34d399"
    }
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
          min-height: calc(100vh - 70px);
          background: #08080d;
          color: #f5f0ff;
          padding: 20px 16px 115px;
          font-family: inherit;
          box-sizing: border-box;
          width: 100%;
        }

        .nyx-home * {
          box-sizing: border-box;
        }

        .nyx-home button {
          font-family: inherit;
        }

        .nyx-home .nyx-home-profile {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }

        .nyx-home .nyx-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #21152f;
          color: #d8b4fe;
          border: 1px solid #60358a;
          cursor: pointer;
        }

        .nyx-home .nyx-hero {
          padding: 25px 20px;
          border-radius: 21px;
          background:
            radial-gradient(circle at 90% 10%, #54217a 0%, transparent 45%),
            linear-gradient(135deg, #191124, #100d19 70%);
          border: 1px solid #352344;
          margin-bottom: 25px;
        }

        .nyx-home .nyx-hero small {
          color: #c084fc;
          letter-spacing: 2px;
          font-weight: 700;
          font-size: 11px;
        }

        .nyx-home .nyx-hero h1 {
          font-size: clamp(27px, 6vw, 36px);
          line-height: 1.18;
          margin: 13px 0;
          color: #fff;
        }

        .nyx-home .nyx-hero p {
          color: #b7adbf;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .nyx-home .nyx-primary {
          border: 0;
          border-radius: 12px;
          padding: 13px 18px;
          margin-top: 18px;
          background: #a855f7;
          color: white;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
        }

        .nyx-home .nyx-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin: 26px 0 14px;
        }

        .nyx-home .nyx-heading h2 {
          font-size: 18px;
          margin: 0;
          color: #fff;
        }

        .nyx-home .nyx-heading span {
          color: #a78bfa;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .nyx-home .nyx-section-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
        }

        .nyx-home .nyx-section-card {
          text-align: left;
          min-height: 137px;
          padding: 15px;
          border-radius: 17px;
          border: 1px solid #292331;
          background: #121119;
          color: white;
          cursor: pointer;
          transition: transform .2s, border-color .2s;
        }

        .nyx-home .nyx-section-card:active {
          transform: scale(.98);
        }

        .nyx-home .nyx-section-card:hover {
          border-color: #8050a9;
        }

        .nyx-home .nyx-section-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          margin-bottom: 13px;
          background: #241832;
        }

        .nyx-home .nyx-section-card strong {
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .nyx-home .nyx-section-card p {
          color: #9c94a7;
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
        }

        .nyx-home .nyx-studio-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .nyx-home .nyx-studio-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 11px;
          background: #121119;
          border: 1px solid #292331;
          border-radius: 13px;
          color: #eee6f8;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
        }

        .nyx-home .nyx-studio-item svg {
          color: #c084fc;
          flex-shrink: 0;
        }

        .nyx-home .nyx-discover {
          margin-top: 25px;
          padding: 18px;
          background: #121119;
          border: 1px solid #30243d;
          border-radius: 17px;
        }

        .nyx-home .nyx-discover h3 {
          font-size: 16px;
          margin: 12px 0 7px;
        }

        .nyx-home .nyx-discover p {
          color: #aaa0b5;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        .nyx-home .nyx-discover button {
          background: transparent;
          border: 0;
          color: #c084fc;
          font-weight: 700;
          padding: 12px 0 0;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        @media (min-width: 700px) {
          .nyx-home {
            padding: 25px 6% 110px;
          }

          .nyx-home .nyx-section-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .nyx-home .nyx-studio-list {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>

      <div className="nyx-home-profile">
        <button
          className="nyx-avatar"
          onClick={() => onNavigate("account")}
          aria-label="Open account"
          type="button"
        >
          <UserRound size={20} />
        </button>
      </div>

      <section className="nyx-hero">
        <small>WELCOME TO NYX</small>

        <h1>
          Your imagination
          <br />
          has no limits.
        </h1>

        <p>
          Create films, music, stories, characters and
          entire creative worlds in one place.
        </p>

        <button
          className="nyx-primary"
          onClick={onNewChat}
          type="button"
        >
          <Plus size={18} />
          Start creating
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
            <button
              className="nyx-section-card"
              key={section.name}
              onClick={() => onNavigate(section.page)}
              type="button"
            >
              <div className="nyx-section-icon">
                <Icon size={22} color={section.color} />
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
            <button
              className="nyx-studio-item"
              key={studio.name}
              onClick={() => onNavigate("studio")}
              type="button"
            >
              <Icon size={19} />
              {studio.name}
            </button>
          );
        })}
      </div>

      <section className="nyx-discover">
        <Search size={22} color="#c084fc" />

        <h3>Find your next inspiration</h3>

        <p>
          Explore ideas, styles, creative references and
          new directions for your next project.
        </p>

        <button
          onClick={() => onNavigate("research")}
          type="button"
        >
          Explore research
          <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}
