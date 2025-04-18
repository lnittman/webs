import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// UI preferences (layout-related)
export interface UIPreferences {
  showTimestamps: boolean;
  compactMode: boolean;
}

export const uiPreferencesAtom = atomWithStorage<UIPreferences>('uiPreferences', {
  showTimestamps: true,
  compactMode: false,
});

// Command menu open state
export const commandMenuOpenAtom = atom<boolean>(false);

// Settings modal open state
export const settingsModalOpenAtom = atom<boolean>(false);

// Sidebar state
export const sidebarOpenAtom = atom<boolean>(false); // Default to collapsed 