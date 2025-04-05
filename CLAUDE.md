# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `pnpm dev`: Run development server (port 4000)
- `pnpm build`: Build the project
- `pnpm lint`: Run linting
- `pnpm format`: Format code
- `pnpm test`: Run all tests
- `pnpm test path/to/file`: Run a single test file
- `pnpm typecheck`: Check TypeScript types

## Code Style
- TypeScript with strict type checking
- React functional components with named exports
- Import order: React, third-party libs, design system, local imports
- PascalCase for components, camelCase for functions/variables
- Avoid default exports, prefer named exports
- Use absolute imports with @/ prefix for app-level imports
- Handle async errors with try/catch blocks
- State management with Zustand and Jotai
- Tailwind for styling with tailwind-merge for conditional classes

## Project Structure
- Monorepo using pnpm workspaces and Turborepo
- Feature-based directory organization
- Components in dedicated directories with subcomponents when needed
- Keep components small and focused on a single responsibility