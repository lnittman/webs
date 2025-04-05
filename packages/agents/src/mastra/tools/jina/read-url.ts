import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { extractLinks } from '../../utils/extractLinks';

// Define the input schema
const inputSchema = z.object({
  url: z.string(),
});

/**
 * Crawls a single URL and retrieves its content using Jina Reader
 */
export const read_url = createTool({
  id: "read_url",
  description: 'Fetches markdown content for a specific URL using Jina Reader',
  inputSchema,
  execute: async ({ context }) => {
    const url = context.url;

    console.log(`[CRAWL] Starting: ${url}`);

    try {
      // Use Jina Reader endpoint with the URL encoded
      const jinaReaderUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

      const response = await fetch(jinaReaderUrl);

      // Get the content as text since Jina Reader returns markdown directly
      const content = await response.text();

      console.log(`[CRAWL] Fetched: ${url} (${content.length} bytes)`);

      if (!content || content.trim().length === 0) {
        console.log(`[CRAWL] Empty response for: ${url}`);
        return {
          url,
          error: "Empty content returned from Jina Reader",
          content: "",
          title: url.split('/').pop() || url,
          links: []
        };
      }

      // Extract a title from the content - typically the first heading
      let title = url.split('/').pop() || url;
      const titleMatch = content.match(/^# (.+)$/m) || content.match(/Title: (.+)$/m);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }

      // Extract links from the content
      const links = extractLinks(content, url);

      console.log(`[CRAWL] ${url}: Found ${links.length} links, title: "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}"`);

      return {
        url,
        content,
        title,
        links
      };
    } catch (error: any) {
      console.error(`[CRAWL] Error for ${url}: ${error.message}`);
      return {
        url,
        error: error.message || "An error occurred while fetching the URL",
        content: "",
        title: url.split('/').pop() || url,
        links: []
      };
    }
  }
});

// Export the tool for direct access
export default read_url;
