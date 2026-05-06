export const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const getLatestDatasetUrl = (): string => {
  return new URL("data/latest.json", document.baseURI).toString();
};
