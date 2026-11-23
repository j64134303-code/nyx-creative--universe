import { supabase } from "../lib/supabase";
import {
  getStudio,
  getStudioCollaborators
} from "./StudioRegistry";

export function getStudioWorkflow(studioId) {
  const studio = getStudio(studioId);

  if (!studio) {
    throw new Error("This NYX studio could not be found.");
  }

  return {
    id: studio.id,
    name: studio.name,
    category: studio.category,
    purpose: studio.purpose,
    capabilities: studio.capabilities,
    research: studio.research,
    collaborators: getStudioCollaborators(studioId),
    production: studio.production
  };
}

export async function runStudioRequest({
  studioId,
  message,
  history = [],
  projectId = null
}) {
  const studio = getStudio(studioId);

  if (!studio) {
    throw new Error(
      "Unknown studio. Please select a valid NYX studio."
    );
  }

  if (!message || !message.trim()) {
    throw new Error("Please enter a message for NYX.");
  }

  const collaborators = getStudioCollaborators(studioId);

  const studioInstructions = `
You are ${studio.name}, a specialist creative workspace
inside the NYX creative platform.

STUDIO CATEGORY:
${studio.category}

STUDIO PURPOSE:
${studio.purpose}

YOUR CAPABILITIES:
${studio.capabilities.map(item => `- ${item}`).join("\n")}

RESEARCH AND DISCOVERY:
${studio.research.map(item => `- ${item}`).join("\n")}

CONNECTED CREATIVE EXPERTISE:
${collaborators.map(item =>
  `- ${item.name}: ${item.purpose}`
).join("\n")}

PRODUCTION CONNECTION:
${studio.production}

HOW YOU SHOULD WORK:

1. Treat this as an ongoing conversation, not a new isolated request.
2. Remember and use the relevant conversation history.
3. Understand the creator's intention before proposing unnecessary steps.
4. Work deeply within this studio's responsibilities.
5. Use research and discovery when useful.
6. Coordinate with relevant NYX studios when their expertise is needed.
7. Keep the creator's project details and creative direction consistent.
8. Ask one relevant follow-up question at a time when necessary.
9. Produce useful creative work, not generic encouragement.
10. Be honest about available production capabilities.
11. Never claim that a song, image, video, voice recording,
    animation or other media asset has been generated unless
    an actual connected production service completed it.
12. Explain when an external production connection is required.
13. Respect the creator's ownership, choices and creative direction.

Speak naturally and collaborate with the creator.
Do not repeat the studio description unnecessarily.
`;

  const safeHistory = Array.isArray(history)
    ? history
        .slice(-20)
        .map(item => ({
          role: item.role,
          content: String(item.content || item.text || "")
        }))
        .filter(item =>
          ["user", "assistant"].includes(item.role) &&
          item.content.trim()
        )
    : [];

  const {
    data: sessionData,
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      "NYX could not verify your session. Please try again."
    );
  }

  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error(
      "Please sign in before using NYX studios."
    );
  }

  const { data, error } = await supabase.functions.invoke(
    "nyx-core",
    {
      body: {
        message: `
${studioInstructions}

CURRENT CREATOR MESSAGE:
${message.trim()}
        `.trim(),

        studioName: studio.name,
        studioId: studio.id,
        projectId,

        history: safeHistory,

        collaboratorStudioIds: collaborators.map(
          item => item.id
        )
      },

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (error) {
    throw new Error(
      error.message ||
      "NYX CORE could not process this request."
    );
  }

  if (!data || !data.response) {
    throw new Error(
      "NYX CORE returned an empty response. Please try again."
    );
  }

  return {
    response: data.response,
    sources: Array.isArray(data.sources)
      ? data.sources
      : [],
    provider: data.provider || "NYX CORE",
    model: data.model || null,
    research: data.research || null,
    studio: studio.name,
    productionStatus: studio.production,
    projectId
  };
}
