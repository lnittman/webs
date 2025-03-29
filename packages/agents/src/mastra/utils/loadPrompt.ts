import { readFileSync } from 'fs';
import path from 'path';

/**
 * Loads a prompt template from an XML file
 * @param relativePath The path relative to src/mastra
 * @param fallback A fallback template if the file can't be loaded
 * @returns The prompt template as a string
 */
export function loadPromptTemplate(relativePath: string, fallback: string = ''): string {
  try {
    const xmlPath = path.join(process.cwd(), 'packages/agents/src/mastra', relativePath);
    const template = readFileSync(xmlPath, 'utf-8');
    console.log(`Loaded template from: ${xmlPath} (${template.length} chars)`);
    return template;
  } catch (error) {
    console.error(`Failed to load ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

/**
 * Fills a template with values from a context object
 * @param template The template string with {{placeholders}}
 * @param context An object with keys matching the placeholders
 * @returns The filled template
 */
export function fillTemplate(template: string, context: Record<string, any>): string {
  let result = template;
  for (const key in context) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    const value = context[key] !== undefined ? String(context[key]) : '';
    result = result.replace(placeholder, value);
  }
  return result;
} 