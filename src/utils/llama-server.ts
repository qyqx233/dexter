/**
 * llama-server (llama.cpp HTTP server) API utilities
 */

interface LlamaServerModel {
  id: string;
  object: string;
}

interface LlamaServerModelsResponse {
  object: string;
  data: LlamaServerModel[];
}

/**
 * Fetches available models from a llama-server instance.
 * Uses the OpenAI-compatible /v1/models endpoint.
 */
export async function getLlamaServerModels(): Promise<string[]> {
  const baseUrl = process.env.LLAMA_SERVER_URL || 'http://192.168.50.42:8080/v1';
  // Remove trailing /v1 if present, then append /v1/models
  const rootUrl = baseUrl.replace(/\/v1\/?$/, '');
  const modelsUrl = `${rootUrl}/v1/models`;

  try {
    const response = await fetch(modelsUrl);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as LlamaServerModelsResponse;
    return data.data?.map((m) => m.id).sort() ?? [];
  } catch {
    // llama-server not running or unreachable
    return [];
  }
}
