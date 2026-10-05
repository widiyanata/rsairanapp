/**
 * RBAC Permission Configuration
 * Single source of truth for role-based access control
 */

export const ROLES = {
  PERAWAT: 'perawat',
  KARU: 'karu',
  KASIE: 'kasie',
  MUTU: 'mutu',
  LAINYA: 'lainya',
  ADMIN: 'admin',
};

export const MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: '/',
    icon: 'fas fa-th-large',
    roles: [ROLES.PERAWAT, ROLES.KARU, ROLES.KASIE, ROLES.MUTU, ROLES.LAINYA, ROLES.ADMIN],
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
    roles: [ROLES.KARU, ROLES.KASIE, ROLES.ADMIN],
  },
  {
    name: 'Investigasi',
    path: '/investigasi',
    icon: 'fas fa-search-plus',
    roles: [ROLES.MUTU, ROLES.ADMIN],
  },
  {
    name: 'User Management',
    path: '/users',
    icon: 'fas fa-users-cog',
    roles: [ROLES.ADMIN],
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
    title: 'Grading & Verifikasi Risiko',
    description: 'Penilaian matriks risiko unit (Karu) dan verifikasi oleh Kasie.',
    icon: 'fas fa-chart-line',
    path: '/grading',
    roles: [ROLES.KARU, ROLES.KASIE, ROLES.ADMIN],
  },
  {
    title: 'Laporan Investigasi',
    description: 'Investigasi komprehensif oleh Komite Mutu.',
    icon: 'fas fa-search-plus',
    path: '/investigasi',
    roles: [ROLES.MUTU, ROLES.ADMIN],
  },
  {
    title: 'User Management',
    description: 'Kelola data pengguna, role, dan nomor telepon WhatsApp.',
    icon: 'fas fa-users-cog',
    path: '/users',
    roles: [ROLES.ADMIN],
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
