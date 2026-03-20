export interface User {
    id: string;
    name: string;
    username: string;
    phone: string;
    is_super_admin: boolean;
    roles: Role[];
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string;
    name: string;
    guard_name: string;
    description: string;
    permissions: Permission[];
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: string;
    name: string;
    guard_name: string;
    group_name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface AuthUser {
    id: string;
    name: string;
    username: string;
    phone: string;
    is_super_admin: boolean;
    roles: string[];
    permissions: string[];
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface ApiError {
    error: string;
    required?: string;
}
