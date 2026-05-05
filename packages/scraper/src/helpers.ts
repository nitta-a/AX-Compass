// ─── ID & Date Helpers ────────────────────────────────────────────────────────

export const generateIdFromUrl = (url: string): string => {
  try {
    const { hostname, pathname, search } = new URL(url);
    const raw = `${hostname}${pathname}${search}`;
    return raw
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  } catch {
    return url
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }
};

export const toIso8601 = (dateString: string): string => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};
