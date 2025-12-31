import { BrowserWindow, shell } from 'electron';
import electronDevtoolsInstaller, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import windowStateKeeper from 'electron-window-state';
import { join } from 'path';
import path from 'node:path';
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from '@craft-studio/shared/config';
export class WindowService {
  private static instance: WindowService | null = null;
  private mainWindow: BrowserWindow | null = null;
  public static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService();
    }
    return WindowService.instance;
  }

  // 创建主窗口
  public createMainWindow(): Electron.BrowserWindow {
    if (this.mainWindow) {
      return this.mainWindow;
    }
    const mainWindowState = windowStateKeeper({
      defaultWidth: MIN_WINDOW_WIDTH,
      defaultHeight: MIN_WINDOW_HEIGHT,
      fullScreen: false,
      maximize: false,
    });

    this.mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
      minHeight: MIN_WINDOW_HEIGHT,
      minWidth: MIN_WINDOW_WIDTH,
      x: mainWindowState.x,
      y: mainWindowState.y,
      show: false,
      autoHideMenuBar: true,
      frame: false, 
      ...(process.platform === 'linux' ? {} : {}),
      webPreferences: {
        preload: join(__dirname, 'preload.cjs'),
        sandbox: false,
      },
    });

    this.setupMainWindow(this.mainWindow, mainWindowState);

    return this.mainWindow;
  }

  // 窗口设置
  private setupMainWindow(mainWindow: BrowserWindow, mainWindowState: any) {
    mainWindowState.manage(mainWindow);

    this.setupWindowEvents(mainWindow);
    this.setupWindowOpenHandler(mainWindow);
    this.loadMainWindowContent(mainWindow);
  }

  // 窗口打开处理
  private setupWindowOpenHandler(mainWindow: BrowserWindow) {
    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  // 加载页面
  private loadMainWindowContent(mainWindow: BrowserWindow) {
    // 加载页面,热加载或静态加载

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      // 开发模式：直接加载 Vite 开发服务器
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      // 生产模式：加载构建后的 HTML 文件
      mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    //安装React Devtools
    // try {
    //   electronDevtoolsInstaller(REACT_DEVELOPER_TOOLS)
    //     .then((name) => console.log(`installed: ${name}`))
    //     .catch((err) => console.log('Unable to install `react-devtools`: \n', err));
    // } catch (e) {
    //   console.error('React Devtools failed to install:', e);
    // }
  }

  private setupWindowEvents(mainWindow: BrowserWindow) {
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  }
}

export const windowService = WindowService.getInstance();
