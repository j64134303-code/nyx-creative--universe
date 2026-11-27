import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./MessageContent.css";

function normalizeMessageMarkdown(value) {
  if (typeof value !== "string") return "";

  return value
    // Remove one escape slash before Markdown punctuation returned by some models.
    .replace(new RegExp("\\\\([*_{}\\[\\]()#+.!|>~-])", "g"), "$1")
    // Convert literal and entity-escaped HTML line breaks into real newlines.
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/&lt;br\s*\/?\s*&gt;/gi, "\n")
    // Decode common entities, without enabling raw HTML rendering.
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    // Convert serialized backslash-n sequences to actual line breaks.
.replace(/\\n/g, "\n")
    .trim();
}

export default function MessageContent({ content, className = "" }) {
  const source = normalizeMessageMarkdown(content);

  return (
    <div className={"nyx-markdown-content " + className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
