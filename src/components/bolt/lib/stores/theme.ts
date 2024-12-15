import { atom } from 'nanostores';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark';
}

export const DEFAULT_THEME = 'light';

export const themeStore = atom<Theme>(initStore());

function initStore(): Theme {
  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return false;
    }
  };

  // Safely get persisted theme
  const getPersistedTheme = (): Theme | undefined => {
    if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
      const persistedTheme = localStorage.getItem(kTheme);
      return persistedTheme === 'dark' || persistedTheme === 'light' 
        ? persistedTheme 
        : undefined;
    }
    return undefined;
  };

  // Get theme attribute from HTML
  const getThemeAttribute = (): Theme | undefined => {
    if (typeof window !== 'undefined') {
      const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');
      return themeAttribute === 'dark' || themeAttribute === 'light' 
        ? themeAttribute 
        : undefined;
    }
    return undefined;
  };

  // Determine theme priority: persisted theme > HTML attribute > default
  return getPersistedTheme() 
    ?? getThemeAttribute() 
    ?? DEFAULT_THEME;
}

export function toggleTheme() {
  const currentTheme = themeStore.get();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  themeStore.set(newTheme);

  // Safely set localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(kTheme, newTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }

    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('data-theme', newTheme);
    }
  }
}