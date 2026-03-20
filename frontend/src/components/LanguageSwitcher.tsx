'use client';

import { useI18n } from '@/lib/i18n/context';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();

    const toggle = () => {
        setLocale(locale === 'fr' ? 'ar' : 'fr');
    };

    return (
        <button
            className="lang-switcher"
            onClick={toggle}
            title={locale === 'fr' ? 'العربية' : 'Français'}
        >
            <Languages size={18} />
            <span>{locale === 'fr' ? 'AR' : 'FR'}</span>
        </button>
    );
}
