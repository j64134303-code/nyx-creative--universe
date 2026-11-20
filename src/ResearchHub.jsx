
import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Link as LinkIcon,
  Video,
  Music2,
  Clapperboard,
  MapPin,
  CalendarDays,
  Image,
  TrendingUp,
  BookOpen,
  Package,
  Check,
  ExternalLink,
  X,
  Sparkles,
  FolderPlus,
  Compass,
} from "lucide-react";

const RESEARCH_TYPES = [
  { name: "Videos", icon: Video },
  { name: "Sounds & Music", icon: Music2 },
  { name: "Movies & Scenes", icon: Clapperboard },
  { name: "Places & Destinations", icon: MapPin },
  { name: "Events", icon: CalendarDays },
  { name: "Images & Styles", icon: Image },
  { name: "Trends", icon: TrendingUp },
  { name: "Facts & Topics", icon: BookOpen },
  { name: "Products & Brands", icon: Package },
];

const SOURCES = [
  "Any source",
  "TikTok",
  "YouTube",
  "Instagram",
  "Web",
  "My own files",
];

const styles = {
  page: {
    minHeight: "100%",
    padding: "24px",
    color: "#f5efff",
    background: "#0b0712",
    fontFamily: "'DM Sans', sans-serif",
  },
  muted: { color: "#a99bb9" },
  panel: {
    background: "#130d1e",
    border: "1px solid rgba(190,151,255,.16)",
    borderRadius: "18px",
    padding: "20px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: "11px",
    border: "1px solid rgba(190,151,255,.2)",
    background: "#0b0712",
    color: "#f5efff",
    outline: "none",
    fontSize: "14px",
  },
  button: {
    border: 0,
    borderRadius: "11px",
    padding: "12px 16px",
    background: "#9b68ed",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    border: "1px solid rgba(190,151,255,.2)",
    borderRadius: "11px",
    padding: "11px 14px",
    background: "#1b1229",
    color: "#f5efff",
    cursor: "pointer",
  },
};

export default function ResearchHub({
  studio,
  onBack,
  onAttach,
}) {
  const [brief, setBrief] = useState("");
  const [type, setType] = useState("Videos");
  const [source, setSource] = useState("Any source");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [references, setReferences] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");

  const studioName =
    typeof studio === "string"
      ? studio
      : studio?.name || "Your studio";

  const selectedReferences = useMemo(
    () => references.filter((item) => selected.includes(item.id)),
    [references, selected]
  );

  function addReference(event) {
    event.preventDefault();
    setMessage("");

    let cleanUrl;

    try {
      cleanUrl = new URL(url.trim());

      if (!["http:", "https:"].includes(cleanUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      setMessage("Please enter a valid web link beginning with https://");
      return;
    }

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: label.trim() || cleanUrl.hostname,
      url: cleanUrl.href,
      notes: notes.trim(),
      type,
      source: source === "Any source" ? "Web link" : source,
    };

    setReferences((current) => [item, ...current]);
    setSelected((current) => [...current, item.id]);
    setUrl("");
    setLabel("");
    setNotes("");
    setMessage("Reference added to your research collection.");
  }

  function toggleSelected(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function removeReference(id) {
    setReferences((current) =>
      current.filter((item) => item.id !== id)
    );
    setSelected((current) =>
      current.filter((item) => item !== id)
    );
  }

  function attachReferences() {
    if (!selectedReferences.length) {
      setMessage("Select at least one reference first.");
      return;
    }

    onAttach?.(selectedReferences);
    setMessage(
      `${selectedReferences.length} reference(s) sent to ${studioName}.`
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            ...styles.secondary,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#c4a2ff",
              marginBottom: "10px",
            }}
          >
            <Compass size={22} />
            <span style={{ fontWeight: 700 }}>NYX DISCOVERY</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              margin: "0 0 10px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Research before you create.
          </h1>

          <p style={{ ...styles.muted, lineHeight: 1.7, maxWidth: "650px" }}>
            Find inspiration, collect references and give NYX a clearer
            understanding of what you want to make. Your research can
            travel with your project into other studios.
          </p>
        </div>

        <div
          style={{
            ...styles.panel,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "22px",
          }}
        >
          <Sparkles color="#c4a2ff" size={23} />
          <div>
            <div style={{ fontWeight: 700 }}>Working in {studioName}</div>
            <div style={{ ...styles.muted, fontSize: "13px", marginTop: 4 }}>
              Research collected here is intended for this creative project.
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={{ fontSize: "19px", marginTop: 0 }}>
            What are you looking for?
          </h2>

          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="Example: Find popular videos using the same sound, with creative transitions and strong storytelling..."
            rows={3}
            style={{
              ...styles.input,
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "14px",
              marginTop: "16px",
            }}
          >
            <label style={{ fontSize: "13px", color: "#c4a2ff" }}>
              Research category
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                style={{ ...styles.input, marginTop: "7px" }}
              >
                {RESEARCH_TYPES.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: "13px", color: "#c4a2ff" }}>
              Preferred source
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                style={{ ...styles.input, marginTop: "7px" }}
              >
                {SOURCES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "13px",
              borderRadius: "11px",
              background: "rgba(155,104,237,.09)",
              color: "#c4a2ff",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <Search size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />
            Live platform discovery is not connected yet. NYX will not show
            invented search results, rankings or view counts.
          </div>
        </div>

        <div style={{ ...styles.panel, marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LinkIcon color="#c4a2ff" size={20} />
            <h2 style={{ fontSize: "19px", margin: 0 }}>
              Add a reference link
            </h2>
          </div>

          <p style={{ ...styles.muted, fontSize: "13px", lineHeight: 1.6 }}>
            Paste a video, sound, article, destination or other reference
            you want to keep with your project.
          </p>

          <form onSubmit={addReference}>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Reference name (optional)"
              style={{ ...styles.input, marginBottom: "10px" }}
            />

            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              type="url"
              required
              style={{ ...styles.input, marginBottom: "10px" }}
            />

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What should NYX pay attention to in this reference?"
              rows={2}
              style={{
                ...styles.input,
                resize: "vertical",
                marginBottom: "12px",
              }}
            />

            <button
              type="submit"
              style={{
                ...styles.button,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={17} />
              Add reference
            </button>
          </form>

          {message && (
            <p
              role="status"
              style={{
                color: "#c4a2ff",
                fontSize: "13px",
                marginBottom: 0,
              }}
            >
              {message}
            </p>
          )}
        </div>

        <div style={{ marginTop: "26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px" }}>
                Your research collection
              </h2>
              <p style={{ ...styles.muted, fontSize: "13px" }}>
                {references.length} reference(s) added · {selected.length} selected
              </p>
            </div>

            <button
              onClick={attachReferences}
              disabled={!selected.length}
              style={{
                ...styles.button,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                opacity: selected.length ? 1 : 0.45,
                cursor: selected.length ? "pointer" : "not-allowed",
              }}
            >
              <FolderPlus size={17} />
              Attach to project
            </button>
          </div>

          {references.length === 0 ? (
            <div
              style={{
                ...styles.panel,
                textAlign: "center",
                padding: "38px 20px",
              }}
            >
              <Compass
                size={34}
                color="#9b68ed"
                style={{ marginBottom: "12px" }}
              />
              <h3 style={{ margin: "0 0 8px" }}>
                Your collection starts here
              </h3>
              <p style={{ ...styles.muted, fontSize: "13px", lineHeight: 1.6 }}>
                Add a reference link above. Your saved references will appear
                here for selection.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {references.map((item) => {
                const isSelected = selected.includes(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.panel,
                      borderColor: isSelected
                        ? "rgba(155,104,237,.65)"
                        : "rgba(190,151,255,.16)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <button
                        onClick={() => toggleSelected(item.id)}
                        aria-label={isSelected ? "Deselect reference" : "Select reference"}
                        style={{
                          width: "25px",
                          height: "25px",
                          flexShrink: 0,
                          borderRadius: "7px",
                          border: "1px solid #9b68ed",
                          background: isSelected ? "#9b68ed" : "transparent",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {isSelected && <Check size={16} />}
                      </button>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: "5px" }}>
                          {item.title}
                        </div>
                        <div style={{ ...styles.muted, fontSize: "12px" }}>
                          {item.type} · {item.source}
                        </div>

                        {item.notes && (
                          <p style={{ fontSize: "13px", lineHeight: 1.5 }}>
                            {item.notes}
                          </p>
                        )}

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#c4a2ff",
                            fontSize: "12px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          <ExternalLink
                            size={13}
                            style={{ verticalAlign: "middle", marginRight: 5 }}
                          />
                          Open reference
                        </a>
                      </div>

                      <button
                        onClick={() => removeReference(item.id)}
                        aria-label="Remove reference"
                        style={{
                          ...styles.secondary,
                          padding: "7px",
                          display: "flex",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p
          style={{
            ...styles.muted,
            fontSize: "12px",
            lineHeight: 1.6,
            marginTop: "24px",
          }}
        >
          Only add links you are allowed to access. Saving a reference does
          not grant permission to download, reuse or publish its content.
        </p>
      </div>
    </div>
  );
}
