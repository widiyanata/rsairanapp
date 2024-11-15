<script setup>
import { RouterView } from 'vue-router'
// import HomePage from './components/HomePage.vue'
import Header from './components/HeaderNav.vue'
import Login from './views/LoginView.vue'

const isAuthenticated = sessionStorage.getItem('isAuthenticated')
</script>

<template>
  <div v-if="!isAuthenticated">
    <Login />
  </div>
  <div v-else>
    <Header />
    <div class="container">
      <RouterView />
    </div>
  </div>
</template>

<style scoped></style>
