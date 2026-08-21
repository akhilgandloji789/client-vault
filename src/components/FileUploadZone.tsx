import React, { useState, useRef } from "react";
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  AlignLeft,
  ArrowUpRight,
  Sparkles,
  FileImage,
  FolderOpen,
} from "lucide-react";
import { formatBytes } from "../utils/formatters";

interface FileUploadZoneProps {
  onUpload: (files: File[], projectTag: string, notes: string) => Promise<void>;
  availableProjectTags: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onUpload,
  availableProjectTags,
  isOpen,
  onClose,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectTag, setProjectTag] = useState<string>("General");
  const [customTag, setCustomTag] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const addFiles = (incoming: File[]) => {
    if (!incoming || incoming.length === 0) return;
    const valid: File[] = [];
    let err: string | null = null;

    for (const f of incoming) {
      if (!f) continue;
      if (f.size > 50 * 1024 * 1024) {
        err = `"${f.name}" exceeds the 50MB limit.`;
        continue;
      }
      valid.push(f);
    }

    if (err) setErrorMessage(err);
    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
      setErrorMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      addFiles(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    
    // Extract files into standard array
    const filesArray: File[] = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      if (file) filesArray.push(file);
    }

    if (filesArray.length > 0) {
      addFiles(filesArray);
    }
  };

  const openFileBrowser = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage("Please select or drop at least one file to upload.");
      return;
    }

    const finalTag = projectTag === "custom" ? customTag.trim() || "General" : projectTag;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(25);

      const progressInterval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 15 : p));
      }, 150);

      await onUpload(selectedFiles, finalTag, notes);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccessMessage(`Successfully uploaded ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}!`);

      setTimeout(() => {
        setSelectedFiles([]);
        setNotes("");
        setUploadProgress(0);
        setIsUploading(false);
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage(err.message || "Failed to upload files. Please try again.");
    }
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      id="upload-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="upload-modal-content"
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-base font-bold text-slate-900">
                Upload to Client Vault
              </h2>
              <p className="text-xs text-slate-500">
                Encrypted deliverables will be synced to your Supabase project bucket.
              </p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Messages */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Drag & Drop / File Input Zone */}
          <div
            id="drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileBrowser}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-100/60 ring-4 ring-blue-100"
                : "border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/70"
            }`}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              id="hidden-file-input"
            />

            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="font-bold text-slate-900 text-sm sm:text-base">
              Click anywhere here or drag & drop files
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Images, Documents, PDFs, Design assets, ZIP up to 50MB
            </p>
            <button
              type="button"
              onClick={openFileBrowser}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Browse Your Files</span>
            </button>
          </div>

          {/* Selected Files Preview List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>{selectedFiles.length} File{selectedFiles.length > 1 ? "s" : ""} Selected & Ready to Upload</span>
                </span>
                <span className="text-slate-500 font-normal">Total: {formatBytes(totalSize)}</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
                  let objectUrl = "";
                  try {
                    if (isImage) {
                      objectUrl = URL.createObjectURL(file);
                    }
                  } catch {
                    // ignore
                  }

                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isImage && objectUrl ? (
                          <img
                            src={objectUrl}
                            alt={file.name}
                            className="h-10 w-10 rounded-md object-cover border border-slate-200 shrink-0"
                            onLoad={() => URL.revokeObjectURL(objectUrl)}
                          />
                        ) : isImage ? (
                          <div className="h-10 w-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <FileImage className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                            <File className="h-5 w-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 block truncate">{file.name}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {formatBytes(file.size)} • {file.type || "Local File"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Ready to upload into your vault.
                </span>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload & Open Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Metadata: Project Vault & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project / Client Folder Tag */}
            <div>
              <label htmlFor="project-tag-select" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-blue-600" />
                <span>Project / Client Vault</span>
              </label>
              <select
                id="project-tag-select"
                value={projectTag}
                onChange={(e) => setProjectTag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
              >
                <option value="General">General / Shared</option>
                <option value="Brand Identity">Brand Identity</option>
                <option value="Website Launch">Website Launch</option>
                <option value="Legal & Invoices">Legal & Invoices</option>
                <option value="Design Deliverables">Design Deliverables</option>
                {availableProjectTags
                  .filter((t) => !["General", "Brand Identity", "Website Launch", "Legal & Invoices", "Design Deliverables"].includes(t))
                  .map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                <option value="custom">+ Create New Project Folder...</option>
              </select>

              {projectTag === "custom" && (
                <input
                  id="custom-project-tag-input"
                  type="text"
                  placeholder="Enter project/client name..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="mt-2 w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  autoFocus
                />
              )}
            </div>

            {/* Upload Notes / Instructions */}
            <div>
              <label htmlFor="upload-notes-input" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <AlignLeft className="h-3.5 w-3.5 text-blue-600" />
                <span>Client Notes / Instructions (Optional)</span>
              </label>
              <input
                id="upload-notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Final approved export for print..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Encrypting & Storing in Supabase Vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-upload-submit-btn"
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}` : "Files"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

