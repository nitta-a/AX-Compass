// ─── ID & Date Helpers ────────────────────────────────────────────────────────

const replaceFn = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};
export const generateIdFromUrl = (url: string): string => {
  try {
    const { hostname, pathname, search } = new URL(url);
    return replaceFn(`${hostname}${pathname}${search}`);
  } catch {
    return replaceFn(url);
  }
};

export const toIso8601 = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};
