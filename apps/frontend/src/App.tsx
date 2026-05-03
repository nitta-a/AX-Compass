import { useEffect, useState } from "react";

type CompassEntry = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  topic: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
};

type CompassDataset = {
  generatedAt: string;
  itemCount: number;
  items: CompassEntry[];
};

const isCompassEntry = (value: unknown): value is CompassEntry => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.sourceId === "string" &&
    typeof candidate.sourceTitle === "string" &&
    typeof candidate.topic === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.publishedAt === "string" &&
    typeof candidate.fetchedAt === "string"
  );
};

const isCompassDataset = (value: unknown): value is CompassDataset => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.generatedAt === "string" &&
    typeof candidate.itemCount === "number" &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isCompassEntry)
  );
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getLatestDatasetUrl = (): string => {
  return new URL("data/latest.json", document.baseURI).toString();
};

export const App = (): JSX.Element => {
  const [dataset, setDataset] = useState<CompassDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDataset = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(getLatestDatasetUrl());

        if (!response.ok) {
          throw new Error(
            `latest.json request failed with status ${response.status}`,
          );
        }

        const payload = (await response.json()) as unknown;

        if (!isCompassDataset(payload)) {
          throw new Error("latest.json has an unexpected schema.");
        }

        if (isActive) {
          setDataset(payload);
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
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

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">AX Compass</p>
        <h1>政府公開情報を構造化 JSON として追跡する</h1>
        <p className="hero-copy">
          scraper が生成した最新データを読み込み、AX と AI
          ガバナンス関連の更新を一覧表示します。
        </p>
        {dataset !== null ? (
          <dl className="metrics-grid">
            <div>
              <dt>生成時刻</dt>
              <dd>{formatDate(dataset.generatedAt)}</dd>
            </div>
            <div>
              <dt>件数</dt>
              <dd>{dataset.itemCount}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="content-panel">
        {isLoading ? (
          <p className="status-message">データを読み込んでいます。</p>
        ) : null}
        {!isLoading && errorMessage !== null ? (
          <p className="status-message status-error">{errorMessage}</p>
        ) : null}
        {!isLoading && errorMessage === null && dataset !== null ? (
          <ul className="feed-list">
            {dataset.items.map((item) => (
              <li className="feed-card" key={item.id}>
                <div className="feed-card-header">
                  <span className="feed-topic">{item.topic}</span>
                  <span className="feed-source">{item.sourceTitle}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <div className="feed-card-footer">
                  <time dateTime={item.publishedAt}>
                    {formatDate(item.publishedAt)}
                  </time>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    参照元を見る
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
};
