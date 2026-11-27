
import { supabase } from "../lib/supabase";
import {
  getStudio,
  getStudioCollaborators
} from "./StudioRegistry";

export async function listUserProjects() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error("NYX could not verify your session. Please try again.");
  if (!sessionData?.session?.user) throw new Error("Please sign in to select a shared project.");

  const { data, error } = await supabase
    .from("nyx_projects")
    .select("id, title, created_at")
    .eq("user_id", sessionData.session.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("NYX could not load your saved projects.");
  return Array.isArray(data) ? data : [];
}

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
  projectId = null,
  workspaceContext = ""
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
        .slice(-12)
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
        studioContext: [studioContext, workspaceContext].filter(Boolean).join("\n\n"),

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

  const result = data?.data && typeof data.data === "object"
    ? data.data
    : data;

  if (!result || typeof result.response !== "string" || !result.response.trim()) {
    throw new Error(
      "NYX CORE returned an empty response. Please try again."
    );
  }

  return {
    response: result.response,
    sources: Array.isArray(result.sources) ? result.sources : [],
    provider: result.provider || "NYX CORE",
    model: result.model || null,
    orchestration: result.orchestration || null,
    deliverables: Array.isArray(result.deliverables) ? result.deliverables : [],
    research: {
      requested: Boolean(result.research?.requested ?? result.researchRequested),
      available: Boolean(result.research?.available ?? result.researchAvailable),
      verified: Boolean(result.research?.verified ?? result.researchVerified),
      date: result.researchDate || null
    },
    memory: {
      available: Boolean(result.memory?.enabled ?? result.memoryAvailable),
      saved: Boolean(result.memory?.success ?? result.memorySaved),
      details: result.memory || null
    },
    studio: result.studio?.name || studio.name,
    productionStatus: result.productionStatus || studio.production,
    projectId
  };
}


// Persistent studio conversation storage. Row Level Security scopes every
// operation to the signed-in creator; local legacy history is never deleted.
async function requireStudioUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Please sign in to save studio conversations.");
  return data.user;
}

export async function listStudioConversations({ studioId }) {
  await requireStudioUser();
  const { data, error } = await supabase
    .from("nyx_conversations")
    .select("id, title, studio_id, project_id, conversation_type, context, created_at, updated_at")
    .eq("studio_id", studioId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("NYX could not load your saved studio conversations.");
  return Array.isArray(data) ? data : [];
}

export async function createStudioConversation({
  studioId, projectId = null, title = "New conversation",
  conversationType = "conversation", context = {}
}) {
  const user = await requireStudioUser();
  const { data, error } = await supabase
    .from("nyx_conversations")
    .insert({
      user_id: user.id,
      studio_id: studioId,
      project_id: projectId,
      title,
      conversation_type: conversationType,
      context
    })
    .select("id, title, studio_id, project_id, conversation_type, context, created_at, updated_at")
    .single();
  if (error || !data) throw new Error("NYX could not create this conversation. Check that the latest studio conversation migration has been applied.");
  return data;
}

export async function listStudioMessages(conversationId) {
  await requireStudioUser();
  const { data, error } = await supabase
    .from("nyx_messages")
    .select("id, role, content, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error("NYX could not load this conversation's history.");
  return (data || []).map(item => ({
    id: item.id,
    role: item.role,
    content: item.content,
    sources: Array.isArray(item.metadata?.sources) ? item.metadata.sources : [],
    provider: item.metadata?.provider || null,
    metadata: item.metadata || {},
    created_at: item.created_at
  }));
}

export async function saveStudioMessage({ conversationId, role, content, metadata = {} }) {
  const user = await requireStudioUser();
  const { data, error } = await supabase
    .from("nyx_messages")
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
      metadata
    })
    .select("id, role, content, metadata, created_at")
    .single();
  if (error || !data) throw new Error("NYX could not save a message to this conversation.");
  await supabase.from("nyx_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return {
    id: data.id,
    role: data.role,
    content: data.content,
    sources: Array.isArray(data.metadata?.sources) ? data.metadata.sources : [],
    provider: data.metadata?.provider || null,
    metadata: data.metadata || {},
    created_at: data.created_at
  };
}

export async function renameStudioConversation({ conversationId, title }) {
  await requireStudioUser();
  const cleanTitle = String(title || "").trim().slice(0, 120);
  if (!cleanTitle) throw new Error("Please enter a title.");
  const { error } = await supabase
    .from("nyx_conversations")
    .update({ title: cleanTitle })
    .eq("id", conversationId);
  if (error) throw new Error("NYX could not rename this conversation.");
  return cleanTitle;
}

export async function updateStudioConversationContext({ conversationId, context }) {
  await requireStudioUser();
  const { error } = await supabase
    .from("nyx_conversations")
    .update({ context })
    .eq("id", conversationId);
  if (error) throw new Error("NYX could not save the edited context.");
}

export async function editStudioMessage({ messageId, content, metadata = {} }) {
  await requireStudioUser();
  const { data: current, error: readError } = await supabase
    .from("nyx_messages")
    .select("content, metadata")
    .eq("id", messageId)
    .single();
  if (readError || !current) throw new Error("NYX could not load the message for editing.");
  const revisions = Array.isArray(current.metadata?.revisions) ? current.metadata.revisions : [];
  const nextMetadata = {
    ...current.metadata,
    ...metadata,
    revisions: [...revisions, { content: current.content, savedAt: new Date().toISOString() }].slice(-20)
  };
  const { error } = await supabase
    .from("nyx_messages")
    .update({ content: String(content || ""), metadata: nextMetadata })
    .eq("id", messageId);
  if (error) throw new Error("NYX could not save your message edit.");
}
