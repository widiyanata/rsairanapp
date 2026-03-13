<template>
  <div class="kronologi-detail-page animate-fade-in">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between mb-5">
      <div class="d-flex align-items-center gap-4">
        <router-link to="/kronologi" class="btn-minimal btn-minimal-outline p-2 border-0">
          <i class="fas fa-chevron-left"></i>
        </router-link>
        <div>
          <h1 class="h3 fw-bold mb-0">{{ isEdit ? 'Edit Laporan' : 'Pelaporan Baru' }}</h1>
          <div class="text-muted small mt-1" v-if="pasien.KPKD_PASIEN">
            Pasien Terpilih: <strong>{{ pasien.KPKD_PASIENN }}</strong>
          </div>
        </div>
      </div>
      
      <div class="d-flex gap-2">
        <button @click="print" class="btn-minimal btn-minimal-outline">
          <i class="fas fa-print"></i>
          <span>Cetak</span>
        </button>
        <button v-if="pasien.KPKD_PASIEN && !isKirim" class="btn-minimal btn-minimal-primary" @click="simpanKronologi">
          <i class="fas fa-save"></i>
          <span>{{ isEdit ? 'Perbarui Draf' : 'Simpan Draf' }}</span>
        </button>
      </div>
    </div>

    <div class="row g-5">
      <!-- Form Body -->
      <div class="col-lg-8">
        <!-- Patient Selection -->
          <div class="card-minimal mb-4 shadow-sm">
            <h6 class="label-minimal mb-3">Pilih Pasien *</h6>
            <div v-if="!pasien.KPKD_PASIEN">
              <div class="input-group-minimal border-bottom d-flex align-items-center gap-2 mb-3 py-1">
                <i class="fas fa-search text-muted small"></i>
                <input type="text" v-model="cari" class="bg-transparent border-0 small w-100 py-2" placeholder="Cari No. RM / Nama..." @keyup.enter="cariPasien">
              </div>
              <div v-if="pasiens" class="search-results border rounded-3 mt-2 overflow-hidden animate-fade-in shadow-lg">
                <div v-for="(p, idx) in pasiens" :key="idx" @click="pilihPasien(p)" class="p-3 border-bottom hover-bg cursor-pointer bg-white">
                  <div class="fw-bold small">{{ p.KPKD_PASIENN }}</div>
                  <div class="text-muted" style="font-size: 10px;">{{ p.KPNO_TRANSAKSI }}</div>
                </div>
              </div>
            </div>
            <div v-else class="p-3 bg-light border-start border-3 border-primary rounded-1 d-flex align-items-center justify-content-between">
              <div>
                <div class="fw-bold small">{{ pasien.KPKD_PASIENN }}</div>
                <div class="text-muted" style="font-size: 10px;">RM: {{ pasien.KPKD_PASIEN }}</div>
              </div>
              <button v-if="!isKirim" @click="pasien = {}; pasiens = null;" class="btn btn-sm text-muted p-0"><i class="fas fa-times"></i></button>
            </div>
          </div>
        <div class="form-section mb-5">
          <h6 class="label-minimal mb-4">Informasi Kejadian</h6>
          <div class="d-flex align-items-center justify-content-between mb-3">
             <span class="small text-muted">Uraian Detil Kejadian (Siabidibame)</span>
             <button v-if="!isKirim" class="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-bold small" @click="tambahRowKejadian">
                + Tambah Baris
             </button>
          </div>

          <div class="timeline-minimal">
            <div v-for="(entry, idx) in kejadianEntries" :key="idx" class="timeline-item mb-4 animate-fade-in">
              <div class="timeline-content p-4 bg-light bg-opacity-50 border rounded-3 position-relative">
                <div class="row g-4">
                  <div class="col-md-5">
                    <label class="label-minimal mb-2">Tanggal & Jam</label>
                    <input v-model="entry.Tanggal" type="datetime-local" class="input-minimal border-0 shadow-sm" :disabled="isKirim">
                  </div>
                  <div class="col-md-7">
                    <div class="d-flex justify-content-between">
                      <label class="label-minimal mb-2">Uraian Singkat</label>
                      <button v-if="!isKirim && kejadianEntries.length > 1" @click="hapusRowKejadian(idx)" class="btn btn-sm text-danger p-0 opacity-50 hover-opacity-100"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    <textarea v-model="entry.Uraian" rows="2" class="input-minimal border-0 shadow-sm" placeholder="Jelaskan kronologi secara singkat..." :disabled="isKirim"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="signature-minimal pt-5 border-top">
          <h6 class="label-minimal mb-4">Konfirmasi & Tanda Tangan</h6>
          <div class="bg-light bg-opacity-50 p-4 border rounded-3 d-inline-block shadow-sm">
            <TandaTanganCanvas :base64="tandaTangan" ref="tandaTanganCanvas" @save="simpanTandaTangan" />
            <p class="text-muted mt-3 mb-0 small text-center">Bubuhkan tanda tangan pembuat laporan</p>
          </div>
        </div>
      </div>

      <!-- Right Panel: Side Actions -->
      <div class="col-lg-4">
        <div class="sticky-top" style="top: 100px;">

          <!-- Report Info -->
          <div class="card-minimal mb-4 shadow-sm bg-light bg-opacity-25 border-dashed">
            <h6 class="label-minimal mb-3">Laporan Oleh</h6>
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-sm bg-dark text-white rounded-circle flex-center" style="width: 32px; height: 32px; font-size: 12px;">
                {{ nama_pembuat.username?.charAt(0) }}
              </div>
              <div>
                <div class="fw-bold small">{{ nama_pembuat.username }}</div>
                <div class="text-muted" style="font-size: 9px;">{{ nama_pembuat.role }}</div>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-top">
              <label class="label-minimal mb-2">Kirim ke Atasan (Karu)</label>
              <select v-model="kirimke" class="input-minimal" :disabled="isKirim">
                <option value="">-- Pilih Karu --</option>
                <option v-for="user in listKaru" :value="user.id" :key="user.id">{{ user.nama }}</option>
              </select>
            </div>
          </div>

          <button v-if="pasien.KPKD_PASIEN" class="btn-minimal btn-minimal-primary py-3 w-100 justify-content-center border-0 shadow-md" :disabled="isKirim || !kirimke" @click="kirimKronologi">
            <span>{{ isKirim ? 'Selesai / Terkirim' : 'Kirim Laporan' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, nextTick, onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TandaTanganCanvas from '../TandaTanganCanvas.vue'

const apiBaseUrl = 'http://10.30.0.12:8009'
const route = useRoute()
const router = useRouter()

// States
const pasiens = ref(null)
const pasien = ref({ KPKD_PASIEN: '', KPKD_PASIENN: '' })
const cari = ref('')
const kejadianEntries = ref([{ Tanggal: null, Uraian: null }]);
const loading = ref(false);
const id_kronologi = ref('')
const kirimke = ref('')
const isKirim = ref(false)
const listKaru = ref([])
const tandaTangan = ref('')
const nama_pembuat = ref(JSON.parse(sessionStorage.getItem('user')) || {})

const isEdit = computed(() => !!route.params.id)

// Methods
const tambahRowKejadian = () => kejadianEntries.value.push({ Tanggal: null, Uraian: null })
const hapusRowKejadian = (index) => kejadianEntries.value.splice(index, 1)

const cariPasien = async () => {
  if (cari.value.length < 3) return
  loading.value = true
  try {
    const data = await fetch(`${apiBaseUrl}/kunjunganPasien?cari=${cari.value}`)
    const res = await data.json()
    pasiens.value = res.data
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const pilihPasien = (p) => {
  pasien.value = p
  pasiens.value = null
  cari.value = ''
}

const getKronologiDetail = async (id) => {
  loading.value = true
  try {
    const userSession = JSON.parse(sessionStorage.getItem('user'))
    const data = await fetch(`${apiBaseUrl}/kronologi?no_transaksi=${id}&dibuat_oleh=${JSON.stringify(userSession)}`)
    const res = await data.json()
    
    if (res.data && res.data.length > 0) {
      const item = res.data[0]
      kejadianEntries.value = JSON.parse(item.Uraian)
      pasien.value = {
        KPKD_PASIEN: item.no_rm,
        KPKD_PASIENN: item.nama_pasien,
        KPNO_TRANSAKSI: item.no_transaksi
      }
      tandaTangan.value = item.tanda_tangan
      kirimke.value = item.kirimke || ''
      isKirim.value = !!(kirimke.value && kirimke.value !== '0')
      id_kronologi.value = item.id_kronologi
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const simpanTandaTangan = (ttd) => {
  tandaTangan.value = ttd
  simpanKronologi()
}

const simpanKronologi = async () => {
  if (!tandaTangan.value) {
    alert('Tanda tangan wajib diisi')
    return
  }
  loading.value = true
  try {
    await fetch(`${apiBaseUrl}/kronologi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pasien: pasien.value,
        kejadian: kejadianEntries.value,
        dibuat_oleh: nama_pembuat.value,
        tanda_tangan: tandaTangan.value
      })
    })
    router.push('/kronologi')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const kirimKronologi = async () => {
  if (!kirimke.value) return
  loading.value = true
  try {
    await fetch(`${apiBaseUrl}/kirimKronologi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_kronologi: id_kronologi.value,
        kirimke: kirimke.value
      })
    })
    router.push('/kronologi')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getUserKaru = async () => {
  try {
    const data = await fetch(`${apiBaseUrl}/cariKaru?&role=karu`)
    const res = await data.json()
    listKaru.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const print = () => window.print()

onMounted(() => {
  getUserKaru()
  if (isEdit.value) getKronologiDetail(route.params.id)
})
</script>

<style scoped>
.hover-bg:hover { background: var(--surface); }
.cursor-pointer { cursor: pointer; }
.hover-opacity-100:hover { opacity: 1 !important; }
.border-dashed { border-style: dashed !important; }

textarea { resize: none; overflow: hidden; }
</style>
