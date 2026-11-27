import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
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
  editStudioMessage,
  updateStudioConversationProject
} from "./StudioEngine";
import { deleteProjectAsset, listProjectAssets, saveProjectAsset } from "./ProjectAssets";
import "./studios.css";
import MessageContent from "../components/MessageContent";

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
  const [conversationSearch, setConversationSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
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
  const [filmPrompt, setFilmPrompt] = useState("");
  const [filmDuration, setFilmDuration] = useState(5);
  const [filmRatio, setFilmRatio] = useState("1280:720");
  const [filmApproved, setFilmApproved] = useState(false);
  const [filmBusy, setFilmBusy] = useState(false);
  const [filmTask, setFilmTask] = useState(null);
  const [filmTaskError, setFilmTaskError] = useState("");
  const [filmCheckResult, setFilmCheckResult] = useState(null);
  const filmCredits = Math.ceil(Math.ceil(15.7 * Number(filmDuration)) * 0.8);


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
          setProjectId(selected.project_id || "");
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

  async function startNewThread(type) {
    if (loading || threadLoading) return;
    setError("");
    setThreadLoading(true);
    try {
      const row = await createStudioConversation({
        studioId,
        projectId: projectId || null,
        title: type === "task" ? "New task" : "New conversation",
        conversationType: type,
        context: {}
      });
      setConversations(items => [row, ...items]);
      setActiveConversationId(row.id);
      setProjectId(row.project_id || "");
      setConversationType(type);
      setConversationTitle(row.title);
      setContextDraft("");
      setMessages([]);
      setMessage("");
      setHistoryOpen(false);
    } catch (err) {
      setError(err.message || "Could not start a new workspace.");
    } finally {
      setThreadLoading(false);
    }
  }

  async function openThread(row) {
    if (!row || row.id === activeConversationId || loading) return;
    setThreadLoading(true);
    setError("");
    try {
      const history = await listStudioMessages(row.id);
      setActiveConversationId(row.id);
      setProjectId(row.project_id || "");
      setConversationType(row.conversation_type || "conversation");
      setConversationTitle(row.title || "");
      setContextDraft(row.context?.notes || row.context?.text || "");
      setMessages(history);
      setMessage("");
      setHistoryOpen(false);
    } catch (err) {
      setError(err.message || "Could not open this workspace.");
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleRenameThread() {
    if (!activeConversationId) return;
    const next = window.prompt("Give this workspace a title:", conversationTitle);
    if (next === null || !next.trim()) return;
    try {
      const title = await renameStudioConversation({ conversationId: activeConversationId, title: next });
      setConversationTitle(title);
      setConversations(items => items.map(item => item.id === activeConversationId ? { ...item, title } : item));
    } catch (err) {
      setError(err.message || "Could not rename this workspace.");
    }
  }

  async function handleSaveContext() {
    if (!activeConversationId || contextSaving) return;
    setContextSaving(true);
    try {
      const context = { notes: contextDraft };
      await updateStudioConversationContext({ conversationId: activeConversationId, context });
      setConversations(items => items.map(item => item.id === activeConversationId ? { ...item, context } : item));
      setError("");
    } catch (err) {
      setError(err.message || "Could not save the workspace context.");
    } finally {
      setContextSaving(false);
    }
  }

  async function handleEditMessage(item) {
    const revised = window.prompt("Edit this message. Previous versions are retained:", item.content);
    if (revised === null || revised === item.content) return;
    try {
      await editStudioMessage({ messageId: item.id, content: revised });
      setMessages(items => items.map(messageItem => messageItem.id === item.id ? { ...messageItem, content: revised } : messageItem));
    } catch (err) {
      setError(err.message || "Could not edit this message.");
    }
  }


  async function checkFilmSetup() {
    if (!projectId) {
      setFilmTaskError("Select The Last Kingdom or another saved project first.");
      return;
    }
    setFilmBusy(true);
    setFilmTaskError("");
    setFilmCheckResult(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("nyx-core", {
        body: { action: "video_check", studioId: "film", projectId }
      });
      if (invokeError) throw invokeError;
      if (!data?.success) throw new Error(data?.error || "NYX setup check failed.");
      setFilmCheckResult(data);
    } catch (err) {
      setFilmTaskError(err.message || "Could not check the Runway setup.");
    } finally {
      setFilmBusy(false);
    }
  }

  async function startFilmGeneration() {
    if (!projectId) {
      setFilmTaskError("Select a saved project before generating a shot.");
      return;
    }
    if (!filmPrompt.trim()) {
      setFilmTaskError("Describe the shot you want NYX to generate.");
      return;
    }
    if (!filmApproved) {
      setFilmTaskError("Review and tick the cost approval before generating.");
      return;
    }
    setFilmBusy(true);
    setFilmTaskError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("nyx-core", {
        body: {
          action: "video_generate",
          studioId: "film",
          projectId,
          promptText: filmPrompt.trim(),
          duration: Number(filmDuration),
          ratio: filmRatio,
          confirmed: true,
          approvedCredits: filmCredits
        }
      });
      if (invokeError) throw invokeError;
      if (!data?.success) throw new Error(data?.error || "NYX could not start this generation.");
      setFilmTask(data);
      setFilmApproved(false);
    } catch (err) {
      setFilmTaskError(err.message || "Video generation could not be started.");
    } finally {
      setFilmBusy(false);
    }
  }

  async function refreshFilmTask() {
    const taskId = filmTask?.task?.id || filmTask?.taskId;
    if (!taskId) return;
    setFilmBusy(true);
    setFilmTaskError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("nyx-core", {
        body: { action: "video_status", studioId: "film", projectId, taskId }
      });
      if (invokeError) throw invokeError;
      if (!data?.success) throw new Error(data?.error || "Could not retrieve the video status.");
      setFilmTask(previous => ({ ...(previous || {}), ...data, task: previous?.task }));
    } catch (err) {
      setFilmTaskError(err.message || "Could not refresh the video status.");
    } finally {
      setFilmBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const creatorMessage = message.trim();
    if (!creatorMessage || loading) return;

    setMessage("");
    setError("");
    setLoading(true);
    const previousMessages = messages;

    try {
      let threadId = activeConversationId;
      let activeTitle = conversationTitle;
      if (!threadId) {
        const row = await createStudioConversation({
          studioId,
          projectId: projectId || null,
          title: conversationType === "task" ? "New task" : "New conversation",
          conversationType,
          context: { notes: contextDraft }
        });
        threadId = row.id;
        activeTitle = row.title;
        setActiveConversationId(row.id);
        setConversationTitle(row.title);
        setConversations(items => [row, ...items]);
      }

      const userMessage = await saveStudioMessage({
        conversationId: threadId,
        role: "user",
        content: creatorMessage
      });
      setMessages(previous => [...previous, userMessage]);

      if (previousMessages.length === 0) {
        const title = makeConversationTitle(creatorMessage);
        await renameStudioConversation({ conversationId: threadId, title });
        activeTitle = title;
        setConversationTitle(title);
        setConversations(items => items.map(item => item.id === threadId ? { ...item, title } : item));
      }

      const workspaceContext = [
        studio.purpose,
        contextDraft ? "CREATOR-EDITED WORKSPACE CONTEXT:\n" + contextDraft : "",
        projectAssets.length
          ? [
              "SHARED PROJECT ASSET MANIFEST (metadata only; media contents have not yet been visually/audio analyzed):",
              ...projectAssets.map(asset => {
                const size = Number(asset.size_bytes || 0);
                const type = asset.asset_type || "file";
                return `- ${asset.file_name || "Unnamed asset"} | type: ${type} | MIME: ${asset.mime_type || "unknown"} | bytes: ${size} | uploaded: ${asset.created_at || "unknown"}`;
              }),
              "Use this manifest to refer to available files and ask the creator which asset to work with when unclear. Do not claim to have viewed, heard, transcribed, or edited any asset unless a connected media-analysis or production service actually did so."
            ].join("\n")
          : "No shared project assets are currently attached."
      ].filter(Boolean).join("\n\n");

      const output = await runStudioRequest({
        studioId,
        message: creatorMessage,
        history: previousMessages,
        projectId: projectId || null,
        workspaceContext
      });

      const assistantMessage = await saveStudioMessage({
        conversationId: threadId,
        role: "assistant",
        content: output.response,
        metadata: { sources: output.sources || [], provider: output.provider || null, model: output.model || null, deliverables: output.deliverables || [] }
      });
      setMessages(previous => [...previous, assistantMessage]);
      setConversations(items => items.map(item => item.id === threadId ? { ...item, title: activeTitle, updated_at: new Date().toISOString() } : item));

      if (onResult) onResult(output);
    } catch (err) {
      setError(err.message || "NYX could not complete that request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssetUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0 || !projectId || assetBusy) return;

    if (files.length > 10) {
      setAssetError("Please upload up to 10 files at a time.");
      return;
    }

    setAssetBusy(true);
    setAssetError("");
    const failures = [];
    let savedCount = 0;

    try {
      // Upload sequentially to avoid overwhelming mobile connections.
      for (const file of files) {
        try {
          const assetType = file.type.startsWith("image/") ? "image" :
            file.type.startsWith("audio/") ? "audio" :
            file.type.startsWith("video/") ? "video" : "document";
          await saveProjectAsset({
            projectId,
            studioId,
            file,
            assetType,
            metadata: {
              uploadedFrom: "studio-workspace",
              originalLastModified: file.lastModified || null
            }
          });
          savedCount += 1;
        } catch (err) {
          failures.push(`${file.name}: ${err.message || "upload failed"}`);
        }
      }

      const refreshed = await listProjectAssets({ projectId });
      setProjectAssets(refreshed);

      if (failures.length) {
        setAssetError(
          `${savedCount} of ${files.length} files uploaded. ${failures.join(" | ")}`
        );
      }
    } catch (err) {
      setAssetError(err.message || "Could not refresh project assets.");
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

        .nyx-history-toggle { flex:0 0 auto !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; width:auto !important; min-width:76px !important; height:40px !important; padding:0 12px !important; border:1px solid #9b70c8 !important; border-radius:11px !important; background:#39234f !important; color:#fff !important; font-size:13px !important; font-weight:700 !important; cursor:pointer !important; visibility:visible !important; opacity:1 !important; position:relative !important; z-index:2 !important; }
        .nyx-history-backdrop { position:fixed; inset:0; z-index:100; display:flex; background:rgba(0,0,0,.68); }
        .nyx-history-drawer { width:min(86vw,350px); height:100%; display:flex; flex-direction:column; gap:12px; padding:18px 14px calc(18px + env(safe-area-inset-bottom)); background:#100d18; border-right:1px solid #49315e; box-shadow:18px 0 50px rgba(0,0,0,.35); }
        .nyx-history-top { display:flex; align-items:center; justify-content:space-between; color:#fff; font-size:16px; }
        .nyx-history-top button { border:0; background:transparent; color:#cdb8df; font-size:22px; padding:5px 9px; }
        .nyx-history-new { width:100%; padding:12px; border:1px solid #8053b5; border-radius:12px; background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:white; font-weight:700; text-align:left; }
        .nyx-history-task { width:100%; padding:10px 12px; border:1px solid #49315e; border-radius:12px; background:#1b1427; color:#eadcff; text-align:left; }
        .nyx-history-search { width:100%; padding:11px 12px; border:1px solid #49315e; border-radius:11px; background:#17121f; color:white; font:inherit; font-size:12px; outline:none; }
        .nyx-history-label { color:#a99bb7; font-size:10px; letter-spacing:1px; font-weight:800; }
        .nyx-history-items { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:5px; }
        .nyx-history-item { width:100%; padding:11px 12px; border:1px solid transparent; border-radius:10px; background:transparent; color:#d9cbe7; text-align:left; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .nyx-history-item.active { background:#2a1d39; border-color:#65458a; color:white; }
        .nyx-history-options { border-top:1px solid #30213e; padding-top:10px; color:#d8b4fe; font-size:12px; }
        .nyx-history-options textarea { width:100%; min-height:76px; margin-top:8px; padding:9px; border:1px solid #49315e; border-radius:9px; background:#17121f; color:white; font:inherit; font-size:11px; }
        .nyx-history-options button { margin:7px 7px 0 0; padding:8px 10px; border:1px solid #68429a; border-radius:9px; background:#34204b; color:white; }
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

        .nyx-thread-bar {
          flex-shrink: 0;
          padding: 10px 13px;
          background: #100d18;
          border-bottom: 1px solid #30213e;
        }
        .nyx-thread-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 9px;
        }
        .nyx-thread-actions button, .nyx-thread-chip {
          border: 1px solid #49315e;
          border-radius: 13px;
          background: #1b1427;
          color: #eadcff;
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .nyx-thread-actions button.primary {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          border-color: #a78bfa;
          color: white;
        }
        .nyx-thread-search {
          width: 100%;
          margin: 0 0 8px;
          padding: 8px 11px;
          border: 1px solid #382849;
          border-radius: 11px;
          background: #17121f;
          color: #f5f0ff;
          font: inherit;
          font-size: 11px;
          outline: none;
        }
        .nyx-thread-search::placeholder { color: #91869e; }
        .nyx-thread-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 190px;
          overflow-y: auto;
          padding: 2px 0 5px;
        }
        .nyx-thread-chip {
          display: block;
          width: 100%;
          max-width: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
          font-weight: 500;
          border-radius: 10px;
          padding: 11px 13px;
          background: transparent;
          border-color: transparent;
        }
        .nyx-thread-chip.active {
          background: #241a30;
          border-color: #65458a;
          color: white;
        }
        .nyx-thread-chip:active {
          background: #34204b;
        }
        .nyx-thread-meta {
          color: #aa9bb9;
          font-size: 9px;
          margin-left: 5px;
        }
        .nyx-thread-context {
          margin-top: 7px;
          color: #d8b4fe;
          font-size: 11px;
        }
        .nyx-thread-context textarea {
          width: 100%;
          min-height: 65px;
          margin-top: 7px;
          padding: 9px;
          border: 1px solid #49315e;
          border-radius: 10px;
          background: #17121f;
          color: white;
          font: inherit;
          font-size: 12px;
        }
        .nyx-thread-context button {
          margin-top: 7px;
          border: 1px solid #68429a;
          border-radius: 9px;
          background: #34204b;
          color: white;
          padding: 7px 11px;
        }
        .nyx-message-edit {
          display: block;
          margin-top: 8px;
          border: 0;
          background: transparent;
          color: #c4a1f1;
          font-size: 10px;
          cursor: pointer;
          padding: 2px 0;
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

        /* ChatGPT-style transcript: assistant replies are flowing text, not cards. */
        .nyx-chat-scroll .nyx-chat-message.assistant {
          display: block;
          align-self: stretch;
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 5px 2px 18px;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          color: #eee6f7;
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .nyx-chat-scroll .nyx-chat-message.user {
          width: fit-content;
          max-width: 88%;
          padding: 12px 15px;
          border-radius: 17px 17px 4px 17px;
          background: #512779;
          color: #fff;
          box-shadow: none;
        }
        .nyx-chat-scroll .nyx-chat-message.assistant small {
          color: #81758d;
          font-size: 9px;
        }
        .nyx-chat-scroll .nyx-chat-message.assistant .nyx-chat-sources {
          max-width: 100%;
          border-top: 1px solid #30213e;
        }
        .nyx-chat-scroll .nyx-chat-message.assistant .nyx-message-edit {
          opacity: .7;
          margin-top: 5px;
        }
        @media (max-width: 600px) {
          .nyx-chat-scroll .nyx-chat-message.assistant {
            max-width: 100%;
            padding-left: 1px;
            padding-right: 1px;
            font-size: 14px;
          }
          .nyx-chat-scroll .nyx-chat-message.user {
            max-width: 88%;
          }
        }
      `}</style>

      <header className="nyx-chat-header">
        <button type="button" className="nyx-history-toggle" onClick={() => setHistoryOpen(true)} aria-label="Open conversation history">☰ History</button>
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
            onChange={async event => {
              const next = event.target.value;
              setProjectId(next);
              try {
                if (next) localStorage.setItem("nyx-active-project-id", next);
                else localStorage.removeItem("nyx-active-project-id");
              } catch {}
              if (activeConversationId) {
                try {
                  await updateStudioConversationProject({ conversationId: activeConversationId, projectId: next });
                  setConversations(items => items.map(item => item.id === activeConversationId ? { ...item, project_id: next || null } : item));
                } catch (err) {
                  setError(err.message || "Could not update the shared project.");
                }
              }
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

      {historyOpen && (
        <div className="nyx-history-backdrop" onClick={() => setHistoryOpen(false)}>
          <aside className="nyx-history-drawer" onClick={event => event.stopPropagation()}>
            <div className="nyx-history-top"><strong>{studio.name}</strong><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close history">×</button></div>
            <button type="button" className="nyx-history-new" onClick={() => startNewThread("conversation")} disabled={threadLoading || loading}>＋ New chat</button>
            <button type="button" className="nyx-history-task" onClick={() => startNewThread("task")} disabled={threadLoading || loading}>✦ New task</button>
            <input className="nyx-history-search" value={conversationSearch} onChange={event => setConversationSearch(event.target.value)} placeholder="Search conversations..." aria-label="Search conversations" />
            <div className="nyx-history-label">PAST CONVERSATIONS · {conversations.length}</div>
            <div className="nyx-history-items">
              {threadLoading && <span className="nyx-thread-meta">Loading your work...</span>}
              {conversations.filter(item => (item.title || "").toLowerCase().includes(conversationSearch.toLowerCase())).map(item => (
                <button type="button" key={item.id} className={`nyx-history-item ${item.id === activeConversationId ? "active" : ""}`} onClick={() => openThread(item)} title={item.title}>
                  {item.conversation_type === "task" ? "✦ " : "◌ "}{item.title || "Untitled conversation"}
                </button>
              ))}
              {!threadLoading && conversations.length === 0 && <span className="nyx-thread-meta">Your conversations will appear here.</span>}
            </div>
            {activeConversationId && (
              <details className="nyx-history-options">
                <summary>⋯ Conversation options</summary>
                <button type="button" onClick={handleRenameThread}>Rename chat</button>
                <textarea value={contextDraft} onChange={event => setContextDraft(event.target.value)} placeholder="Conversation context and project notes..." />
                <button type="button" onClick={handleSaveContext} disabled={contextSaving}>{contextSaving ? "Saving..." : "Save context"}</button>
              </details>
            )}
          </aside>
        </div>
      )}

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
                  Upload up to 10 scripts, reference images, audio clips or videos at once. Files are private to your account; each file has a 20 MB limit.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  disabled={!projectId || assetBusy}
                  onChange={handleAssetUpload}
                  style={{ width: "100%", margin: "8px 0", fontSize: 12 }}
                />
                {!projectId && <p style={{ fontSize: 12 }}>Select a shared project to manage its assets.</p>}
                {assetBusy && <p style={{ fontSize: 12 }}>Uploading project files one by one...</p>}
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
              style={item.role === "assistant" ? {
                display: "block",
                alignSelf: "stretch",
                width: "100%",
                maxWidth: 760,
                margin: "0 auto",
                padding: "5px 2px 18px",
                border: "0",
                borderRadius: 0,
                background: "transparent",
                boxShadow: "none",
                color: "#eee6f7",
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere"
              } : undefined}
            >
              {item.role === "assistant" ? <MessageContent content={item.content} /> : item.content}

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
              {activeConversationId && (
                <>
                  <button type="button" className="nyx-message-edit" onClick={() => handleEditMessage(item)}>✎ Edit message</button>
                  {item.metadata?.revisions?.length > 0 && (
                    <details style={{ marginTop: 5, color: "#bda6d2", fontSize: 10 }}>
                      <summary>Previous versions ({item.metadata.revisions.length})</summary>
                      {item.metadata.revisions.map((revision, index) => (
                        <p key={index} style={{ whiteSpace: "pre-wrap", opacity: 0.8 }}>{revision.content}</p>
                      ))}
                    </details>
                  )}
                </>
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
