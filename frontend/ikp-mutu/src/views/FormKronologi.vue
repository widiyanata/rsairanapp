<template>
  <div class="kronologi-page animate-fade-in">
    <!-- Page Header -->
    <div class="d-flex align-items-center justify-content-between mb-5">
      <div>
        <h1 class="h2 fw-bold mb-1">Kronologi Kejadian</h1>
        <p class="text-muted small mb-0">Riwayat pelaporan insiden keselamatan pasien.</p>
      </div>
      <router-link to="/kronologi/form" class="btn-minimal btn-minimal-primary shadow-sm">
        <i class="fas fa-plus"></i>
        <span>Tambah Baru</span>
      </router-link>
    </div>

    <!-- Table Section -->
    <div class="card-minimal p-0 overflow-hidden shadow-sm">
      <div class="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light bg-opacity-50">
        <h3 class="h6 mb-0 text-uppercase fw-bold ls-1">Riwayat Pelaporan</h3>
        <div class="search-minimal d-flex align-items-center gap-2 border-bottom py-1" style="width: 200px;">
          <i class="fas fa-search text-muted small"></i>
          <input type="text" class="bg-transparent border-0 small w-100" placeholder="Cari..." style="outline: none;">
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table-minimal">
          <thead>
            <tr>
              <th class="ps-4">No.</th>
              <th>Tanggal</th>
              <th>Informasi Pasien</th>
              <th>Pelapor</th>
              <th class="text-end pe-4">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in riwayatKronologi" :key="index"
                class="clickable-row hover-fade" @click="goToDetail(entry)">
              <td class="ps-4"><span class="text-muted small">#{{ index + 1 }}</span></td>
              <td>
                <div class="small fw-medium">{{ new Date(entry.Tanggal).toLocaleDateString('id-ID') }}</div>
                <div class="text-muted" style="font-size: 10px;">{{ entry.Tanggal.split('T')[1]?.substring(0, 5) }} WIB</div>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-truncate fw-bold" style="max-width: 180px;">{{ entry.nama_pasien }}</span>
                  <span class="text-muted small" style="font-size: 10px;">• RM: {{ entry.no_rm }}</span>
                </div>
              </td>
              <td>
                <div class="small text-muted">
                  <i class="far fa-user me-1"></i>
                  {{ JSON.parse(entry.dibuat_oleh).username }}
                </div>
              </td>
              <td class="text-end pe-4">
                <span class="badge rounded-pill fw-normal px-3 py-1 border" 
                      :class="entry.kirimke && entry.kirimke !== '0' ? 'text-success bg-success-subtle border-success' : 'text-muted bg-light border-secondary border-opacity-25'">
                  {{ entry.kirimke && entry.kirimke !== '0' ? 'Terkirim' : 'Draf' }}
                </span>
              </td>
            </tr>
            <tr v-if="riwayatKronologi.length === 0 && !loading">
              <td colspan="5" class="text-center py-5">
                <div class="text-muted opacity-50">
                  <i class="fas fa-inbox h1 mb-3"></i>
                  <p class="small">Belum ada data tersedia</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const apiBaseUrl = 'http://10.30.0.12:8009'
const router = useRouter()

// States
const riwayatKronologi = ref([]);
const loading = ref(false);
const isMobile = inject('isMobile')

// Methods
const getRiwayatKronologi = async () => {
  loading.value = true
  let userSession = JSON.parse(sessionStorage.getItem('user'))
  let params = `&dibuat_oleh=${JSON.stringify(userSession)}`

  if (userSession?.role === 'mutu') {
    params = ''
  }

  try {
    const data = await fetch(`${apiBaseUrl}/kronologi?${params}`)
    const res = await data.json()
    riwayatKronologi.value = res.data || []
  } catch (error) {
    console.error('Error fetching list:', error)
  } finally {
    loading.value = false
  }
}

const goToDetail = (entry) => {
  router.push({ name: 'FormKronologiDetail', params: { id: entry.no_transaksi } })
}

onMounted(() => {
  getRiwayatKronologi()
})

</script>

<style scoped>
.clickable-row {
  cursor: pointer;
}

.hover-fade:hover {
  background: var(--surface);
}

.ls-1 { letter-spacing: 0.05em; }
</style>
