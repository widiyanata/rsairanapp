<template>
  <div class="">
    <div class="container no-print">
      <div class="row">
        <div class="col-md-12 no-print">
          <div class="d-flex justify-content-between mb-3 align-items-center">
            <h3>Riwayat Kronologi</h3>
            <button class="btn btn-success btn-sm ms-auto" @click="tambahKronologiBaru" data-bs-toggle="modal" data-bs-target="#modalDetailKronologi">+ Tambah baru</button>
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-hover align-start">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Tanggal</th>
                  <th>Nama Pasien</th>
                  <!-- <th>#</th> -->
                </tr>
              </thead>
              <tbody>
                <!-- Riwayat -->
                <tr v-for="(entry, index) in riwayatKronologi" :key="index" :class="{ 'rowActive': selectedRow === entry }" @click="getKronologi(entry); selectRow(entry)" data-bs-toggle="modal" data-bs-target="#modalDetailKronologi">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td> 
                    <span class="badge bg-white text-secondary border ms-1">{{ entry.Tanggal.replace('T', ' jam ') }}</span>
                    <!-- <span class="badge bg-white text-secondary ms-1">{{ JSON.parse(entry.dibuat_oleh).user_id }}</span> -->
                    <span class="badge text-secondary ms-1">{{ JSON.parse(entry.dibuat_oleh).username }}</span>
                  </td>
                  <td> <small class="fw-bold badge text-dark">{{ entry.nama_pasien }} </small> <small class="badge text-secondary">({{ entry.no_rm }})</small>  </td>
                  <!-- <td>
                    <a href="#" class="badge bg-white text-info text-decoration-none border" @click="getKronologi(entry); selectRow(entry)">
                      <small>{{ entry.no_transaksi }}</small>
                    </a>
                  </td> -->
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="col-md-7">
          
        </div>
      </div>
    </div>

    <div id="print-area" class="print">
      <div class="kop-surat mb-4">
        <div class="row">
          <div class="col-12">
            <img class="w-100" src="../assets/kop_surat.jpg" alt="">
          </div>
        </div>
      </div>
      <h3>Kronologis Kejadian</h3>
      <div class="">
        <table class="align-start">
          <colgroup>
            <col width="200px">
            <col width="250px">
          </colgroup>
          <tr>
            <th>Nama Pembuat</th>
            <td>
              : {{ nama_pembuat.username }}
            </td>
          </tr>
          <tr>
            <th>Unit Kerja / Jabatan</th>
            <td>: {{ nama_pembuat.role }}</td>
          </tr>
          <tr>
            <th class="align-top">Pasien</th>
            <td>
              : {{ pasien.KPKD_PASIENN }} - {{ pasien.KPKD_PASIEN }}
            </td>
          </tr>
        </table>
        <table  class="table table-sm table-bordered mt-4 ">
          <colgroup>
            <col width="50px">
            <col width="150px">
            <col width="500px">
          </colgroup>
          <thead class="">
            <tr>
              <th class="text-center">No</th>
              <th>Tgl Jam</th>
              <th>Uraian</th>
            </tr>
          </thead>
          <tbody ref="kejadianTableBody">
            <tr v-for="(entry, index) in kejadianEntries" :key="index">
              <td class="text-center">{{ index + 1 }}</td>
              <td>
                <input v-model="kejadianEntries[index].Tanggal" type="datetime-local" class="form-control form-control-sm">
              </td>
              <td>
                <textarea v-model="kejadianEntries[index].Uraian" cols="30" rows="1" class="form-control form-control-sm"></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Body -->
    <!-- if you want to close by clicking outside the modal, delete the last endpoint:data-bs-backdrop and data-bs-keyboard -->
    <div
      class="modal fade"
      id="modalDetailKronologi"
      tabindex="-1"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      
      role="dialog"
      aria-labelledby="modalTitleId"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-fullscreen"
        role="document"
      >
        <div class="modal-content">
          <div class="modal-header">
            <button class="btn btn-light me-2" data-bs-dismiss="modal"> <i class="fas fa-arrow-left"></i> Kembali </button>
            <h5 class="modal-title d-flex align-items-center" id="modalTitleId">
              <span class="badge text-dark ps-0">{{ pasien.KPKD_PASIENN }}</span> <span class="badge bg-dark">{{ pasien.KPNO_TRANSAKSI }}</span>
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body bg-secondary">
            <h3 class="text-center">Kronologis Kejadian</h3>
            <div class="p-3 bg-white shadow-sm rounded border">
              <div class="row">
                <div class="col-md-6">
                  <table class="align-start">
                    <colgroup>
                      <col width="200px">
                      <col width="250px">
                    </colgroup>
                    <tr>
                      <th>Nama Pembuat</th>
                      <td>
                        <div class="input-group">
                          <button v-if="nama_pembuat.id" class="btn btn-sm btn-secondary" :class="{ disabled: loading }" @click=" cari.length > 2 ? cariPembuat() : ''">{{ nama_pembuat.id }}</button>
                          <input type="search" class="form-control form-control-sm" v-model="nama_pembuat.username" @keydown="nama_pembuat.username.length > 2 ? cariPembuat() : ''" :disabled="{ true: pasien ? true : false }">
                        </div>
                        <div v-if="users_pembuat" >
                          <div class="dropdown">
                            <div class="dropdown-menu show p-0 border-0 shadow-none">
                              <div class="list-group">
                                <a href="#" v-for="(user, index) in users_pembuat" :key="index" @click="pilihUser(user)" class="list-group-item list-group-item-action list-group-item-info">{{ user.FMPPERAWAT_ID }} - {{ user.FMPPERAWATN }}</a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>Unit Kerja / Jabatan</th>
                      <td>: {{ nama_pembuat.role }}</td>
                    </tr>
                    <tr>
                      <th class="align-top">Pasien</th>
                      <td>
                        : {{ pasien.KPKD_PASIENN }} - {{ pasien.KPKD_PASIEN }}
        
                        <div v-if="!pasien.KPKD_PASIEN" class="input-group input-group-sm no-print">
                          <input type="search" class="form-control" v-model="cari" placeholder="Pilih pasien terlebih dahulu">
                          <button class="btn btn-sm btn-primary" :class="{ disabled: loading }" @click=" cari.length > 2 ? cariPasien() : ''"> <span v-if="!loading">Cari</span> <span v-else><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span> </button>
                        </div>
                        <div v-if="pasiens">
                          <div class="dropdown">
                            <div class="dropdown-menu show p-0" aria-labelledby="triggerId">
                              <div class="list-group">
                                <a href="#" v-for="(pasien, index) in pasiens" :key="index" @click="pilihPasien(pasien)" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                  <div class="w-100">
                                    <div class="fw-bold d-flex justify-content-between"><small>{{ pasien.KPNO_TRANSAKSI}}</small> <small class="badge bg-dark rounded-pill">{{ pasien.KPKD_PASIEN }}</small></div>
                                    <small>{{ pasien.KPKD_PASIENN }}</small>
                                  </div>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <p class="mb-1">Tanda Tangan</p>
                  <TandaTanganCanvas :height="150" :width="300" ref="tandaTanganCanvas" @save="simpanTandaTangan"/>
                </div>
              </div>
              <div class="table-responsive">
                <table id="uraianKejadian" class="table table-sm table-bordered mt-4 ">
                  <colgroup>
                    <col width="50px">
                    <col width="150px">
                    <col>
                  </colgroup>
                  <thead class="table-info">
                    <tr>
                      <th class="text-center">No</th>
                      <th>Tgl Jam</th>
                      <th>Uraian</th>
                      <th>#</th>
                    </tr>
                  </thead>
                  <tbody ref="kejadianTableBody">
                    <tr v-for="(entry, index) in kejadianEntries" :key="index">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>
                        <input v-model="kejadianEntries[index].Tanggal" type="datetime-local" class="form-control form-control-sm">
                      </td>
                      <td>
                        <textarea v-model="kejadianEntries[index].Uraian" cols="30" rows="1" class="form-control form-control-sm" style="min-width: 200px;"></textarea>
                      </td>
                      <td>
                        <button class="btn btn-danger btn-sm" @click="hapusRowKejadian(index)"> - </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="btn-group ">
                <button class="btn btn-info btn-sm" @click="tambahRowKejadian"> + Tambah Baris</button>
                <!-- <button class="btn btn-danger btn-sm" @click="hapusRowKejadian"> - Hapus</button> -->
                <button v-if="batalHapus" class="btn btn-warning btn-sm" @click="batalHapus ? getKronologi(pasien.KPNO_TRANSAKSI) : ''; batalHapus = !batalHapus ">Batal hapus</button>
                <button v-if="pasien.KPKD_PASIEN" class="btn btn-success btn-sm" @click="simpanKronologi">Simpan</button>
                <button class="btn btn-primary btn-sm no-print" @click="print" data-bs-dismiss="modal">Cetak</button>
              </div>
            </div>
          </div>
          <div class="modal-footer align-items-center justify-content-between">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              data-bs-dismiss="modal"
            >
              Tutup
            </button>
            <div class="btn-group d-none">
              <button class="btn btn-info btn-sm" @click="tambahRowKejadian"> + Tambah Baris</button>
              <!-- <button class="btn btn-danger btn-sm" @click="hapusRowKejadian"> - Hapus</button> -->
              <button v-if="batalHapus" class="btn btn-warning btn-sm" @click="batalHapus ? getKronologi(pasien.KPNO_TRANSAKSI) : ''; batalHapus = !batalHapus ">Batal hapus</button>
              <button class="btn btn-primary btn-sm no-print" @click="print">Cetak</button>
              <button v-if="pasien.KPKD_PASIEN" class="btn btn-success btn-sm" @click="simpanKronologi">Simpan</button>
  
              <!-- <ExportToWord element="export-to-word" filename="Kronologi-kejadian">
                <button class="btn btn-primary btn-sm">Export ke Word</button>
              </ExportToWord>
              <ExportToExcel element="export-to-word" filename="Kronologi-kejadian">
                <button class="btn btn-primary btn-sm">Export ke Excel</button>
              </ExportToExcel> -->
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { inject, onMounted, ref, watch } from 'vue'

// import { ExportToWord, ExportToExcel  } from 'vue-doc-exporter'

const apiBaseUrl = 'http://10.30.0.6:8009'

const pasiens = ref('')
const pasien = ref({
  KPKD_PASIEN: '',
  KPKD_PASIENN: '',
})
const cari = ref('')

const kejadianEntries = ref([
{}
]);

const riwayatKronologi = ref([]);

const loading = ref(false);

// cek device
const isMobile = inject('isMobile')

watch(loading, (newVal, oldVal) => {
  if (newVal) {
    document.body.style.cursor = 'wait'
    Swal.fire({
      title: 'Loading',
      width: 250,
      allowClickOutside: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
  } else {
    document.body.style.cursor = 'default'
    setTimeout(() => {
      Swal.close()
    }, 750)
  }
})

onMounted(() => {
  // get riwayat kronologi
  getKronologi()
})

const tambahRowKejadian = () => {
  kejadianEntries.value.push({})
}

let batalHapus = false
const hapusRowKejadian = (index) => {
  kejadianEntries.value.splice(index, 1)

  batalHapus = true

  // if (kejadianEntries.value.length > 1) {
  //   kejadianEntries.value.pop()
  // }
}

const reload = () => {
  window.location.reload()
}

// Cari pasien
const cariPasien = async () => {
  loading.value = true
  try {
    const data = await fetch(`${apiBaseUrl}/kunjunganPasien?cari=${cari.value}`)
    const users = await data.json()
    console.log(users)
    pasiens.value = users.data
    loading.value = false
  } catch (error) {
    console.error('Error fetching patients:', error)
  }
}

const pilihPasien = (pasienPilih) => {
  pasien.value = pasienPilih
  // emptying the pasien
  pasiens.value = ''

  // emptying the cari
  cari.value = ''
  
}

// Get kronologi
const getKronologi = async (entry = '') => {
  loading.value = true

  const no_transaksi = entry.no_transaksi
  let params = ''
  let userSession = JSON.parse(sessionStorage.getItem('user'))
  console.log('userSession getKronologi', userSession)

  if (no_transaksi) {
    // nama_pembuat = entry.dibuat_oleh
  }

  // jika role perawat maka params dibuat_oleh perawat
  if (userSession && userSession.role === 'perawat') {
    params = `&dibuat_oleh=${JSON.stringify(userSession)}`
    if ( no_transaksi) {
      params = `&no_transaksi=${no_transaksi}&dibuat_oleh=${entry.dibuat_oleh}`
    }
  } else if ( no_transaksi) {
    params = `&no_transaksi=${no_transaksi}&dibuat_oleh=${entry.dibuat_oleh}`
  } else {
    params = ''
  }
  // jika yang lain maka params tidak ada dibuat_oleh
  // jika ada notransaksi maka params notransaksi dan dibuat_oleh

  try {
    const data = await fetch(`${apiBaseUrl}/kronologi?${params}`)
    const kronologis = await data.json()
    console.log('get kronologis',kronologis)

    // Riwayat kronologi
    if (!no_transaksi) {
      riwayatKronologi.value = kronologis.data
    }
    
    // Detail kronologi
    // set pasien
    if (no_transaksi) {
      kejadianEntries.value = JSON.parse(kronologis.data[0].Uraian)
      pasien.value.KPKD_PASIEN = kronologis.data[0].no_rm
      pasien.value.KPKD_PASIENN = kronologis.data[0].nama_pasien
      pasien.value.KPNO_TRANSAKSI = kronologis.data[0].no_transaksi

      nama_pembuat.value = JSON.parse(kronologis.data[0].dibuat_oleh)
    }

    loading.value = false

    console.log('kejadian entries', kejadianEntries.value)
  } catch (error) {
    console.error('Error fetching kronologi:', error)
  }
}

// simpan kronologi
const users_pembuat = ref([])
const nama_pembuat = ref(JSON.parse(sessionStorage.getItem('user')))
const cariPembuat = async () => {
  try {
    const data = await fetch(`${apiBaseUrl}/cariUser?cari=${nama_pembuat.value.username}`)
    const users = await data.json()
    console.log(users)
    users_pembuat.value = users.data
  } catch (error) {
    console.error('Error fetching patients:', error)
  }
}
const pilihUser = (user) => {
  console.log('pilih user',user)
  nama_pembuat.value.id = user.FMPPERAWAT_ID
  nama_pembuat.value.username = user.FMPPERAWATN
  nama_pembuat.value.role = user.USER_EMR

  console.log('nama pembuat',nama_pembuat.value)

  users_pembuat.value = []
}
// watch(
//   () => nama_pembuat.value.user_name,
//   (newVal, oldVal) => {
//     console.log(newVal, oldVal);
//     if (newVal && newVal !== oldVal) {
//       cariPembuat();
//     }
//   },
//   {
//     immediate: true,
//     deep: false // Set to false since deep is unnecessary for primitive values like strings
//   }
// );

import TandaTanganCanvas from '../TandaTanganCanvas.vue';
const tandaTangan = ref('')
const simpanTandaTangan = (ttd) => {
  console.log('TTD:',ttd)
  tandaTangan.value = ttd
}
const simpanKronologi = async () => {
  if (tandaTangan.value == '') {
    Swal.fire({
      icon: 'error',
      text: 'Tanda Tangan Wajib diisi',
    })
    return
  }
  loading.value = true
  try {
    const data = await fetch(`${apiBaseUrl}/kronologi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pasien: pasien.value,
        kejadian: kejadianEntries.value,
        dibuat_oleh: nama_pembuat.value,
        tanda_tangan: tandaTangan.value
      })
    })
    const kronologis = await data.json()
    console.log('hmmmm',kronologis)

    await getKronologi()

    loading.value = false
  } catch (error) {
    console.error('Error fetching kronologi:', error)
  }
}

const selectedRow = ref(null)
const selectRow = (row) => {
  selectedRow.value = row
}

// print
const print = () => {
  setTimeout(() => {
    window.print()
  }, 1000)
}

const tambahKronologiBaru = () => {
  // reset pasien
  pasien.value = {};
  // reset baris kronologi
  kejadianEntries.value = [];
  kejadianEntries.value.push({ Tanggal: null, Uraian: null });

  // reset nama pembuat
  nama_pembuat.value = JSON.parse(sessionStorage.getItem('user'))
}

</script>


<style scoped>
.form-label { font-weight: bold; }
.rowActive td {
  background-color: aquamarine;
}
</style>
