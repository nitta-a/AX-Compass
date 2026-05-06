import { useEffect, useState } from "react";
import { fetchPolicyDataset } from "../lib/api";
import { getLatestDatasetUrl } from "../lib/utils";
import type { PolicyDataset } from "../types";

interface UsePolicyDatasetResult {
  dataset: PolicyDataset | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export const usePolicyDataset = (): UsePolicyDatasetResult => {
  const [dataset, setDataset] = useState<PolicyDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDataset = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const payload = await fetchPolicyDataset(getLatestDatasetUrl());

        if (isActive) {
          setDataset(payload);
        }
      } catch (error) {
        if (isActive) {
          const message = error instanceof Error ? error.message : "Unknown error";
          setErrorMessage(message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDataset();

    return () => {
      isActive = false;
    };
  }, []);

  return { dataset, isLoading, errorMessage };
};
