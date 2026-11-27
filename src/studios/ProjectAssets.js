import { supabase } from "../lib/supabase";

const BUCKET = "nyx-project-assets";
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function safeFileName(name) {
  return String(name || "asset")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-120) || "asset";
}

async function getOwner() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new Error("Please sign in before managing project assets.");
  }
  return data.user;
}

async function assertProjectOwner(projectId, userId) {
  if (!projectId) throw new Error("Select a shared project first.");
  const { data, error } = await supabase
    .from("nyx_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("NYX could not verify access to this project.");
  }
}

export async function saveProjectAsset({
  projectId,
  studioId,
  file,
  assetType = "file",
  metadata = {}
}) {
  if (!(file instanceof File)) throw new Error("Choose a file to upload.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("This file is larger than NYX's 20 MB upload limit.");
  }

  const user = await getOwner();
  await assertProjectOwner(projectId, user.id);

  const fileName = safeFileName(file.name);
  const storagePath = `${user.id}/${projectId}/${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    throw new Error(uploadError.message || "NYX could not upload this asset.");
  }

  const { data, error: recordError } = await supabase
    .from("nyx_project_assets")
    .insert({
      project_id: projectId,
      user_id: user.id,
      studio_id: studioId || null,
      asset_type: assetType,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      metadata
    })
    .select("*")
    .single();

  if (recordError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(recordError.message || "NYX could not save the asset record.");
  }

  return data;
}

export async function listProjectAssets({ projectId, studioId } = {}) {
  const user = await getOwner();
  await assertProjectOwner(projectId, user.id);

  let query = supabase
    .from("nyx_project_assets")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (studioId) query = query.eq("studio_id", studioId);

  const { data, error } = await query;
  if (error) throw new Error(error.message || "NYX could not load project assets.");

  return Promise.all((data || []).map(async asset => {
    const { data: signed, error: signedError } = await supabase.storage
      .from(asset.storage_bucket || BUCKET)
      .createSignedUrl(asset.storage_path, 60 * 10);

    return {
      ...asset,
      signedUrl: signedError ? null : signed?.signedUrl || null
    };
  }));
}

export async function deleteProjectAsset(asset) {
  const user = await getOwner();
  if (!asset?.id || !asset?.storage_path) throw new Error("Invalid project asset.");

  const { data: record, error: lookupError } = await supabase
    .from("nyx_project_assets")
    .select("id, storage_bucket, storage_path, project_id")
    .eq("id", asset.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError || !record) throw new Error("NYX could not verify this asset.");

  await assertProjectOwner(record.project_id, user.id);

  const { error: storageError } = await supabase.storage
    .from(record.storage_bucket || BUCKET)
    .remove([record.storage_path]);

  if (storageError) throw new Error(storageError.message || "NYX could not remove the file.");

  const { error: deleteError } = await supabase
    .from("nyx_project_assets")
    .delete()
    .eq("id", record.id)
    .eq("user_id", user.id);

  if (deleteError) throw new Error(deleteError.message || "File removed, but its record could not be deleted.");
}
