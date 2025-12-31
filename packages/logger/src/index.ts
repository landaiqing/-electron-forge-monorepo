// 导出所有公共类型和常量
export type {
  LogLevel,
  LogContextData,
  LogSourceWithContext,
} from "./types";
export { LEVEL, LEVEL_MAP } from "./types";

// 主进程和渲染进程需要从对应路径导入：
// import { loggerService } from '@craft-studio/logger/main';
// import { loggerService } from '@craft-studio/logger/renderer';

