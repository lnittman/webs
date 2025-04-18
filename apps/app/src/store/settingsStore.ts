import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Define theme settings
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system');

// Define user interface preferences
export interface UIPreferences {
  showTimestamps: boolean;
  compactMode: boolean;
}

export const uiPreferencesAtom = atomWithStorage<UIPreferences>('uiPreferences', {
  showTimestamps: true,
  compactMode: false,
});

// Current command input
export const commandInputAtom = atom<string>('');

// Command menu open state
export const commandMenuOpenAtom = atom<boolean>(false);

// Settings modal open state
export const settingsModalOpenAtom = atom<boolean>(false);

export const initialMessageForNavAtom = atom<string | null>(null);

// Sidebar state
export const sidebarOpenAtom = atom<boolean>(false); // Default to collapsed
