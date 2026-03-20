'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fr, { Translations } from './fr';
import ar from './ar';

type Locale = 'fr' | 'ar';

interface I18nContextType {
    locale: Locale;
    t: Translations;
    setLocale: (locale: Locale) => void;
    dir: 'ltr' | 'rtl';
}

const translations: Record<Locale, Translations> = { fr, ar };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('fr');

    useEffect(() => {
        const saved = localStorage.getItem('locale') as Locale;
        if (saved && translations[saved]) {
            setLocaleState(saved);
        }
    }, []);

    useEffect(() => {
        const dir = locale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', locale);
    }, [locale]);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('locale', newLocale);
    }, []);

    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <I18nContext.Provider value={{ locale, t: translations[locale], setLocale, dir }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
