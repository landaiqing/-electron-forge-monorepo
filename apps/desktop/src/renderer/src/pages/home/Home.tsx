import { useState } from 'react';
import { Button } from '@craft-studio/ui/src/components/Button';
import { useEvents } from '@/hooks';
import { APP_GET_VERSION, MAIN_PROCESS } from '@craft-studio/shared/events';
import { LoggerService } from '@craft-studio/logger/renderer';
export function HomePage() {
  const [version, setVersion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [logStatus, setLogStatus] = useState<string>('');
  const events = useEvents();

  // 初始化logger
  const logger = LoggerService.getInstance(events)
    .initWindowSource('main-window')
    .withContext('HomePage', { page: 'home' });

  const handleGetVersion = async () => {
    setLoading(true);
    try {
      logger.info('开始获取应用版本');
      const result = await events.invokeTo(MAIN_PROCESS, APP_GET_VERSION);
      setVersion(result.version);
      logger.info('获取应用版本成功', { version: result.version });
      console.log('✅ 获取应用版本成功:', result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('获取版本失败', err);
      console.error('❌ 获取版本失败:', error);
      setVersion('获取失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试不同级别的日志
  const handleTestLog = (level: string) => {
    const timestamp = new Date().toISOString();
    setLogStatus(`${level.toUpperCase()} 日志已发送 - ${timestamp}`);

    switch (level) {
      case 'error':
        logger.error('这是一个错误日志', { code: 'TEST_ERROR', timestamp });
        break;
      case 'warn':
        logger.warn('这是一个警告日志', { type: 'test_warning', data: { value: 123 } });
        break;
      case 'info':
        logger.info('这是一个信息日志', { action: 'button_click', page: 'home' });
        break;
      case 'debug':
        logger.debug('这是一个调试日志', { debugInfo: { foo: 'bar', nested: { value: true } } });
        break;
      case 'verbose':
        logger.verbose('这是一个详细日志', { details: 'verbose mode test' });
        break;
      case 'silly':
        logger.silly('这是一个追踪日志', { trace: 'step by step' });
        break;
    }
  };

  // 测试发送日志到主进程
  const handleLogToMain = () => {
    setLogStatus('INFO 日志已发送到主进程');
    logger.info('渲染进程发送到主进程的日志', { logToMain: true, source: 'renderer' });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Craft Studio</h1>
        <p className="mb-6 text-gray-600">使用 @craft-studio/electron-events 进行跨进程通信</p>

        <div className="mb-6">
          <h2 className="mb-3 text-xl font-semibold text-gray-700">测试事件通信</h2>
          <div className="space-y-4">
            <div>
              <Button onClick={handleGetVersion} disabled={loading} className="w-full">
                {loading ? '获取中...' : '获取应用版本'}
              </Button>
            </div>

            {version && (
              <div className="rounded border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">
                  应用版本：
                  <span className="ml-2 font-mono text-blue-600">{version}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-xl font-semibold text-gray-700">测试 Logger 日志</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleTestLog('error')}
                variant="destructive"
                className="text-sm"
              >
                Error
              </Button>
              <Button
                onClick={() => handleTestLog('warn')}
                variant="secondary"
                className="bg-orange-500 text-sm text-white hover:bg-orange-600"
              >
                Warn
              </Button>
              <Button
                onClick={() => handleTestLog('info')}
                className="bg-green-500 text-sm text-white hover:bg-green-600"
              >
                Info
              </Button>
              <Button onClick={() => handleTestLog('debug')} variant="outline" className="text-sm">
                Debug
              </Button>
              <Button
                onClick={() => handleTestLog('verbose')}
                variant="outline"
                className="text-sm"
              >
                Verbose
              </Button>
              <Button onClick={() => handleTestLog('silly')} variant="outline" className="text-sm">
                Silly
              </Button>
            </div>

            <Button
              onClick={handleLogToMain}
              variant="outline"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              发送日志到主进程文件
            </Button>

            {logStatus && (
              <div className="rounded border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-medium text-green-900">{logStatus}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 text-sm text-gray-500">
          <p>💡 点击按钮测试主进程与渲染进程之间的通信和日志功能</p>
          <p className="mt-1">📝 日志会显示在控制台和日志文件中</p>
        </div>
      </div>
    </div>
  );
}
