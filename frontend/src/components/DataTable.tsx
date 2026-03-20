'use client';

import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface Column<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    fetchData: (page: number, perPage: number, search: string) => Promise<{
        data: T[];
        meta: { current_page: number; per_page: number; total: number; last_page: number };
    }>;
    actions?: (item: T) => React.ReactNode;
    refreshKey?: number;
}

export default function DataTable<T extends { id: string }>({
    columns,
    fetchData,
    actions,
    refreshKey = 0,
}: DataTableProps<T>) {
    const { t } = useI18n();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0, last_page: 1 });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchData(page, perPage, search);
            setData(result.data || []);
            setMeta(result.meta);
        } catch (err) {
            console.error('Failed to load data:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [page, perPage, search, fetchData, refreshKey]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    return (
        <div className="data-table-container">
            <div className="data-table-toolbar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="table-info">
                    <span className="table-total">{meta.total} {t.results}</span>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                            {actions && <th>{t.actions}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="table-loading">
                                    <div className="loading-spinner" />
                                    <span>{t.loading}</span>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="table-empty">
                                    {t.no_data}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id}>
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            {col.render
                                                ? col.render(item)
                                                : String((item as Record<string, unknown>)[col.key] ?? '')}
                                        </td>
                                    ))}
                                    {actions && <td className="actions-cell">{actions(item)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {meta.last_page > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="pagination-btn" title={t.first_page}>
                        <ChevronsLeft size={16} />
                    </button>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn" title={t.prev_page}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className="pagination-info">
                        {t.page} {meta.current_page} {t.of} {meta.last_page}
                    </span>
                    <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="pagination-btn" title={t.next_page}>
                        <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setPage(meta.last_page)} disabled={page === meta.last_page} className="pagination-btn" title={t.last_page}>
                        <ChevronsRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
