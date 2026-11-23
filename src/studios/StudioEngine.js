
import { supabase } from "../lib/supabase";
import {
  getStudio,
  getStudioCollaborators
} from "./StudioRegistry";

/**
 * Prepare the studio's working instructions.
 * NYX CORE remains responsible for the AI response.
 */

export function getStudioWorkflow(studioId) {
  const studio = getStudio(studioId);

  if (!studio) {
    throw new Error("This NYX studio could not be found.");
  }

  return {
    id: studio.id,
    name: studio.name,
    purpose: studio.purpose,
    capabilities: studio.capabilities,
    research: studio.research,
    collaborators: getStudioCollaborators(studioId),
    production: studio.production
  };
}

/**
 * Send a creator's request through the existing NYX CORE.
 */

export async function runStudioRequest({
  studioId,
  message,
  history = [],
  projectId = null
}) {
  const studio = getStudio(studioId);

  if (!studio) {
    throw new Error("Unknown studio. Please select a valid NYX studio.");
  }

  if (!message || !message.trim()) {
    throw new Error("Please enter what you want to create.");
  }

  const collaborators = getStudioCollaborators(studioId);

  const studioInstructions = `
You are working as ${studio.name}, one of the specialist studios
inside the NYX creative platform.

STUDIO PURPOSE:
${studio.purpose}

YOUR CAPABILITIES:
${studio.capabilities.map(item => `- ${item}`).join("\n")}

RESEARCH AND DISCOVERY:
${studio.research.map(item => `- ${item}`).join("\n")}

POTENTIAL COLLABORATING STUDIOS:
${collaborators.map(item => `- ${item.name}: ${item.purpose}`).join("\n")}

PRODUCTION STATUS:
${studio.production}

HOW TO WORK:
1. Understand the creator's actual intention.
2. Work deeply within this studio's responsibilities.
3. Use research when facts, references, trends or creative discovery are useful.
4. Coordinate with relevant studios conceptually when their expertise is needed.
5. Keep the creator's project details and creative direction consistent.
6. Ask only for information that is genuinely necessary.
7. Give practical, detailed work rather than generic suggestions.
8. Never claim that an image, video, song, voice recording or other
   media asset has been generated unless a production service actually
   completed that work.
9. Explain clearly when an external production connection is required.
10. Preserve the creator's ownership and creative direction.

The creator's request is below. Respond as this specialist studio.
`;

  const safeHistory = Array.isArray(history)
    ? history.slice(-12).map(item => ({
        role: item.role,
        content: String(item.content || item.text || "")
      })).filter(item =>
        ["user", "assistant"].includes(item.role) &&
        item.content.trim()
      )
    : [];

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("NYX could not verify your session. Please try again.");
  }

  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error("Please sign in before using NYX studios.");
  }

  const { data, error } = await supabase.functions.invoke(
    "nyx-core",
    {
      body: {
        message: `${studioInstructions}\n\nCREATOR REQUEST:\n${message.trim()}`,
        studioName: studio.name,
        studioId: studio.id,
        projectId,
        history: safeHistory,
        collaboratorStudioIds: collaborators.map(item => item.id)
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (error) {
    throw new Error(error.message || "NYX CORE could not process this request.");
  }

  if (!data || !data.response) {
    throw new Error("NYX CORE returned an empty response. Please try again.");
  }

  return {
    response: data.response,
    sources: data.sources || [],
    provider: data.provider || "NYX CORE",
    model: data.model || null,
    research: data.research || null,
    studio: studio.name,
    productionStatus: studio.production,
    projectId
  };
}
