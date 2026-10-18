import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'quadra_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark =
      saved === 'dark' ||
      (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.setDark(prefersDark);
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  private setDark(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark-theme', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }
}
