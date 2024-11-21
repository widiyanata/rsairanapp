<template>
<div class="container mt-5">
  <div class="row justify-content-center">
    <div class="col-md-6">
      <h2 class="text-center mb-4">Login</h2>
      <!-- Login sebagai -->
      <div class="mb-3">
        <label for="role" class="form-label">Login sebagai:</label>
        <select id="role" v-model="role" class="form-select">
          <option value="">-- Pilih Role --</option>
          <option value="mutu">mutu</option>
          <option value="karu">karu</option>
          <option value="perawat">Perawat</option>
          <option value="lainya">Lainya</option>
        </select>
      </div>
      <form @submit.prevent="role === 'perawat' ? loginPerawat() : login()">
        <div class="mb-3">
          <label for="username" class="form-label">Username:</label>
          <input type="search" id="username" v-model="username" @input="role === 'perawat' && username.length > 2 ? cariUser() : ''" class="form-control" required />
          <div v-if="role === 'perawat' && user_perawat" class="dropdown">
            <div class="dropdown-menu" :class="{ show: username.length > 2  }">
              <a class="dropdown-item" href="#" v-for="user in user_perawat " :key="user.FMPPERAWAT_ID" @click="pilihUser(user)">{{ user.FMPPERAWATN }}</a>
            </div>
          </div>
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
import { onMounted, ref } from 'vue';
import router from '../router';

// const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref(null);

// Contoh data JSON untuk login
const users = [
{ id: 1, username: 'admin', password: '12345', role: 'admin' },
{ id: 2, username: 'mutu', password: '12345', role: 'mutu' },
];

onMounted(() => {
  console.log('users: ', users.value); // Menampilkan data users
})


const role = ref('');
const user_perawat = ref('');
// jika role perawat, maka ketika ketik username, cari username dari table perawat
const cariUser = async () => {
  try {
    const data = await fetch(`http://10.30.0.6:8009/cariUser?cari=${username.value}&role=${role.value}`);
    const userData = await data.json();
    console.log('data user dari DB: ',userData);
    user_perawat.value = userData.data
    console.log('user perawat: ', user_perawat.value);
  } catch (error) {
    console.error('Error fetching patients:', error);
  }
}

const pilihUser = (user) => {
  console.log('pilih user: ', user);
  username.value = user.FMPPERAWATN
  // username.id = user.FMPPERAWAT_ID

  users.value = user
  console.log('users pilih user: ', users.value);

  user_perawat.value = ''
  
}

function loginPerawat() {
  console.log('login perawat');
  console.log(users.value);

  const user = {
    username: users.value.FMPPERAWATN,
    // password: users.value.FMPPW,
    id: users.value.FMPPERAWAT_ID,
    role: 'perawat'
  }

  if (users.value.FMPPERAWATN === username.value && users.value.FMPPW === password.value) {
    sessionStorage.setItem('user', JSON.stringify(user));
    router.push('/');
  } else {
    error.value = 'Username perawat atau password salah';
  }
  
}


function login() {
  console.log('login');
  console.log(users.value);
  const user = users.find(u => u.username === username.value && u.password === password.value);
  if (user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    router.push('/');
  } else {
    error.value = 'Username atau password salah';
  }
}
</script>
