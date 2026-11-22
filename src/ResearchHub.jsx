
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
  X,
  LoaderCircle
} from "lucide-react";
import { supabase } from "./lib/supabase";

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

function extractLinks(content = "") {
  const links = [];
  const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const plainUrlPattern = /https?:\/\/[^\s<>)\]]+/g;

  let match;

  while ((match = markdownLinkPattern.exec(content)) !== null) {
    links.push({
      title: match[1].trim(),
      url: match[2].replace(/[.,;!?]+$/, "")
    });
  }

  while ((match = plainUrlPattern.exec(content)) !== null) {
    const url = match[0].replace(/[.,;!?]+$/, "");
    if (!links.some(item => item.url === url)) {
      links.push({ title: url, url });
    }
  }

  return links.filter(item => {
    try {
      const parsed = new URL(item.url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  });
}

function renderMessageContent(content = "") {
  const parts = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>)\]]+)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`text-${key++}`}>
          {content.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }

    const label = match[1] || match[3];
    const rawUrl = match[2] || match[3];
    const url = rawUrl.replace(/[.,;!?]+$/, "");
    const trailing = rawUrl.slice(url.length);

    let safeUrl = null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        safeUrl = parsed.href;
      }
    } catch {
      safeUrl = null;
    }

    if (safeUrl) {
      parts.push(
        <React.Fragment key={`link-${key++}`}>
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#d0a7ff",
              textDecoration: "underline",
              overflowWrap: "anywhere"
            }}
          >
            {label}
          </a>
          {trailing}
        </React.Fragment>
      );
    } else {
      parts.push(
        <React.Fragment key={`plain-${key++}`}>
          {match[0]}
        </React.Fragment>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(
      <React.Fragment key={`text-${key++}`}>
        {content.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return parts;
}

export default function ResearchHub({ studio, onBack, onAttach }) {
  const studioName = getStudioName(studio);

  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [isResearching, setIsResearching] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const activeConversation =
    conversations.find(item => item.id === activeId) || null;

  const savedConversations = conversations.filter(item => item.saved);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      setNotice("Your device could not save this conversation.");
    }
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [activeConversation?.messages?.length, isResearching]);

  function startNewChat() {
    setActiveId(null);
    setMessage("");
    setShowSaved(false);
    setNotice("");
  }

  async function sendMessage() {
    const question = message.trim();
    if (!question || isResearching) return;

    const existing = activeConversation;
    const now = new Date().toISOString();

    const conversation = existing || {
      id: makeId(),
      title: question.length > 48
        ? `${question.slice(0, 48)}...`
        : question,
      studio: studioName,
      saved: false,
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    const userMessage = {
      id: makeId(),
      role: "user",
      content: question,
      createdAt: now
    };

    const updatedConversation = {
      ...conversation,
      updatedAt: now,
      messages: [...(conversation.messages || []), userMessage]
    };

    setConversations(previous => [
      updatedConversation,
      ...previous.filter(item => item.id !== updatedConversation.id)
    ]);
    setActiveId(updatedConversation.id);
    setMessage("");
    setShowSaved(false);
    setNotice("");
    setIsResearching(true);

    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Please sign in again before using NYX Research.");
      }

      const history = (conversation.messages || [])
        .filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        )
        .slice(-12)
        .map(item => ({
          role: item.role,
          content: item.content
        }));

      const { data, error } = await supabase.functions.invoke("nyx-core", {
        body: {
          message: question,
          studioName,
          history
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (error) {
        let details = error.message || "The NYX CORE request failed.";

        if (error.context && typeof error.context.json === "function") {
          try {
            const responseBody = await error.context.json();
            if (responseBody?.error) details = responseBody.error;
          } catch {
            // Keep the original function error.
          }
        }

        throw new Error(details);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const answer =
        typeof data?.response === "string"
          ? data.response.trim()
          : "";

      if (!answer) {
        throw new Error("NYX CORE returned an empty answer. Please try again.");
      }

      const assistantMessage = {
        id: makeId(),
        role: "assistant",
        content: answer,
        sources: extractLinks(answer),
        provider: data.provider || "Groq",
        core: data.core || "NYX CORE",
        researchRequested: Boolean(data.researchRequested),
        createdAt: new Date().toISOString()
      };

      setConversations(previous =>
        previous.map(item =>
          item.id === updatedConversation.id
            ? {
                ...item,
                updatedAt: new Date().toISOString(),
                messages: [...(item.messages || []), assistantMessage]
              }
            : item
        )
      );
    } catch (error) {
      const errorMessage = {
        id: makeId(),
        role: "assistant",
        content: `I couldn't complete that research request. ${error?.message || "Please try again."}`,
        isError: true,
        createdAt: new Date().toISOString()
      };

      setConversations(previous =>
        previous.map(item =>
          item.id === updatedConversation.id
            ? {
                ...item,
                updatedAt: new Date().toISOString(),
                messages: [...(item.messages || []), errorMessage]
              }
            : item
        )
      );
    } finally {
      setIsResearching(false);
      textareaRef.current?.focus();
    }
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

    if (activeId === id) setActiveId(null);
    setNotice("Conversation deleted.");
  }

  function attachResearch() {
    if (!activeConversation) return;

    const references = (activeConversation.messages || [])
      .filter(item => item.role === "assistant" && !item.isError)
      .flatMap(item => {
        const links = item.sources?.length
          ? item.sources
          : extractLinks(item.content);

        return links.map((source, index) => ({
          id: `${item.id}-${index}`,
          title: source.title || activeConversation.title,
          url: source.url,
          notes: item.content,
          category: "Research",
          rights: "Public viewing only",
          studio: activeConversation.studio || studioName,
          type: "research",
          source: "NYX Research"
        }));
      });

    if (!references.length) {
      setNotice(
        "NYX has not returned clickable source links in this conversation yet."
      );
      return;
    }

    if (typeof onAttach === "function") {
      onAttach(references);
      setNotice(`${references.length} research source(s) sent to your studio project.`);
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
      gap: "6px",
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
      lineHeight: 1.65,
      fontSize: "14px",
      overflowWrap: "anywhere",
      whiteSpace: "pre-wrap"
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

          <div style={styles.muted}>{studioName}</div>
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
          disabled={isResearching}
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
            <h2 style={{
              fontSize: "19px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
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
                      : item.isError
                        ? "1px solid #8b4545"
                        : "1px solid #30283c"
                  }}>
                    {item.role === "assistant" && (
                      <div style={{
                        color: item.isError ? "#ffaaaa" : "#c69aff",
                        fontSize: "11px",
                        fontWeight: 700,
                        marginBottom: "7px"
                      }}>
                        {item.isError ? "NYX NOTICE" : "NYX RESEARCH"}
                      </div>
                    )}

                    {renderMessageContent(item.content)}

                    {item.role === "assistant" &&
                      item.sources?.length > 0 && (
                        <div style={{
                          borderTop: "1px solid #393044",
                          marginTop: "13px",
                          paddingTop: "10px"
                        }}>
                          <div style={{
                            color: "#c69aff",
                            fontSize: "12px",
                            fontWeight: 700,
                            marginBottom: "8px"
                          }}>
                            SOURCES
                          </div>

                          {item.sources.map((source, index) => (
                            <a
                              key={`${item.id}-source-${index}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "7px",
                                color: "#d0a7ff",
                                textDecoration: "none",
                                fontSize: "13px",
                                marginTop: "7px",
                                overflowWrap: "anywhere"
                              }}
                            >
                              <ExternalLink
                                size={14}
                                style={{
                                  flexShrink: 0,
                                  marginTop: "2px"
                                }}
                              />
                              <span>{source.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {isResearching && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  color: "#c69aff",
                  fontSize: "13px",
                  padding: "10px 4px"
                }}>
                  <LoaderCircle size={17} />
                  NYX is researching...
                </div>
              )}

              <div ref={bottomRef} />
            </section>
          )}

          <div style={styles.composer}>
            <textarea
              ref={textareaRef}
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
              disabled={isResearching}
            />

            <button
              onClick={sendMessage}
              disabled={!message.trim() || isResearching}
              style={{
                ...styles.iconButton,
                background: message.trim() && !isResearching
                  ? "#8750c9"
                  : "#30283c",
                color: "#ffffff",
                border: "none",
                opacity: message.trim() && !isResearching ? 1 : 0.5
              }}
              aria-label="Send research question"
            >
              {isResearching
                ? <LoaderCircle size={19} />
                : <Send size={19} />}
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
              border: "none",
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
