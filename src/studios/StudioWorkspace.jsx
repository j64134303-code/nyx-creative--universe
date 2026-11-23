
import React, { useState } from "react";
import {
  getStudio,
  getStudioCollaborators
} from "./StudioRegistry";
import { runStudioRequest } from "./StudioEngine";
import "./studios.css";

export default function StudioWorkspace({
  studioId,
  onBack,
  onResult
}) {
  const studio = getStudio(studioId);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  if (!studio) {
    return (
      <div className="nyx-studio-workspace">
        <h2>Studio not found</h2>
        <button onClick={onBack}>Go back</button>
      </div>
    );
  }

  const collaborators = getStudioCollaborators(studioId);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const output = await runStudioRequest({
        studioId,
        message
      });

      setResult(output);

      if (onResult) {
        onResult(output);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="nyx-studio-workspace">
      <header className="nyx-studio-header">
        <button
          type="button"
          className="nyx-studio-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <span className="nyx-studio-label">
          NYX CREATIVE STUDIO
        </span>

        <h1>{studio.name}</h1>
        <p>{studio.purpose}</p>
      </header>

      <section className="nyx-studio-section">
        <h2>What this studio can do</h2>

        <div className="nyx-studio-grid">
          {studio.capabilities.map((item, index) => (
            <div className="nyx-studio-item" key={index}>
              <span>✦</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="nyx-studio-section">
        <h2>Research & Discovery</h2>
        <p className="nyx-studio-description">
          This studio can use research to guide its creative work.
        </p>

        <div className="nyx-studio-tags">
          {studio.research.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </section>

      <section className="nyx-studio-section">
        <h2>Connected expertise</h2>

        <div className="nyx-studio-tags">
          {collaborators.map(item => (
            <span key={item.id}>{item.name}</span>
          ))}
        </div>
      </section>

      <section className="nyx-studio-section">
        <h2>Production connections</h2>
        <p className="nyx-studio-description">
          {studio.production}
        </p>
      </section>

      <section className="nyx-studio-creator">
        <span className="nyx-studio-label">
          YOUR CREATIVE SPACE
        </span>

        <h2>What are we creating?</h2>

        <p>
          Describe your idea naturally. NYX will help develop
          the work inside this studio.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder={`Tell NYX what you want to create in ${studio.name}...`}
            rows={5}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !message.trim()}
          >
            {loading ? "NYX is working..." : "Start creating →"}
          </button>
        </form>

        {error && (
          <div className="nyx-studio-error">
            {error}
          </div>
        )}

        {result && (
          <div className="nyx-studio-result">
            <h3>NYX Studio Response</h3>

            <p>{result.response}</p>

            {result.sources?.length > 0 && (
              <div>
                <h4>Research sources</h4>

                {result.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title || source.url}
                  </a>
                ))}
              </div>
            )}

            <small>
              Processed by {result.provider}
            </small>
          </div>
        )}
      </section>
    </main>
  );
}
