<script setup>
import { onMounted, provide } from 'vue';
import router from './router';

import { RouterView } from 'vue-router';

// import Breadcrumb from './components/Breadcrumb.vue';

// Cek device
import { useDevice } from './useDevice';
const { isMobile } = useDevice();

provide('isMobile', isMobile);
// ----------

const user = JSON.parse(sessionStorage.getItem('user'));

function logout() {
  sessionStorage.removeItem('user');
  router.push('/login');
}

onMounted(() => {
  // router.push('/')
  user
  if (!user) {
    router.push('/login');
  }

  console.log(user);
})
</script>

<template>
  <div>
    <nav v-if="$route.path !== '/login'" class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-3">
      <div class="container-fluid">
        <a class="navbar-brand" :href="'/'">RS Airan Raya</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div v-if="$route.name !== 'Home'" class="collapse navbar-collapse" id="navbarNavDropdown">
          <ul v-if="user.role == 'mutu'" class="navbar-nav">
            <!-- <li v-for="route in router.options.routes" :key="route.path" class="nav-item">
              <router-link v-if="route.name !== 'Login'" active-class="active" class="nav-link" aria-current="page" :to="route.path">{{ route.name }}</router-link>
            </li> -->
          </ul>
          <!-- logout button -->
          <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {{ user && user.username }}
              </a>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                <li><a class="dropdown-item" href="#" @click="logout">Logout</a></li>
              </ul>
            </li>
          </ul>
        </div>
        <button v-if="$route.name === 'Home'" type="button" class="btn btn-sm btn-light rounded-pill" @click="logout">Logout</button>
      </div>
    </nav>

    <!-- <Breadcrumb v-if="$route.path !== '/login' && $route.path !== '/'"/> -->
    
    <RouterView />

    <footer class="footer mt-auto py-3 bg-white text-center position-absolute bottom-0 d-none">
      <div class="container">
        <span class="text-muted">&copy; 2024 - IT RS Airan Raya</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>

</style>
