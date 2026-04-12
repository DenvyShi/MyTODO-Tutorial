import { useLanguage } from '../i18n.jsx';
import { useTheme } from '../theme.jsx';
import { Sun, Moon, Globe } from 'lucide-react';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 hover:bg-slate-700 rounded-lg transition"
        title={theme === 'dark' ? t('menu.light') : t('menu.dark')}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
      
      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')}
        className="p-2 hover:bg-slate-700 rounded-lg transition flex items-center gap-1"
        title={t('menu.language')}
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs">{language === 'zh-TW' ? '中' : 'EN'}</span>
      </button>
    </div>
  );
}
