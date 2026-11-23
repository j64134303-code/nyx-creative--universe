
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

  const studioContext = `
ACTIVE STUDIO:
${studio.name}

CATEGORY:
${studio.category}

PURPOSE:
${studio.purpose}

CAPABILITIES:
${studio.capabilities.map(item => `- ${item}`).join("\n")}

RESEARCH AND DISCOVERY:
${studio.research.map(item => `- ${item}`).join("\n")}

POTENTIAL COLLABORATORS:
${collaborators.map(item =>
  `- ${item.name}: ${item.purpose}`
).join("\n")}

PRODUCTION CONNECTION:
${studio.production}

STUDIO RULES:
- Work as a specialist within this studio.
- Maintain project continuity.
- Coordinate with other studios only when relevant.
- Produce actual creative materials where possible.
- Distinguish plans from completed deliverables.
- Never claim that media has been generated, recorded,
  rendered or exported unless the action actually happened.
- Explain external production requirements honestly.
- Ask only one necessary follow-up question at a time.
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
        // Keep the creator's actual message separate.
        message: message.trim(),

        // Send studio instructions as separate context.
        studioContext,

        studioName: studio.name,
        studioId: studio.id,
        projectId,

        history: safeHistory
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

    // Preserve central intelligence decisions.
    orchestration: data.orchestration || null,

    // Preserve structured deliverable information
    // when the backend begins returning it.
    deliverables: Array.isArray(data.deliverables)
      ? data.deliverables
      : [],

    research: {
      requested: Boolean(data.researchRequested),
      available: Boolean(data.researchAvailable),
      verified: Boolean(data.researchVerified),
      date: data.researchDate || null
    },

    memory: {
      available: Boolean(data.memoryAvailable),
      saved: Boolean(data.memorySaved)
    },

    studio: studio.name,
    productionStatus:
      data.productionStatus || studio.production,

    projectId
  };
}
