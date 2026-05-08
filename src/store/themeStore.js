import { create } from 'zustand';

export const useThemeStore = create((set) => {
  // Check local storage or system preference on load
  const storedTheme = localStorage.getItem('clinix-theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const initialTheme = storedTheme ? storedTheme : (systemPrefersDark ? 'dark' : 'light');

  return {
    theme: initialTheme,
    transitionState: 'idle', // 'idle' | 'closing' | 'snapping-dark' | 'fading-dark-out' | 'sealed-for-open' | 'opening-light'
    startBlinkToggle: () => set((state) => {
      if (state.transitionState !== 'idle') return state;

      const toDark = state.theme === 'light';

      if (toDark) {
        // LIGHT → DARK
        // Phase 1: Lids sweep in from top/bottom (550ms)
        // Phase 2: Lids snap away, dark content blur-fades in
        setTimeout(() => {
          localStorage.setItem('clinix-theme', 'dark');
          document.documentElement.classList.add('dark');
          useThemeStore.setState({ theme: 'dark', transitionState: 'snapping-dark' });
          setTimeout(() => {
            useThemeStore.setState({ transitionState: 'idle' });
          }, 850);
        }, 550);

        return { transitionState: 'closing' };

      } else {
        // DARK → LIGHT
        // Phase 1: Dark UI blurs/fades OUT (400ms)
        // Phase 2: Lids materialize at center sealed + theme swaps
        // Phase 3: Lids peel open from center with blur-in revealing light
        setTimeout(() => {
          localStorage.setItem('clinix-theme', 'light');
          document.documentElement.classList.remove('dark');
          // Snap lids to sealed position instantly (no slide-in animation)
          useThemeStore.setState({ theme: 'light', transitionState: 'sealed-for-open' });

          // Give browser 2 frames to register the sealed position, then open
          setTimeout(() => {
            useThemeStore.setState({ transitionState: 'opening-light' });
            setTimeout(() => {
              useThemeStore.setState({ transitionState: 'idle' });
            }, 750);
          }, 32);
        }, 400);

        return { transitionState: 'fading-dark-out' };
      }
    }),
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('clinix-theme', newTheme);
      return { theme: newTheme };
    }),
    setTheme: (newTheme) => set(() => {
      localStorage.setItem('clinix-theme', newTheme);
      return { theme: newTheme };
    })
  };
});
