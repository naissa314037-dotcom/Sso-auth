'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    onConfirm,
    onCancel,
    danger = true,
}: ConfirmDialogProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => confirmRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onCancel} style={{ position: 'absolute', top: '16px', insetInlineEnd: '16px' }}>
                    <X size={18} />
                </button>

                <div className="confirm-icon-wrapper">
                    <div className={`confirm-icon ${danger ? 'danger' : ''}`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>

                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>

                <div className="confirm-actions">
                    <button
                        ref={confirmRef}
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        style={{ width: 'auto', flex: 1 }}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        style={{ width: 'auto', flex: 1 }}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
