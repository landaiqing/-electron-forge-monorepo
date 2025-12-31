import {
  LogContextData,
  LogLevel,
  LogSourceWithContext,
  LEVEL,
  LEVEL_MAP,
} from "../types";
import { isDev } from "@craft-studio/shared/config";
import { LOGGER_TO_MAIN } from "@craft-studio/shared/events";
import {
  RendererIpcEvents,
  useEvents,
} from "@craft-studio/electron-events/renderer";
import type { PreloadDependencies } from "@craft-studio/electron-events/preload";
import type { EventKey } from "@craft-studio/electron-events";

// 类型化的 logger 事件常量
const LOGGER_SEND_TO_MAIN: EventKey<
  [LogSourceWithContext, LogLevel, string, any[]]
> = LOGGER_TO_MAIN as EventKey<
  [LogSourceWithContext, LogLevel, string, any[]]
>;

/**
 * 渲染进程日志服务
 * API 与主进程 LoggerService 完全一致
 * 通过 electron-events 将日志发送到主进程
 */
export class LoggerService {
  private static instance: LoggerService;
  private events: RendererIpcEvents;

  // 配置
  private level: LogLevel = isDev ? LEVEL.SILLY : LEVEL.INFO;
  private logToMainLevel: LogLevel = LEVEL.WARN;

  // 环境变量（仅开发模式）
  private envLevel: LogLevel = LEVEL.NONE;
  private envShowModules: string[] = [];

  // 上下文
  private windowName: string = "";
  private moduleName: string = "";
  private context: Record<string, any> = {};

  private constructor(events: RendererIpcEvents) {
    this.events = events;

    // 加载环境变量
    if (isDev) {
      const env = (globalThis as any).window?.electron?.process?.env;

      if (
        env?.CSLOGGER_RENDERER_LEVEL &&
        Object.values(LEVEL).includes(env.CSLOGGER_RENDERER_LEVEL as LogLevel)
      ) {
        this.envLevel = env.CSLOGGER_RENDERER_LEVEL;
        console.log(
          `%c[LoggerService] env CSLOGGER_RENDERER_LEVEL: ${this.envLevel}`,
          "color: blue; font-weight: bold"
        );
      }

      if (env?.CSLOGGER_RENDERER_SHOW_MODULES) {
        this.envShowModules = env.CSLOGGER_RENDERER_SHOW_MODULES.split(",")
          .map((m: string) => m.trim())
          .filter((m: string) => m);
        if (this.envShowModules.length > 0) {
          console.log(
            `%c[LoggerService] env CSLOGGER_RENDERER_SHOW_MODULES: ${this.envShowModules.join(" ")}`,
            "color: blue; font-weight: bold"
          );
        }
      }
    }
  }

  /**
   * 获取单例实例
   * 自动从 window.electronAPI.events 获取 RendererIpcEvents
   */
  public static getInstance(events?: RendererIpcEvents): LoggerService {
    if (!LoggerService.instance) {
      // 如果没有传入 events，自动从 window.electronAPI.events 获取
      const eventsInstance =
        events ||
        (() => {
          const win = globalThis as typeof globalThis & {
            electronAPI?: {
              events: PreloadDependencies;
            };
          };

          if (!win.electronAPI?.events) {
            throw new Error(
              "[LoggerService] window.electronAPI.events not found. " +
                "Make sure preload script is configured correctly."
            );
          }

          return useEvents(win.electronAPI.events);
        })();

      LoggerService.instance = new LoggerService(eventsInstance);
    }
    return LoggerService.instance;
  }

  /**
   * 初始化窗口信息（必须在调用其他方法前调用）
   * 如果不调用，将使用默认窗口名 'renderer'
   */
  public initWindowSource(window: string): LoggerService {
    this.windowName = window;
    return this;
  }

  /**
   * 创建带上下文的新 logger
   */
  public withContext(
    module: string,
    context?: Record<string, any>
  ): LoggerService {
    const newLogger = Object.create(this);
    newLogger.events = this.events;
    newLogger.level = this.level;
    newLogger.logToMainLevel = this.logToMainLevel;
    newLogger.envLevel = this.envLevel;
    newLogger.envShowModules = this.envShowModules;
    newLogger.windowName = this.windowName;
    newLogger.moduleName = module;
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  /**
   * 处理日志
   */
  private processLog(level: LogLevel, message: string, data: any[]): void {
    // 如果没有设置窗口名，使用默认值
    if (!this.windowName) {
      this.windowName = "renderer";
    }

    const currentLevel = LEVEL_MAP[level];

    // 环境变量过滤
    if (isDev) {
      if (
        this.envLevel !== LEVEL.NONE &&
        currentLevel < LEVEL_MAP[this.envLevel]
      ) {
        return;
      }
      if (
        this.moduleName &&
        this.envShowModules.length > 0 &&
        !this.envShowModules.includes(this.moduleName)
      ) {
        return;
      }
    }

    // 级别过滤
    if (currentLevel < LEVEL_MAP[this.level]) {
      return;
    }

    // 控制台输出
    const logMessage = this.moduleName
      ? `[${this.moduleName}] ${message}`
      : message;
    const timestamp = new Date().toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hour12: false,
    });

    switch (level) {
      case LEVEL.ERROR:
        console.error(
          `[${timestamp}] %c<ERROR>`,
          "color: red; font-weight: bold",
          logMessage,
          ...data
        );
        break;
      case LEVEL.WARN:
        console.warn(
          `[${timestamp}] %c<WARN>`,
          "color: orange; font-weight: bold",
          logMessage,
          ...data
        );
        break;
      case LEVEL.INFO:
        console.info(
          `[${timestamp}] %c<INFO>`,
          "color: green; font-weight: bold",
          logMessage,
          ...data
        );
        break;
      case LEVEL.VERBOSE:
        console.log(
          `[${timestamp}] %c<VERBOSE>`,
          "color: gray",
          logMessage,
          ...data
        );
        break;
      case LEVEL.DEBUG:
        console.debug(
          `[${timestamp}] %c<DEBUG>`,
          "color: purple; font-weight: bold",
          logMessage,
          ...data
        );
        break;
      case LEVEL.SILLY:
        console.debug(
          `[${timestamp}] %c<SILLY>`,
          "color: gray",
          logMessage,
          ...data
        );
        break;
    }

    // 发送到主进程
    const forceLogToMain =
      data.length > 0 && data[data.length - 1]?.logToMain === true;

    if (currentLevel >= LEVEL_MAP[this.logToMainLevel] || forceLogToMain) {
      const source: LogSourceWithContext = {
        process: "renderer",
        window: this.windowName,
        module: this.moduleName,
      };

      if (Object.keys(this.context).length > 0) {
        source.context = this.context;
      }

      // 移除 logToMain 标记
      const sendData = forceLogToMain ? data.slice(0, -1) : data;

      // 通过 electron-events 发送
      this.events
        .invokeTo("main", LOGGER_SEND_TO_MAIN, source, level, message, sendData)
        .catch((error) => {
          console.error("[LoggerService] Failed to send log to main:", error);
        });
    }
  }

  // ==================== 日志方法（与主进程API完全一致） ====================

  public error(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.ERROR, message, data);
  }

  public warn(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.WARN, message, data);
  }

  public info(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.INFO, message, data);
  }

  public verbose(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.VERBOSE, message, data);
  }

  public debug(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.DEBUG, message, data);
  }

  public silly(message: string, ...data: LogContextData): void {
    this.processLog(LEVEL.SILLY, message, data);
  }

  // ==================== 配置方法（与主进程API完全一致） ====================

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  public resetLevel(): void {
    this.level = isDev ? LEVEL.SILLY : LEVEL.INFO;
  }

  public setLogToMainLevel(level: LogLevel): void {
    this.logToMainLevel = level;
  }

  public getLogToMainLevel(): LogLevel {
    return this.logToMainLevel;
  }

  public resetLogToMainLevel(): void {
    this.logToMainLevel = LEVEL.WARN;
  }
}

/**
 * 单例实例（需要在初始化时传入 events）
 */
export const loggerService = LoggerService.getInstance();
