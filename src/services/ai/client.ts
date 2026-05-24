const BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";

export async function aiFetch<T>(endpoint: string, options: RequestInit = {}, fallbackValue?: T): Promise<T> {
  // Normalize slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`AI Engine request failed (${response.status}): ${errorText}`);
      if (fallbackValue !== undefined) return fallbackValue;
      throw new Error(`AI Engine request failed (${response.status})`);
    }
    
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`AI Client: Failed to connect to ${url} (Is the AI engine running?)`);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw error;
  }
}
