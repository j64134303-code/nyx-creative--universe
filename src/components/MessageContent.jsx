import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./MessageContent.css";

export default function MessageContent({ content, className = "" }) {
  const source = typeof content === "string" ? content : "";

  return (
    <div className={`nyx-markdown-content ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
