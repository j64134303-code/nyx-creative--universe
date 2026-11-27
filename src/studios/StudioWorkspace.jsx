import React, { useEffect, useRef, useState } from "react";
import {
  getStudio,
  getStudioCollaborators
} from "./StudioRegistry";
import {
  listUserProjects,
  runStudioRequest,
  listStudioConversations,
  createStudioConversation,
  listStudioMessages,
  saveStudioMessage,
  renameStudioConversation,
  updateStudioConversationContext,
  editStudioMessage
} from "./StudioEngine";
import { deleteProjectAsset, listProjectAssets, saveProjectAsset } from "./ProjectAssets";
import "./studios.css";

const QUICK_IDEAS = {
  music: [
    "Help me create an original song",
    "Let's develop a beat",
    "Help me explore a music genre"
  ],
  film: [
    "Develop a film concept with me",
    "Let's plan a scene",
    "Help me create a storyboard"
  ],
  books: [
    "Help me develop a book idea",
    "Let's plan my chapters",
    "Help me write a story"
  ],
  voice: [
    "Design a character voice",
    "Help me plan a narration",
    "Explore different voice styles"
  ],
  games: [
    "Develop a game concept",
    "Let's design the gameplay",
    "Create a world for my game"
  ],
  marketing: [
    "Develop a campaign idea",
    "Help me understand my audience",
    "Create a brand strategy"
  ],
  characters: [
    "Create an original character",
    "Develop a character's personality",
    "Build a character backstory"
  ],
  audio: [
    "Design sound for my project",
    "Plan an audio atmosphere",
    "Help me develop sound effects"
  ],
  animation: [
    "Develop an animation concept",
    "Plan an animated scene",
    "Design character movement"
  ],
  comedy: [
    "Help me write a comedy sketch",
    "Develop a funny character",
    "Let's create original jokes"
  ],
  audiobooks: [
    "Plan an audiobook",
    "Develop narrator direction",
    "Prepare my book for audio"
  ],
  research: [
    "Research a creative idea",
    "Find useful references",
    "Help me explore a subject"
  ]
};

function getStorageKey(studioId) {
  return `nyx-studio-chat-${studioId}`;
}

function makeConversationTitle(value) {
  const cleaned = String(value || "")
    .replace(/^(hey|hello|hi)\s+nyx[,.! ]*/i, "")
    .replace(/^(please\s+)?(help me|let's|lets|i want to|can you)\s+/i, "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  const words = (cleaned || "New creative work").split(/\s+/).slice(0, 7);
  let title = words.join(" ").replace(/[.!?]+$/, "");
  if (title.length > 54) title = title.slice(0, 51).trimEnd() + "...";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export default function StudioWorkspace({
  studioId,
  onBack,
  onResult
}) {
  const studio = getStudio(studioId);
  const collaborators = getStudioCollaborators(studioId);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedStudioId, setLoadedStudioId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationType, setConversationType] = useState("conversation");
  const [conversationTitle, setConversationTitle] = useState("");
  const [contextDraft, setContextDraft] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [dictating, setDictating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(() => {
    try { return localStorage.getItem("nyx-active-project-id") || ""; } catch { return ""; }
  });
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectAssets, setProjectAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetBusy, setAssetBusy] = useState(false);
  const [assetError, setAssetError] = useState("");

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let active = true;
    listUserProjects()
      .then(items => {
        if (!active) return;
        setProjects(items);
        setProjectId(current => {
          const next = items.some(item => item.id === current) ? current : "";
          try {
            if (next) localStorage.setItem("nyx-active-project-id", next);
            else localStorage.removeItem("nyx-active-project-id");
          } catch {}
          return next;
        });
      })
      .catch(err => { if (active) setError(err.message || "Could not load saved projects."); })
      .finally(() => { if (active) setProjectsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!projectId) {
      setProjectAssets([]);
      setAssetError("");
      return () => { active = false; };
    }

    setAssetsLoading(true);
    setAssetError("");
    listProjectAssets({ projectId })
      .then(items => { if (active) setProjectAssets(items); })
      .catch(err => { if (active) setAssetError(err.message || "Could not load project assets."); })
      .finally(() => { if (active) setAssetsLoading(false); });

    return () => { active = false; };
  }, [projectId]);

  useEffect(() => {
    let active = true;
    if (!studio) return () => { active = false; };
    setMessages([]);
    setConversations([]);
    setActiveConversationId(null);
    setError("");
    setLoadedStudioId(null);
    setThreadLoading(true);

    (async () => {
      try {
        const rows = await listStudioConversations({ studioId });
        if (!active) return;
        let available = rows;

        // One-time, non-destructive migration of the old browser-only chat.
        // The original localStorage copy is intentionally retained as backup.
        if (rows.length === 0) {
          let legacy = [];
          try {
            const saved = localStorage.getItem(getStorageKey(studioId));
            const parsed = saved ? JSON.parse(saved) : [];
            if (Array.isArray(parsed)) legacy = parsed;
          } catch {}
          if (legacy.length > 0) {
            const first = legacy.find(item => item.role === "user")?.content || "Earlier studio work";
            const migrated = await createStudioConversation({
              studioId,
              projectId: projectId || null,
              title: makeConversationTitle(first),
              conversationType: "conversation",
              context: { migratedFromBrowserHistory: true }
            });
            for (const item of legacy) {
              if (!item?.content || !["user", "assistant"].includes(item.role)) continue;
              await saveStudioMessage({
                conversationId: migrated.id,
                role: item.role,
                content: item.content,
                metadata: { sources: item.sources || [], provider: item.provider || null, migrated: true }
              });
            }
            available = [migrated];
          }
        }
        if (!active) return;
        setConversations(available);
        if (available.length > 0) {
          const selected = available[0];
          setActiveConversationId(selected.id);
          setConversationType(selected.conversation_type || "conversation");
          setConversationTitle(selected.title || "");
          setContextDraft(selected.context?.notes || selected.context?.text || "");
          const history = await listStudioMessages(selected.id);
          if (active) setMessages(history);
        } else {
          setMessages([]);
        }
      } catch (err) {
        if (active) setError(err.message || "Could not load saved conversations.");
      } finally {
        if (active) {
          setLoadedStudioId(studioId);
          setThreadLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [studioId]);

  useEffect(() => {
    if (loadedStudioId !== studioId || !activeConversationId) return;
    // Keep a local recovery copy, while the cloud database remains the source of truth.
    try {
      localStorage.setItem(getStorageKey(studioId), JSON.stringify(messages));
    } catch {}
  }, [messages, loadedStudioId, studioId, activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!studio) {
    return (
      <main className="nyx-studio-workspace">
        <h2>Studio not found</h2>
        <button onClick={onBack}>Go back</button>
      </main>
    );
  }

  function startDictation() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice dictation is not supported by this browser. You can still type your message."
      );
      return;
    }

    if (dictating && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setError("");

    const recognition = new SpeechRecognition();

    recognition.lang = "en-KE";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setDictating(true);
    };

    recognition.onresult = event => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || "";

      if (transcript) {
        setMessage(previous =>
          previous
            ? `${previous} ${transcript}`
            : transcript
        );
      }
    };

    recognition.onerror = () => {
      setError("Voice input could not be completed. Please try again.");
      setDictating(false);
    };

    recognition.onend = () => {
      setDictating(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const creatorMessage = message.trim();

    if (!creatorMessage || loading) return;

    const previousMessages = messages;

    const userMessage = {
      role: "user",
      content: creatorMessage,
      id: `${Date.now()}-user`
    };

    setMessages(previous => [...previous, userMessage]);
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const output = await runStudioRequest({
        studioId,
        message: creatorMessage,
        history: previousMessages,
        projectId: projectId || null
      });

      const assistantMessage = {
        role: "assistant",
        content: output.response,
        sources: output.sources || [],
        provider: output.provider,
        id: `${Date.now()}-assistant`
      };

      setMessages(previous => [
        ...previous,
        assistantMessage
      ]);

      if (onResult) {
        onResult(output);
      }
    } catch (err) {
      setError(
        err.message || "NYX could not complete that request."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAssetUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !projectId || assetBusy) return;

    setAssetBusy(true);
    setAssetError("");
    try {
      await saveProjectAsset({
        projectId,
        studioId,
        file,
        assetType: file.type.startsWith("image/") ? "image" :
          file.type.startsWith("audio/") ? "audio" :
          file.type.startsWith("video/") ? "video" : "document",
        metadata: { uploadedFrom: "studio-workspace" }
      });
      const refreshed = await listProjectAssets({ projectId });
      setProjectAssets(refreshed);
    } catch (err) {
      setAssetError(err.message || "Could not save this asset.");
    } finally {
      setAssetBusy(false);
    }
  }

  async function handleAssetDelete(asset) {
    if (!asset || assetBusy) return;
    setAssetBusy(true);
    setAssetError("");
    try {
      await deleteProjectAsset(asset);
      setProjectAssets(items => items.filter(item => item.id !== asset.id));
    } catch (err) {
      setAssetError(err.message || "Could not delete this asset.");
    } finally {
      setAssetBusy(false);
    }
  }

  function useQuickIdea(idea) {
    setMessage(idea);
  }

  const quickIdeas = QUICK_IDEAS[studioId] || [
    "Help me develop a creative idea",
    "Let's plan a new project",
    "Help me bring my concept to life"
  ];

  return (
    <main className="nyx-studio-workspace">
      <style>{`
        .nyx-studio-workspace {
          min-height: 100vh;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #08080d;
          color: #f5f0ff;
          font-family: inherit;
        }

        .nyx-studio-workspace * {
          box-sizing: border-box;
        }

        .nyx-chat-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          background: #100d18;
          border-bottom: 1px solid #30213e;
        }

        .nyx-chat-back {
          background: #21172d;
          color: #e9d5ff;
          border: 1px solid #49315e;
          border-radius: 10px;
          padding: 9px 12px;
          cursor: pointer;
        }

        .nyx-chat-heading {
          min-width: 0;
          flex: 1;
        }

        .nyx-chat-heading small {
          display: block;
          color: #c084fc;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .nyx-chat-heading h1 {
          font-size: 17px;
          margin: 3px 0;
          color: white;
        }

        .nyx-chat-heading p {
          margin: 0;
          color: #a99bb7;
          font-size: 11px;
        }

        .nyx-chat-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .nyx-chat-tools {
          flex-shrink: 0;
          padding: 10px 14px;
          background: #0d0b13;
          border-bottom: 1px solid #211a2b;
        }

        .nyx-chat-tools details {
          color: #cfc2dd;
        }

        .nyx-chat-tools summary {
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: #d8b4fe;
          padding: 3px 0;
        }

        .nyx-chat-tool-content {
          padding-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .nyx-chat-tool-content h3 {
          color: #c084fc;
          font-size: 11px;
          margin: 0 0 7px;
        }

        .nyx-chat-tool-content p {
          color: #a99fb2;
          font-size: 11px;
          line-height: 1.5;
          margin: 4px 0;
        }

        .nyx-chat-tool-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .nyx-chat-tool-tags span {
          background: #21172d;
          border: 1px solid #39264b;
          border-radius: 20px;
          color: #d8c2ee;
          font-size: 10px;
          padding: 5px 8px;
        }

        .nyx-chat-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 18px 14px 25px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .nyx-chat-welcome {
          margin: auto auto 12px;
          width: 100%;
          max-width: 520px;
          text-align: center;
          padding: 20px 8px;
        }

        .nyx-chat-orb {
          width: 52px;
          height: 52px;
          margin: 0 auto 15px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: linear-gradient(135deg, #54217a, #241332);
          border: 1px solid #70449a;
          color: #e9d5ff;
          font-size: 25px;
        }

        .nyx-chat-welcome h2 {
          color: white;
          font-size: 21px;
          margin: 0 0 9px;
        }

        .nyx-chat-welcome p {
          color: #a99fb2;
          font-size: 13px;
          line-height: 1.6;
          margin: 0 auto;
          max-width: 390px;
        }

        .nyx-quick-ideas {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 19px;
        }

        .nyx-quick-ideas button {
          background: #17121f;
          border: 1px solid #49315e;
          color: #d9c4ec;
          border-radius: 20px;
          padding: 9px 12px;
          font-size: 11px;
          cursor: pointer;
        }

        .nyx-chat-message {
          max-width: 88%;
          padding: 12px 14px;
          border-radius: 15px;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .nyx-chat-message.user {
          align-self: flex-end;
          background: #512779;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .nyx-chat-message.assistant {
          align-self: flex-start;
          background: #17131f;
          border: 1px solid #342640;
          color: #eee6f7;
          border-bottom-left-radius: 4px;
        }

        .nyx-chat-message small {
          display: block;
          color: #a98bbf;
          font-size: 9px;
          margin-top: 9px;
        }

        .nyx-chat-sources {
          margin-top: 12px;
          padding-top: 9px;
          border-top: 1px solid #392b45;
        }

        .nyx-chat-sources strong {
          display: block;
          font-size: 10px;
          color: #d8b4fe;
          margin-bottom: 6px;
        }

        .nyx-chat-sources a {
          display: block;
          color: #c4a1f1;
          font-size: 11px;
          margin: 5px 0;
          overflow-wrap: anywhere;
        }

        .nyx-chat-typing {
          align-self: flex-start;
          color: #c084fc;
          font-size: 12px;
          padding: 10px 13px;
          background: #17131f;
          border: 1px solid #342640;
          border-radius: 13px;
        }

        .nyx-chat-error {
          flex-shrink: 0;
          margin: 0 14px 8px;
          padding: 10px 12px;
          border: 1px solid #713b52;
          border-radius: 10px;
          background: #28131e;
          color: #ffb4c5;
          font-size: 12px;
        }

        .nyx-chat-composer {
          flex-shrink: 0;
          padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
          background: #100d18;
          border-top: 1px solid #30213e;
        }

        .nyx-chat-composer form {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 900px;
          margin: 0 auto;
        }

        .nyx-chat-composer textarea {
          flex: 1;
          min-width: 0;
          resize: none;
          min-height: 45px;
          max-height: 120px;
          padding: 13px;
          border-radius: 14px;
          background: #1a1522;
          color: white;
          border: 1px solid #49315e;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .nyx-chat-composer textarea:focus {
          border-color: #a855f7;
        }

        .nyx-chat-composer textarea::placeholder {
          color: #91869e;
        }

        .nyx-chat-action {
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 13px;
          border: 1px solid #563477;
          background: #241832;
          color: #e9d5ff;
          font-size: 18px;
          cursor: pointer;
        }

        .nyx-chat-action.send {
          background: #9333ea;
          border-color: #a855f7;
          color: white;
        }

        .nyx-chat-action:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .nyx-chat-hint {
          max-width: 900px;
          margin: 7px auto 0;
          color: #81758d;
          font-size: 9px;
          text-align: center;
        }

        @media (min-width: 800px) {
          .nyx-chat-scroll {
            padding-left: 7%;
            padding-right: 7%;
          }

          .nyx-chat-message {
            max-width: 72%;
          }

          .nyx-chat-composer {
            padding-left: 7%;
            padding-right: 7%;
          }
        }
      `}</style>

      <header className="nyx-chat-header">
        <button
          type="button"
          className="nyx-chat-back"
          onClick={onBack}
        >
          ←
        </button>

        <div className="nyx-chat-heading">
          <small>NYX CREATIVE STUDIO</small>
          <h1>{studio.name}</h1>
          <p>{studio.category}</p>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, maxWidth: 150, color: "#cdb8df", fontSize: 10 }}>
          SHARED PROJECT
          <select
            value={projectId}
            disabled={projectsLoading}
            onChange={event => {
              const next = event.target.value;
              setProjectId(next);
              try {
                if (next) localStorage.setItem("nyx-active-project-id", next);
                else localStorage.removeItem("nyx-active-project-id");
              } catch {}
            }}
            style={{ maxWidth: 150, minWidth: 0, padding: "7px 6px", borderRadius: 8, background: "#1a1522", color: "white", border: "1px solid #49315e", fontSize: 11 }}
          >
            <option value="">{projectsLoading ? "Loading..." : "No project selected"}</option>
            {projects.map(item => (
              <option key={item.id} value={item.id}>{item.title || "Untitled project"}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="nyx-chat-content">
        <section className="nyx-chat-tools">
          <details>
            <summary>✦ Studio workspace & tools</summary>

            <div className="nyx-chat-tool-content">
              <div>
                <h3>WHAT THIS STUDIO DOES</h3>
                {studio.capabilities.map((item, index) => (
                  <p key={index}>✦ {item}</p>
                ))}
              </div>

              <div>
                <h3>RESEARCH & DISCOVERY</h3>
                <div className="nyx-chat-tool-tags">
                  {studio.research.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))}
                </div>

                <h3 style={{ marginTop: 14 }}>
                  CONNECTED STUDIOS
                </h3>
                <div className="nyx-chat-tool-tags">
                  {collaborators.map(item => (
                    <span key={item.id}>{item.name}</span>
                  ))}
                </div>

                <h3 style={{ marginTop: 14 }}>
                  PRODUCTION CONNECTION
                </h3>
                <p>{studio.production}</p>

                <h3 style={{ marginTop: 14 }}>SHARED PROJECT ASSETS</h3>
                <p style={{ fontSize: 12, opacity: 0.8 }}>
                  Upload scripts, reference images, audio and other project files. Private to your account.
                </p>
                <input
                  type="file"
                  disabled={!projectId || assetBusy}
                  onChange={handleAssetUpload}
                  style={{ width: "100%", margin: "8px 0", fontSize: 12 }}
                />
                {!projectId && <p style={{ fontSize: 12 }}>Select a shared project to manage its assets.</p>}
                {assetBusy && <p style={{ fontSize: 12 }}>Saving project asset...</p>}
                {assetsLoading && <p style={{ fontSize: 12 }}>Loading project assets...</p>}
                {assetError && <p style={{ color: "#fca5a5", fontSize: 12 }}>{assetError}</p>}
                {projectAssets.map(asset => (
                  <div key={asset.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, fontSize: 12 }}>
                    <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                      {asset.file_name || "Project asset"}
                    </span>
                    {asset.signedUrl && (
                      <a href={asset.signedUrl} target="_blank" rel="noreferrer" style={{ color: "#c4b5fd" }}>Open</a>
                    )}
                    <button type="button" disabled={assetBusy} onClick={() => handleAssetDelete(asset)} style={{ background: "transparent", border: 0, color: "#fca5a5" }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </section>

        <section className="nyx-chat-scroll">
          {messages.length === 0 && (
            <div className="nyx-chat-welcome">
              <div className="nyx-chat-orb">✦</div>

              <h2>Welcome to {studio.name}</h2>

              <p>
                {studio.purpose} Tell NYX what you have in mind.
                We can develop the idea together, one step at a time.
              </p>

              <div className="nyx-quick-ideas">
                {quickIdeas.map((idea, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => useQuickIdea(idea)}
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(item => (
            <article
              className={`nyx-chat-message ${item.role}`}
              key={item.id}
            >
              {item.content}

              {item.sources?.length > 0 && (
                <div className="nyx-chat-sources">
                  <strong>Research sources</strong>

                  {item.sources.map((source, index) => (
                    source.url ? (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.title || source.url}
                      </a>
                    ) : null
                  ))}
                </div>
              )}

              {item.provider && (
                <small>Processed by {item.provider}</small>
              )}
            </article>
          ))}

          {loading && (
            <div className="nyx-chat-typing">
              NYX is thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        {error && (
          <div className="nyx-chat-error">
            {error}
          </div>
        )}

        <footer className="nyx-chat-composer">
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              className="nyx-chat-action"
              onClick={startDictation}
              title="Use voice dictation"
              aria-label="Use voice dictation"
              disabled={loading}
            >
              {dictating ? "■" : "🎙"}
            </button>

            <textarea
              rows={1}
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder={`Message ${studio.name}...`}
              disabled={loading}
              onKeyDown={event => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  event.currentTarget.form.requestSubmit();
                }
              }}
            />

            <button
              type="submit"
              className="nyx-chat-action send"
              disabled={loading || !message.trim()}
              aria-label="Send message"
              title="Send message"
            >
              ➤
            </button>
          </form>

          <p className="nyx-chat-hint">
            Enter to send · Shift + Enter for a new line ·
            Microphone uses voice dictation where supported
          </p>
        </footer>
      </div>
    </main>
  );
}
