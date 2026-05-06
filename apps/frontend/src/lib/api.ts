import type { PolicyDataset } from "../types";
import { isPolicyDataset } from "./guards";

export const fetchPolicyDataset = async (url: string): Promise<PolicyDataset> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`latest.json request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!isPolicyDataset(payload)) {
    throw new Error("latest.json has an unexpected schema.");
  }

  return payload;
};
