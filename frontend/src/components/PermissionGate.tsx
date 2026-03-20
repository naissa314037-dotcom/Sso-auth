'use client';

import { useAuth } from '@/lib/auth-context';
import React from 'react';

interface PermissionGateProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
