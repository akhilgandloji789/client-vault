export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return "Invalid date";
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Invalid date";
  }
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "" : "FILE";
}

export function getCategoryBadgeColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case "image":
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    case "document":
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
    case "design":
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
    case "archive":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    case "video":
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
    case "audio":
      return { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  }
}
