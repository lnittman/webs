declare module 'ai' {
  export class StreamingTextResponse extends Response {
    constructor(stream: ReadableStream, options?: ResponseInit);
  }
} 