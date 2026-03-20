'use client';

import { useState, useCallback, FormEvent } from 'react';
import api from '@/lib/api';
import { Permission } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import DataTable from '@/components/DataTable';
import PermissionGate from '@/components/PermissionGate';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function PermissionsPage() {
    const { t } = useI18n();
    const [showModal, setShowModal] = useState(false);
    const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

    const [name, setName] = useState('');
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchPermissions = useCallback(async (page: number, perPage: number, search: string) => {
        const res = await api.get('/api/permissions', { params: { page, per_page: perPage, search } });
        return res.data;
    }, []);

    const openCreate = () => {
        setEditingPerm(null); setName(''); setGroupName(''); setDescription('');
        setFormError(''); setShowModal(true);
    };

    const openEdit = (perm: Permission) => {
        setEditingPerm(perm); setName(perm.name); setGroupName(perm.group_name);
        setDescription(perm.description); setFormError(''); setShowModal(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setFormError(''); setSaving(true);
        try {
            if (editingPerm) {
                await api.put(`/api/permissions/${editingPerm.id}`, { name, group_name: groupName, description });
            } else {
                await api.post('/api/permissions', { name, group_name: groupName, description });
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
            await api.delete(`/api/permissions/${deleteTarget.id}`);
            setRefreshKey(k => k + 1);
        } catch { /* ignore */ }
        setDeleteTarget(null);
    };

    const columns = [
        { key: 'name', label: t.permission_col_name },
        {
            key: 'group_name', label: t.permission_col_group,
            render: (perm: Permission) => (<span className="badge badge-accent">{perm.group_name}</span>),
        },
        { key: 'description', label: t.permission_col_description },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t.permissions_title}</h1>
                    <p className="page-subtitle">{t.permissions_subtitle}</p>
                </div>
                <PermissionGate permission="permissions.create">
                    <button className="btn btn-primary" onClick={openCreate} style={{ width: 'auto' }}>
                        <Plus size={18} /> {t.permissions_add}
                    </button>
                </PermissionGate>
            </div>

            <DataTable columns={columns} fetchData={fetchPermissions} refreshKey={refreshKey}
                actions={(perm: Permission) => (
                    <>
                        <PermissionGate permission="permissions.edit">
                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(perm)} title={t.edit}><Pencil size={14} /></button>
                        </PermissionGate>
                        <PermissionGate permission="permissions.delete">
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(perm)} title={t.delete}><Trash2 size={14} /></button>
                        </PermissionGate>
                    </>
                )}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title={t.confirm_title}
                message={`${t.permission_confirm_delete} "${deleteTarget?.name}" ?`}
                confirmLabel={t.confirm_yes}
                cancelLabel={t.confirm_no}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingPerm ? t.permissions_edit : t.permissions_create}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && <div className="login-error">{formError}</div>}
                                <div className="form-group">
                                    <label className="form-label">{t.permission_name}</label>
                                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="resource.action" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.permission_group}</label>
                                    <input className="form-input" value={groupName} onChange={e => setGroupName(e.target.value)} required placeholder={t.permission_group_placeholder} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.permission_description}</label>
                                    <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder={t.permission_description_placeholder} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto' }}>
                                    {saving ? t.saving : editingPerm ? t.update : t.create}
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
