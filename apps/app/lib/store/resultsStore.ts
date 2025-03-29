import { create } from 'zustand';

export interface CrawlResult {
  url: string;
  title: string;
  markdown: string;
  links: string[];
}

export type CommandType = 'main' | 'spin' | 'think';

export interface CommandResult {
  type: CommandType;
  content: any;
  command: string;
  timestamp: number;
}

export interface StreamState {
  isStreaming: boolean;
  streamingType: CommandType | null;
  streamingContent: string;
  streamingCommand: string;
}

export interface ResultsStore {
  results: CommandResult[];
  pendingResult: CommandResult | null;
  isLoading: boolean;
  stream: StreamState;
  
  // Actions
  addResult: (result: CommandResult) => void;
  updatePendingResult: (pendingResult: CommandResult, finalResult: CommandResult) => void;
  setIsLoading: (value: boolean) => void;
  
  // Stream actions
  startStreaming: (type: CommandType, command: string) => void;
  appendStreamingContent: (content: string) => void;
  finishStreaming: () => void;
  
  // Reset results
  resetResults: () => void;
}

export const useResultsStore = create<ResultsStore>((set, get) => ({
  results: [],
  pendingResult: null,
  isLoading: false,
  stream: {
    isStreaming: false,
    streamingType: null,
    streamingContent: '',
    streamingCommand: '',
  },
  
  addResult: (result) => {
    set((state) => ({
      results: [...state.results, result],
      pendingResult: result,
    }));
  },
  
  updatePendingResult: (pendingResult, finalResult) => {
    set((state) => ({
      results: state.results.map((r) => 
        r === pendingResult ? finalResult : r
      ),
      pendingResult: null,
    }));
  },
  
  setIsLoading: (value) => {
    set({ isLoading: value });
  },
  
  startStreaming: (type, command) => {
    set({
      stream: {
        isStreaming: true,
        streamingType: type,
        streamingContent: '',
        streamingCommand: command,
      },
    });
  },
  
  appendStreamingContent: (content) => {
    set((state) => ({
      stream: {
        ...state.stream,
        streamingContent: state.stream.streamingContent + content,
      },
    }));
  },
  
  finishStreaming: () => {
    const { stream } = get();
    
    // Add the streamed content as a result
    if (stream.streamingType && stream.streamingCommand) {
      const result: CommandResult = {
        type: stream.streamingType,
        content: {
          response: stream.streamingContent,
          question: stream.streamingCommand
        },
        command: stream.streamingCommand,
        timestamp: Date.now(),
      };
      
      get().addResult(result);
    }
    
    // Reset streaming state
    set({
      stream: {
        isStreaming: false,
        streamingType: null,
        streamingContent: '',
        streamingCommand: '',
      },
    });
  },
  
  resetResults: () => {
    set({
      results: [],
      pendingResult: null,
      isLoading: false,
      stream: {
        isStreaming: false,
        streamingType: null,
        streamingContent: '',
        streamingCommand: '',
      },
    });
  },
}));
