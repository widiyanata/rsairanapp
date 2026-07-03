/**
 * RBAC Permission Configuration
 * Single source of truth for role-based access control
 */

export const ROLES = {
  PERAWAT: 'perawat',
  KARU: 'karu',
  MUTU: 'mutu',
  LAINYA: 'lainya',
  ADMIN: 'admin',
};

export const MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: '/',
    icon: 'fas fa-th-large',
    roles: [ROLES.PERAWAT, ROLES.KARU, ROLES.MUTU, ROLES.LAINYA, ROLES.ADMIN],
  },
  {
    name: 'Kronologi',
    path: '/kronologi',
    icon: 'fas fa-history',
    roles: [ROLES.PERAWAT, ROLES.LAINYA, ROLES.ADMIN],
  },
  {
    name: 'Grading',
    path: '/grading',
    icon: 'fas fa-chart-line',
    roles: [ROLES.KARU, ROLES.ADMIN],
  },
  {
    name: 'Investigasi',
    path: '/investigasi',
    icon: 'fas fa-search-plus',
    roles: [ROLES.MUTU, ROLES.ADMIN],
  },
];

export const DASHBOARD_CARDS = [
  {
    title: 'Lembar Kronologi',
    description: 'Pencatatan insiden dan kejadian di unit pelayanan.',
    icon: 'fas fa-history',
    path: '/kronologi',
    roles: [ROLES.PERAWAT, ROLES.LAINYA, ROLES.ADMIN],
  },
  {
    title: 'Grading Karu',
    description: 'Penilaian matriks risiko oleh masing-masing unit.',
    icon: 'fas fa-chart-line',
    path: '/grading',
    roles: [ROLES.KARU, ROLES.ADMIN],
  },
  {
    title: 'Laporan Investigasi',
    description: 'Investigasi komprehensif oleh Komite Mutu.',
    icon: 'fas fa-search-plus',
    path: '/investigasi',
    roles: [ROLES.MUTU, ROLES.ADMIN],
  },
];

/**
 * Check if a role has access to a specific feature
 */
export function hasAccess(userRole, allowedRoles) {
  if (!userRole) return false;
  if (userRole === ROLES.ADMIN) return true;
  return allowedRoles.includes(userRole);
}
