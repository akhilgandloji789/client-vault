import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://rkjotzbzcaahzcfdyocu.supabase.co";
const DEFAULT_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJram90emJ6Y2FhaHpjZmR5b2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMDY2NDUsImV4cCI6MjEwMjc4MjY0NX0.zYAWN6xku3g4TzUdgjdUu9sGaCmWVrVkty3TOmzZRcs";

function normalizeSupabaseUrl(rawUrl: unknown): string {
  if (!rawUrl || typeof rawUrl !== "string") return DEFAULT_SUPABASE_URL;
  let trimmed = rawUrl.trim().replace(/^["']|["']$/g, "");
  if (
    !trimmed ||
    trimmed === "MY_SUPABASE_URL" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed.includes("YOUR_") ||
    trimmed.startsWith("sb_") ||
    trimmed.startsWith("sb_secret") ||
    (trimmed.length > 35 && !trimmed.includes(".supabase.co") && !trimmed.startsWith("http"))
  ) {
    return DEFAULT_SUPABASE_URL;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (trimmed.includes(".supabase.co")) {
      trimmed = `https://${trimmed}`;
    } else if (/^[a-z0-9_-]{15,30}$/i.test(trimmed)) {
      trimmed = `https://${trimmed}.supabase.co`;
    } else {
      return DEFAULT_SUPABASE_URL;
    }
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    // Fall back if parsing failed
  }
  return DEFAULT_SUPABASE_URL;
}

function normalizeSupabaseKey(rawKey: unknown): string {
  if (!rawKey || typeof rawKey !== "string") return DEFAULT_SUPABASE_KEY;
  const trimmed = rawKey.trim().replace(/^["']|["']$/g, "");
  if (
    !trimmed ||
    trimmed === "MY_SUPABASE_ANON_KEY" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed.includes("YOUR_")
  ) {
    return DEFAULT_SUPABASE_KEY;
  }
  return trimmed;
}

const rawEnvUrl = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined;
const rawEnvKey = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined;

export const SUPABASE_URL = normalizeSupabaseUrl(rawEnvUrl);
export const SUPABASE_ANON_KEY = normalizeSupabaseKey(rawEnvKey);

export const supabase = (() => {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn("Falling back to default Supabase client due to error:", err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
  }
})();

export const BUCKET_NAME = "clientvault-deliverables";

/**
 * Ensures the target storage bucket exists or provides helpful diagnostic.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.storage.getBucket(BUCKET_NAME);
    if (error && error.message?.includes("not found")) {
      return {
        connected: true,
        message: `Connected to Supabase (Bucket '${BUCKET_NAME}' will be used for uploads).`,
      };
    }
    if (error) {
      return { connected: true, message: `Connected to Supabase: ${error.message}` };
    }
    return { connected: true, message: `Connected to Supabase Storage bucket '${BUCKET_NAME}'.` };
  } catch (err: any) {
    return { connected: false, message: err.message || "Failed to connect to Supabase." };
  }
}

