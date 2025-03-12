import { fetchContent, storeContent } from './fetcher';
import { getUnprocessedLinks, markLinkProcessed } from './database';

export interface QueueOptions {
  maxDepth?: number;
  maxPages?: number;
  workspaceId?: string;
  onProgress?: (processed: number, total: number, current: string) => void;
}

interface QueueState {
  processed: Set<string>;
  count: number;
  depth: number;
}

/**
 * Process the queue of URLs to fetch
 * 
 * @param startUrl The URL to start fetching from
 * @param options Options for processing the queue
 */
export async function processQueue(startUrl: string, options: QueueOptions = {}): Promise<void> {
  const {
    maxDepth = 1,
    maxPages = 100,
    workspaceId,
    onProgress
  } = options;
  
  const state: QueueState = {
    processed: new Set<string>(),
    count: 0,
    depth: 0
  };
  
  // Process the start URL
  await processUrl(startUrl, 0);
  
  // Continue processing unprocessed links
  let unprocessedLinks = await getUnprocessedLinks();
  
  while (unprocessedLinks.length > 0 && state.count < maxPages) {
    const link = unprocessedLinks[0];
    
    if (!state.processed.has(link.targetUrl)) {
      await processUrl(link.targetUrl, extractDepthFromContent(link.sourceId) + 1);
    }
    
    await markLinkProcessed(link.id);
    
    // Reload unprocessed links
    unprocessedLinks = await getUnprocessedLinks();
  }
  
  /**
   * Process a single URL
   */
  async function processUrl(url: string, depth: number): Promise<void> {
    // Skip if we've exceeded max pages or depth
    if (state.count >= maxPages || depth > maxDepth) {
      return;
    }
    
    // Skip if we've already processed this URL
    if (state.processed.has(url)) {
      return;
    }
    
    // Call the progress callback
    if (onProgress) {
      onProgress(state.count, state.processed.size, url);
    }
    
    // Fetch the content
    const content = await fetchContent(url);
    
    // Mark as processed
    state.processed.add(url);
    
    // Skip if there was an error
    if (content.error || !content.markdown) {
      return;
    }
    
    // Store the content
    const pageId = await storeContent(content, workspaceId);
    
    // Increment the count
    state.count++;
    
    // Update the depth
    state.depth = Math.max(state.depth, depth);
    
    // Add depth information to the content
    await addDepthToContent(pageId, depth);
  }
}

/**
 * Store depth information in the content metadata
 */
async function addDepthToContent(pageId: string, depth: number): Promise<void> {
  // In a real implementation, this would store the depth in the page metadata
  // For now, we'll just log it
  console.log(`Page ${pageId} fetched at depth ${depth}`);
}

/**
 * Extract depth information from a page or link
 */
function extractDepthFromContent(sourceId: string): number {
  // In a real implementation, this would retrieve the depth from the page metadata
  // For now, we'll just return 0
  return 0;
} 