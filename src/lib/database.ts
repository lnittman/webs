import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';

// Types for database entries
export interface Page {
  id?: number;
  url: string;
  title: string;
  content: string;
  fetchedAt: string;
}

export interface Link {
  id?: number;
  sourceId: number;
  targetUrl: string;
  processed: boolean;
}

// Options for fetching pages
export interface GetPagesOptions {
  limit?: number;
  search?: string;
}

// Options for getting content by domain and path
export interface GetContentOptions {
  includeTitle?: boolean;
  includeFetchDate?: boolean;
  format?: 'markdown' | 'text' | 'json';
}

class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;
  
  private constructor() {
    // Create the .web-cli directory in the user's home directory if it doesn't exist
    const dbDir = join(homedir(), '.web-cli');
    this.ensureDbDirExists(dbDir);
    
    const dbPath = join(dbDir, 'web-content.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private async ensureDbDirExists(dir: string): Promise<void> {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists or cannot be created
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // Initialize database tables if they don't exist
  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        fetchedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceId INTEGER NOT NULL,
        targetUrl TEXT NOT NULL,
        processed BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (sourceId) REFERENCES pages (id),
        UNIQUE (sourceId, targetUrl)
      );
    `);
  }

  // Get a singleton instance of the database manager
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Check if a page exists in the database
   * @param url The URL to check
   * @returns True if the page exists, false otherwise
   */
  public pageExists(url: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM pages WHERE url = ?');
    const result = stmt.get(url);
    return !!result;
  }

  /**
   * Delete a page and its associated links from the database
   * @param url The URL of the page to delete
   * @returns True if the page was deleted, false otherwise
   */
  public deletePage(url: string): boolean {
    try {
      this.db.transaction(() => {
        // First get the page ID
        const page = this.getPageByUrl(url);
        if (!page) {
          return false;
        }
        
        // Delete links associated with this page
        this.db.prepare('DELETE FROM links WHERE sourceId = ?').run(page.id);
        
        // Delete the page itself
        this.db.prepare('DELETE FROM pages WHERE url = ?').run(url);
      })();
      
      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      return false;
    }
  }

  /**
   * Clean the database by removing broken links and orphaned records
   * @returns Statistics about the cleaning operation
   */
  public cleanDatabase(): { removedLinks: number, removedUnprocessedLinks: number } {
    let removedLinks = 0;
    let removedUnprocessedLinks = 0;
    
    try {
      this.db.transaction(() => {
        // Remove links where source or target no longer exists
        const linkStmt = this.db.prepare(`
          DELETE FROM links 
          WHERE sourceId NOT IN (SELECT id FROM pages)
        `);
        const linkInfo = linkStmt.run();
        removedLinks = linkInfo.changes;
        
        // Update unprocessed links count (we don't have a separate unprocessed_links table)
        const unprocessedStmt = this.db.prepare(`
          SELECT COUNT(*) as count FROM links WHERE processed = 0
        `);
        const unprocessedResult = unprocessedStmt.get() as { count: number };
        removedUnprocessedLinks = 0; // No links removed, just counting
      })();
      
      return { removedLinks, removedUnprocessedLinks };
    } catch (error) {
      console.error('Error cleaning database:', error);
      return { removedLinks, removedUnprocessedLinks };
    }
  }

  /**
   * Get all pages from the database
   * @returns Array of all pages
   */
  public getAllPages(options: GetPagesOptions = {}): Page[] {
    if (Object.keys(options).length === 0) {
      // If no options are provided, return all pages sorted by URL
      const stmt = this.db.prepare('SELECT * FROM pages ORDER BY url ASC');
      return stmt.all() as Page[];
    }

    // Otherwise use the options for filtering
    let query = 'SELECT id, url, title, substr(content, 1, 100) as content, fetchedAt FROM pages';
    const params: any[] = [];
    
    // Add search condition if provided
    if (options.search) {
      query += ' WHERE url LIKE ? OR title LIKE ?';
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern);
    }
    
    // Add order by and limit
    query += ' ORDER BY id DESC';
    
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Page[];
  }

  // Insert a new page into the database
  public insertPage(page: Page): number {
    const stmt = this.db.prepare(
      'INSERT INTO pages (url, title, content, fetchedAt) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(page.url, page.title, page.content, page.fetchedAt);
    return result.lastInsertRowid as number;
  }

  // Get a page by URL
  public getPageByUrl(url: string): Page | undefined {
    const stmt = this.db.prepare('SELECT * FROM pages WHERE url = ?');
    return stmt.get(url) as Page | undefined;
  }

  // Get a page by ID
  public getPageById(id: number): Page | undefined {
    const stmt = this.db.prepare('SELECT * FROM pages WHERE id = ?');
    return stmt.get(id) as Page | undefined;
  }
  
  // Get content by domain and optional path
  public getContentByDomainAndPath(domain: string, path?: string, options: GetContentOptions = {}): string {
    let pages: Page[] = [];
    
    if (path) {
      // Get content for a specific path
      const stmt = this.db.prepare('SELECT * FROM pages WHERE url LIKE ? AND url LIKE ?');
      const domainPattern = `%${domain}%`;
      const pathPattern = `%${path}%`;
      pages = stmt.all(domainPattern, pathPattern) as Page[];
    } else {
      // Get content for all pages in the domain
      const stmt = this.db.prepare('SELECT * FROM pages WHERE url LIKE ?');
      const domainPattern = `%${domain}%`;
      pages = stmt.all(domainPattern) as Page[];
    }
    
    // Format the content based on options
    return this.formatContent(pages, options);
  }

  // Get pages by domain name
  public getPagesByDomain(domain: string): Page[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pages 
      WHERE url LIKE ?
      ORDER BY url ASC
    `);
    
    return stmt.all(`%${domain}%`) as Page[];
  }

  // Get statistics about the database
  public getStats(): { pages: number; links: number; unprocessedLinks: number } {
    const pageCount = this.db.prepare('SELECT COUNT(*) as count FROM pages').get() as { count: number };
    const linkCount = this.db.prepare('SELECT COUNT(*) as count FROM links').get() as { count: number };
    const unprocessedCount = this.db.prepare('SELECT COUNT(*) as count FROM links WHERE processed = 0').get() as { count: number };
    
    return {
      pages: pageCount.count,
      links: linkCount.count,
      unprocessedLinks: unprocessedCount.count
    };
  }
  
  // Format content based on options
  private formatContent(pages: Page[], options: GetContentOptions): string {
    if (pages.length === 0) {
      return '';
    }
    
    switch (options.format) {
      case 'json':
        return JSON.stringify(pages, null, 2);
        
      case 'text':
        return pages.map(page => {
          let result = '';
          
          if (options.includeTitle) {
            result += `${page.title}\n\n`;
          }
          
          result += page.content;
          
          if (options.includeFetchDate) {
            result += `\n\nFetched: ${page.fetchedAt}`;
          }
          
          return result;
        }).join('\n\n---\n\n');
        
      case 'markdown':
      default:
        return pages.map(page => {
          let result = '';
          
          if (options.includeTitle) {
            result += `# ${page.title}\n\n`;
          }
          
          result += page.content;
          
          if (options.includeFetchDate) {
            result += `\n\n*Fetched: ${page.fetchedAt}*`;
          }
          
          result += `\n\n*URL: ${page.url}*`;
          
          return result;
        }).join('\n\n---\n\n');
    }
  }

  // Insert a new link into the database
  public insertLink(link: Link): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO links (sourceId, targetUrl, processed) VALUES (?, ?, ?)'
    );
    stmt.run(link.sourceId, link.targetUrl, link.processed ? 1 : 0);
  }

  // Get all unprocessed links
  public getUnprocessedLinks(): Link[] {
    const stmt = this.db.prepare('SELECT * FROM links WHERE processed = 0');
    return stmt.all() as Link[];
  }

  // Get all links by source ID
  public getLinksBySourceId(sourceId: number): Link[] {
    const stmt = this.db.prepare('SELECT * FROM links WHERE sourceId = ?');
    return stmt.all(sourceId) as Link[];
  }

  // Mark a link as processed
  public markLinkProcessed(id: number): void {
    const stmt = this.db.prepare('UPDATE links SET processed = 1 WHERE id = ?');
    stmt.run(id);
  }

  // Close the database connection
  public close(): void {
    this.db.close();
  }
}

export default DatabaseManager; 