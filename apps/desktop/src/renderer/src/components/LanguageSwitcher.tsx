import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';

/**
 * 语言切换组件
 * 可以放在设置页面或标题栏中
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        className="px-2 py-1 text-sm border border-gray-300 rounded hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * 简单的语言切换按钮组件
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();

  const handleToggle = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={handleToggle}
      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
      title="切换语言 / Switch Language"
    >
      {i18n.language === 'zh-CN' ? 'EN' : '中'}
    </button>
  );
}

