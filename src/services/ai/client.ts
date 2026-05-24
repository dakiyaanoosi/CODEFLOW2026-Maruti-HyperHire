const BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";

export async function aiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      throw new Error(`AI Engine request failed (${response.status}): ${errorText}`);
    }
    
    return (await response.json()) as T;
  } catch (error) {
    console.error(`AI Client: Failed to connect to ${url}`, error);
    throw error;
  }
}
