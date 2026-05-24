const DEFAULT_AI_URL = "https://hyperhire-ai-engine.onrender.com";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getCandidateBaseUrls(): string[] {
  const configuredUrl = process.env.NEXT_PUBLIC_AI_API_URL;
  const urls = [
    configuredUrl,
    DEFAULT_AI_URL,
    process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : undefined,
  ].filter(Boolean) as string[];

  return Array.from(new Set(urls.map(normalizeBaseUrl)));
}

export async function aiFetch<T>(endpoint: string, options: RequestInit = {}, fallbackValue?: T): Promise<T> {
  // Normalize slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  let lastError: unknown = null;

  for (const baseUrl of getCandidateBaseUrls()) {
    const url = `${baseUrl}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`AI Engine request failed (${response.status}): ${errorText}`);
        console.warn(lastError);
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      console.warn(`AI Client: Failed to connect to ${url} (Is the AI engine running?)`, error);
    }
  }

  if (fallbackValue !== undefined) {
    return fallbackValue;
  }

  throw lastError instanceof Error ? lastError : new Error("AI Engine request failed");
}
