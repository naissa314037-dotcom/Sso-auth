'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
    LayoutDashboard,
    Users,
    Shield,
    KeyRound,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    labelKey: 'sidebar_dashboard' | 'sidebar_users' | 'sidebar_roles' | 'sidebar_permissions';
    href: string;
    icon: React.ReactNode;
    permission?: string;
}

const systemItems: NavItem[] = [
    { labelKey: 'sidebar_dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
    { labelKey: 'sidebar_users', href: '/users', icon: <Users size={20} />, permission: 'users.view' },
    { labelKey: 'sidebar_roles', href: '/roles', icon: <Shield size={20} />, permission: 'roles.view' },
    { labelKey: 'sidebar_permissions', href: '/permissions', icon: <KeyRound size={20} />, permission: 'permissions.view' },
];

// Placeholder for future modules (Microservices)
const moduleItems: NavItem[] = [
    // { labelKey: 'sidebar_inventory', href: '/inventory', icon: <Archive size={20} />, permission: 'inventory.view' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout, hasPermission } = useAuth();
    const { t, dir } = useI18n();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);


    const CollapseIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

    return (
        <>
            <button
                className="sidebar-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle sidebar"
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Shield size={28} className="logo-icon" />
                        {!collapsed && <span className="logo-text">{t.app_name}</span>}
                    </div>
                    <button
                        className="sidebar-collapse-btn"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Collapse sidebar"
                    >
                        <CollapseIcon size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        {!collapsed && <span className="sidebar-section-title">{t.sidebar_system}</span>}
                        {systemItems.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? t[item.labelKey as keyof typeof t] : undefined}
                            >
                                <span className="sidebar-link-icon">{item.icon}</span>
                                {!collapsed && <span className="sidebar-link-label">{t[item.labelKey as keyof typeof t]}</span>}
                            </Link>
                        ))}
                    </div>

                    {moduleItems.length > 0 && (
                        <div className="sidebar-section">
                            {!collapsed && <span className="sidebar-section-title">{t.sidebar_modules}</span>}
                            {moduleItems.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                    title={collapsed ? t[item.labelKey as keyof typeof t] : undefined}
                                >
                                    <span className="sidebar-link-icon">{item.icon}</span>
                                    {!collapsed && <span className="sidebar-link-label">{t[item.labelKey as keyof typeof t]}</span>}
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    {!collapsed && (
                        <div style={{ padding: '4px 8px', marginBottom: '4px' }}>
                            <LanguageSwitcher />
                        </div>
                    )}
                    {!collapsed && user && (
                        <div className="sidebar-user">
                            <div className="sidebar-user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{user.name}</span>
                                <span className="sidebar-user-role">
                                    {user.is_super_admin ? 'Super Admin' : user.roles[0] || 'User'}
                                </span>
                            </div>
                        </div>
                    )}
                    <button className="sidebar-link logout-btn" onClick={logout} title={collapsed ? t.sidebar_logout : undefined}>
                        <span className="sidebar-link-icon"><LogOut size={20} /></span>
                        {!collapsed && <span className="sidebar-link-label">{t.sidebar_logout}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
