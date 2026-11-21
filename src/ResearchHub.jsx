
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  TrendingUp,
  Globe,
  Lightbulb,
  FolderOpen,
  Sparkles,
  Compass,
  Music,
  Film,
  Video,
  Mic,
  Palette,
  Gamepad2,
  Building2,
  ShieldCheck,
  Check,
  Link as LinkIcon
} from "lucide-react";

const STORAGE_KEY = "nyx-shared-research-library-v1";

const CATEGORIES = [
  "All research",
  "History & Culture",
  "Science & Technology",
  "Music & Beats",
  "Sounds & Audio",
  "Movies & Film",
  "Video & Editing",
  "Animation & Visual Effects",
  "Books & Literature",
  "Characters & Storytelling",
  "Games & Interactive Media",
  "Fashion & Design",
  "Photography & Art",
  "Marketing & Social Media",
  "Trends & Audience Interests",
  "Companies & Organisations",
  "Business & Industries",
  "Products & Brands",
  "Places & Events",
  "Education & Knowledge",
  "Other"
];

const RIGHTS = [
  "My own work",
  "Public domain",
  "Licensed material",
  "Creator-authorised",
  "Public viewing only",
  "Rights unclear"
];

const STUDIO_CATEGORIES = {
  "Film & Video": [
    "Movies & Film",
    "Video & Editing",
    "Photography & Art",
    "Characters & Storytelling"
  ],
  "Edit Studio": [
    "Video & Editing",
    "Movies & Film",
    "Trends & Audience Interests",
    "Photography & Art"
  ],
  "Beat Studio": [
    "Music & Beats",
    "Sounds & Audio",
    "Trends & Audience Interests"
  ],
  "Music": [
    "Music & Beats",
    "Sounds & Audio",
    "History & Culture"
  ],
  "Books & Writing": [
    "Books & Literature",
    "History & Culture",
    "Characters & Storytelling"
  ],
  "Storytelling & Voice": [
    "Characters & Storytelling",
    "Books & Literature",
    "Sounds & Audio"
  ],
  "Game Creation": [
    "Games & Interactive Media",
    "Characters & Storytelling",
    "Science & Technology"
  ],
  "Marketing": [
    "Marketing & Social Media",
    "Trends & Audience Interests",
    "Business & Industries"
  ],
  "Character Studio": [
    "Characters & Storytelling",
    "Fashion & Design",
    "History & Culture"
  ],
  "Audio Production": [
    "Sounds & Audio",
    "Music & Beats",
    "Trends & Audience Interests"
  ],
  "Animation": [
    "Animation & Visual Effects",
    "Photography & Art",
    "Characters & Storytelling"
  ],
  "Comedy & Entertainment": [
    "Trends & Audience Interests",
    "Video & Editing",
    "Characters & Storytelling"
  ],
  "Audiobook Production": [
    "Books & Literature",
    "Sounds & Audio",
    "Characters & Storytelling"
  ],
  "Research & Discovery": [
    "All research",
    "History & Culture",
    "Science & Technology"
  ]
};

function loadLibrary() {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStudioName(studio) {
  if (!studio) return "All Studios";
  if (typeof studio === "string") return studio;
  return studio.name || studio.title || "All Studios";
}

export default function ResearchHub({ studio, onBack, onAttach }) {
  const studioName = getStudioName(studio);

  const suggestedCategories =
    STUDIO_CATEGORIES[studioName] || [
      "All research",
      "Trends & Audience Interests",
      "History & Culture"
    ];

  const [library, setLibrary] = useState(loadLibrary);
  const [brief, setBrief] = useState("");
  const [category, setCategory] = useState("All research");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [rights, setRights] = useState("Public viewing only");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch {
      setMessage("Could not save. Your device storage may be full.");
    }
  }, [library]);

  const visibleItems = useMemo(() => {
    return library.filter(item => {
      const matchesStudio =
        filter === "All" ||
        item.studio === filter ||
        item.studio === "All Studios";

      const matchesCategory =
        category === "All research" ||
        item.category === category;

      return matchesStudio && matchesCategory;
    });
  }, [library, filter, category]);

  function searchWeb(mode) {
    const query = brief.trim();

    if (!query) {
      setMessage("Write what you want to research first.");
      return;
    }

    let searchQuery = query;

    if (mode === "trends") {
      searchQuery =
        `latest current trends ${query} audience interests`;
    }

    if (mode === "techniques") {
      searchQuery =
        `${query} creative techniques examples analysis`;
    }

    if (mode === "history") {
      searchQuery =
        `${query} history background facts reliable sources`;
    }

    const destination =
      "https://www.google.com/search?q=" +
      encodeURIComponent(searchQuery);

    window.open(destination, "_blank", "noopener,noreferrer");
  }

  function saveReference() {
    if (!title.trim() || !url.trim()) {
      setMessage("Please add a title and a link.");
      return;
    }

    let validUrl;

    try {
      validUrl = new URL(url.trim());

      if (
        validUrl.protocol !== "https:" &&
        validUrl.protocol !== "http:"
      ) {
        throw new Error("Invalid link");
      }
    } catch {
      setMessage("Please enter a valid website link.");
      return;
    }

    const reference = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: title.trim(),
      url: validUrl.href,
      notes: notes.trim(),
      category,
      rights,
      studio: studioName,
      createdAt: new Date().toISOString()
    };

    setLibrary(previous => [reference, ...previous]);
    setSelected(previous => [...previous, reference.id]);

    setTitle("");
    setUrl("");
    setNotes("");
    setMessage("Saved to your shared research library.");
  }

  function removeReference(id) {
    setLibrary(previous =>
      previous.filter(item => item.id !== id)
    );

    setSelected(previous =>
      previous.filter(item => item !== id)
    );
  }

  function toggleReference(id) {
    setSelected(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    );
  }

  function attachReferences() {
    const chosen = library.filter(item =>
      selected.includes(item.id)
    );

    if (!chosen.length) {
      setMessage("Select some references first.");
      return;
    }

    if (typeof onAttach === "function") {
      onAttach(chosen);
      setMessage("References sent to your studio project.");
    } else {
      setMessage("References remain saved in your library.");
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#09070f",
      color: "#f5efff",
      padding: "20px",
      boxSizing: "border-box"
    },
    panel: {
      background: "#151020",
      border: "1px solid #30213f",
      borderRadius: "16px",
      padding: "18px",
      marginBottom: "16px"
    },
    muted: {
      color: "#a99bb9",
      fontSize: "13px",
      lineHeight: 1.6
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      background: "#0d0915",
      border: "1px solid #49345e",
      borderRadius: "10px",
      color: "#ffffff",
      padding: "12px",
      marginTop: "7px",
      marginBottom: "13px",
      outline: "none"
    },
    button: {
      background: "#8750c9",
      color: "#ffffff",
      border: "none",
      borderRadius: "10px",
      padding: "11px 14px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      fontWeight: 600
    },
    secondary: {
      background: "#241932",
      color: "#e6d8f7",
      border: "1px solid #49345e",
      borderRadius: "10px",
      padding: "10px 13px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "7px"
    }
  };

  return (
    <main style={styles.page}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "24px"
      }}>
        <button style={styles.secondary} onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </button>

        <span style={styles.muted}>
          <Globe size={15} /> Shared NYX research
        </span>
      </header>

      <section style={{ marginBottom: "22px" }}>
        <div style={{
          color: "#bd8aff",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "1px"
        }}>
          <Sparkles size={17} /> NYX INTELLIGENCE
        </div>

        <h1 style={{ fontSize: "28px", margin: "9px 0" }}>
          Research & Discovery
        </h1>

        <p style={styles.muted}>
          Discover knowledge. Explore creative references.
          Understand industries and trends. Give every studio
          better information before it creates.
        </p>
      </section>

      <section style={styles.panel}>
        <h3 style={{ marginTop: 0 }}>
          <Compass size={18} /> Active studio
        </h3>

        <strong style={{ color: "#c99cff" }}>
          {studioName}
        </strong>

        <p style={styles.muted}>
          This studio can use the shared research library.
          Research saved here can also be reused by other studios.
        </p>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          {suggestedCategories.map(item => (
            <button
              key={item}
              style={styles.secondary}
              onClick={() => {
                setCategory(item);
                setBrief(
                  item === "All research" ? "" : item
                );
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section style={styles.panel}>
        <h3 style={{ marginTop: 0 }}>
          <Search size={18} /> Discover and investigate
        </h3>

        <p style={styles.muted}>
          Research anything relevant to your project:
          facts, history, science, music, editing, characters,
          companies, products, techniques and more.
        </p>

        <textarea
          style={{
            ...styles.input,
            minHeight: "105px",
            resize: "vertical"
          }}
          value={brief}
          onChange={event => setBrief(event.target.value)}
          placeholder="What do you want NYX research to explore?"
        />

        <label style={styles.muted}>Research area</label>

        <select
          style={styles.input}
          value={category}
          onChange={event => setCategory(event.target.value)}
        >
          {CATEGORIES.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "9px"
        }}>
          <button
            style={styles.button}
            onClick={() => searchWeb("general")}
          >
            <Search size={16} /> Search web
          </button>

          <button
            style={styles.secondary}
            onClick={() => searchWeb("trends")}
          >
            <TrendingUp size={16} /> Explore trends
          </button>

          <button
            style={styles.secondary}
            onClick={() => searchWeb("techniques")}
          >
            <Lightbulb size={16} /> Study techniques
          </button>

          <button
            style={styles.secondary}
            onClick={() => searchWeb("history")}
          >
            <BookOpen size={16} /> Explore knowledge
          </button>
        </div>

        <p style={styles.muted}>
          These buttons open external search results. Automatic
          in-app web research, source verification and AI analysis
          are part of the next backend upgrade.
        </p>
      </section>

      <section style={styles.panel}>
        <h3 style={{ marginTop: 0 }}>
          <Plus size={18} /> Save a reference
        </h3>

        <p style={styles.muted}>
          Save useful articles, videos, music references,
          research pages and other sources.
        </p>

        <label style={styles.muted}>Reference title</label>
        <input
          style={styles.input}
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Name this reference"
        />

        <label style={styles.muted}>Website link</label>
        <input
          style={styles.input}
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="https://..."
        />

        <label style={styles.muted}>Category</label>
        <select
          style={styles.input}
          value={category}
          onChange={event => setCategory(event.target.value)}
        >
          {CATEGORIES.filter(item => item !== "All research").map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label style={styles.muted}>Rights and permissions</label>
        <select
          style={styles.input}
          value={rights}
          onChange={event => setRights(event.target.value)}
        >
          {RIGHTS.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label style={styles.muted}>Research notes</label>
        <textarea
          style={{
            ...styles.input,
            minHeight: "85px",
            resize: "vertical"
          }}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="What did you discover? What should the studio learn from this?"
        />

        <button style={styles.button} onClick={saveReference}>
          <Plus size={16} /> Save reference
        </button>
      </section>

      <section style={styles.panel}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h3 style={{ margin: 0 }}>
            <FolderOpen size={18} /> Shared research library
          </h3>

          <span style={styles.muted}>
            {library.length} references
          </span>
        </div>

        <p style={styles.muted}>
          Your saved references are available to the NYX studios
          using this browser and device.
        </p>

        <label style={styles.muted}>Filter by studio</label>
        <select
          style={styles.input}
          value={filter}
          onChange={event => setFilter(event.target.value)}
        >
          <option value="All">All studios</option>
          {Object.keys(STUDIO_CATEGORIES).map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value="All Studios">General references</option>
        </select>

        <label style={styles.muted}>Filter by category</label>
        <select
          style={styles.input}
          value={category}
          onChange={event => setCategory(event.target.value)}
        >
          {CATEGORIES.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {visibleItems.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "25px 10px",
            color: "#a99bb9"
          }}>
            <BookOpen size={30} />
            <p>No matching research references yet.</p>
          </div>
        ) : (
          visibleItems.map(item => (
            <article
              key={item.id}
              style={{
                borderTop: "1px solid #30213f",
                padding: "15px 0"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px"
              }}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggleReference(item.id)}
                  style={{ marginTop: "5px" }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{item.title}</strong>

                  <p style={styles.muted}>
                    {item.category} · Saved from {item.studio}
                  </p>

                  {item.notes && (
                    <p style={styles.muted}>{item.notes}</p>
                  )}

                  <p style={styles.muted}>
                    Rights: {item.rights}
                  </p>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#c99cff",
                      fontSize: "13px",
                      overflowWrap: "anywhere"
                    }}
                  >
                    <ExternalLink
                      size={13}
                      style={{ verticalAlign: "middle" }}
                    /> Open reference
                  </a>
                </div>

                <button
                  style={styles.secondary}
                  onClick={() => removeReference(item.id)}
                  title="Delete reference"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))
        )}

        <button
          style={{
            ...styles.button,
            marginTop: "15px"
          }}
          onClick={attachReferences}
        >
          <Check size={16} /> Attach selected to studio project
        </button>
      </section>

      <section style={{
        ...styles.panel,
        borderColor: "#49345e"
      }}>
        <h3 style={{ marginTop: 0 }}>
          <ShieldCheck size={18} /> Respect creative rights
        </h3>

        <p style={styles.muted}>
          Publicly viewing a creation does not automatically give
          permission to download, copy, modify, reuse or publish it.
          Research can study techniques and inspiration while
          keeping original creators' rights protected.
        </p>
      </section>

      {message && (
        <div
          role="status"
          style={{
            position: "sticky",
            bottom: "12px",
            background: "#241932",
            border: "1px solid #8750c9",
            color: "#ffffff",
            padding: "13px",
            borderRadius: "12px",
            marginTop: "15px"
          }}
        >
          {message}
          <button
            onClick={() => setMessage("")}
            style={{
              float: "right",
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
