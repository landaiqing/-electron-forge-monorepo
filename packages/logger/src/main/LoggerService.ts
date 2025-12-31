import {
  LogContextData,
  LogLevel,
  LogSourceWithContext,
  LEVEL,
  LEVEL_MAP,
} from "../types";
import { isDev } from "@craft-studio/shared/config";
import { LOGGER_TO_MAIN } from "@craft-studio/shared/events";
import { app } from "electron";
import os from "os";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { isMainThread } from "worker_threads";
import { useEvents } from "@craft-studio/electron-events/main";
import type { MainIpcEvents } from "@craft-studio/electron-events";
import { ANY_WINDOW_SYMBOL } from "@craft-studio/electron-events/common";
import type { EventKey } from "@craft-studio/electron-events";

// 类型化的 logger 事件常量
const LOGGER_SEND_TO_MAIN: EventKey<
  [LogSourceWithContext, LogLevel, string, any[]]
> = LOGGER_TO_MAIN as EventKey<
  [LogSourceWithContext, LogLevel, string, any[]]
>;

const ANSICOLORS = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  END: "\x1b[0m",
  BOLD: "\x1b[1m",
  ITALIC: "\x1b[3m",
  UNDERLINE: "\x1b[4m",
};

/**
 * 应用 ANSI 颜色到文本
 */
function colorText(text: string, color: keyof typeof ANSICOLORS) {
  return ANSICOLORS[color] + text + ANSICOLORS.END;
}

const SYSTEM_INFO = {
  os: `${os.platform()}-${os.arch()} / ${os.version()}`,
  hw: `${os.cpus()[0]?.model || "Unknown CPU"} / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
};
const APP_VERSION = `${app?.getVersion?.() || "unknown"}`;

const DEFAULT_LEVEL = isDev ? LEVEL.SILLY : LEVEL.INFO;

/**
 * 主进程日志服务
 * 负责记录日志到文件，并接收来自渲染进程的日志
 */
export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private events?: MainIpcEvents;

  // 环境变量，仅在开发模式下使用
  private envLevel: LogLevel = LEVEL.NONE;
  private envShowModules: string[] = [];

  private logsDir: string = "";
  private module: string = "";
  private context: Record<string, any> = {};

  private constructor(events?: MainIpcEvents) {
    if (!isMainThread) {
      throw new Error(
        "[LoggerService] NOT support worker thread yet, can only be instantiated in main process."
      );
    }

    this.events = events;
    this.logsDir = path.join(app.getPath("userData"), "logs");

    // 环境变量配置
    if (isDev) {
      if (
        process.env.CSLOGGER_MAIN_LEVEL &&
        Object.values(LEVEL).includes(
          process.env.CSLOGGER_MAIN_LEVEL as LogLevel
        )
      ) {
        this.envLevel = process.env.CSLOGGER_MAIN_LEVEL as LogLevel;
        console.log(
          colorText(
            `[LoggerService] 已加载环境变量 CSLOGGER_MAIN_LEVEL: ${this.envLevel}`,
            "BLUE"
          )
        );
      }

      if (process.env.CSLOGGER_MAIN_SHOW_MODULES) {
        const showModules = process.env.CSLOGGER_MAIN_SHOW_MODULES.split(",")
          .map((module) => module.trim())
          .filter((module) => module !== "");
        if (showModules.length > 0) {
          this.envShowModules = showModules;
          console.log(
            colorText(
              `[LoggerService] env CSLOGGER_MAIN_SHOW_MODULES loaded: ${this.envShowModules.join(" ")}`,
              "BLUE"
            )
          );
        }
      }
    }

    // 配置 Winston 日志记录器
    const transports: winston.transport[] = [];

    // 一般日志文件
    transports.push(
      new DailyRotateFile({
        filename: path.join(this.logsDir, "app.%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "10m",
        maxFiles: "30d",
      })
    );

    // 错误日志文件
    transports.push(
      new DailyRotateFile({
        level: "warn",
        filename: path.join(this.logsDir, "app-error.%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "10m",
        maxFiles: "60d",
      })
    );

    this.logger = winston.createLogger({
      level: DEFAULT_LEVEL,
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      exitOnError: false,
      transports,
    });

    this.logger.on("error", (error) => {
      console.error("LoggerService fatal error:", error);
    });

    // 注册 IPC 处理器
    if (this.events) {
      this.registerIpcHandler();
    }
  }

  /**
   * 获取 LoggerService 的单例实例
   * 自动获取 MainIpcEvents 实例
   */
  public static getInstance(events?: MainIpcEvents): LoggerService {
    if (!LoggerService.instance) {
      // 如果没有传入 events，自动获取单例
      const eventsInstance = events || useEvents();
      LoggerService.instance = new LoggerService(eventsInstance);
    }
    return LoggerService.instance;
  }

  /**
   * 设置事件系统实例（用于延迟注册）
   */
  public setupEvents(events: MainIpcEvents): void {
    if (!this.events) {
      this.events = events;
      this.registerIpcHandler();
    }
  }

  /**
   * 注册用于渲染进程日志记录的 IPC 处理程序
   * 使用 electron-events 系统
   */
  private registerIpcHandler(): void {
    if (!this.events) {
      console.warn(
        "[LoggerService] No events instance, skipping IPC handler registration"
      );
      return;
    }

    // 使用 electron-events 注册处理器
    // ANY_WINDOW_SYMBOL 表示接收来自任何窗口的日志
    this.events.handle(
      ANY_WINDOW_SYMBOL,
      LOGGER_SEND_TO_MAIN,
      async (
        source: LogSourceWithContext,
        level: LogLevel,
        message: string,
        data: any[]
      ) => {
        this.processRendererLog(source, level, message, data);
      }
    );
  }

  /**
   * 创建一个带有模块名称和附加上下文的新日志记录器
   */
  public withContext(
    module: string,
    context?: Record<string, any>
  ): LoggerService {
    const newLogger = Object.create(this);
    newLogger.logger = this.logger;
    newLogger.module = module;
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  /**
   * 完成日志记录并关闭所有传输通道
   */
  public finish() {
    this.logger.end();
  }

  /**
   * 处理并输出带来源信息的日志消息
   */
  private processLog(
    source: LogSourceWithContext,
    level: LogLevel,
    message: string,
    meta: any[]
  ): void {
    // 确保 meta 是一个数组
    if (!meta || !Array.isArray(meta)) {
      meta = [];
    }

    if (isDev) {
      // 环境变量过滤
      if (
        this.envLevel !== LEVEL.NONE &&
        LEVEL_MAP[level] < LEVEL_MAP[this.envLevel]
      ) {
        return;
      }
      if (
        this.module &&
        this.envShowModules.length > 0 &&
        !this.envShowModules.includes(this.module)
      ) {
        return;
      }

      const datetimeColored = colorText(
        new Date().toLocaleString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
          hour12: false,
        }),
        "CYAN"
      );

      let moduleString = "";
      if (source.process === "main") {
        moduleString = this.module
          ? ` [${colorText(this.module, "UNDERLINE")}] `
          : " ";
      } else {
        moduleString = ` [${colorText(source.window || "", "UNDERLINE")}::${colorText(source.module || "", "UNDERLINE")}] `;
      }

      switch (level) {
        case LEVEL.ERROR:
          console.error(
            `${datetimeColored} ${colorText(colorText("<ERROR>", "RED"), "BOLD")}${moduleString}${message}`,
            ...meta
          );
          break;
        case LEVEL.WARN:
          console.warn(
            `${datetimeColored} ${colorText(colorText("<WARN>", "YELLOW"), "BOLD")}${moduleString}${message}`,
            ...meta
          );
          break;
        case LEVEL.INFO:
          console.info(
            `${datetimeColored} ${colorText(colorText("<INFO>", "GREEN"), "BOLD")}${moduleString}${message}`,
            ...meta
          );
          break;
        case LEVEL.DEBUG:
          console.debug(
            `${datetimeColored} ${colorText(colorText("<DEBUG>", "BLUE"), "BOLD")}${moduleString}${message}`,
            ...meta
          );
          break;
        case LEVEL.VERBOSE:
          console.log(
            `${datetimeColored} ${colorText("<VERBOSE>", "BOLD")}${moduleString}${message}`,
            ...meta
          );
          break;
        case LEVEL.SILLY:
          console.log(
            `${datetimeColored} ${colorText("<SILLY>", "BOLD")}${moduleString}${message}`,
            ...meta
          );
          break;
      }
    }

    // 添加来源信息到元数据
    const sourceWithContext: LogSourceWithContext = source;
    if (source.process === "main") {
      sourceWithContext.module = this.module;
      if (Object.keys(this.context).length > 0) {
        sourceWithContext.context = this.context;
      }
    }
    meta.push(sourceWithContext);

    // 为错误和警告级别添加额外系统信息
    if (level === LEVEL.ERROR || level === LEVEL.WARN) {
      meta.push({
        sys: SYSTEM_INFO,
        appver: APP_VERSION,
      });
    }

    this.logger.log(level, message, ...meta);
  }

  /**
   * 处理来自主进程的日志消息
   */
  private processMainLog(level: LogLevel, message: string, data: any[]): void {
    this.processLog({ process: "main" }, level, message, data);
  }

  /**
   * 处理来自渲染进程的日志消息
   */
  private processRendererLog = (
    source: LogSourceWithContext,
    level: LogLevel,
    message: string,
    data: any[]
  ): void => {
    this.processLog(source, level, message, data);
  };

  // ==================== 日志级别方法 ====================

  public error(message: string, ...data: LogContextData): void {
    this.processMainLog(LEVEL.ERROR, message, data);
  }

  public warn(message: string, ...data: LogContextData): void {
    this.processMainLog(LEVEL.WARN, message, data);
  }

  public info(message: string, ...data: LogContextData): void {
    this.processMainLog(LEVEL.INFO, message, data);
  }

  public verbose(message: string, ...data: LogContextData): void {
    this.processMainLog(LEVEL.VERBOSE, message, data);
  }

  public debug(message: string, ...data: LogContextData): void {
    this.processMainLog(LEVEL.DEBUG, message, data);
  }

  public silly(message: string, ...data: LogContextData): void {
    this.processMainLog(LEVEL.SILLY, message, data);
  }

  // ==================== 配置方法 ====================

  public setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  public getLevel(): LogLevel {
    return this.logger.level as LogLevel;
  }

  public resetLevel(): void {
    this.setLevel(DEFAULT_LEVEL);
  }

  public getBaseLogger(): winston.Logger {
    return this.logger;
  }

  public getLogsDir(): string {
    return this.logsDir;
  }
}

/**
 * 单例实例（主进程使用）
 */
export const loggerService = LoggerService.getInstance();
