import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FolderOpen,
  UploadCloud,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Info,
  Clock,
  Search,
} from "lucide-react";
import { AuthState, FileCategory, FileItem, SortOption, StorageStats, User, ViewMode } from "./types";
import { api, clearStoredToken, getStoredToken } from "./services/api";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { FileList } from "./components/FileList";
import { FileGrid } from "./components/FileGrid";
import { FileUploadZone } from "./components/FileUploadZone";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { StorageStatsCard } from "./components/StorageStatsCard";
import { AuthModal } from "./components/AuthModal";
import { formatBytes } from "./utils/formatters";

export default function App() {
  // Auth State
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: getStoredToken(),
    isAuthenticated: false,
    isLoading: true,
  });

  // Files State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    fileCount: 0,
    totalStorageBytes: 0,
    maxStorageBytes: 1024 * 1024 * 1024, // 1 GB
  });
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // UI Filters & State
  const [activeTab, setActiveTab] = useState<string>("all-files");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | "all">("all");
  const [selectedProjectTag, setSelectedProjectTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Check authentication on initial load
  const verifySession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const { user, stats } = await api.getCurrentUser();
      setAuthState({ user, token, isAuthenticated: true, isLoading: false });
      setStorageStats(stats);
      fetchFiles();
    } catch {
      clearStoredToken();
      setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Fetch files from server
  const fetchFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const res = await api.getFiles();
      setFiles(res.files);
      setStorageStats((prev) => ({
        ...prev,
        fileCount: res.count,
        totalStorageBytes: res.totalStorageBytes,
      }));
    } catch (err: any) {
      console.error("Failed to load files:", err);
      showToast(err.message || "Failed to load files.", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = (user: User) => {
    setAuthState({
      user,
      token: getStoredToken(),
      isAuthenticated: true,
      isLoading: false,
    });
    fetchFiles();
    showToast(`Welcome back, ${user.name}!`);
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    await api.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setFiles([]);
    showToast("You have been signed out.", "info");
  };

  // Upload Handler
  const handleUploadFiles = async (newFiles: File[], projectTag: string, notes: string) => {
    const res = await api.uploadFiles(newFiles, projectTag, notes);
    setFiles((prev) => [...res.files, ...prev]);
    const addedBytes = newFiles.reduce((acc, f) => acc + f.size, 0);
    setStorageStats((prev) => ({
      ...prev,
      fileCount: prev.fileCount + res.files.length,
      totalStorageBytes: prev.totalStorageBytes + addedBytes,
    }));
    showToast(res.message);
    if (res.files && res.files.length > 0) {
      // Auto-open preview modal for the uploaded file so it is immediately visible in the app
      setPreviewFile(res.files[0]);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      await api.deleteFile(deleteCandidate.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteCandidate.id));
      setStorageStats((prev) => ({
        ...prev,
        fileCount: Math.max(0, prev.fileCount - 1),
        totalStorageBytes: Math.max(0, prev.totalStorageBytes - deleteCandidate.fileSize),
      }));
      showToast(`Deleted "${deleteCandidate.fileName}".`);
      setDeleteCandidate(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete file.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Download Handler
  const handleDownload = async (file: FileItem) => {
    try {
      showToast(`Preparing download for ${file.fileName}...`, "info");
      await api.triggerDownload(file);
      // Increment local count
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f))
      );
    } catch (err: any) {
      showToast(err.message || "Download failed.", "error");
    }
  };

  // Extract available unique project tags
  const availableProjectTags = useMemo(() => {
    const tagsSet = new Set<string>();
    files.forEach((f) => {
      if (f.projectTag) tagsSet.add(f.projectTag);
    });
    return Array.from(tagsSet);
  }, [files]);

  // Filter and sort files locally for instant UI responsiveness
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Tab filter
    if (activeTab === "recent") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      result = result.filter((f) => new Date(f.uploadedAt) >= sevenDaysAgo);
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.fileName.toLowerCase().includes(q) ||
          f.projectTag.toLowerCase().includes(q) ||
          (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((f) => f.category === selectedCategory);
    }

    // Project tag filter
    if (selectedProjectTag !== "all") {
      result = result.filter((f) => f.projectTag.toLowerCase() === selectedProjectTag.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date_asc") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === "name_asc") {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortBy === "name_desc") {
        return b.fileName.localeCompare(a.fileName);
      }
      if (sortBy === "size_desc") {
        return b.fileSize - a.fileSize;
      }
      if (sortBy === "size_asc") {
        return a.fileSize - b.fileSize;
      }
      // default: date_desc
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

    return result;
  }, [files, activeTab, searchQuery, selectedCategory, selectedProjectTag, sortBy]);

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse mb-4">
          <ShieldCheck className="h-7 w-7 stroke-[2.2]" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Loading ClientVault...</p>
      </div>
    );
  }

  // Not authenticated -> Show Login / Sign Up Page
  if (!authState.isAuthenticated || !authState.user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Toast Notification */}
      {toast && (
        <div
          id="app-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold text-white border transition-all animate-bounce ${
            toast.type === "error"
              ? "bg-rose-600 border-rose-500 shadow-rose-600/30"
              : toast.type === "info"
              ? "bg-slate-900 border-slate-800 shadow-slate-900/30"
              : "bg-emerald-600 border-emerald-500 shadow-emerald-600/30"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : toast.type === "info" ? (
            <Info className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Dark Navy Sidebar */}
      <Sidebar
        currentUser={authState.user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProjectTag={selectedProjectTag}
        setSelectedProjectTag={setSelectedProjectTag}
        availableProjectTags={availableProjectTags}
        storageStats={storageStats}
        onSignOut={handleSignOut}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content Area (White & Light Gray) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* If Active Tab is Analytics / Storage */}
          {activeTab === "storage" ? (
            <StorageStatsCard
              stats={storageStats}
              files={files}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          ) : (
            <>
              {/* Quick Upload Dropzone Card (Direct explorer picker & instant preview) */}
              <div
                id="quick-dropzone-banner"
                className="relative bg-blue-50/70 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  type="file"
                  multiple
                  id="dashboard-quick-file-input"
                  title="Click to select files or drag and drop"
                  onChange={(e) => {
                    const rawFiles = e.target.files;
                    if (!rawFiles || rawFiles.length === 0) return;
                    const filesArray: File[] = [];
                    for (let i = 0; i < rawFiles.length; i++) {
                      const f = rawFiles[i];
                      if (f) filesArray.push(f);
                    }

                    if (filesArray.length > 0) {
                      handleUploadFiles(filesArray, selectedProjectTag !== "all" ? selectedProjectTag : "General", "");
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-3 pointer-events-none group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base pointer-events-none">
                  Upload files directly to vault
                </h3>
                <p className="text-xs text-slate-500 mb-4 mt-1 pointer-events-none">
                  Drag and drop files here, or click to open your computer's file explorer
                </p>
                <div className="pointer-events-none inline-flex items-center gap-1.5 bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Browse From Computer</span>
                </div>
              </div>

              {/* Summary Metrics (Storage, Files, Vaults) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Storage
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {formatBytes(storageStats.totalStorageBytes)}
                  </h3>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    of {formatBytes(storageStats.maxStorageBytes)} allocated quota
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Vault Files
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {storageStats.fileCount} {storageStats.fileCount === 1 ? "File" : "Files"}
                  </h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    Protected & available online
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Active Vaults
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {availableProjectTags.length} {availableProjectTags.length === 1 ? "Folder" : "Folders"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Client workspace directories
                  </p>
                </div>
              </div>

              {/* Section Header & File List Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeTab === "recent"
                      ? "Recent Files"
                      : selectedProjectTag !== "all"
                      ? `${selectedProjectTag} Files`
                      : "All Files"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {filteredFiles.length} item{filteredFiles.length === 1 ? "" : "s"} shown
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                </div>
              </div>

              {/* File Listing (List or Grid) */}
              {isLoadingFiles ? (
                <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-medium text-slate-500">Retrieving encrypted vault files...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                /* Empty State */
                <div
                  id="empty-files-state"
                  className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm"
                >
                  <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <FolderOpen className="h-7 w-7" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-base font-bold text-slate-900">No files found</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {searchQuery
                        ? `No files matched your search "${searchQuery}". Try clearing filters or searching for another term.`
                        : selectedCategory !== "all" || selectedProjectTag !== "all"
                        ? "No files found matching the selected category or project vault filters."
                        : "Your vault is currently empty. Upload your first client asset, brand deliverable, or project agreement."}
                    </p>
                  </div>
                  <button
                    id="empty-state-upload-btn"
                    onClick={() => {
                      if (searchQuery || selectedCategory !== "all" || selectedProjectTag !== "all") {
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setSelectedProjectTag("all");
                      } else {
                        setIsUploadOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {searchQuery || selectedCategory !== "all" || selectedProjectTag !== "all" ? (
                      <span>Reset Filters</span>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        <span>Upload Your First File</span>
                      </>
                    )}
                  </button>
                </div>
              ) : viewMode === "list" ? (
                <FileList
                  files={filteredFiles}
                  selectedFileId={previewFile?.id}
                  onPreview={(f) => setPreviewFile(f)}
                  onDownload={handleDownload}
                  onDelete={(f) => setDeleteCandidate(f)}
                />
              ) : (
                <FileGrid
                  files={filteredFiles}
                  selectedFileId={previewFile?.id}
                  onPreview={(f) => setPreviewFile(f)}
                  onDownload={handleDownload}
                  onDelete={(f) => setDeleteCandidate(f)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <FileUploadZone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadFiles}
        availableProjectTags={availableProjectTags}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        onDelete={(f) => {
          setPreviewFile(null);
          setDeleteCandidate(f);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        file={deleteCandidate}
        isOpen={deleteCandidate !== null}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
