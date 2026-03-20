'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/context';
import api from '@/lib/api';
import { Users, Shield, KeyRound } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const { t } = useI18n();
    const [stats, setStats] = useState({ users: 0, roles: 0, permissions: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, rolesRes, permsRes] = await Promise.allSettled([
                    api.get('/api/users?per_page=1'),
                    api.get('/api/roles?per_page=1'),
                    api.get('/api/permissions?per_page=1'),
                ]);

                setStats({
                    users: usersRes.status === 'fulfilled' ? usersRes.value.data.meta?.total || 0 : 0,
                    roles: rolesRes.status === 'fulfilled' ? rolesRes.value.data.meta?.total || 0 : 0,
                    permissions: permsRes.status === 'fulfilled' ? permsRes.value.data.meta?.total || 0 : 0,
                });
            } catch {
                // stats are optional
            }
        };

        fetchStats();
    }, []);

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t.dashboard_welcome}, {user?.name} 👋</h1>
                    <p className="page-subtitle">{t.dashboard_subtitle}</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon users">
                        <Users size={22} />
                    </div>
                    <div className="stat-value">{stats.users}</div>
                    <div className="stat-label">{t.stat_users}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon roles">
                        <Shield size={22} />
                    </div>
                    <div className="stat-value">{stats.roles}</div>
                    <div className="stat-label">{t.stat_roles}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon permissions">
                        <KeyRound size={22} />
                    </div>
                    <div className="stat-value">{stats.permissions}</div>
                    <div className="stat-label">{t.stat_permissions}</div>
                </div>
            </div>
        </>
    );
}
