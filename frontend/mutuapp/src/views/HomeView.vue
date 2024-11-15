<script setup>
import { RouterLink } from 'vue-router'
import HomePage from '@/components/HomePage.vue'
</script>

<template>
  <main class="home pt-5">
    <div class="row">
      <div class="col-12">
        <HomePage title="Komite Mutu" />
        <h4>RS Airan Raya</h4>
      </div>
      <div class="col-md-3">
        <!-- Hover added -->
        <div class="list-group">
          <RouterLink
            active-class="active"
            class="list-group-item list-group-item-action"
            to="/perawat"
            >Lembar Kronologi</RouterLink
          >
        </div>
      </div>
      <div class="col-md-9"></div>
    </div>
  </main>
</template>
