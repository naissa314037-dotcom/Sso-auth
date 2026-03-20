'use client';

import { useState, useCallback, FormEvent, useEffect } from 'react';
import api from '@/lib/api';
import { Role, Permission } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import DataTable from '@/components/DataTable';
import PermissionGate from '@/components/PermissionGate';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function RolesPage() {
    const { t } = useI18n();
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/api/permissions/all').then(res => {
            setGroupedPermissions(res.data.grouped || {});
        }).catch(() => { });
    }, []);

    const fetchRoles = useCallback(async (page: number, perPage: number, search: string) => {
        const res = await api.get('/api/roles', { params: { page, per_page: perPage, search } });
        return res.data;
    }, []);

    const openCreate = () => {
        setEditingRole(null); setName(''); setDescription('');
        setSelectedPermIds([]); setFormError(''); setShowModal(true);
    };

    const openEdit = (role: Role) => {
        setEditingRole(role); setName(role.name); setDescription(role.description);
        setSelectedPermIds(role.permissions?.map(p => p.id) || []);
        setFormError(''); setShowModal(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setFormError(''); setSaving(true);
        try {
            if (editingRole) {
                await api.put(`/api/roles/${editingRole.id}`, { name, description, permission_ids: selectedPermIds });
            } else {
                await api.post('/api/roles', { name, description, permission_ids: selectedPermIds });
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
            await api.delete(`/api/roles/${deleteTarget.id}`);
            setRefreshKey(k => k + 1);
        } catch { /* ignore */ }
        setDeleteTarget(null);
    };

    const togglePermission = (permId: string) => {
        setSelectedPermIds(ids => ids.includes(permId) ? ids.filter(id => id !== permId) : [...ids, permId]);
    };

    const toggleGroup = (groupPerms: Permission[]) => {
        const groupIds = groupPerms.map(p => p.id);
        const allSelected = groupIds.every(id => selectedPermIds.includes(id));
        if (allSelected) {
            setSelectedPermIds(ids => ids.filter(id => !groupIds.includes(id)));
        } else {
            setSelectedPermIds(ids => [...new Set([...ids, ...groupIds])]);
        }
    };

    const columns = [
        { key: 'name', label: t.role_name },
        { key: 'description', label: t.role_description },
        {
            key: 'permissions', label: t.role_permissions,
            render: (role: Role) => (
                <div className="badges-list">
                    {(role.permissions || []).slice(0, 4).map(p => (<span key={p.id} className="badge badge-accent">{p.name}</span>))}
                    {(role.permissions?.length || 0) > 4 && (<span className="badge badge-success">+{(role.permissions?.length || 0) - 4}</span>)}
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t.roles_title}</h1>
                    <p className="page-subtitle">{t.roles_subtitle}</p>
                </div>
                <PermissionGate permission="roles.create">
                    <button className="btn btn-primary" onClick={openCreate} style={{ width: 'auto' }}>
                        <Plus size={18} /> {t.roles_add}
                    </button>
                </PermissionGate>
            </div>

            <DataTable columns={columns} fetchData={fetchRoles} refreshKey={refreshKey}
                actions={(role: Role) => (
                    <>
                        <PermissionGate permission="roles.edit">
                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(role)} title={t.edit}><Pencil size={14} /></button>
                        </PermissionGate>
                        <PermissionGate permission="roles.delete">
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(role)} title={t.delete}><Trash2 size={14} /></button>
                        </PermissionGate>
                    </>
                )}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title={t.confirm_title}
                message={`${t.role_confirm_delete} "${deleteTarget?.name}" ?`}
                confirmLabel={t.confirm_yes}
                cancelLabel={t.confirm_no}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingRole ? t.roles_edit : t.roles_create}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && <div className="login-error">{formError}</div>}
                                <div className="form-group">
                                    <label className="form-label">{t.role_name}</label>
                                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.role_description}</label>
                                    <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.role_permissions}</label>
                                    <div className="permission-picker">
                                        {Object.entries(groupedPermissions).map(([group, perms]) => (
                                            <div key={group} className="permission-group">
                                                <div className="permission-group-header" onClick={() => toggleGroup(perms)}>
                                                    <span>{group}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {perms.filter(p => selectedPermIds.includes(p.id)).length}/{perms.length}
                                                    </span>
                                                </div>
                                                {perms.map(perm => (
                                                    <div key={perm.id} className="permission-item" onClick={() => togglePermission(perm.id)}>
                                                        <input type="checkbox" className="permission-checkbox" checked={selectedPermIds.includes(perm.id)} readOnly />
                                                        <div className="permission-info">
                                                            <div className="permission-name">{perm.name}</div>
                                                            <div className="permission-desc">{perm.description}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto' }}>
                                    {saving ? t.saving : editingRole ? t.update : t.create}
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
