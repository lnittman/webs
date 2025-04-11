import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { SetStateAction } from 'jotai';

// Define theme settings
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system');

// Define user interface preferences
export interface UIPreferences {
  commandBarPlacement: 'top' | 'bottom';
  showTimestamps: boolean;
  compactMode: boolean;
}

export const uiPreferencesAtom = atomWithStorage<UIPreferences>('uiPreferences', {
  commandBarPlacement: 'top',
  showTimestamps: true,
  compactMode: false,
});

// Current command input
export const commandInputAtom = atom<string>('');

// History of commands
export const commandHistoryAtom = atomWithStorage<string[]>('commandHistory', []);

// Add a command to history
export const addToCommandHistoryAtom = atom(
  null,
  (get: (arg0: typeof commandHistoryAtom) => string[], set: (arg0: typeof commandHistoryAtom, arg1: SetStateAction<string[]>) => void, command: string) => {
    const history = get(commandHistoryAtom);
    // Don't add duplicate consecutive commands
    if (history.length > 0 && history[0] === command) {
      return;
    }
    // Limit history to 50 items
    set(commandHistoryAtom, [command, ...history.slice(0, 49)]);
  }
);

// Current history navigation index (-1 means not navigating)
export const historyIndexAtom = atom<number>(-1);

// Active context URL (for chat/summary commands)
export const activeContextAtom = atom<string | null>(null);

// Mobile menu sheet state
export const mobileSheetOpenAtom = atom<boolean>(false);

// Command menu open state
export const commandMenuOpenAtom = atom<boolean>(false);

// Settings modal open state
export const settingsModalOpenAtom = atom<boolean>(false);

// Sidebar state
export const sidebarOpenAtom = atom<boolean>(false); // Default to collapsed

// Language menu state
export const languageMenuAtom = atom({
  isVisible: false,
  isHovering: false,
}); 