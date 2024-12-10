<template>
  <div class="form-signin">
    <div class="container">
      <div class="row align-items-center g-3 mb-2">
        <div class="col-3">
          <img class="w-100 rounded border border-success" src="../assets/logo-airan.png" alt="">
        </div>
        <div class="col-9">
          <div class="text-start">
            <h3 class="text-success h4">RS Airan Raya</h3>
            <h1 class="mb-0 h3 text-uppercase">Komite Mutu</h1>
          </div>
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-md-12">
          <!-- <h2 class="">Login</h2> -->
          <!-- Login sebagai -->
          <div class="form-floating mb-3 pb-3 border-bottom">
            <select id="role" v-model="role" class="form-select">
              <option value="">-- Pilih Role --</option>
              <option value="mutu">Mutu</option>
              <option value="karu">Karu</option>
              <option value="perawat">Perawat</option>
              <option value="lainya">Karyawan Lainya</option>
            </select>
            <label for="role" class="form-label">Login sebagai:</label>
          </div>
          <div v-if="role">
            <!-- Login lainnya -->
            <form v-if="role === 'lainya'" @submit.prevent="loginLainya">
              <div class="row">
                <div class="col-12">
                  <div class="form-floating mb-1">
                    <input type="search" v-model="karyawan.username" @input=" karyawan.username.length > 2 && cekKaryawan(karyawan.username)" class="form-control" id="nama" placeholder="Nama" required />
                    <label for="nama">Nama</label>
                  </div>

                  <div v-if="karyawan.username.length > 2 && listKaryawan.length > 0" class="dropdown">
                    <div class="dropdown-menu list-group p-0 border-0 w-100" :class="{ show: karyawan.username.length > 2  }">
                      <a class="list-group-item list-group-item-info" href="#" v-for="user in listKaryawan" :key="user.id" @click="pilihKaryawan(user)">
                        {{ user.nama }} <span class="badge bg-white text-secondary ms-1">{{ user.nik }}</span>
                      </a>
                    </div>
                  </div>
                  
                  <!-- <small v-if="isNik" class="text-danger"> ceknik </small> -->
                </div>
                <div v-if="isKaryawan" class="col-12">
                  <div class="form-floating mb-1">
                    <input type="text" v-model="karyawan.id" class="form-control" id="nik" placeholder="NIK" required readonly />
                    <label for="nik">NIK</label>
                  </div>
                </div>
              </div>
              <div v-if="isKaryawan" class="form-floating mb-1">
                <input type="text" v-model="karyawan.email" class="form-control" id="email" placeholder="Email" required />
                <label for="email">Email</label>
              </div>
              <div v-if="isKaryawan" class="form-floating mb-1">
                <input type="text" v-model="karyawan.role" class="form-control" id="unitKerja" placeholder="Unit Kerja/Jabatan" required />
                <label for="unitKerja">Unit Kerja/Jabatan</label>
              </div>
              <hr>
              <button type="submit" class="btn btn-lg btn-success w-100">Login</button>
            </form>
            
            <!-- Login perawat, mutu dan karu -->
            <form v-else @submit.prevent="role === 'perawat' ? loginPerawat() : login()">
              <div class="form-floating mb-1">
                <input type="search" id="username" v-model="username" @input="role === 'perawat' && username.length > 2 ? cariUser() : ''" class="form-control" placeholder="Username" required />
                <label for="username">Username</label>
                <div v-if="role === 'perawat' && user_perawat" class="dropdown">
                  <div class="dropdown-menu list-group p-0 border-0 w-100" :class="{ show: username.length > 2  }">
                    <a class="list-group-item list-group-item-info" href="#" v-for="user in user_perawat" :key="user.FMPPERAWAT_ID" @click="pilihUser(user)">
                      {{ user.FMPPERAWATN }}
                    </a>
                  </div>
                  <div v-if="user_perawat.length === 0">
                    <span class="text-danger badge">{{ username.length > 2 ? 'User perawat tidak ditemukan!' : '' }}</span>
                  </div>
                </div>
              </div>
              <div class="form-floating mb-1">
                <input type="password" id="password" v-model="password" class="form-control" placeholder="Password" required />
                <label for="password">Password</label>
              </div>
              <hr>
              <button type="submit" class="btn btn-lg btn-success w-100">Login</button>
            </form>
          </div>
          
          <p v-if="error" class="text-danger mt-3">{{ error }}</p>
        </div>
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
{ id: 3, username: 'karu', password: '12345', role: 'karu' },
];

const karyawan = ref({
  id: '',
  username: '',
  email: '',
  role: ''
})
const loginLainya = () => {
  console.log('login lainya');
  console.log(karyawan.value);
  if (karyawan.value.username && karyawan.value.email) {
    const user = { id: karyawan.value.id, username: karyawan.value.username, email: karyawan.value.email, role: karyawan.value.role };
    sessionStorage.setItem('user', JSON.stringify(user));
    router.push('/');
  } else {
    error.value = 'Nama, email dan role harus diisi';
  }
}

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

const isNik = ref(false)
const cekNik = async (nik) => {
  console.log('cek nik');
  console.log(nik);
  console.log('karyawan:',karyawan.value);

  // fetch data dari API
  try {
    const res = await fetch(`http://10.30.0.6:8009/cekNik?nik=${nik}`);
    const data = await res.json();
    console.log(data);
    if (data.data.length > 0) {
      karyawan.value.id = data.data[0].nik
      karyawan.value.username = data.data[0].nama
      karyawan.value.role = data.data[0].unit

      isNik.value = true
    } else {
      karyawan.value.username = ''
      karyawan.value.role = ''
      isNik.value = false
    }
  } catch (error) {
    console.error('Error fetching patients:', error);
  }
}
const isKaryawan = ref(false)
const listKaryawan = ref([])
const cekKaryawan = async (nama) => {
  console.log('cek nama karyawan');

  // fetch data dari API
  try {
    const res = await fetch(`http://10.30.0.6:8009/cekKaryawan?q=${nama}`);
    const data = await res.json();
    console.log(data);
    if (data.data.length > 0) {
      listKaryawan.value = data.data
    }
  } catch (error) {
    console.error('Error fetching patients:', error);
  }
}
const pilihKaryawan = (data) => {
  console.log('pilih karyawan: ', data);
  karyawan.value.id = data.nik
  karyawan.value.username = data.nama
  karyawan.value.role = data.unit

  isKaryawan.value = true

  listKaryawan.value = []
}
</script>

<style v-if="$route.path == '/login'">

/* html, body {
  height: 100%!important;
} */
body {
  /* display: flex!important;
  align-items: center;
  justify-content: center;
  padding-bottom: 4em; */
  /* background-color: #ffffff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3E%3Cdefs%3E%3Crect stroke='%23ffffff' stroke-width='0' width='1' height='1' id='s'/%3E%3Cpattern id='a' width='3' height='3' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cuse fill='%23fcfcfc' href='%23s' y='2'/%3E%3Cuse fill='%23fcfcfc' href='%23s' x='1' y='2'/%3E%3Cuse fill='%23fafafa' href='%23s' x='2' y='2'/%3E%3Cuse fill='%23fafafa' href='%23s'/%3E%3Cuse fill='%23f7f7f7' href='%23s' x='2'/%3E%3Cuse fill='%23f7f7f7' href='%23s' x='1' y='1'/%3E%3C/pattern%3E%3Cpattern id='b' width='7' height='11' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f5f5f5'%3E%3Cuse href='%23s'/%3E%3Cuse href='%23s' y='5' /%3E%3Cuse href='%23s' x='1' y='10'/%3E%3Cuse href='%23s' x='2' y='1'/%3E%3Cuse href='%23s' x='2' y='4'/%3E%3Cuse href='%23s' x='3' y='8'/%3E%3Cuse href='%23s' x='4' y='3'/%3E%3Cuse href='%23s' x='4' y='7'/%3E%3Cuse href='%23s' x='5' y='2'/%3E%3Cuse href='%23s' x='5' y='6'/%3E%3Cuse href='%23s' x='6' y='9'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='h' width='5' height='13' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f5f5f5'%3E%3Cuse href='%23s' y='5'/%3E%3Cuse href='%23s' y='8'/%3E%3Cuse href='%23s' x='1' y='1'/%3E%3Cuse href='%23s' x='1' y='9'/%3E%3Cuse href='%23s' x='1' y='12'/%3E%3Cuse href='%23s' x='2'/%3E%3Cuse href='%23s' x='2' y='4'/%3E%3Cuse href='%23s' x='3' y='2'/%3E%3Cuse href='%23s' x='3' y='6'/%3E%3Cuse href='%23s' x='3' y='11'/%3E%3Cuse href='%23s' x='4' y='3'/%3E%3Cuse href='%23s' x='4' y='7'/%3E%3Cuse href='%23s' x='4' y='10'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='c' width='17' height='13' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23f2f2f2'%3E%3Cuse href='%23s' y='11'/%3E%3Cuse href='%23s' x='2' y='9'/%3E%3Cuse href='%23s' x='5' y='12'/%3E%3Cuse href='%23s' x='9' y='4'/%3E%3Cuse href='%23s' x='12' y='1'/%3E%3Cuse href='%23s' x='16' y='6'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='d' width='19' height='17' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23ffffff'%3E%3Cuse href='%23s' y='9'/%3E%3Cuse href='%23s' x='16' y='5'/%3E%3Cuse href='%23s' x='14' y='2'/%3E%3Cuse href='%23s' x='11' y='11'/%3E%3Cuse href='%23s' x='6' y='14'/%3E%3C/g%3E%3Cg fill='%23efefef'%3E%3Cuse href='%23s' x='3' y='13'/%3E%3Cuse href='%23s' x='9' y='7'/%3E%3Cuse href='%23s' x='13' y='10'/%3E%3Cuse href='%23s' x='15' y='4'/%3E%3Cuse href='%23s' x='18' y='1'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='e' width='47' height='53' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23E5E5E5'%3E%3Cuse href='%23s' x='2' y='5'/%3E%3Cuse href='%23s' x='16' y='38'/%3E%3Cuse href='%23s' x='46' y='42'/%3E%3Cuse href='%23s' x='29' y='20'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='f' width='59' height='71' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23E5E5E5'%3E%3Cuse href='%23s' x='33' y='13'/%3E%3Cuse href='%23s' x='27' y='54'/%3E%3Cuse href='%23s' x='55' y='55'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='g' width='139' height='97' patternUnits='userSpaceOnUse' patternTransform='scale(50) translate(-980 -735)'%3E%3Cg fill='%23E5E5E5'%3E%3Cuse href='%23s' x='11' y='8'/%3E%3Cuse href='%23s' x='51' y='13'/%3E%3Cuse href='%23s' x='17' y='73'/%3E%3Cuse href='%23s' x='99' y='57'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23a)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23b)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23h)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23c)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23d)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23e)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23f)' width='100%25' height='100%25'/%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3C/svg%3E");
  background-attachment: fixed;
  background-size: cover; */
}
.form-signin {
  width: 400px;
  max-width: 400px;
  padding: 15px;
  margin: auto;
}
/* .form-signin .checkbox {
  font-weight: 400;
}
.form-signin .form-floating:focus-within {
  z-index: 2;
}
.form-signin input[type="email"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
} */
</style>
