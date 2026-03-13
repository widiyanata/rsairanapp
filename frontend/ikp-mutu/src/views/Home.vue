<script setup>
import { computed } from 'vue';

const user = computed(() => {
  const userData = sessionStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
});

const cards = [
  {
    title: 'Lembar Kronologi',
    description: 'Pencatatan insiden dan kejadian di unit pelayanan.',
    icon: 'fas fa-history',
    path: '/kronologi',
    roles: ['perawat', 'admin']
  },
  {
    title: 'Grading Karu',
    description: 'Penilaian matriks risiko oleh masing-masing unit.',
    icon: 'fas fa-chart-line',
    path: '/grading',
    roles: ['karu', 'admin']
  },
  {
    title: 'Laporan Investigasi',
    description: 'Investigasi komprehensif oleh Komite Mutu.',
    icon: 'fas fa-search-plus',
    path: '/investigasi',
    roles: ['mutu', 'admin']
  }
];

const visibleCards = computed(() => {
  if (!user.value) return [];
  const currentUser = user.value;
  if (currentUser.role === 'admin') return cards;
  
  return cards.filter(card => {
    const role = currentUser.role;
    if (card.path === '/kronologi') return role !== 'mutu' && role !== 'karu';
    if (card.path === '/grading') return role === 'karu';
    if (card.path === '/investigasi') return role === 'mutu';
    return false;
  });
});
</script>

<template>
  <div class="home-container py-4">
    <div class="welcome-section mb-5 animate-fade-in">
      <div class="d-flex align-items-center gap-3 mb-2">
        <div class="v-bar"></div>
        <h1 class="h3 fw-bold mb-0">Selamat Datang, {{ user?.username }}</h1>
      </div>
      <p class="text-muted small ms-4">Dashboard Komite Mutu & Keselamatan Pasien RS Airan Raya</p>
    </div>

    <div class="row g-4 animate-fade-in" style="animation-delay: 0.1s;">
      <div v-for="(card, index) in visibleCards" :key="index" class="col-12 col-md-4">
        <router-link :to="card.path" class="text-decoration-none">
          <div class="card-minimal h-100 d-flex flex-column gap-3 p-4">
            <div class="icon-box-minimal flex-center mb-1">
              <i :class="card.icon"></i>
            </div>
            <div>
              <h3 class="h5 mb-2">{{ card.title }}</h3>
              <p class="text-muted small mb-0">{{ card.description }}</p>
            </div>
            <div class="mt-auto pt-3 d-flex align-items-center gap-2 text-primary small fw-bold">
              Buka Modul
              <i class="fas fa-arrow-right" style="font-size: 10px;"></i>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Minimal Stats -->
    <div class="mt-5 pt-5 animate-fade-in" style="animation-delay: 0.3s;">
      <h6 class="label-minimal mb-4">Statistik Terkini</h6>
      <div class="row g-4">
        <div class="col-6 col-md-3">
          <div class="p-4 border-start border-3 border-dark bg-light bg-opacity-50">
            <div class="h2 fw-bold mb-1">24</div>
            <div class="text-muted small text-uppercase ls-1">Kronologi</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="p-4 border-start border-3 border-dark bg-light bg-opacity-50">
            <div class="h2 fw-bold mb-1">12</div>
            <div class="text-muted small text-uppercase ls-1">Grading</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="p-4 border-start border-3 border-dark bg-light bg-opacity-50">
            <div class="h2 fw-bold mb-1">05</div>
            <div class="text-muted small text-uppercase ls-1">Investigasi</div>
          </div>
        </div>
        <div class="col-12 col-md-3 d-flex align-items-end">
          <div class="ms-md-auto text-muted small pb-2">
            <i class="fas fa-circle text-success me-2" style="font-size: 8px;"></i>
            Sistem Stabil
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-bar {
  width: 4px;
  height: 1.5rem;
  background: var(--primary);
  border-radius: 2px;
}

.icon-box-minimal {
  width: 40px;
  height: 40px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  color: var(--primary);
  font-size: 1.1rem;
}

.ls-1 { letter-spacing: 1px; font-weight: 700; font-size: 9px; }

.card-minimal {
  background: #fff;
}
</style>