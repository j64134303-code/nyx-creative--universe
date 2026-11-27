import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./MessageContent.css";

function normalizeMessageMarkdown(value) {
  if (typeof value !== "string") return "";

  return value
    // Models sometimes return escaped Markdown punctuation, which otherwise
    // makes the backslashes visible instead of formatting the text.
    .replace(/\\\\([\\\\`*_{}\\[\\]()#+.!|>~-])/g, "$1")
    // Convert HTML line-break variants into real Markdown line breaks.
    .replace(/<br\\s*\\/?\\s*>/gi, "\\n")
    .replace(/&lt;br\\s*\\/?\\s*&gt;/gi, "\\n")
    // Decode common escaped entities without enabling raw HTML rendering.
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    // Providers occasionally serialize line breaks as literal slash-n text.
    .replace(/\\\\r?\\\\n/g, "\\n")
    .trim();
}

export default function MessageContent({ content, className = "" }) {
  const source = normalizeMessageMarkdown(content);

  return (
    <div className={`nyx-markdown-content ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
