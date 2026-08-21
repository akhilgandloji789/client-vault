import React from "react";
import { HardDrive, FolderCheck, Shield, UploadCloud, PieChart, Sparkles } from "lucide-react";
import { StorageStats, FileItem } from "../types";
import { formatBytes } from "../utils/formatters";

interface StorageStatsCardProps {
  stats: StorageStats;
  files: FileItem[];
  onOpenUpload: () => void;
}

export const StorageStatsCard: React.FC<StorageStatsCardProps> = ({
  stats,
  files,
  onOpenUpload,
}) => {
  const percentUsed = Math.min(
    100,
    Math.round((stats.totalStorageBytes / (stats.maxStorageBytes || 1024 * 1024 * 1024)) * 100)
  );

  // Group by categories
  const categoriesCount = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categorySizes = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + f.fileSize;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2.5 border border-blue-400/20">
              <Shield className="h-3.5 w-3.5" />
              <span>Isolated Client Portal Storage</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Vault Storage & Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1.5 leading-relaxed">
              Track file distribution, storage usage, and active deliverables. All uploads are encrypted and isolated per client access rules.
            </p>
          </div>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Assets</span>
          </button>
        </div>

        {/* Storage Bar in Banner */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-2">
            <span className="text-slate-400">Total Allocated Capacity</span>
            <span className="text-white font-semibold">
              {formatBytes(stats.totalStorageBytes)} of {formatBytes(stats.maxStorageBytes)} ({percentUsed}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                percentUsed > 80 ? "bg-rose-500" : percentUsed > 50 ? "bg-amber-400" : "bg-blue-500"
              }`}
              style={{ width: `${Math.max(percentUsed, 3)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Files
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.fileCount}</p>
          <p className="text-xs text-slate-400 mt-2">Stored across client projects</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Storage Used
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatBytes(stats.totalStorageBytes)}{" "}
            <span className="text-sm font-normal text-slate-400">/ {formatBytes(stats.maxStorageBytes)}</span>
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.max(percentUsed, 3)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Downloads
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {files.reduce((acc, f) => acc + (f.downloads || 0), 0)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-2">Client download activity</p>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Storage Breakdown by Asset Type</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {["document", "image", "design", "archive", "video", "other"].map((cat) => {
            const count = categoriesCount[cat] || 0;
            const size = categorySizes[cat] || 0;
            return (
              <div
                key={cat}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {cat}
                </span>
                <div className="mt-2">
                  <span className="text-base font-bold text-slate-800">{count}</span>
                  <span className="text-xs text-slate-400 block">{formatBytes(size)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cloud Infrastructure Architecture Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span>Active Cloud Infrastructure</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
              FB
            </div>
            <div>
              <p className="font-bold text-slate-900">Google Firebase Authentication</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Handles user account provisioning, role-based client sessions, and secure login verification.
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Connected & Active
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              SB
            </div>
            <div>
              <p className="font-bold text-slate-900">Supabase Storage & Database</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Project Ref: <code className="font-mono text-slate-700">rkjotzbzcaahzcfdyocu</code>. Deliverables and assets uploaded to cloud bucket storage.
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Connected & Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
