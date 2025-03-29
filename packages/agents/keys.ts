import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).url(),
    },
    runtimeEnv: {
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.OPENROUTER_API_KEY,
    },
  });
