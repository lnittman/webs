import { atomWithStorage } from 'jotai/utils';

// Define theme settings
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system'); 