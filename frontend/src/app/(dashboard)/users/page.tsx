'use client';

import { useState, useCallback, FormEvent, useEffect } from 'react';
import api from '@/lib/api';
import { User, Role } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import DataTable from '@/components/DataTable';
import PermissionGate from '@/components/PermissionGate';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function UsersPage() {
    const { t } = useI18n();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/api/roles?per_page=100').then(res => {
            setAllRoles(res.data.data || []);
        }).catch(() => { });
    }, []);

    const fetchUsers = useCallback(async (page: number, perPage: number, search: string) => {
        const res = await api.get('/api/users', { params: { page, per_page: perPage, search } });
        return res.data;
    }, []);

    const openCreate = () => {
        setEditingUser(null); setName(''); setUsername(''); setPhone(''); setPassword('');
        setSelectedRoleIds([]); setFormError(''); setShowModal(true);
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setName(user.name); setUsername(user.username); setPhone(user.phone); setPassword('');
        setSelectedRoleIds(user.roles?.map(r => r.id) || []);
        setFormError(''); setShowModal(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setFormError(''); setSaving(true);
        try {
            if (editingUser) {
                await api.put(`/api/users/${editingUser.id}`, {
                    name, username, phone, ...(password ? { password } : {}), role_ids: selectedRoleIds,
                });
            } else {
                await api.post('/api/users', { name, username, phone, password, role_ids: selectedRoleIds });
            }
            setShowModal(false); setRefreshKey(k => k + 1);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setFormError(error.response?.data?.error || t.error_occurred);
        } finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/users/${deleteTarget.id}`);
            setRefreshKey(k => k + 1);
        } catch { /* ignore */ }
        setDeleteTarget(null);
    };

    const toggleRole = (roleId: string) => {
        setSelectedRoleIds(ids => ids.includes(roleId) ? ids.filter(id => id !== roleId) : [...ids, roleId]);
    };

    const columns = [
        { key: 'name', label: t.user_name },
        { key: 'username', label: t.user_username },
        { key: 'phone', label: t.user_phone },
        {
            key: 'roles', label: t.user_roles,
            render: (user: User) => (
                <div className="badges-list">
                    {user.is_super_admin && <span className="badge badge-warning">Super Admin</span>}
                    {user.roles?.map(r => (<span key={r.id} className="badge badge-accent">{r.name}</span>))}
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t.users_title}</h1>
                    <p className="page-subtitle">{t.users_subtitle}</p>
                </div>
                <PermissionGate permission="users.create">
                    <button className="btn btn-primary" onClick={openCreate} style={{ width: 'auto' }}>
                        <Plus size={18} /> {t.users_add}
                    </button>
                </PermissionGate>
            </div>

            <DataTable columns={columns} fetchData={fetchUsers} refreshKey={refreshKey}
                actions={(user: User) => (
                    <>
                        <PermissionGate permission="users.edit">
                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(user)} title={t.edit}><Pencil size={14} /></button>
                        </PermissionGate>
                        <PermissionGate permission="users.delete">
                            {!user.is_super_admin && (
                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(user)} title={t.delete}><Trash2 size={14} /></button>
                            )}
                        </PermissionGate>
                    </>
                )}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title={t.confirm_title}
                message={`${t.user_confirm_delete} "${deleteTarget?.name}" ?`}
                confirmLabel={t.confirm_yes}
                cancelLabel={t.confirm_no}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingUser ? t.users_edit : t.users_create}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && <div className="login-error">{formError}</div>}
                                <div className="form-group">
                                    <label className="form-label">{t.user_name}</label>
                                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.user_username}</label>
                                    <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.user_phone}</label>
                                    <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        {t.user_password} {editingUser && t.user_password_edit_hint}
                                    </label>
                                    <input type="password" className="form-input" value={password}
                                        onChange={e => setPassword(e.target.value)} {...(!editingUser ? { required: true } : {})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.user_roles}</label>
                                    <div className="permission-picker">
                                        {allRoles.map(role => (
                                            <div key={role.id} className="permission-item" onClick={() => toggleRole(role.id)}>
                                                <input type="checkbox" className="permission-checkbox" checked={selectedRoleIds.includes(role.id)} readOnly />
                                                <div className="permission-info">
                                                    <div className="permission-name">{role.name}</div>
                                                    <div className="permission-desc">{role.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {allRoles.length === 0 && (
                                            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>{t.user_no_roles}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto' }}>
                                    {saving ? t.saving : editingUser ? t.update : t.create}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
