<script setup>

import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue';
const loading = ref(false)



watch(loading, (newVal, oldVal) => {
  if (newVal) {
    document.body.style.cursor = 'wait'
    Swal.fire({
      title: 'Loading',
      width: 250,
      allowOutsideClick: false,
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

// data kronologi
const riwayatKronologi = ref([])
const getKronologi = async () => {
  loading.value = true
  try {
    const res = await fetch('http://10.30.0.6:8009/kronologi')
    const kronologis = await res.json()

    riwayatKronologi.value = kronologis.data
    console.log('riwayat kronologi', riwayatKronologi)
  } catch (error) {
    console.error('Error fetching kronologi:', error)
  } finally {
    loading.value = false
  }
}

const detailPasien = ref({})
const getDetailPasien = async (no_transaksi) => {
  loading.value = true
  try {
    const res = await fetch(`http://10.30.0.6:8009/kunjunganPasien?cari=${no_transaksi}`)
    const data = await res.json()

    console.log(data)

    detailPasien.value = data.data[0]
    console.log('detail pasien', detailPasien.value)

    if (no_transaksi) {
      await getRiwayatGrading(no_transaksi)
    }
  } catch (error) {
    console.error('Error fetching kronologi:', error)
  } finally {
    loading.value = false
  }
}

const rincianKejadian = ref({})

const dibuat_oleh = ref({
  user_id: sessionStorage.getItem('user')['id'] || '',
  user_name: sessionStorage.getItem('user')['username'] || '',
  jabatan: sessionStorage.getItem('user')['role'] || ''
})
const submitForm = async (e) => {
  e.preventDefault()

  loading.value = true

  const formData = new FormData(e.target)

  rincianKejadian.value = Object.fromEntries(formData)

  console.log('rincian kejadian', rincianKejadian)

  const res = await fetch('http://10.30.0.6:8009/grading', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pasien: detailPasien.value,
      kejadian: rincianKejadian.value,
      dibuat_oleh: dibuat_oleh.value
    })
  })

  const data = await res.json()

  console.log('simpan kejadian: ',data)
  setTimeout(function(){
    loading.value = false
  }, 1000)
}

const riwayatGrading = ref([])
const getRiwayatGrading = async (no_transaksi = '') => {
  loading.value = true

  const res = await fetch('http://10.30.0.6:8009/grading?no_transaksi='+ no_transaksi)
  const data = await res.json()
  
  riwayatGrading.value = data.data
  console.log('riwayat grading:', riwayatGrading.value)

  if (no_transaksi) {
    if (riwayatGrading.value.length > 0) {
      rincianKejadian.value = JSON.parse( riwayatGrading.value[0].rincian_kejadian)
      console.log('rincian kejadian:', rincianKejadian.value)
  
      // rincian kejadian ke form
    } else {
      rincianKejadian.value = {}
    }
    setFormData(rincianKejadian.value)
  }
}

const form = ref(null)
function setFormData(data) {
  const isEmpty = Object.keys(data).length === 0;

  form.value.querySelectorAll("[name]").forEach((element) => {
    if (isEmpty) {
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = false;
      } else {
        element.value = "";
      }
    } else {
      const key = element.name;
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = Array.isArray(data[key])
          ? data[key].includes(element.value)
          : data[key] === element.value;
      } else {
        element.value = data[key] || "";
      }
    }
  });
}

const selectedRow = ref(null)
const selectRow = (row) => {
  selectedRow.value = row
}

onMounted(() => {
  getKronologi()
  getRiwayatGrading()
  
})

</script>
<template>
  <div class="container">
    <div class="row">
      <div class="col-md-5 ">
        <div class="d-flex justify-content-between mb-2 align-items-center">
          <h3>Riwayat Kronologi</h3>
          <!-- <button class="btn btn-success btn-sm ms-auto" @click="reload">+ Tambah baru</button> -->
        </div>
        <table class="table table-sm table-hover align-middle">
          <thead>
            <tr>
              <th>No.</th>
              <th>Tanggal</th>
              <th>Nama</th>
              <th>No Trans.</th>
            </tr>
          </thead>
          <tbody>
            <!-- Riwayat -->
            <tr v-for="(entry, index) in riwayatKronologi" :key="index" :class="{ 'rowActive': selectedRow === entry, 'rowActive': selectedRow && selectedRow.no_transaksi === entry.no_transaksi }">
              <td>{{ index + 1 }}</td>
              <td>{{ entry.Tanggal.replace('T', ' jam ') }}</td>
              <td> <small class="fw-bold">{{ entry.nama_pasien }} </small> <small class="badge bg-white text-secondary border">({{ entry.no_rm }})</small>  </td>
              <td>
                <a class="badge bg-white text-primary text-decoration-none border" href="#" @click="getDetailPasien(entry.no_transaksi); selectRow(entry)">
                  <small>{{ entry.no_transaksi }}</small>
                </a>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Detail Kronologi -->
        <h4 v-if="selectedRow" class="">Detail Kronologi</h4>
        <div v-if="selectedRow" class="p-3 bg-white shadow rounded">
          <div
            v-if="loading"
            class="d-flex justify-content-center align-items-center p-2"
          >
            <div
              class="spinner-border text-primary spinner-border-sm"
              role="status"
            >
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          
          <table v-else class="table table-sm table-hover align-top mb-1">
            <thead>
              <tr>
                <th width="100px">Tanggal</th>
                <th>Uraian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in JSON.parse(selectedRow.Uraian)" :key="row">
                <td><span  class="badge bg-secondary">{{ row.Tanggal.replace('T', ' jam ') }}</span></td>
                <td><small>{{ row.Uraian }}</small></td>
              </tr>
            </tbody>
          </table>
          
        </div>

        <div class="d-none">
          <h4>Riwayat Grading</h4>
          <table class="table table-striped table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>No RM</th>
                <th>No Trans.</th>
                <!-- <th>No Trans.</th> -->
              </tr>
            </thead>
            <tbody>
              <!-- Riwayat -->
              <tr v-for="(entry, index) in riwayatGrading" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ entry.no_rm }}</td>
                <td> <small>{{ entry.no_transaksi }} </small> </td>
                <!-- <td>
                  <button class="badge bg-primary" @click="getDetailPasien(entry.no_transaksi)">Detail</button>
                </td> -->
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="detailPasien.KPNO_TRANSAKSI" class="col-md-7">
        <form ref="form" id="formInsiden" @submit.prevent="submitForm">
          <h3 class="mb-4">LAPORAN INSIDEN (INTERNAL)</h3>

          <!-- Nav tabs -->
          <div class="d-flex justify-content-between align-items-center">
            <ul class="nav nav-tabs nav-fill" id="myTab" role="tablist">
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link active"
                  id="data-pasien-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#data-pasien"
                  type="button"
                  role="tab"
                  aria-controls="data-pasien"
                  aria-selected="true"
                >
                  I. DATA PASIEN
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  id="rincian-kejadian-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#rincian-kejadian"
                  type="button"
                  role="tab"
                  aria-controls="rincian-kejadian"
                  aria-selected="false"
                >
                  II. RINCIAN KEJADIAN
                </button>
              </li>
              <li class="nav-item" role="presentation">
              </li>
            </ul>
            <button type="submit" class="btn btn-success btn-sm">
              <div v-if="loading">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Loading...
              </div>
              <span v-else>Simpan Insiden</span>
            </button>
          </div>
          <!-- Tab panes -->
          <div class="tab-content mb-5">
            <div
              class="tab-pane p-3 bg-white active shadow"
              id="data-pasien"
              role="tabpanel"
              aria-labelledby="home-tab"
            >
              <!-- I. DATA PASIEN -->
              <!-- <h5>I. DATA PASIEN</h5> -->
              <div class="mb-2">
                <label class="form-label">Nama</label>
                <input type="text" class="form-control form-control-sm" :value="detailPasien ? detailPasien.NAMAPASIEN : ''" disabled/>
              </div>
              <div class="row mb-2">
                <div class="col">
                  <label class="form-label">No MR</label>
                  <input type="text" class="form-control form-control-sm" :value="detailPasien ? detailPasien.KD_PASIEN : ''" disabled/>
                </div>
                <div class="col">
                  <label class="form-label">Ruangan</label>
                  <input type="text" class="form-control form-control-sm" placeholder="" />
                </div>
              </div>
          
              <label class="form-label">Umur *</label>
              <div class="mb-2">
                <input type="text" class="form-control form-control-sm" :value="detailPasien.KD_PERUSAHAAN ? detailPasien.KD_PERUSAHAAN + ' ' +detailPasien.PEMEGANG_ASURANSI : ''" disabled>
              </div>

              <div class="mb-2 d-none">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange1" />
                  <label class="form-check-label" for="umurrange1">0-1 bulan</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange2" />
                  <label class="form-check-label" for="umurrange2">&gt; 1 bulan – 1 tahun</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange3" />
                  <label class="form-check-label" for="umurrange3">&gt; 1 tahun – 5 tahun</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange4" />
                  <label class="form-check-label" for="umurrange4">&gt; 5 tahun – 15 tahun</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange5" />
                  <label class="form-check-label" for="umurrange5">&gt; 15 tahun – 30 tahun</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange6" />
                  <label class="form-check-label" for="umurrange6">&gt; 30 tahun – 65 tahun</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="umur" id="umurrange7" />
                  <label class="form-check-label" for="umurrange7">&gt; 65 tahun</label>
                </div>
              </div>
          
              <label class="form-label">Jenis Kelamin</label>
              <div class="mb-2">
                <span>{{ detailPasien.JENIS_KELAMIN == "1" ? "Laki-laki" :  detailPasien.JENIS_KELAMIN == "1" ? "Perempuan" : "" }}</span>
                <!-- <div class="form-check">
                  <input class="form-check-input" type="radio" name="gender" id="male" :checked="detailPasien.JENIS_KELAMIN == '1'" disabled/>
                  <label class="form-check-label" for="male">Laki-laki</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="gender" id="female" :checked="detailPasien.JENIS_KELAMIN == '2'" disabled/>
                  <label class="form-check-label" for="female">Perempuan</label>
                </div> -->
              </div>
          
              <label class="form-label">Penanggung biaya pasien</label>
              <div class="mb-2">
                <input type="text" class="form-control form-control-sm" :value="detailPasien.KD_PERUSAHAAN ? detailPasien.KD_PERUSAHAAN + ' ' +detailPasien.PEMEGANG_ASURANSI : ''" disabled>
              </div>
              <div class="mb-2 d-none">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="biayapribadi" />
                  <label class="form-check-label" for="biayapribadi">Pribadi</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="asuransiswasta" />
                  <label class="form-check-label" for="asuransiswasta">Asuransi Swasta</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="askesgov" />
                  <label class="form-check-label" for="askesgov">ASKES Pemerintah</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="perusahaan" />
                  <label class="form-check-label" for="perusahaan">Perusahaan</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="jamkesmas" />
                  <label class="form-check-label" for="jamkesmas">JAMKESMAS</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="bpjsnonpbi" />
                  <label class="form-check-label" for="bpjsnonpbi">BPJS Non PBI</label>
                </div>
              </div>
          
              <div class="row mb-2">
                <div class="col">
                  <label class="form-label">Tanggal Masuk RS</label>
                  <input type="date" class="form-control form-control-sm" :value="detailPasien.KPTGL_PERIKSA ? detailPasien.KPTGL_PERIKSA.slice(0, 10) : ''" disabled/>
                </div>
                <div class="col">
                  <label class="form-label">Jam</label>
                  <input type="time" class="form-control form-control-sm" :value="detailPasien.KPJAM_MASUK ? detailPasien.KPJAM_MASUK.split('T')[1]: ''" disabled/>
                </div>
              </div> 
            </div>
            <div
              class="tab-pane p-3 bg-white shadow"
              id="rincian-kejadian"
              role="tabpanel"
              aria-labelledby="rincian-kejadian-tab"
            >
              <!-- II. RINCIAN KEJADIAN -->
              <!-- <h5>II. RINCIAN KEJADIAN</h5> -->
              <div class="row mb-2">
                <div class="col">
                  <label class="form-label">Tanggal Insiden</label>
                  <input type="date" class="form-control form-control-sm" name="tanggalinsiden" />
                </div>
                <div class="col">
                  <label class="form-label">Jam</label>
                  <input type="time" class="form-control form-control-sm" name="jamInsiden" />
                </div>
              </div>
          
              <div class="mb-2">
                <label class="form-label">Insiden</label>
                <input type="text" class="form-control form-control-sm" name="insiden" />
              </div>
          
              <div class="mb-2">
                <label class="form-label">Kronologis Insiden</label>
                <textarea
                  class="form-control form-control-sm"
                  rows="3"
                  placeholder="kronologi insiden"
                  name="kronologiInsiden"
                ></textarea>
              </div>
          
              <label class="form-label">Jenis Insiden *</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="jenisInsiden" id="knc" value="KNC" required />
                  <label class="form-check-label" for="knc"
                    >Kejadian Nyaris Cedera / KNC (Near miss)</label
                  >
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="jenisInsiden" id="ktd" value="KTD" required/>
                  <label class="form-check-label" for="ktd"
                    >Kejadian Tidak diharapkan / KTD (Adverse Event)</label
                  >
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="jenisInsiden" id="sentinel" value="SENTINEL" required/>
                  <label class="form-check-label" for="sentinel"
                    >Kejadian Sentinel (Sentinel Event)</label
                  >
                </div>
              </div>
          
              <label class="form-label">Orang Pertama Yang Melaporkan Insiden *</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pelaporPertama" required id="karyawan" value="karyawan" />
                  <label class="form-check-label" for="karyawan"
                    >Karyawan: Dokter / Perawat / Petugas lainnya</label
                  >
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pelaporPertama" required id="pasien" value="pasien" />
                  <label class="form-check-label" for="pasien">Pasien</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pelaporPertama" required id="keluarga" value="keluarga" />
                  <label class="form-check-label" for="keluarga">Keluarga / Pendamping Pasien</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pelaporPertama" required id="pengunjung" value="pengunjung" />
                  <label class="form-check-label" for="pengunjung">Pengunjung</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pelaporPertama" id="lainlain1" value="lainlain" />
                  <label class="form-check-label" for="lainlain1">Lain-lain</label>
                  <input type="text" class="form-control mt-2" name="pelaporPertamaText" placeholder="Sebutkan" />
                </div>
              </div>
          
              <label class="form-label">Insiden terjadi pada *</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="insindentuj" id="pasien" value="pasien" required/>
                  <label class="form-check-label" for="pasien">Pasien</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="insindentuj" id="lainlain2" value="lainlain" required/>
                  <label class="form-check-label" for="lainlain2">Lain-lain</label>
                  <input
                    type="text"
                    class="form-control form-control-sm mt-2"
                    placeholder="Sebutkan, misal: Karyawan / Pengunjung / Pendamping / Keluarga pasien"
                    name="insindentujText"
                  />
                </div>
              </div>
          
              <label class="form-label">Insiden menyangkut pasien</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="insidenmenyangkut" id="rawatinap" value="pasien rawat inap" />
                  <label class="form-check-label" for="rawatinap">Pasien rawat inap</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="insidenmenyangkut" id="rawatjalan" value="pasien rawat jalan"/>
                  <label class="form-check-label" for="rawatjalan">Pasien rawat jalan</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="insidenmenyangkut" id="ugd" value="pasien ugd"/>
                  <label class="form-check-label" for="ugd">Pasien UGD</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="insidenmenyangkut" id="lainlain3" value="lainlain"/>
                  <label class="form-check-label" for="lainlain3">Lain-lain</label>
                </div>
              </div>
          
              <div class="mb-2">
                <label class="form-label">Tempat Insiden</label>
                <input type="text" class="form-control form-control-sm" name="tempatInsiden" placeholder="Lokasi kejadian (sebutkan)" />
              </div>
          
              <label class="form-label">Insiden terjadi pada pasien</label>
              <div class="mb-2">
                <input type="text" class="form-control form-control-sm" name="insidenTerjadiPada" placeholder="Sebutkan, misal: Penyakit dalam dan subspesialisasinya" />
                <!-- <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="pdalam" />
                  <label class="form-check-label" for="pdalam"
                    >Penyakit Dalam dan Subspesialisasinya</label
                  >
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="anak" />
                  <label class="form-check-label" for="anak">Anak dan Subspesialisasinya</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="bedah" />
                  <label class="form-check-label" for="bedah">Bedah dan Subspesialisasinya</label>
                </div> -->
                <!-- Add more checkboxes as needed for each category -->
              </div>
          
              <div class="mb-2">
                <label class="form-label">Unit Kerja tempat terjadinya insiden</label>
                <input type="text" class="form-control form-control-sm" name="unitKerja" placeholder="Unit kerja (sebutkan)" />
              </div>
          
              <label class="form-label">Akibat Insiden Terhadap Pasien *</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="akibatinsiden" id="kematian" value="kematian" />
                  <label class="form-check-label" for="kematian">Kematian</label>
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="akibatinsiden"
                    id="cederairreversibel"
                    value="cedera irreversibel"
                  />
                  <label class="form-check-label" for="cederairreversibel"
                    >Cedera Irreversibel / Cedera Berat</label
                  >
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="akibatinsiden"
                    id="cederareversibel"
                    value="cedera reversibel"
                  />
                  <label class="form-check-label" for="cederareversibel"
                    >Cedera Reversibel / Cedera Sedang</label
                  >
                </div>
                <!-- More options -->
              </div>
          
              <div class="mb-2">
                <label class="form-label"
                  >Tindakan yang dilakukan segera setelah kejadian, dan hasilnya</label
                >
                <textarea
                  class="form-control form-control-sm"
                  rows="3"
                  placeholder="Sebutkan, misal: Tindakan yang dilakukan segera setelah kejadian, dan hasilnya"
                  name="tindakanHasil"
                ></textarea>
              </div>
          
              <label class="form-label">Tindakan dilakukan oleh *</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="dilakukanOleh" required id="tim" value="tim" />
                  <label class="form-check-label" for="tim">Tim</label>
                  <input type="text" class="form-control mt-2" name="dilakukanOlehTim" placeholder="Terdiri dari..." />
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="dokter" name="dilakukanOleh" required value="dokter"/>
                  <label class="form-check-label" for="dokter">Dokter</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="perawat" name="dilakukanOleh" required value="perawat" />
                  <label class="form-check-label" for="perawat">Perawat</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="petugaslainnya" name="dilakukanOleh" required value="petugaslainnya"/>
                  <label class="form-check-label" for="petugaslainnya">Petugas lainnya</label>
                  <input type="text" class="form-control mt-2" name="dilakukanOlehLainnya" placeholder="Sebutan" />
                </div>
              </div>
          
              <label class="form-label"
                >Apakah kejadian yang sama pernah terjadi di Unit Kerja lain? *</label
              >
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="kejadiansama" id="ya" value="ya" required/>
                  <label class="form-check-label" for="ya">Ya</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="kejadiansama" id="tidak" value="tidak" required/>
                  <label class="form-check-label" for="tidak">Tidak</label>
                </div>
              </div>
          
              <div class="mb-2">
                <label class="form-label"
                  >Jika ya, kapan dan langkah/tindakan apa yang telah diambil?</label
                >
                <textarea class="form-control form-control-sm" rows="3" placeholder="Please describe" name="kejadianSamaText"></textarea>
              </div>
          
              <label class="form-label">Grading Risiko Kejadian * (Diisi oleh atasan pelapor)</label>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="gradingrisiko" required id="biru" value="biru" />
                  <label class="form-check-label" for="biru">BIRU</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="gradingrisiko" required id="hijau" value="hijau" />
                  <label class="form-check-label" for="hijau">HIJAU</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="gradingrisiko" required id="kuning" value="kuning" />
                  <label class="form-check-label" for="kuning">KUNING</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="gradingrisiko" required id="merah" value="merah" />
                  <label class="form-check-label" for="merah">MERAH</label>
                </div>
              </div> 
            </div>
          </div>
          
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-label { 
  font-weight: bold;
  margin-bottom: 0; 
}
.rowActive td {
  background-color: aquamarine;
}
</style>