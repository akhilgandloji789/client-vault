import { FileCategory, FileItem, SortOption, StorageStats, User } from "../types";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  firebaseSignOut,
} from "../lib/firebase";
import { supabase, BUCKET_NAME } from "../lib/supabase";

const TOKEN_KEY = "clientvault_auth_token";
const USER_KEY = "clientvault_user_cache";

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  // Default to designer session in sandbox preview if no token exists yet
  return "demo_session_designer_1";
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
    return {
      id: "user_designer_1",
      email: "designer@clientvault.com",
      name: "Elena Rostova",
      role: "freelancer",
      companyName: "Rostova Studio",
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function safeParseJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText || "Request failed"}`);
    }
    return { status: res.status };
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Authentication via Firebase Auth (with fallback to backend/demo session)
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: "freelancer" | "client";
    companyName?: string;
  }): Promise<{ user: User; token: string }> {
    let firebaseUid: string | null = null;
    try {
      // 1. Create account with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      firebaseUid = userCredential.user.uid;
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });
    } catch (fbErr: any) {
      console.warn("Firebase Auth notice:", fbErr.message);
      // If Firebase fails with email-already-in-use or auth domain rules in sandboxes, proceed to backend synchronization
    }

    // 2. Synchronize user profile with backend/workspace session
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        firebaseUid,
      }),
    });
    const result = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(result.error || "Failed to register account.");
    }
    setStoredToken(result.token);
    setStoredUser(result.user);
    return result;
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    try {
      // 1. Attempt sign-in with Firebase Authentication
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (fbErr: any) {
      console.warn("Firebase Auth login notice:", fbErr.message);
      // Continue to verify credentials against backend (e.g. for demo accounts)
    }

    // 2. Authenticate session with backend
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(result.error || "Failed to sign in.");
    }
    setStoredToken(result.token);
    setStoredUser(result.user);
    return result;
  },

  async getCurrentUser(): Promise<{ user: User; stats: StorageStats }> {
    const token = getStoredToken();
    if (!token) throw new Error("No active session.");

    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await safeParseJson(res);
    if (!res.ok) {
      clearStoredToken();
      throw new Error(result.error || "Failed to fetch user session.");
    }
    setStoredUser(result.user);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("Firebase sign out error:", err);
    }

    const token = getStoredToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Logout request failed:", err);
      }
    }
    clearStoredToken();
  },

  // Files with Supabase Storage Integration
  async getFiles(params?: {
    search?: string;
    category?: FileCategory | "all";
    projectTag?: string;
    sortBy?: SortOption;
  }): Promise<{ files: FileItem[]; count: number; totalStorageBytes: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category && params.category !== "all") query.set("category", params.category);
    if (params?.projectTag && params.projectTag !== "all") query.set("projectTag", params.projectTag);
    if (params?.sortBy) query.set("sortBy", params.sortBy);

    const token = getStoredToken();
    const res = await fetch(`/api/files?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(result.error || "Failed to fetch files.");
    }
    return result;
  },

  async uploadFiles(
    files: File[],
    projectTag: string = "General",
    notes: string = ""
  ): Promise<{ files: FileItem[]; message: string }> {
    const token = getStoredToken();
    if (!token) throw new Error("You must be signed in to upload files.");

    const currentUser = getStoredUser();
    const userId = currentUser?.id || "anonymous";

    // 1. Upload to Supabase Storage Bucket for cloud resilience
    const uploadedSupabaseFiles: { fileName: string; supabaseUrl: string; supabasePath: string }[] = [];

    for (const file of files) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${userId}/${Date.now()}_${cleanName}`;

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

          uploadedSupabaseFiles.push({
            fileName: file.name,
            supabaseUrl: urlData.publicUrl,
            supabasePath: storagePath,
          });
          console.log(`[Supabase Storage] Successfully uploaded ${file.name} to ${storagePath}`);
        } else if (error) {
          console.warn(`[Supabase Storage] Notice for ${file.name}:`, error.message);
        }
      } catch (storageErr: any) {
        console.warn(`[Supabase Storage] Upload error for ${file.name}:`, storageErr?.message || storageErr);
      }
    }

    // 2. Submit to file registry & server vault with Supabase metadata
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("projectTag", projectTag);
    formData.append("notes", notes);
    formData.append("supabaseMetadata", JSON.stringify(uploadedSupabaseFiles));

    const res = await fetch("/api/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(result.error || "Upload failed.");
    }
    return result;
  },

  async deleteFile(fileId: string, supabasePath?: string): Promise<void> {
    // If stored in Supabase bucket, delete remote object
    if (supabasePath) {
      try {
        await supabase.storage.from(BUCKET_NAME).remove([supabasePath]);
      } catch (supaErr) {
        console.warn("Supabase remove file notice:", supaErr);
      }
    }

    const token = getStoredToken();
    const res = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(result.error || "Failed to delete file.");
    }
  },

  async updateFile(
    fileId: string,
    updates: { fileName?: string; projectTag?: string; notes?: string }
  ): Promise<FileItem> {
    const res = await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const result = await safeParseJson(res);
    if (!res.ok) {
      throw new Error(result.error || "Failed to update file.");
    }
    return result.file;
  },

  getDownloadUrl(fileId: string): string {
    const token = getStoredToken();
    return `/api/files/${fileId}/download${token ? `?auth=${token}` : ""}`;
  },

  getPreviewUrl(file: FileItem | string): string {
    const token = getStoredToken();
    if (typeof file === "string") {
      return `/api/files/${file}/preview${token ? `?auth=${token}` : ""}`;
    }
    if (file?.supabaseUrl) {
      return file.supabaseUrl;
    }
    return `/api/files/${file?.id || ""}/preview${token ? `?auth=${token}` : ""}`;
  },

  async triggerDownload(file: FileItem): Promise<void> {
    // If Supabase direct public URL is available and accessible
    if (file.supabaseUrl) {
      try {
        const response = await fetch(file.supabaseUrl);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      } catch (supaDlErr) {
        console.warn("Supabase direct download notice, falling back to secure endpoint:", supaDlErr);
      }
    }

    const token = getStoredToken();
    const res = await fetch(`/api/files/${file.id}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Download failed" }));
      throw new Error(err.error || "Could not download file.");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
