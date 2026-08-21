export interface User {
  id: string;
  email: string;
  name: string;
  role: "freelancer" | "client";
  companyName?: string;
  createdAt: string;
}

export type FileCategory = "image" | "document" | "design" | "archive" | "video" | "audio" | "other";

export interface FileItem {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  projectTag: string;
  notes?: string;
  storageFileName: string;
  supabaseUrl?: string;
  supabasePath?: string;
  uploadedAt: string;
  downloads: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface StorageStats {
  fileCount: number;
  totalStorageBytes: number;
  maxStorageBytes: number;
}

export type ViewMode = "list" | "grid";

export type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "size_desc" | "size_asc";
