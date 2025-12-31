/**
 * i18n 国际化模块
 * 
 * 使用方法：
 * 1. 在组件中导入 useTranslation hook
 * 2. 使用 t 函数进行翻译
 * 
 * @example
 * ```tsx
 * import { useTranslation } from 'react-i18next';
 * 
 * function MyComponent() {
 *   const { t, i18n } = useTranslation();
 *   
 *   return (
 *     <div>
 *       <h1>{t('titleBar.close')}</h1>
 *       <button onClick={() => i18n.changeLanguage('en-US')}>
 *         切换语言
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

import i18n from './config';

export default i18n;

export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from './config';

export { useTranslation } from 'react-i18next';


