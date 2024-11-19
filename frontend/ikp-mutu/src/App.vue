<script setup>
import { onMounted } from 'vue';
import router from './router';

import { RouterView } from 'vue-router';

// import Breadcrumb from './components/Breadcrumb.vue';

const user = JSON.parse(sessionStorage.getItem('user'));

function logout() {
  sessionStorage.removeItem('user');
  router.push('/login');
}

onMounted(() => {
  // router.push('/')
  user
})
</script>

<template>
  <div>
    <nav v-if="$route.path !== '/login'" class="navbar navbar-expand-lg navbar-light bg-white shadow mb-5">
      <div class="container">
        <a class="navbar-brand" href="#">RS Airan Raya</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavDropdown">
          <ul class="navbar-nav">
            <li v-for="route in router.options.routes" :key="route.path" class="nav-item">
              <router-link v-if="route.name !== 'Login'" active-class="active" class="nav-link" aria-current="page" :to="route.path">{{ route.name }}</router-link>
            </li>
          </ul>
          <!-- <ul class="navbar-nav">
            <li class="nav-item">
              <router-link active-class="active" class="nav-link" aria-current="page" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link active-class="active" class="nav-link" aria-current="page" to="/kronologi">Kronologi</router-link>
            </li>
            <li class="nav-item">
              <router-link active-class="active" class="nav-link" aria-current="page" to="/grading">Grading</router-link>
            </li>
            
          </ul> -->

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
      </div>
    </nav>

    <!-- <Breadcrumb v-if="$route.path !== '/login' && $route.path !== '/'"/> -->
    
    <RouterView />
  </div>
</template>

<style scoped>

</style>
