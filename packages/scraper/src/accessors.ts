// ─── Type-safe Accessors ──────────────────────────────────────────────────────

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isArrayOfObjects = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isObject);

export const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const asStringFromKeys = (obj: Record<string, unknown>, keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const result = asString(obj[key]);
    if (result !== undefined) return result;
  }
  return undefined;
};
