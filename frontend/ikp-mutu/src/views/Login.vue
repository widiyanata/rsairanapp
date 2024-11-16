<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div>
        <label>Username:</label>
        <input type="text" v-model="username" required />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
    <p v-if="error">{{ error }}</p>
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
