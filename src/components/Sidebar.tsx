import React from "react";
import {
  FolderOpen,
  UploadCloud,
  HardDrive,
  LogOut,
  Sparkles,
  FileCheck,
  Layers,
  Briefcase,
  User as UserIcon,
  ChevronRight,
  Shield,
} from "lucide-react";
import { User, StorageStats } from "../types";
import { formatBytes } from "../utils/formatters";

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProjectTag: string;
  setSelectedProjectTag: (tag: string) => void;
  availableProjectTags: string[];
  storageStats: StorageStats;
  onSignOut: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  selectedProjectTag,
  setSelectedProjectTag,
  availableProjectTags,
  storageStats,
  onSignOut,
  isMobileOpen,
  setIsMobileOpen,
  onOpenUpload,
}) => {
  const percentUsed = Math.min(
    100,
    Math.round((storageStats.totalStorageBytes / (storageStats.maxStorageBytes || 1024 * 1024 * 1024)) * 100)
  );

  const mainNavItems = [
    { id: "all-files", label: "Dashboard", icon: FolderOpen, badge: storageStats.fileCount },
    { id: "recent", label: "Recent Files", icon: FileCheck },
    { id: "projects", label: "Project Vaults", icon: Layers },
    { id: "storage", label: "Storage & Analytics", icon: HardDrive },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Dark Slate 900 Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="font-bold text-white text-lg">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ClientVault</span>
          </div>

          <button
            id="sidebar-close-mobile"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-4">
          {/* Quick Upload Button */}
          <div>
            <button
              id="sidebar-upload-button"
              onClick={() => {
                onOpenUpload();
                if (window.innerWidth < 1024) setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Files</span>
            </button>
          </div>

          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === "all-files") setSelectedProjectTag("all");
                      if (window.innerWidth < 1024) setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Project Vaults / Client Folders */}
          {availableProjectTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Client Projects
                </p>
                <span className="text-[11px] text-blue-400 font-medium">
                  {availableProjectTags.length} active
                </span>
              </div>
              <div className="space-y-1">
                <button
                  id="filter-tag-all"
                  onClick={() => {
                    setSelectedProjectTag("all");
                    setActiveTab("all-files");
                    if (window.innerWidth < 1024) setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedProjectTag === "all"
                      ? "bg-slate-800 text-blue-400 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    All Projects
                  </span>
                </button>

                {availableProjectTags.map((tag) => {
                  const isTagActive = selectedProjectTag.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      id={`filter-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => {
                        setSelectedProjectTag(tag);
                        setActiveTab("all-files");
                        if (window.innerWidth < 1024) setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isTagActive
                          ? "bg-slate-800 text-blue-400 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                        <span className="truncate">{tag}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Storage Overview & Live Supabase Status Widget */}
          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-800 text-xs space-y-3">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1.5">
                <span>Storage Quota</span>
                <span className="text-white font-semibold">{percentUsed}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentUsed > 85 ? "bg-rose-500" : percentUsed > 60 ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.max(percentUsed, 3)}%` }}
                />
              </div>
              <p className="text-slate-400 text-[10px] mt-1.5">
                {formatBytes(storageStats.totalStorageBytes)} of {formatBytes(storageStats.maxStorageBytes)} used
              </p>
            </div>

            {/* Supabase Storage Backend Sync Badge */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Supabase Live</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                deliverables
              </span>
            </div>
          </div>
        </div>

        {/* Bottom User Info & Sign Out Footer */}
        <div className="p-4 mt-auto border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {currentUser.companyName || `${currentUser.role} Account`}
              </p>
            </div>
          </div>

          <button
            id="sidebar-signout-btn"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
