import { useState, useEffect, createContext, useContext } from 'react';

// 导入语言文件
import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';

const translations = {
  'en': en,
  'zh-TW': zhTW
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // 从 localStorage 获取保存的语言，默认为中文
    return localStorage.getItem('language') || 'zh-TW';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
