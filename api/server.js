const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const DatabaseManager = require('../dist/lib/database').default;
const { processQueue } = require('../dist/lib/queue');
const { estimateTokens } = require('../dist/lib/token-counter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize database connection
const db = DatabaseManager.getInstance();

// API Routes

// Get all domains
app.get('/api/domains', (req, res) => {
  try {
    const pages = db.getAllPages();
    const domains = {};
    
    pages.forEach(page => {
      const url = new URL(page.url);
      const domain = url.hostname.replace(/^www\./, '');
      
      if (!domains[domain]) {
        domains[domain] = [];
      }
      
      domains[domain].push(page);
    });
    
    const results = Object.entries(domains).map(([domain, pages]) => ({
      domain,
      pageCount: pages.length
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get domain details
app.get('/api/domains/:domain', (req, res) => {
  try {
    const domain = req.params.domain;
    const pages = db.getPagesByDomain(domain);
    
    if (pages.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json({
      domain,
      pageCount: pages.length,
      pages: pages.map(p => ({
        id: p.id,
        url: p.url,
        title: p.title,
        fetchedAt: p.fetchedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pages for domain
app.get('/api/domains/:domain/pages', (req, res) => {
  try {
    const domain = req.params.domain;
    const pages = db.getPagesByDomain(domain);
    
    if (pages.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific page
app.get('/api/pages/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const page = db.getPageById(id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get page content
app.get('/api/pages/:id/content', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const page = db.getPageById(id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    const tokens = estimateTokens(page.content);
    
    res.json({
      content: page.content,
      tokens: tokens.count,
      tokenInfo: tokens.visual,
      modelTokens: tokens.byModel
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch new content
app.post('/api/fetch', async (req, res) => {
  try {
    const { url, depth = 1, maxPages = 50 } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Start the fetch process in the background
    processQueue(url, {
      maxDepth: depth,
      maxPages: maxPages,
      showProgress: false
    }).then(() => {
      console.log(`Fetch completed for ${url}`);
    }).catch(err => {
      console.error(`Fetch error for ${url}:`, err);
    });
    
    // Immediately return a response
    res.json({ 
      message: 'Fetch process started',
      url,
      depth,
      maxPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get database statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    const pages = db.getAllPages();
    
    // Group by domain
    const domains = {};
    pages.forEach(page => {
      try {
        const url = new URL(page.url);
        const domain = url.hostname.replace(/^www\./, '');
        
        if (!domains[domain]) {
          domains[domain] = 0;
        }
        
        domains[domain]++;
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    res.json({
      ...stats,
      domainStats: Object.entries(domains).map(([domain, count]) => ({
        domain,
        pageCount: count
      })).sort((a, b) => b.pageCount - a.pageCount)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete domain
app.delete('/api/domains/:domain', (req, res) => {
  try {
    const domain = req.params.domain;
    const pages = db.getPagesByDomain(domain);
    
    if (pages.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    let deletedCount = 0;
    pages.forEach(page => {
      if (db.deletePage(page.url)) {
        deletedCount++;
      }
    });
    
    res.json({
      domain,
      deletedCount,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete specific page
app.delete('/api/pages/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const page = db.getPageById(id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    const success = db.deletePage(page.url);
    
    res.json({
      id,
      url: page.url,
      success
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clean database
app.post('/api/clean', (req, res) => {
  try {
    const results = db.cleanDatabase();
    
    res.json({
      ...results,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`⚡ Webs API server running on port ${PORT}`);
});

module.exports = app; 