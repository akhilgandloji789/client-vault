import React from "react";
import {
  Download,
  Trash2,
  Eye,
  Calendar,
  Layers,
} from "lucide-react";
import { FileItem } from "../types";
import { formatBytes, formatDate } from "../utils/formatters";

interface FileListProps {
  files: FileItem[];
  selectedFileId?: string | null;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFileId,
  onPreview,
  onDownload,
  onDelete,
}) => {
  const getFileBadge = (mimeType: string, fileName: string) => {
    const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
    const extLower = ext.toLowerCase();

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

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm">
          Files & Deliverables ({files.length})
        </h3>
        <span className="text-xs text-slate-400 font-medium">Click a file to preview</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" id="client-files-table">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">
                File Name
              </th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">
                Project Vault
              </th>
              <th scope="col" className="px-6 py-3 hidden lg:table-cell">
                Uploaded By
              </th>
              <th scope="col" className="px-6 py-3">
                Size
              </th>
              <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                Date Uploaded
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {files.map((file) => {
              const badge = getFileBadge(file.mimeType, file.fileName);
              const isSelected = selectedFileId === file.id;
              return (
                <tr
                  key={file.id}
                  id={`file-row-${file.id}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open preview for ${file.fileName}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPreview(file);
                    }
                  }}
                  className={`transition-colors group cursor-pointer select-none ${
                    isSelected
                      ? "bg-blue-50/80 ring-1 ring-blue-300 font-medium"
                      : "hover:bg-slate-50/90"
                  }`}
                  onClick={() => onPreview(file)}
                >
                  {/* File Name & Type Badge */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 ${badge.bg} ${badge.textColor} rounded flex items-center justify-center font-bold text-[10px] shrink-0`}
                      >
                        {badge.text}
                      </div>
                      <div className="min-w-0 max-w-xs sm:max-w-md">
                        <span
                          className={`truncate block text-left transition-colors ${
                            isSelected
                              ? "text-blue-700 font-semibold"
                              : "text-slate-800 font-medium group-hover:text-blue-600"
                          }`}
                          title={file.fileName}
                        >
                          {file.fileName}
                        </span>
                        {file.notes && (
                          <p className="text-xs text-slate-400 truncate mt-0.5" title={file.notes}>
                            {file.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Project Vault */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <Layers className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate max-w-[130px]">{file.projectTag}</span>
                    </span>
                  </td>

                  {/* Uploaded By */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {file.userEmail ? file.userEmail.slice(0, 1).toUpperCase() : "U"}
                      </div>
                      <span className="truncate max-w-[150px]" title={file.userEmail}>
                        {file.userEmail || "Anonymous"}
                      </span>
                    </div>
                  </td>

                  {/* File Size */}
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs font-medium">
                    {formatBytes(file.fileSize)}
                  </td>

                  {/* Upload Date */}
                  <td className="px-6 py-4 text-slate-500 hidden sm:table-cell whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="px-6 py-4 text-right whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        id={`btn-preview-${file.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onPreview(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Preview"
                        aria-label={`Preview ${file.fileName}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        id={`btn-download-${file.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDownload(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Download"
                        aria-label={`Download ${file.fileName}`}
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        id={`btn-delete-${file.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDelete(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                        aria-label={`Delete ${file.fileName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
