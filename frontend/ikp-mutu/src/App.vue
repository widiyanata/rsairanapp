<script setup>
import { onMounted, provide, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();

// Cek device
import { useDevice } from './useDevice';
const { isMobile } = useDevice();
provide('isMobile', isMobile);

const isSidebarOpen = ref(!isMobile.value);
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const user = computed(() => {
  const userData = sessionStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
});

function logout() {
  sessionStorage.removeItem('user');
  router.push('/login');
}

onMounted(() => {
  if (!user.value && route.path !== '/login') {
    router.push('/login');
  }
});

const menuItems = [
  { name: 'Dashboard', path: '/', icon: 'fas fa-th-large' },
  { name: 'Kronologi', path: '/kronologi', icon: 'fas fa-history' },
  { name: 'Grading', path: '/grading', icon: 'fas fa-chart-line' },
  { name: 'Investigasi', path: '/investigasi', icon: 'fas fa-search-plus' },
];

const showLayout = computed(() => route.path !== '/login' && user.value);
</script>

<template>
  <div class="app-container" :class="{ 'sidebar-collapsed': !isSidebarOpen && !isMobile, 'mobile': isMobile }">
    <!-- Sidebar -->
    <aside v-if="showLayout" class="sidebar" :class="{ 'active': isSidebarOpen }">
      <div class="sidebar-header py-4 px-4 d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <div class="logo-circle"></div>
          <h5 class="mb-0 fw-bold ls-tight">IKP MUTU</h5>
        </div>
        <button v-if="isMobile" @click="toggleSidebar" class="btn-icon">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav px-3 flex-grow-1">
        <div class="nav-label mb-3 px-3">Menu Utama</div>
        <ul class="list-unstyled d-flex flex-column gap-1">
          <li v-for="item in menuItems" :key="item.path">
            <router-link :to="item.path" class="nav-link-minimal" active-class="active">
              <i :class="item.icon" class="nav-icon"></i>
              <span>{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer p-4 border-top">
        <div class="user-minimal d-flex align-items-center gap-3">
          <div class="avatar-minimal flex-center">
            {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
          </div>
          <div class="user-details overflow-hidden">
            <div class="fw-bold small text-truncate">{{ user?.username }}</div>
            <div class="text-muted" style="font-size: 10px;">{{ user?.role }}</div>
          </div>
          <button @click="logout" class="btn-icon ms-auto text-muted" title="Logout">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    <div v-if="isMobile && isSidebarOpen && showLayout" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Main Content -->
    <main class="main-wrapper" :class="{ 'no-sidebar': !showLayout }">
      <!-- Header -->
      <header v-if="showLayout" class="header-minimal border-bottom px-4 py-3 d-flex align-items-center justify-content-between bg-white">
        <div class="d-flex align-items-center gap-4">
          <button @click="toggleSidebar" class="btn-icon">
            <i :class="isSidebarOpen ? 'fas fa-arrow-left' : 'fas fa-bars'"></i>
          </button>
          <div class="breadcrumb-minimal d-none d-md-flex align-items-center gap-2 small">
            <span class="text-muted">RS Airan Raya</span>
            <span class="breadcrumb-sep">/</span>
            <span class="fw-medium">{{ route.name }}</span>
          </div>
        </div>

        <div class="header-right d-flex align-items-center gap-3">
          <div class="date-minimal d-none d-lg-block text-muted">
            {{ new Date().toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }}
          </div>
          <div class="v-divider"></div>
          <button class="btn-icon"><i class="far fa-bell"></i></button>
        </div>
      </header>

      <div class="content-body p-4 p-lg-5 animate-fade-in">
        <router-view v-slot="{ Component }">
          <transition name="fade-min" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  background: #fff;
}

.sidebar {
  width: 260px;
  height: 100vh;
  background: #fcfcfc;
  border-right: 1px solid var(--border);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed .sidebar { transform: translateX(-260px); }

.main-wrapper {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  transition: margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-collapsed .main-wrapper, .no-sidebar .main-wrapper { margin-left: 0; }

.logo-circle {
  width: 24px;
  height: 24px;
  background: var(--primary);
  border-radius: 50%;
}

.nav-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.nav-link-minimal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.nav-link-minimal i { width: 1.25rem; font-size: 1rem; }

.nav-link-minimal:hover {
  background: var(--surface);
  color: var(--text-main);
}

.nav-link-minimal.active {
  background: #000;
  color: #fff;
}

.avatar-minimal {
  width: 32px;
  height: 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.btn-icon {
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-main);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.btn-icon:hover { background: var(--surface); }

.breadcrumb-sep { color: var(--border); margin: 0 0.25rem; }

.v-divider {
  width: 1px;
  height: 1.5rem;
  background: var(--border);
}

.date-minimal { font-size: 0.75rem; font-weight: 500; }

.fade-min-enter-active, .fade-min-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-min-enter-from { opacity: 0; transform: translateY(5px); }
.fade-min-leave-to { opacity: 0; transform: translateY(-5px); }

@media (max-width: 991px) {
  .main-wrapper { margin-left: 0; }
  .sidebar { transform: translateX(-100%); }
  .sidebar.active { transform: translateX(0); }
  .sidebar-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 90;
  }
}
</style>
