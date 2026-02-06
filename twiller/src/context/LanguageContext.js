import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "./translations";

const LanguageContext = createContext();

export const languages = [
  { code: "en", name: "English", flag: "🇺🇸", requiresEmailOtp: false },
  { code: "es", name: "Spanish", flag: "🇪🇸", requiresEmailOtp: false },
  { code: "hi", name: "Hindi", flag: "🇮🇳", requiresEmailOtp: false },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", requiresEmailOtp: false },
  { code: "zh", name: "Chinese", flag: "🇨🇳", requiresEmailOtp: false },
  { code: "fr", name: "French", flag: "🇫🇷", requiresEmailOtp: true }, // French requires email OTP
];

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", currentLanguage);
  }, [currentLanguage]);

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations["en"]?.[key] || key;
  };

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
  };

  const getLanguageInfo = (langCode) => {
    return languages.find(lang => lang.code === langCode);
  };

  const requiresOtpVerification = (targetLang) => {
    const langInfo = getLanguageInfo(targetLang);
    // French requires email OTP, others require mobile OTP
    return {
      required: true,
      type: langInfo?.requiresEmailOtp ? "email" : "phone"
    };
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        languages,
        getLanguageInfo,
        requiresOtpVerification,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
