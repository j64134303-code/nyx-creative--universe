
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  Send,
  Trash2,
  Bookmark,
  FolderOpen,
  Sparkles,
  ExternalLink,
  X
} from "lucide-react";

const STORAGE_KEY = "nyx-research-conversations-v2";

function loadConversations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStudioName(studio) {
  if (!studio) return "Research & Discovery";
  if (typeof studio === "string") return studio;
  return studio.name || studio.title || "Research & Discovery";
}

export default function ResearchHub({ studio, onBack, onAttach }) {
  const studioName = getStudioName(studio);

  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [notice, setNotice] = useState("");

  const bottomRef = useRef(null);

  const activeConversation =
    conversations.find(item => item.id === activeId) || null;

  const savedConversations = conversations.filter(
    item => item.saved
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversations)
      );
    } catch {
      setNotice("Your device could not save this conversation.");
    }
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [activeConversation?.messages?.length]);

  function startNewChat() {
    setActiveId(null);
    setMessage("");
    setShowSaved(false);
    setNotice("");
  }

  function sendMessage() {
    const question = message.trim();
    if (!question) return;

    const existing = activeConversation;
    const conversation = existing || {
      id: makeId(),
      title: question.length > 48
        ? question.slice(0, 48) + "..."
        : question,
      studio: studioName,
      saved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    const searchUrl =
      "https://www.google.com/search?q=" +
      encodeURIComponent(question);

    const userMessage = {
      id: makeId(),
      role: "user",
      content: question,
      createdAt: new Date().toISOString()
    };

    const assistantMessage = {
      id: makeId(),
      role: "assistant",
      content:
        "Your research question is ready. The live NYX research engine is not connected yet, so I cannot produce verified in-app findings at this stage. You can open the search below to explore sources. Once the research engine is connected, NYX will be able to investigate, analyse and organise sourced findings here.",
      searchUrl,
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages: [
        ...(conversation.messages || []),
        userMessage,
        assistantMessage
      ]
    };

    setConversations(previous => [
      updated,
      ...previous.filter(item => item.id !== updated.id)
    ]);

    setActiveId(updated.id);
    setMessage("");
    setShowSaved(false);
    setNotice("");
  }

  function toggleSaved() {
    if (!activeConversation) return;

    setConversations(previous =>
      previous.map(item =>
        item.id === activeId
          ? { ...item, saved: !item.saved }
          : item
      )
    );

    setNotice(
      activeConversation.saved
        ? "Removed from saved research."
        : "Research conversation saved."
    );
  }

  function openConversation(id) {
    setActiveId(id);
    setShowSaved(false);
    setNotice("");
  }

  function deleteConversation(id) {
    setConversations(previous =>
      previous.filter(item => item.id !== id)
    );

    if (activeId === id) {
      setActiveId(null);
    }

    setNotice("Conversation deleted.");
  }

  function attachResearch() {
    if (!activeConversation) return;

    const references = (activeConversation.messages || [])
      .filter(item => item.role === "assistant" && item.searchUrl)
      .map(item => ({
        id: item.id,
        title: activeConversation.title,
        url: item.searchUrl,
        notes: item.content,
        category: "Research",
        rights: "Public viewing only",
        studio: studioName,
        type: "research",
        source: "NYX Research"
      }));

    if (!references.length) {
      setNotice("There are no research references to attach yet.");
      return;
    }

    if (typeof onAttach === "function") {
      onAttach(references);
      setNotice("Research sent to your studio project.");
    } else {
      setNotice("Your research is saved in this conversation.");
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#08080d",
      color: "#f5f1ff",
      display: "flex",
      flexDirection: "column",
      padding: "14px",
      boxSizing: "border-box"
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      padding: "5px 0 15px",
      borderBottom: "1px solid #24202d"
    },
    iconButton: {
      background: "#17141f",
      color: "#e8ddff",
      border: "1px solid #30283c",
      borderRadius: "12px",
      padding: "10px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    },
    panel: {
      background: "#111018",
      border: "1px solid #292332",
      borderRadius: "16px",
      padding: "15px",
      marginTop: "15px"
    },
    muted: {
      color: "#a9a2b5",
      fontSize: "13px",
      lineHeight: 1.6
    },
    message: {
      maxWidth: "88%",
      padding: "13px 15px",
      borderRadius: "16px",
      lineHeight: 1.6,
      fontSize: "14px",
      overflowWrap: "anywhere"
    },
    composer: {
      display: "flex",
      alignItems: "flex-end",
      gap: "9px",
      background: "#17141f",
      border: "1px solid #393044",
      borderRadius: "18px",
      padding: "9px",
      marginTop: "15px"
    },
    textarea: {
      flex: 1,
      minWidth: 0,
      resize: "none",
      border: "none",
      outline: "none",
      background: "transparent",
      color: "#ffffff",
      fontSize: "15px",
      padding: "9px",
      minHeight: "42px",
      maxHeight: "130px",
      fontFamily: "inherit"
    }
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button
          style={styles.iconButton}
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#c79aff",
            fontSize: "12px",
            fontWeight: 700
          }}>
            <Sparkles size={14} />
            NYX INTELLIGENCE
          </div>
          <div style={{
            fontWeight: 700,
            fontSize: "16px",
            marginTop: "3px"
          }}>
            Research
          </div>
          <div style={styles.muted}>
            {studioName}
          </div>
        </div>

        <button
          style={styles.iconButton}
          onClick={() => setShowSaved(!showSaved)}
          aria-label="Saved conversations"
        >
          <Bookmark size={19} />
        </button>

        <button
          style={styles.iconButton}
          onClick={startNewChat}
          aria-label="New research"
        >
          <Plus size={20} />
        </button>
      </header>

      {showSaved ? (
        <section style={{ paddingTop: "20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ fontSize: "19px" }}>
              <FolderOpen size={19} /> Saved research
            </h2>
            <button
              style={styles.iconButton}
              onClick={() => setShowSaved(false)}
            >
              <X size={18} />
            </button>
          </div>

          {savedConversations.length === 0 ? (
            <div style={styles.panel}>
              <p style={styles.muted}>
                No saved conversations yet. Save a research chat
                to find it here later.
              </p>
            </div>
          ) : (
            savedConversations.map(item => (
              <article key={item.id} style={styles.panel}>
                <button
                  onClick={() => openConversation(item.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    textAlign: "left",
                    fontSize: "15px",
                    fontWeight: 600,
                    padding: 0,
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  {item.title}
                </button>

                <p style={styles.muted}>
                  {item.studio} · {item.messages?.length || 0} messages
                </p>

                <div style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }}>
                  <button
                    style={styles.iconButton}
                    onClick={() => openConversation(item.id)}
                  >
                    Open conversation
                  </button>

                  <button
                    style={styles.iconButton}
                    onClick={() => deleteConversation(item.id)}
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      ) : (
        <>
          {!activeConversation ? (
            <section style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "35px 12px"
            }}>
              <div style={{
                width: "65px",
                height: "65px",
                borderRadius: "22px",
                background: "#21172e",
                display: "grid",
                placeItems: "center",
                color: "#c69aff",
                marginBottom: "20px"
              }}>
                <Search size={30} />
              </div>

              <h1 style={{
                fontSize: "25px",
                margin: "0 0 9px"
              }}>
                What shall we discover?
              </h1>

              <p style={{
                ...styles.muted,
                maxWidth: "310px"
              }}>
                Ask NYX about anything. Explore ideas, people,
                history, music, films, technology, businesses
                and creative trends.
              </p>
            </section>
          ) : (
            <section style={{
              flex: 1,
              overflowY: "auto",
              padding: "18px 2px"
            }}>
              <h2 style={{
                fontSize: "16px",
                color: "#c69aff",
                marginBottom: "20px"
              }}>
                {activeConversation.title}
              </h2>

              {(activeConversation.messages || []).map(item => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: item.role === "user"
                      ? "flex-end"
                      : "flex-start",
                    marginBottom: "15px"
                  }}
                >
                  <div style={{
                    ...styles.message,
                    background: item.role === "user"
                      ? "#39234e"
                      : "#17141f",
                    border: item.role === "user"
                      ? "1px solid #63418a"
                      : "1px solid #30283c"
                  }}>
                    {item.role === "assistant" && (
                      <div style={{
                        color: "#c69aff",
                        fontSize: "11px",
                        fontWeight: 700,
                        marginBottom: "7px"
                      }}>
                        NYX RESEARCH
                      </div>
                    )}

                    {item.content}

                    {item.searchUrl && (
                      <a
                        href={item.searchUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          marginTop: "12px",
                          color: "#d0a7ff",
                          textDecoration: "none",
                          fontWeight: 600
                        }}
                      >
                        <ExternalLink size={15} />
                        Explore search results
                      </a>
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </section>
          )}

          <div style={styles.composer}>
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              onKeyDown={event => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask NYX to research something..."
              style={styles.textarea}
              rows={1}
            />

            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              style={{
                ...styles.iconButton,
                background: message.trim() ? "#8750c9" : "#30283c",
                color: "#ffffff",
                border: "none",
                opacity: message.trim() ? 1 : 0.5
              }}
              aria-label="Send research question"
            >
              <Send size={19} />
            </button>
          </div>

          {activeConversation && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "12px"
            }}>
              <button
                style={styles.iconButton}
                onClick={toggleSaved}
              >
                <Bookmark size={16} />
                {activeConversation.saved ? "Saved" : "Save chat"}
              </button>

              <button
                style={styles.iconButton}
                onClick={attachResearch}
              >
                <FolderOpen size={16} />
                Use in studio
              </button>

              <button
                style={styles.iconButton}
                onClick={() => deleteConversation(activeId)}
                aria-label="Delete current conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {notice && (
        <div style={{
          background: "#21172e",
          border: "1px solid #63418a",
          borderRadius: "12px",
          padding: "11px",
          marginTop: "12px",
          color: "#e9dcff",
          fontSize: "13px"
        }}>
          {notice}
          <button
            onClick={() => setNotice("")}
            style={{
              float: "right",
              background: "transparent",
              color: "#ffffff",
              border: "none"
            }}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
