import type { PolicyDataset, PolicyUpdate } from "./types";

export const isPolicyUpdate = (value: unknown): value is PolicyUpdate => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.publishedAt === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.score === "number" &&
    Array.isArray(candidate.tags)
  );
};

export const isPolicyDataset = (value: unknown): value is PolicyDataset => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.generatedAt === "string" &&
    typeof candidate.itemCount === "number" &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isPolicyUpdate)
  );
};
