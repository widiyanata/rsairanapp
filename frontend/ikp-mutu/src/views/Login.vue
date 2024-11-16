<template>
<div class="container mt-5">
  <div class="row justify-content-center">
    <div class="col-md-6">
      <h2 class="text-center mb-4">Login</h2>
      <form @submit.prevent="login">
        <div class="mb-3">
          <label for="username" class="form-label">Username:</label>
          <input type="text" id="username" v-model="username" class="form-control" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Password:</label>
          <input type="password" id="password" v-model="password" class="form-control" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
      </form>
      <p v-if="error" class="text-danger mt-3">{{ error }}</p>
    </div>
  </div>
</div>

</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref(null);

// Contoh data JSON untuk login
const users = [
  { id: 1, username: 'admin', password: '12345', role: 'admin' },
  { id: 2, username: 'user', password: '54321', role: 'user' },
  // Tambahkan data login lainnya
  { id: 3, username: 'karu', password: '54321', role: 'karu' },
  { id: 4, username: 'mutu', password: '54321', role: 'mutu' },
];

function login() {
  const user = users.find(u => u.username === username.value && u.password === password.value);
  if (user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    router.push('/');
  } else {
    error.value = 'Username atau password salah';
  }
}
</script>
