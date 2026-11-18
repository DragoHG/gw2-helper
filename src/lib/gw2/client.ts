const API_BASE = "https://api.guildwars2.com/v2";

export class Gw2ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string,
  ) {
    super(message);
    this.name = "Gw2ApiError";
  }
}

export function getApiKey(): string {
  const key = process.env.GW2_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GW2_API_KEY não configurada. Copie .env.local.example para .env.local e cole sua key.",
    );
  }
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function gw2Fetch<T>(
  path: string,
  options: {
    apiKey?: string | null;
    params?: Record<string, string | number | undefined>;
    retries?: number;
  } = {},
): Promise<T> {
  const { apiKey, params = {}, retries = 3 } = options;
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  if (apiKey) {
    url.searchParams.set("access_token", apiKey);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
        await sleep(Math.max(retryAfter, 1) * 1000);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Gw2ApiError(
          `GW2 API ${res.status} em ${path}: ${body || res.statusText}`,
          res.status,
          path,
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (error instanceof Gw2ApiError && error.status !== 429) {
        throw error;
      }
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Falha ao chamar ${path}`);
}

export async function gw2FetchMany<T extends { id: number }>(
  path: string,
  ids: number[],
  options: { apiKey?: string | null; chunkSize?: number } = {},
): Promise<T[]> {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  if (unique.length === 0) return [];

  const chunkSize = options.chunkSize ?? 200;
  const results: T[] = [];

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const batch = await gw2Fetch<T[]>(path, {
      apiKey: options.apiKey,
      params: { ids: chunk.join(",") },
    });
    results.push(...batch);
  }

  return results;
}

export async function gw2FetchOptional<T>(
  path: string,
  options: {
    apiKey?: string | null;
    params?: Record<string, string | number | undefined>;
  } = {},
): Promise<T | null> {
  try {
    return await gw2Fetch<T>(path, options);
  } catch (error) {
    if (error instanceof Gw2ApiError && (error.status === 403 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}
