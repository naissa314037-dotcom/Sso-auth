const fr = {
    // General
    app_name: 'SSO Auth',
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    create: 'Créer',
    update: 'Mettre à jour',
    delete: 'Supprimer',
    edit: 'Modifier',
    actions: 'Actions',
    search: 'Rechercher...',
    results: 'résultats',
    no_data: 'Aucune donnée disponible',
    confirm_delete: 'Êtes-vous sûr de vouloir supprimer',
    delete_failed: 'Échec de la suppression',
    error_occurred: 'Une erreur est survenue',
    saving: 'Enregistrement...',
    page: 'Page',
    of: 'de',
    first_page: 'Première page',
    last_page: 'Dernière page',
    prev_page: 'Page précédente',
    next_page: 'Page suivante',

    // Login
    login_title: 'Connexion au tableau de bord',
    login_field: "Nom d'utilisateur ou numéro de téléphone",
    login_placeholder: "Entrez votre nom d'utilisateur ou téléphone",
    password: 'Mot de passe',
    password_placeholder: 'Entrez votre mot de passe',
    login_button: 'Se connecter',
    logging_in: 'Connexion en cours...',
    login_error: "Nom d'utilisateur ou mot de passe incorrect",

    // Sidebar
    sidebar_dashboard: 'Tableau de bord',
    sidebar_users: 'Utilisateurs',
    sidebar_roles: 'Rôles',
    sidebar_permissions: 'Permissions',
    sidebar_logout: 'Déconnexion',
    sidebar_system: 'Système Principal',
    sidebar_modules: 'Modules & Services',

    // Dashboard
    dashboard_welcome: 'Bienvenue',
    dashboard_subtitle: 'Tableau de bord du système de gestion des autorisations',
    stat_users: 'Utilisateurs',
    stat_roles: 'Rôles',
    stat_permissions: 'Permissions',

    // Users
    users_title: 'Utilisateurs',
    users_subtitle: 'Gestion des comptes utilisateurs et attribution des rôles',
    users_add: 'Ajouter un utilisateur',
    users_edit: 'Modifier l\'utilisateur',
    users_create: 'Nouvel utilisateur',
    user_name: 'Nom complet',
    user_username: "Nom d'utilisateur",
    user_phone: 'Numéro de téléphone',
    user_password: 'Mot de passe',
    user_password_edit_hint: '(Laissez vide pour garder l\'ancien)',
    user_roles: 'Rôles',
    user_no_roles: 'Aucun rôle disponible',
    user_confirm_delete: 'Êtes-vous sûr de vouloir supprimer l\'utilisateur',

    // Roles
    roles_title: 'Rôles',
    roles_subtitle: 'Gestion des rôles et définition des permissions pour chaque rôle',
    roles_add: 'Ajouter un rôle',
    roles_edit: 'Modifier le rôle',
    roles_create: 'Nouveau rôle',
    role_name: 'Nom du rôle',
    role_description: 'Description',
    role_permissions: 'Permissions',
    role_confirm_delete: 'Êtes-vous sûr de vouloir supprimer le rôle',

    // Permissions
    permissions_title: 'Permissions',
    permissions_subtitle: 'Gestion des permissions du système et leur classification par groupes',
    permissions_add: 'Ajouter une permission',
    permissions_edit: 'Modifier la permission',
    permissions_create: 'Nouvelle permission',
    permission_name: 'Nom de la permission (ex: orders.create)',
    permission_group: 'Groupe (ex: orders)',
    permission_group_placeholder: 'Nom du groupe',
    permission_description: 'Description',
    permission_description_placeholder: 'Brève description de la permission',
    permission_confirm_delete: 'Êtes-vous sûr de vouloir supprimer la permission',
    permission_col_name: 'Nom de la permission',
    permission_col_group: 'Groupe',
    permission_col_description: 'Description',

    // Confirm dialog
    confirm_title: 'Confirmer la suppression',
    confirm_yes: 'Supprimer',
    confirm_no: 'Annuler',
};

export default fr;
export type Translations = typeof fr;
