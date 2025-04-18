import { atom } from 'jotai';

// Current command input
export const commandInputAtom = atom<string>('');

// Initial message for navigation
export const initialMessageAtom = atom<string | null>(null); 