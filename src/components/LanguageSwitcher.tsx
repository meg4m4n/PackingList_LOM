import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      title={i18n.language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
    >
      <Languages className="h-5 w-5 mr-2" />
      {i18n.language === 'pt' ? 'EN' : 'PT'}
    </button>
  );
}