import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 定义主题类型
export type Theme = 'light' | 'dark' | 'system';

// 定义 Store 的状态接口
interface ThemeState {
  // 状态
  theme: Theme;
  isDarkMode: boolean;

  // 操作方法
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * 主题 Store
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // 初始状态
      theme: 'light',
      isDarkMode: false,

      // 设置主题
      setTheme: (theme: Theme) => {
        set({
          theme,
          isDarkMode: theme === 'dark',
        });
      },

      // 切换主题（在 light 和 dark 之间切换）
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        set({
          theme: newTheme,
          isDarkMode: newTheme === 'dark',
        });
      },
    }),
    {
      name: 'theme-storage', // localStorage 中的键名
      storage: createJSONStorage(() => localStorage), // 使用 localStorage 存储
      // 可选：指定要持久化的字段
      partialize: (state) => ({
        theme: state.theme,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

// 导出选择器
export const useTheme = () => useThemeStore((state) => state.theme);
export const useIsDarkMode = () => useThemeStore((state) => state.isDarkMode);
export const useThemeActions = () =>
  useThemeStore((state) => ({
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
  }));

