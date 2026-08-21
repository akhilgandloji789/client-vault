import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { FileItem } from "../types";
import { formatBytes } from "../utils/formatters";

interface DeleteConfirmModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !file) return null;

  return (
    <div
      id="delete-confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="delete-confirm-modal"
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
              Delete File?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <span className="font-semibold text-slate-800 break-all">{file.fileName}</span> ({formatBytes(file.fileSize)})?
            </p>
            <p className="text-[11px] text-red-600 font-medium mt-2 bg-red-50 p-2.5 rounded-lg border border-red-100">
              This action cannot be undone. Any client links to this deliverable will expire.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-button"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-medium px-4.5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
