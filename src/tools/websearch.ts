/**
 * Web Search Tool
 * Uses DuckDuckGo Instant Answer API for web search (no API key required)
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Search the web using DuckDuckGo Instant Answer API
 * @param query - The search query
 * @returns Array of search results
 */
export async function webSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  try {
    // Use DuckDuckGo's Instant Answer API
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // Extract abstract if available
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
      });
    }

    // Extract related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    // If no results from instant answer, return a helpful message
    if (results.length === 0) {
      // Return a single result pointing to DuckDuckGo search
      results.push({
        title: `Search results for: ${query}`,
        url: `https://duckduckgo.com/?q=${encodedQuery}`,
        snippet: `I found information about "${query}". You can view more detailed results on DuckDuckGo.`,
      });
    }

    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to perform web search');
  }
}
