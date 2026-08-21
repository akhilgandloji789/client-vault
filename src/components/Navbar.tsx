import React from "react";
import {
  Search,
  LayoutGrid,
  List,
  Menu,
  SlidersHorizontal,
  Plus,
  X,
  FileText,
  Image as ImageIcon,
  Figma,
  Archive,
  Film,
} from "lucide-react";
import { FileCategory, SortOption, ViewMode } from "../types";

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: FileCategory | "all";
  setSelectedCategory: (category: FileCategory | "all") => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  onOpenUpload: () => void;
  onOpenMobileSidebar: () => void;
  breadcrumbSubtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  onOpenUpload,
  onOpenMobileSidebar,
  breadcrumbSubtitle = "Dashboard",
}) => {
  const categories: { id: FileCategory | "all"; label: string; icon?: React.ElementType }[] = [
    { id: "all", label: "All Files" },
    { id: "document", label: "Documents", icon: FileText },
    { id: "image", label: "Images", icon: ImageIcon },
    { id: "design", label: "Design Files", icon: Figma },
    { id: "archive", label: "Archives", icon: Archive },
    { id: "video", label: "Media", icon: Film },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
      <div className="flex flex-col gap-3">
        {/* Top Row: Breadcrumb / Search / Action controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              id="mobile-menu-toggle"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Info on Larger Screens */}
            <div className="hidden md:block shrink-0 pr-2">
              <h2 className="text-sm font-medium text-slate-500 whitespace-nowrap">
                Client Portal / <span className="text-slate-900 font-semibold">{breadcrumbSubtitle}</span>
              </h2>
            </div>

            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="files-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files or client tags..."
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sort Selector */}
            <div className="relative flex items-center">
              <label htmlFor="sort-dropdown" className="sr-only">
                Sort Files
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
                <select
                  id="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer pr-1"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="name_asc">Name (A - Z)</option>
                  <option value="name_desc">Name (Z - A)</option>
                  <option value="size_desc">Size (Largest)</option>
                  <option value="size_asc">Size (Smallest)</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle (List vs Grid) */}
            <div className="hidden sm:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                id="view-mode-list"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="List View"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                id="view-mode-grid"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid View"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Upload Button */}
            <button
              id="navbar-upload-btn"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
