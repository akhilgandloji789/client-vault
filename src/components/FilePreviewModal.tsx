import React, { useState } from "react";
import {
  X,
  Download,
  Trash2,
  Calendar,
  Layers,
  HardDrive,
  User,
  Share2,
  Check,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Shield,
  FileCheck,
} from "lucide-react";
import { FileItem } from "../types";
import { formatBytes, formatDateTime, getCategoryBadgeColor } from "../utils/formatters";
import { api } from "../services/api";

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onDelete,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  if (!isOpen || !file) return null;

  const isImage = (file.mimeType.startsWith("image/") || file.fileName.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i)) && !imgError;
  const isPdf = file.mimeType === "application/pdf" || file.fileName.endsWith(".pdf");
  const badgeStyle = getCategoryBadgeColor(file.category);
  const previewUrl = api.getPreviewUrl(file);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${api.getDownloadUrl(file.id)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id="file-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="file-preview-modal-dialog"
        className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-file-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h2 id="preview-file-title" className="text-base font-bold text-slate-900 truncate">
                {file.fileName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                >
                  <Layers className="h-2.5 w-2.5" />
                  {file.projectTag}
                </span>
                <span className="text-xs text-slate-400">• {formatBytes(file.fileSize)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="preview-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Visual Preview + Inspector Metadata */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Display (2 Cols on lg) */}
          <div className="lg:col-span-2 flex flex-col justify-center items-center bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[300px] overflow-hidden relative">
            {isImage ? (
              <img
                src={previewUrl}
                alt={file.fileName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="max-h-[440px] max-w-full object-contain rounded-lg shadow-xs"
              />
            ) : isPdf ? (
              <div className="w-full flex flex-col items-center justify-center text-center p-8">
                <div className="h-16 w-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  PDF Document
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-5">
                  This PDF deliverable is securely stored in your ClientVault. View in browser or download directly.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <button
                    onClick={() => onDownload(file)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="h-16 w-16 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mb-4">
                  <FileCheck className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {file.fileName.split(".").pop()?.toUpperCase()} Asset
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-5">
                  Binary files and project archives are stored with verified cryptographic checksums.
                </p>
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download File ({formatBytes(file.fileSize)})</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Metadata Details Inspector */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                File Details
              </h3>

              <div className="space-y-3 text-xs">
                {/* File Size */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                    Size
                  </span>
                  <span className="font-bold text-slate-800">{formatBytes(file.fileSize)}</span>
                </div>

                {/* Upload Date & Time */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Uploaded
                  </span>
                  <span className="font-medium text-slate-800">{formatDateTime(file.uploadedAt)}</span>
                </div>

                {/* Uploader Account */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Owner
                  </span>
                  <span className="font-medium text-slate-800 truncate max-w-[140px]">{file.userEmail}</span>
                </div>

                {/* MIME Type */}
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">MIME Type</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[130px]">{file.mimeType}</span>
                </div>

                {/* Downloads Count */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Downloads</span>
                  <span className="font-bold text-slate-800">{file.downloads || 0} times</span>
                </div>
              </div>

              {/* Notes */}
              {file.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attached Notes</p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {file.notes}
                  </p>
                </div>
              )}

              {/* Security Badge */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2 text-[11px] text-blue-800">
                <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Encrypted at rest with client-level isolation.</span>
              </div>
            </div>

            {/* Actions Block */}
            <div className="space-y-2">
              <button
                id="modal-download-btn"
                onClick={() => onDownload(file)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-xs shadow-sm transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download File</span>
              </button>

              <button
                id="modal-share-btn"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Share Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Copy Download Link</span>
                  </>
                )}
              </button>

              <button
                id="modal-delete-btn"
                onClick={() => {
                  onClose();
                  onDelete(file);
                }}
                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
