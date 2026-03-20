'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/context';
import { Shield } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login: authLogin, isAuthenticated, loading: authLoading } = useAuth();
    const { t } = useI18n();

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace('/');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authLogin(login, password);
            router.replace('/');
        } catch {
            setError(t.login_error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (isAuthenticated) return null;

    return (
        <div className="login-page">
            <div className="login-lang-switcher">
                <LanguageSwitcher />
            </div>
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <Shield size={28} />
                    </div>
                    <h1>{t.app_name}</h1>
                    <p>{t.login_title}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">{t.login_field}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t.login_placeholder}
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.password}</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder={t.password_placeholder}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t.logging_in : t.login_button}
                    </button>
                </form>
            </div>
        </div>
    );
}
