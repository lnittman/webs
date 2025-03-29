/**
 * Extracts links from HTML, markdown, or plain text content
 */
export function extractLinks(content: string, baseUrl: string): string[] {
  const extractedLinks: string[] = [];
  
  // Extract markdown links [text](url)
  const markdownRegex = /\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = markdownRegex.exec(content)) !== null) {
    if (match[1]) extractedLinks.push(match[1].split(' ')[0]); // Remove any trailing space or title
  }
  
  // Extract HTML links <a href="url">
  const htmlRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>/g;
  while ((match = htmlRegex.exec(content)) !== null) {
    if (match[1]) extractedLinks.push(match[1]);
  }
  
  // Extract plain URLs from text
  const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
  while ((match = urlRegex.exec(content)) !== null) {
    if (match[1]) extractedLinks.push(match[1]);
  }
  
  // Resolve relative URLs against the base URL
  const resolvedLinks = extractedLinks.map(link => {
    // If the link is relative, resolve it against the base URL
    if (!link.startsWith('http')) {
      try {
        const baseUrlObj = new URL(baseUrl);
        // Handle different relative path formats
        if (link.startsWith('/')) {
          // Absolute path relative to domain
          return `${baseUrlObj.protocol}//${baseUrlObj.host}${link}`;
        } else {
          // Path relative to current URL
          const path = baseUrlObj.pathname.endsWith('/') ? 
            baseUrlObj.pathname : 
            baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);
          return `${baseUrlObj.protocol}//${baseUrlObj.host}${path}${link}`;
        }
      } catch (e) {
        console.error(`Error resolving relative URL ${link} against base ${baseUrl}:`, e);
        return "";
      }
    }
    return link;
  }).filter(link => link !== "");
  
  // Return unique links
  return [...new Set(resolvedLinks)];
}

export default extractLinks; 