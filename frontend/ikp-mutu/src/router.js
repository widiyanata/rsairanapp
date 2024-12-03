import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Login from './views/Login.vue';

const routes = [
  { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: Login },
  { path: '/kronologi', name: 'Kronologi', component: () => import('./views/FormKronologi.vue'), meta: { requiresAuth: true } },
  { path: '/grading', name: 'Grading', component: () => import('./views/FormGrading.vue'), meta: { requiresAuth: true } },
  { path: '/investigasi', name: 'Investigasi', component: () => import('./views/FormInvestigasi.vue'), meta: { requiresAuth: true } },

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Middleware untuk proteksi rute
router.beforeEach((to, from, next) => {
  const isAuthenticated = sessionStorage.getItem('user');
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
