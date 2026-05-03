import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult, parseSearchResults } from '../types.js';
import { logger } from '@/utils';

const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';

interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

async function callBraveSearch(query: string): Promise<BraveSearchResponse> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error('[Brave Search] BRAVE_API_KEY is not set');
  }

  const url = new URL(BRAVE_API_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('search_lang', 'en');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Subscription-Token': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[Brave Search] ${response.status}: ${text}`);
  }

  return response.json() as Promise<BraveSearchResponse>;
}

export const braveSearch = new DynamicStructuredTool({
  name: 'web_search',
  description:
    'Search the web for current information on any topic. Returns relevant search results with URLs and content snippets.',
  schema: z.object({
    query: z.string().describe('The search query to look up on the web'),
  }),
  func: async (input) => {
    try {
      const res = await callBraveSearch(input.query);
      const results =
        res.web?.results?.map((r) => ({
          title: r.title ?? '',
          url: r.url ?? '',
          snippet: r.description ?? '',
        })) ?? [];

      const data = { results };
      const urls = results.map((r) => r.url).filter(Boolean);
      return formatToolResult(data, urls.length ? urls : undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[Brave Search] error: ${message}`);
      throw new Error(`[Brave Search] ${message}`);
    }
  },
});
