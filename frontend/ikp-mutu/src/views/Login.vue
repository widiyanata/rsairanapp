<template>
  <div class="login-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div class="card-minimal login-card shadow-sm border-0 p-4 p-md-5 bg-white" style="max-width: 400px; width: 100%;">
      <!-- Header -->
      <div class="text-center mb-5">
        <div class="logo-placeholder mx-auto mb-4 flex-center bg-dark text-white rounded-circle" style="width: 48px; height: 48px;">
           <i class="fas fa-plus"></i>
        </div>
        <h2 class="h5 fw-bold mb-1">RS Airan Raya</h2>
        <p class="text-muted small">Sistem Informasi Komite Mutu</p>
      </div>

      <!-- Role Selection -->
      <div class="form-group-minimal mb-4">
        <label for="role" class="label-minimal">Akses Sebagai</label>
        <select id="role" v-model="role" class="input-minimal">
          <option value="">-- Pilih Role --</option>
          <option value="mutu">Tim Mutu</option>
          <option value="karu">Kepala Ruangan</option>
          <option value="perawat">Tenaga Perawat</option>
          <option value="lainya">Karyawan Lainnya</option>
        </select>
      </div>

      <div v-if="role" class="animate-fade-in">
        <!-- Others Login -->
        <form v-if="role === 'lainya'" @submit.prevent="loginLainya" class="d-flex flex-column gap-3">
          <div class="form-group-minimal">
            <label class="label-minimal">Nama Lengkap</label>
            <input type="search" v-model="karyawan.username" @input="karyawan.username.length > 2 && cekKaryawan(karyawan.username)" class="input-minimal" placeholder="Cari nama..." required />
            
            <!-- Dynamic Search Dropdown -->
            <div v-if="karyawan.username.length > 2 && listKaryawan.length > 0" class="search-results-list border rounded-3 mt-1 bg-white shadow-sm overflow-hidden">
              <div v-for="user in listKaryawan" :key="user.id" @click="pilihKaryawan(user)" class="p-2 border-bottom hover-bg cursor-pointer small">
                {{ user.nama }} <span class="text-muted" style="font-size: 9px;">({{ user.nik }})</span>
              </div>
            </div>
          </div>

          <div v-if="isKaryawan" class="animate-fade-in d-flex flex-column gap-3">
            <div class="form-group-minimal">
              <label class="label-minimal">Email</label>
              <input type="email" v-model="karyawan.email" class="input-minimal" placeholder="email@domain.com" required />
            </div>
            <div class="form-group-minimal">
              <label class="label-minimal">Unit Kerja</label>
              <input type="text" v-model="karyawan.role" class="input-minimal" readonly />
            </div>
            <button type="submit" class="btn-minimal btn-minimal-primary w-100 justify-content-center">Masuk</button>
          </div>
        </form>
        
        <!-- Standard Login -->
        <form v-else @submit.prevent="role === 'perawat' ? loginPerawat() : loginMutu()" class="d-flex flex-column gap-3">
          <div class="form-group-minimal position-relative">
            <label class="label-minimal">Username</label>
            <input type="search" id="username" v-model="username" @input="role === 'perawat' && username.length > 2 ? cariUser() : ''" class="input-minimal" placeholder="Username" required />
            
            <div v-if="role === 'perawat' && user_perawat && username.length > 2" class="search-results-list border rounded-3 mt-1 bg-white shadow-sm overflow-hidden position-absolute w-100 z-3">
              <div v-for="user in user_perawat" :key="user.FMPPERAWAT_ID" @click="pilihUser(user)" class="p-2 border-bottom hover-bg cursor-pointer small">
                {{ user.FMPPERAWATN }}
              </div>
            </div>
          </div>

          <div class="form-group-minimal">
            <label class="label-minimal">Password</label>
            <input type="password" id="password" v-model="password" class="input-minimal" placeholder="••••••••" required />
          </div>

          <button type="submit" class="btn-minimal btn-minimal-primary w-100 justify-content-center mt-2">Masuk</button>
        </form>
      </div>
      
      <div v-if="error" class="text-danger small mt-4 text-center animate-fade-in">
        {{ error }}
      </div>

      <div class="text-center mt-5 text-muted" style="font-size: 10px;">
        &copy; 2024 IT RS Airan Raya
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref(null);
const role = ref('');
const user_perawat = ref([]);
const isKaryawan = ref(false);
const listKaryawan = ref([]);
const karyawan = ref({ id: '', username: '', email: '', role: '' });

const apiBaseUrl = 'http://10.30.0.12:8009';

const cariUser = async () => {
  try {
    const data = await fetch(`${apiBaseUrl}/cariUser?cari=${username.value}&role=${role.value}`);
    const res = await data.json();
    user_perawat.value = res.data;
  } catch (err) { console.error(err); }
};

const pilihUser = (user) => {
  username.value = user.FMPPERAWATN;
  sessionStorage.setItem('_temp_user', JSON.stringify(user));
  user_perawat.value = [];
};

const loginPerawat = () => {
  const temp = JSON.parse(sessionStorage.getItem('_temp_user'));
  if (temp && temp.FMPPERAWATN === username.value && temp.FMPPW === password.value) {
    const user = { username: temp.FMPPERAWATN, id: temp.FMPPERAWAT_ID, role: 'perawat' };
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.removeItem('_temp_user');
    router.push('/');
  } else { error.value = 'Data login tidak sesuai'; }
};

const loginMutu = async () => {
  try {
    const res = await fetch(`${apiBaseUrl}/loginMutu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    const data = await res.json();
    if (data.status.success) {
      sessionStorage.setItem('user', JSON.stringify(data.data[0]));
      router.push('/');
    } else { error.value = 'Username/Password salah'; }
  } catch (err) { error.value = 'Koneksi gagal'; }
};

const cekKaryawan = async (nama) => {
  try {
    const res = await fetch(`${apiBaseUrl}/cekKaryawan?q=${nama}`);
    const data = await res.json();
    listKaryawan.value = data.data || [];
  } catch (err) { console.error(err); }
};

const pilihKaryawan = (data) => {
  karyawan.value = { id: data.nik, username: data.nama, role: data.unit, email: '' };
  isKaryawan.value = true;
  listKaryawan.value = [];
};

const loginLainya = () => {
  if (karyawan.value.username && karyawan.value.email) {
    sessionStorage.setItem('user', JSON.stringify({ ...karyawan.value }));
    router.push('/');
  } else { error.value = 'Lengkapi data login'; }
};
</script>

<style scoped>
.hover-bg:hover { background: var(--surface); }
.cursor-pointer { cursor: pointer; }
.z-3 { z-index: 1030; }
</style>
