import React from "react";
import {
  Download,
  Trash2,
  Eye,
  Layers,
  Calendar,
} from "lucide-react";
import { FileItem } from "../types";
import { formatBytes, formatDate } from "../utils/formatters";

interface FileGridProps {
  files: FileItem[];
  selectedFileId?: string | null;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  selectedFileId,
  onPreview,
  onDownload,
  onDelete,
}) => {
  const getFileBadge = (mimeType: string, fileName: string) => {
    const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";

    if (["PDF"].includes(ext) || mimeType.includes("pdf")) {
      return { text: "PDF", bg: "bg-red-100", textColor: "text-red-600" };
    }
    if (["PNG", "JPG", "JPEG", "WEBP"].includes(ext) || mimeType.startsWith("image/")) {
      return { text: ext.length > 4 ? "IMG" : ext, bg: "bg-blue-100", textColor: "text-blue-600" };
    }
    if (["SVG", "AI", "FIG", "PSD", "SKETCH"].includes(ext)) {
      return { text: ext, bg: "bg-purple-100", textColor: "text-purple-600" };
    }
    if (["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext) || mimeType.includes("zip")) {
      return { text: "ZIP", bg: "bg-amber-100", textColor: "text-amber-600" };
    }
    if (["DOC", "DOCX", "TXT", "RTF"].includes(ext)) {
      return { text: "DOC", bg: "bg-emerald-100", textColor: "text-emerald-600" };
    }
    if (["MP4", "MOV", "WEBM"].includes(ext) || mimeType.startsWith("video/")) {
      return { text: "VID", bg: "bg-rose-100", textColor: "text-rose-600" };
    }
    if (["JS", "TS", "JSON", "HTML", "CSS"].includes(ext)) {
      return { text: "DEV", bg: "bg-indigo-100", textColor: "text-indigo-600" };
    }
    return { text: ext.slice(0, 4), bg: "bg-slate-100", textColor: "text-slate-600" };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="client-files-grid">
      {files.map((file) => {
        const badge = getFileBadge(file.mimeType, file.fileName);
        const isSelected = selectedFileId === file.id;

        return (
          <div
            key={file.id}
            id={`grid-card-${file.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Open preview for ${file.fileName}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPreview(file);
              }
            }}
            onClick={() => onPreview(file)}
            className={`group bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm cursor-pointer select-none ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-400 shadow-md bg-blue-50/20"
                : "border-slate-200 hover:border-blue-300 hover:shadow-md"
            }`}
          >
            {/* Card Header & Preview Area */}
            <div className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div
                  className={`w-9 h-9 ${badge.bg} ${badge.textColor} rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                >
                  {badge.text}
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <Layers className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate max-w-[100px]">{file.projectTag}</span>
                </span>
              </div>

              <h3
                className={`text-sm font-semibold truncate transition-colors ${
                  isSelected ? "text-blue-700 font-bold" : "text-slate-900 group-hover:text-blue-600"
                }`}
                title={file.fileName}
              >
                {file.fileName}
              </h3>

              {file.notes ? (
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                  {file.notes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic mt-1 min-h-[32px]">
                  No additional notes attached
                </p>
              )}
            </div>

            {/* Metadata & Actions Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold text-slate-700">{formatBytes(file.fileSize)}</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate" title={`Uploaded by ${file.userEmail} on ${formatDate(file.uploadedAt)}`}>
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate">{file.userEmail ? file.userEmail.split('@')[0] : formatDate(file.uploadedAt)}</span>
                </span>
              </div>

              <div
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  id={`grid-btn-preview-${file.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onPreview(file);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                  title="Preview"
                  aria-label={`Preview ${file.fileName}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  id={`grid-btn-download-${file.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDownload(file);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                  title="Download"
                  aria-label={`Download ${file.fileName}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  id={`grid-btn-delete-${file.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(file);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Delete"
                  aria-label={`Delete ${file.fileName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
