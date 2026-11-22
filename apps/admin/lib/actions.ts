"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./auth";
import { errorCode, errorMessages, parseRecord, readValues, type ErrorCode, type FormState } from "./form";
import { getResource, type Resource } from "./resources";
import { createClient } from "./supabase";

const BUCKET = "ground-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageTypes: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

function resourceOrThrow(key: string): Resource {
  const resource = getResource(key);
  if (!resource) throw new Error("Unknown resource");
  return resource;
}

function backToList(key: string, error?: ErrorCode): never {
  revalidatePath("/", "layout");
  redirect(error ? `/${key}?error=${error}` : `/${key}`);
}

export async function signIn(_state: { message?: string }, formData: FormData): Promise<{ message?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { message: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: "Incorrect email or password." };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { message: "This account does not have admin access." };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveRecord(key: string, id: string | null, _state: FormState, formData: FormData): Promise<FormState> {
  const resource = resourceOrThrow(key);
  const { supabase } = await requireAdmin();
  const values = readValues(resource, formData);
  const parsed = parseRecord(resource, values);
  if (!parsed.ok) return { errors: parsed.errors, values, message: "Fix the highlighted fields." };

  const record = { ...parsed.data };
  let uploadedPath: string | null = null;

  if (key === "photos") {
    if (!id) {
      const file = formData.get("file");
      const extension = file instanceof File ? imageTypes[file.type] : undefined;
      if (!(file instanceof File) || !extension || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
        return { errors: { file: errorMessages.upload }, values, message: "Fix the highlighted fields." };
      }
      uploadedPath = `grounds/${String(record.ground_id).toLowerCase()}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(BUCKET).upload(uploadedPath, file, { contentType: file.type, upsert: false });
      if (error) return { message: errorMessages.upload, values };
      record.storage_path = uploadedPath;
    }
    if (record.is_primary) {
      let clear = supabase.from("ground_images").update({ is_primary: false }).eq("ground_id", record.ground_id as string).eq("is_primary", true);
      if (id) clear = clear.neq("id", id);
      const { error } = await clear;
      if (error) {
        if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
        return { message: errorMessages[errorCode(key, error)], values };
      }
    }
  }

  const { error } = id
    ? await supabase.from(resource.table).update(record).eq("id", id)
    : await supabase.from(resource.table).insert(record);
  if (error) {
    if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
    return { message: errorMessages[errorCode(key, error)], values };
  }
  backToList(key);
}

export async function setPublication(key: string, id: string, status: "draft" | "published") {
  const resource = resourceOrThrow(key);
  if (!resource.hasPublication) throw new Error("Resource has no publication state");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from(resource.table).update({ publication_status: status }).eq("id", id);
  backToList(key, error ? errorCode(key, error) : undefined);
}

export async function deleteRecord(key: string, id: string) {
  const resource = resourceOrThrow(key);
  const { supabase } = await requireAdmin();
  let path: string | null = null;
  if (key === "photos") {
    const { data } = await supabase.from("ground_images").select("storage_path").eq("id", id).maybeSingle();
    path = data?.storage_path ?? null;
  }
  const { error } = await supabase.from(resource.table).delete().eq("id", id);
  if (error) backToList(key, errorCode(key, error));
  if (path) await supabase.storage.from(BUCKET).remove([path]);
  backToList(key);
}
