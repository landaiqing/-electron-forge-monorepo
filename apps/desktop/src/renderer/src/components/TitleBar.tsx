import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Square, Minimize2, X } from 'lucide-react';
import { useEvents } from '@/hooks';
import {
  WINDOW_MINIMIZE,
  WINDOW_MAXIMIZE,
  WINDOW_CLOSE,
  WINDOW_IS_MAXIMIZED,
  MAIN_PROCESS,
} from '@craft-studio/shared/events';

export function TitleBar() {
  const { t } = useTranslation();
  const events = useEvents();
  const [isMaximized, setIsMaximized] = useState(false);

  // 检查窗口状态
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const result = await events.invokeTo(MAIN_PROCESS, WINDOW_IS_MAXIMIZED);
        setIsMaximized(result.isMaximized);
      } catch (error) {
        console.error('检查窗口状态失败:', error);
      }
    };
    checkMaximized();
  }, [events]);

  const handleMinimize = async () => {
    try {
      await events.invokeTo(MAIN_PROCESS, WINDOW_MINIMIZE);
    } catch (error) {
      console.error('最小化失败:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const result = await events.invokeTo(MAIN_PROCESS, WINDOW_MAXIMIZE);
      setIsMaximized(result.isMaximized);
    } catch (error) {
      console.error('最大化/还原失败:', error);
    }
  };

  const handleClose = async () => {
    try {
      await events.invokeTo(MAIN_PROCESS, WINDOW_CLOSE);
    } catch (error) {
      console.error('关闭失败:', error);
    }
  };

  return (
    <div
      className="flex h-9 w-full items-center justify-between border-b border-gray-200 bg-gray-50 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* 左侧：应用名称 */}
      <div className="flex items-center px-3 text-sm font-medium text-gray-700">
        {t('app.name')}
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* 最小化 */}
        <button
          onClick={handleMinimize}
          className="flex h-full w-12 items-center justify-center text-gray-700 transition-colors hover:bg-gray-200"
          aria-label={t('titleBar.minimize')}
          title={t('titleBar.minimize')}
        >
          <Minus size={16} />
        </button>

        {/* 最大化/还原 */}
        <button
          onClick={handleMaximize}
          className="flex h-full w-12 items-center justify-center text-gray-700 transition-colors hover:bg-gray-200"
          aria-label={isMaximized ? t('titleBar.restore') : t('titleBar.maximize')}
          title={isMaximized ? t('titleBar.restore') : t('titleBar.maximize')}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Square size={16} />}
        </button>

        {/* 关闭 */}
        <button
          onClick={handleClose}
          className="flex h-full w-12 items-center justify-center text-gray-700 transition-colors hover:bg-red-500 hover:text-white"
          aria-label={t('titleBar.close')}
          title={t('titleBar.close')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

