import { Theme } from './theme.types';
import { classicTheme } from './classic/classic.theme';
import { damascoTheme } from './damasco/damasco.theme';
import { islaTheme } from './isla/isla.theme';
import { mambosTheme } from './mambos/mambos.theme';
import { megacasinoTheme } from './megacasino/megacasino.theme';
import { keopsTheme } from './keops/keops.theme';
import { excaliburTheme } from './excalibur/excalibur.theme';

export const THEMES: Theme[] = [classicTheme, damascoTheme, islaTheme, mambosTheme,megacasinoTheme,keopsTheme,excaliburTheme];

const FALLBACK = classicTheme;

export function getTheme(key?: string | null): Theme {
  return THEMES.find(t => t.key === key) ?? FALLBACK;
}

/** Clase CSS del tema: 'tema-classic', 'tema-damasco', etc. */
export function themeClass(key?: string | null): string {
  return `tema-${getTheme(key).key}`;
}