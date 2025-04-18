/**
 * Chat type definitions
 */

// ==============================
// Model types (server data structure)
// ==============================

/**
 * Chat message as stored in the database
 */
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: number;
  createdAt?: number;
}

/**
 * Chat as stored in the database
 */
export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  projectId?: string;
}

// ==============================
// UI state types (for display and interaction)
// ==============================

/**
 * Types of UI messages
 */
export type MessageType = 
  'standard' | 'pending' | 'error' | 'toolCall' | 'toolResult';

/**
 * Content of a UI message
 */
export interface MessageContent {
  question?: string;
  response?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  error?: string;
}

/**
 * A UI message (not necessarily persisted)
 */
export interface Message {
  id: string;
  type: MessageType;
  content: MessageContent;
  command: string;
  timestamp: number;
  chatId?: string;
}

/**
 * Tool call representation
 */
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  toolArgs: any;
}

/**
 * Tool result representation
 */
export interface ToolResult {
  toolCallId: string;
  toolName?: string; 
  toolResult: any;
}

/**
 * Streaming state for UI
 */
export interface StreamState {
  isStreaming: boolean;
  content: string;
  command: string;
}

/**
 * Chat UI store state
 */
export interface ChatUIStoreState {
  // UI display state for the CURRENT chat
  messages: Message[];
  isLoading: boolean; // Indicates if waiting for AI response or initial load
  pendingMessageId: string | null;
  stream: StreamState;

  // Actions - UI Message management
  addMessage: (message: Omit<Message, 'id'>) => Message;
  updateMessage: (messageId: string, updates: Partial<Omit<Message, 'id'>>) => void;
  removeMessage: (messageId: string) => void;
  setPendingMessageId: (messageId: string | null) => void;
  resetMessages: () => void; // Resets UI state for the current chat

  // Actions - Streaming UI
  startStreaming: (command: string) => void;
  appendStreamContent: (contentChunk: string) => void;
  finishStreaming: (finalContent?: string, error?: string) => void;

  // Actions - Loading state
  setIsLoading: (value: boolean) => void;
}

// ==============================
// Request/Response types (API contracts)
// ==============================

/**
 * Request to create a new chat
 */
export interface CreateChatRequest {
  title: string;
  message?: string;
  projectId?: string;
} 