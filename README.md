# Webs - Web Content Manager

Webs is a powerful tool for fetching, managing, and interacting with web content. It consists of a CLI tool and web application that work together to provide a comprehensive solution for content management.

## Features

- **Fetch Web Content**: Easily download and store web content from any URL
- **Search & Browse**: Find and organize stored content with powerful search capabilities
- **AI Integration**: Generate summaries and chat with your content using AI models
- **Collaboration**: Share workspaces with team members and collaborate on content

## Repository Structure

This repository is organized as a monorepo with the following components:

- **CLI Tool**: Located in the root and `packages/cli` directories
- **Web Application**: Located in the `webs-app` directory
- **Shared Library**: Located in the `packages/shared` directory

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- SQLite (for development)
- OpenRouter API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/webs.git
cd webs

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Using the CLI

```bash
# Fetch content from a URL
./bin/webs fetch https://example.com

# List stored content
./bin/webs list

# Copy content to clipboard
./bin/webs copy example.com

# Chat with your content
./bin/webs chat
```

### Running the Web Application

```bash
# Start the web application in development mode
cd webs-app
pnpm dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="file:./dev.db"

# OpenRouter API (for AI features)
OPENROUTER_API_KEY="your-api-key"
```

## Troubleshooting


## Deployment on Vercel with Cloud Services

This application has been migrated from SQLite to a cloud-based architecture using the following services:

- **Neon** - Serverless PostgreSQL database
- **Upstash Redis** - Serverless Redis for caching
- **Vercel Blob** - Content storage
- **Vercel** - Deployment platform

### Setting Up Cloud Services

#### Neon (Database)

1. Sign up at [Neon](https://neon.tech/) and create a new project
2. Create a new PostgreSQL database
3. Get your connection string: `postgresql://user:password@pg.neon.tech:5432/database`
4. Set up the following environment variables:
   - `NEON_DATABASE_URL` - Main connection string 
   - `NEON_DIRECT_URL` - Direct connection string (with ?sslmode=require)

#### Upstash Redis (Caching)

1. Sign up at [Upstash](https://upstash.com/) and create a new Redis database
2. Select the region closest to your users
3. From the Upstash console, get your Redis URL and token
4. Set up the following environment variables:
   - `UPSTASH_REDIS_URL` - Redis connection URL
   - `UPSTASH_REDIS_TOKEN` - Authentication token

#### Vercel Blob (Content Storage)

1. This service is automatically available when deploying to Vercel
2. You'll need to set the `BLOB_READ_WRITE_TOKEN` environment variable in your Vercel project

### Deploying to Vercel

1. Push your repository to GitHub
2. Sign up at [Vercel](https://vercel.com) and create a new project
3. Connect your GitHub repository
4. In the "Settings" section, add all environment variables from `.env.example`
5. Deploy the project

### Database Migration

When migrating from SQLite to PostgreSQL:

1. Generate a Prisma migration:
   ```bash
   cd webs-app
   npx prisma migrate dev --name postgres-migration
   ```

2. Apply the migration to your Neon database:
   ```bash
   npx prisma migrate deploy
   ```

3. For data migration from SQLite to PostgreSQL, you can use a script or a tool like [pgloader](https://github.com/dimitri/pgloader)

### Performance Considerations

- **Database queries**: Set appropriate indexes in your Prisma schema
- **Caching**: Critical data is cached in Upstash Redis
- **Blob storage**: Large content is stored in Vercel Blob instead of the database

### Troubleshooting

- **Database Connection Issues**: 
  - Ensure your IP is whitelisted in Neon's access control
  - Verify SSL requirements in connection strings

- **Redis Connection Issues**:
  - Check if the Redis token is correctly configured
  - Verify network access to Upstash servers

- **Blob Storage Issues**:
  - Ensure `BLOB_READ_WRITE_TOKEN` is properly set
  - Check Vercel logs for any permission errors

## License

MIT

## ⚡ features

- fetch web content and convert it to markdown using jina reader
- extract and follow links from the content
- store all content in a local sqlite database
- deduplicate content by url
- generate AI-powered summaries of fetched content
- list and browse indexed content with domain-focused navigation
- copy content to clipboard for easy access with token counts
- chat with your content using AI models of your choice
- manage database content with clean, simple commands
- elegant, minimalist interface with professional design

## 📦 installation

```bash
# Clone the repository
git clone <repository-url>
cd webs-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI globally
npm link
```

## 🚀 usage

```bash
# Fetch content from a URL
webs fetch <url>

# Example
webs fetch https://example.com

# Fetch with depth 2 (follow links and their links)
webs fetch https://example.com -d 2

# Limit the maximum number of pages to fetch
webs fetch https://example.com -m 50

# Generate an AI summary of fetched content
webs fetch https://example.com -s

# Generate a summary without using cache
webs fetch https://example.com -s -n

# Quiet mode (less output)
webs fetch https://example.com -q

# List all indexed domains (default view)
webs list

# Show pages for a specific domain
webs list -d example

# Show domain pages in a directory tree view
webs list -d example --tree

# Show all URLs in a flat list
webs list --all

# Get results in different formats
webs list -f json
webs list -f simple

# Copy content from a domain to clipboard
webs copy example

# Copy content from a specific path
webs copy example/docs

# Include titles and dates in copied content
webs copy example/docs -t -d

# Use a different format for copying
webs copy example -f text
webs copy example -f json

# Start an interactive chat about all your indexed content
webs chat

# Chat about a specific domain
webs chat example

# Focus on a specific path within a domain
webs chat example -p /docs

# Use a specific AI model for chat
webs chat -m claude
webs chat -m gemini-pro
webs chat -m gpt-4

# Adjust the context limit for chat
webs chat -c 20000

# Delete content for a single URL
webs delete https://example.com

# Delete all content for a specific domain
webs delete example --all

# Force delete without confirmation prompt
webs delete example --all --force

# Clean database (remove broken links)
webs clean

# Show database statistics
webs stats

# Show detailed statistics by domain
webs stats --detailed
```

## 🔍 how it works

1. The tool takes a URL as input
2. Fetches the content from r.jina.ai/<url>
3. Extracts links from the markdown content
4. Recursively fetches content from the extracted links
5. Stores all content in a SQLite database with deduplication
6. Optionally generates an AI summary of the content
7. Provides commands to browse content organized by domains and URL paths
8. Allows copying content to clipboard for easy access
9. Generates friendly dog-themed summaries using Google's Gemini-2-Flash-001

## 📚 database schema

The SQLite database contains the following tables:

- `pages`: Stores the web pages with their URLs and content
- `links`: Stores the relationships between pages

## 📝 summary feature

The summary feature uses OpenRouter API with Google's Gemini-2-Flash-001 model to generate structured summaries of fetched content. To use this feature:

1. Set up your OpenRouter API key as an environment variable:
   ```bash
   export OPENROUTER_API_KEY="your-api-key"
   ```

2. Run the CLI with the `-s` or `--summary` flag:
   ```bash
   webs fetch https://example.com -s
   ```

The summary includes:
- A title that represents the main topic
- A brief overview of the content
- Key topics covered
- Important related links

Summaries are cached for 24 hours to improve performance and reduce API calls. Use the `-n` or `--no-cache` flag to bypass the cache.

## 🐶 dog-themed summaries

The tool automatically generates fun dog-themed summaries for both the `list` and `copy` commands. These summaries are created by the Web Retriever, an AI assistant who speaks like a friendly, intelligent dog:

## 📋 copy command

The copy command allows you to copy content from the database to your clipboard:

```bash
# Copy all content from a domain
webs copy domain_name
```

You can also specify a path to copy content from a specific section of a website:

```bash
# Copy content from a specific path
webs copy domain_name/path
```

Customize the copied content with options:

```bash
# Include titles in the copied content
webs copy domain_name -t

# Include fetched dates in the copied content
webs copy domain_name -d

# Choose a different format (default is markdown)
webs copy domain_name -f text
webs copy domain_name -f json
```

When you copy content, the tool automatically provides an estimate of how many tokens the content will consume in different LLM models, helping you manage context windows:

```
📊 Token estimate: ~2,500 tokens (medium, 1,800 words, 10,000 chars)
Model-specific estimates:
  - gpt     : ~2,500 tokens
  - claude  : ~2,800 tokens
  - gemini  : ~2,700 tokens
  - llama   : ~2,600 tokens
  - mistral : ~2,600 tokens
```

This feature helps you understand how much of your LLM's context window will be consumed by the copied content, allowing you to make informed decisions about how to use the information.

## 🌐 web app development

The Webs project also includes a modern web application built with React, TypeScript, and TailwindCSS. This provides a clean, intuitive interface for all the CLI functionality with a focus on minimalist design and lots of whitespace.

### Setting up the web app

```bash
# Navigate to the API directory
cd api

# Install API dependencies
npm install

# Start the API server
npm run dev

# In a new terminal, navigate to the web app directory
cd webs-app

# Install web app dependencies
npm install

# Start the development server
npm start
```

The web app will be available at http://localhost:3000 and will connect to the API running on http://localhost:3001.

### Web app features

- Clean, minimalist interface with generous whitespace
- Dark/light mode support
- Dashboard with key statistics and quick actions
- Content fetching with real-time progress indicators
- Tree-based content browsing organized by domains
- Interactive chat with your indexed content
- Content analysis with token visualization
- Database management and maintenance tools
- Responsive design that works on mobile, tablet, and desktop

### Technologies used

- **Frontend**: React, TypeScript, TailwindCSS, React Router
- **UI Components**: Headless UI, Heroicons
- **API**: Express.js, SQLite (via better-sqlite3)
- **State Management**: React Context API and hooks
- **Data Visualization**: Recharts
- **PWA Features**: Workbox
