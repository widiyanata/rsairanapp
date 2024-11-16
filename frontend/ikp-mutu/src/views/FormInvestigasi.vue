<template>
  <div class="container mt-5">
    <div class="row">

      <div class="col-md-5">
        <h3>Riwayat Grading</h3>
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Tanggal</th>
              <th>No Trans.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in riwayatGrading" :key="index" @click="getDetailGrading(entry); selectRow(entry)" :class="{ 'rowActive': selectedRow === entry }">
              <td>{{ index + 1 }}</td>
              <td> <span class="badge text-secondary bg-white border">{{ entry.created_at.replace('T', ' ') }}</span>
              </td>
              <td> <span class="badge text-dark">{{ entry.no_transaksi }}</span> </td>
            </tr>
          </tbody>
        </table>

        <form ref="formDetailGrading" id="formDetailGrading" :class="!detailGrading || !selectedRow ? 'd-none' : ''">
          <h5>Detail Grading</h5>
          <div v-if="loading">
            <div class="d-flex justify-content-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
          <div class="pe-3 pb-3" style="max-height: 500px; overflow-y: scroll;">
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
              <textarea class="form-control form-control-sm" rows="3" placeholder="kronologi insiden"
                name="kronologiInsiden"></textarea>
            </div>
  
            <label class="form-label">Jenis Insiden *</label>
            <div class="mb-2">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="jenisInsiden" id="knc" value="KNC" required />
                <label class="form-check-label" for="knc">Kejadian Nyaris Cedera / KNC (Near miss)</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="jenisInsiden" id="ktd" value="KTD" required />
                <label class="form-check-label" for="ktd">Kejadian Tidak diharapkan / KTD (Adverse Event)</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="jenisInsiden" id="sentinel" value="SENTINEL"
                  required />
                <label class="form-check-label" for="sentinel">Kejadian Sentinel (Sentinel Event)</label>
              </div>
            </div>
  
            <label class="form-label">Orang Pertama Yang Melaporkan Insiden *</label>
            <div class="mb-2">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="pelaporPertama" required id="karyawan"
                  value="karyawan" />
                <label class="form-check-label" for="karyawan">Karyawan: Dokter / Perawat / Petugas lainnya</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="pelaporPertama" required id="pasien"
                  value="pasien" />
                <label class="form-check-label" for="pasien">Pasien</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="pelaporPertama" required id="keluarga"
                  value="keluarga" />
                <label class="form-check-label" for="keluarga">Keluarga / Pendamping Pasien</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="pelaporPertama" required id="pengunjung"
                  value="pengunjung" />
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
                <input class="form-check-input" type="radio" name="insindentuj" id="pasien" value="pasien" required />
                <label class="form-check-label" for="pasien">Pasien</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="insindentuj" id="lainlain2" value="lainlain"
                  required />
                <label class="form-check-label" for="lainlain2">Lain-lain</label>
                <input type="text" class="form-control form-control-sm mt-2"
                  placeholder="Sebutkan, misal: Karyawan / Pengunjung / Pendamping / Keluarga pasien"
                  name="insindentujText" />
              </div>
            </div>
  
            <label class="form-label">Insiden menyangkut pasien</label>
            <div class="mb-2">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="insidenmenyangkut" id="rawatinap"
                  value="pasien rawat inap" />
                <label class="form-check-label" for="rawatinap">Pasien rawat inap</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="insidenmenyangkut" id="rawatjalan"
                  value="pasien rawat jalan" />
                <label class="form-check-label" for="rawatjalan">Pasien rawat jalan</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="insidenmenyangkut" id="ugd" value="pasien ugd" />
                <label class="form-check-label" for="ugd">Pasien UGD</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="insidenmenyangkut" id="lainlain3"
                  value="lainlain" />
                <label class="form-check-label" for="lainlain3">Lain-lain</label>
              </div>
            </div>
  
            <div class="mb-2">
              <label class="form-label">Tempat Insiden</label>
              <input type="text" class="form-control form-control-sm" name="tempatInsiden"
                placeholder="Lokasi kejadian (sebutkan)" />
            </div>
  
            <label class="form-label">Insiden terjadi pada pasien</label>
            <div class="mb-2">
              <input type="text" class="form-control form-control-sm" name="insidenTerjadiPada"
                placeholder="Sebutkan, misal: Penyakit dalam dan subspesialisasinya" />
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
              <input type="text" class="form-control form-control-sm" name="unitKerja"
                placeholder="Unit kerja (sebutkan)" />
            </div>
  
            <label class="form-label">Akibat Insiden Terhadap Pasien *</label>
            <div class="mb-2">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="akibatinsiden" id="kematian" value="kematian" />
                <label class="form-check-label" for="kematian">Kematian</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="akibatinsiden" id="cederairreversibel"
                  value="cedera irreversibel" />
                <label class="form-check-label" for="cederairreversibel">Cedera Irreversibel / Cedera Berat</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="akibatinsiden" id="cederareversibel"
                  value="cedera reversibel" />
                <label class="form-check-label" for="cederareversibel">Cedera Reversibel / Cedera Sedang</label>
              </div>
              <!-- More options -->
            </div>
  
            <div class="mb-2">
              <label class="form-label">Tindakan yang dilakukan segera setelah kejadian, dan hasilnya</label>
              <textarea class="form-control form-control-sm" rows="3"
                placeholder="Sebutkan, misal: Tindakan yang dilakukan segera setelah kejadian, dan hasilnya"
                name="tindakanHasil"></textarea>
            </div>
  
            <label class="form-label">Tindakan dilakukan oleh *</label>
            <div class="mb-2">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="dilakukanOleh" required id="tim" value="tim" />
                <label class="form-check-label" for="tim">Tim</label>
                <input type="text" class="form-control mt-2" name="dilakukanOlehTim" placeholder="Terdiri dari..." />
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" id="dokter" name="dilakukanOleh" required
                  value="dokter" />
                <label class="form-check-label" for="dokter">Dokter</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" id="perawat" name="dilakukanOleh" required
                  value="perawat" />
                <label class="form-check-label" for="perawat">Perawat</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" id="petugaslainnya" name="dilakukanOleh" required
                  value="petugaslainnya" />
                <label class="form-check-label" for="petugaslainnya">Petugas lainnya</label>
                <input type="text" class="form-control mt-2" name="dilakukanOlehLainnya" placeholder="Sebutan" />
              </div>
            </div>
  
            <label class="form-label">Apakah kejadian yang sama pernah terjadi di Unit Kerja lain? *</label>
            <div class="mb-2">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="kejadiansama" id="ya" value="ya" required />
                <label class="form-check-label" for="ya">Ya</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="kejadiansama" id="tidak" value="tidak" required />
                <label class="form-check-label" for="tidak">Tidak</label>
              </div>
            </div>
  
            <div class="mb-2">
              <label class="form-label">Jika ya, kapan dan langkah/tindakan apa yang telah diambil?</label>
              <textarea class="form-control form-control-sm" rows="3" placeholder="Please describe"
                name="kejadianSamaText"></textarea>
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
                <input class="form-check-input" type="radio" name="gradingrisiko" required id="kuning"
                  value="kuning" />
                <label class="form-check-label" for="kuning">KUNING</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="gradingrisiko" required id="merah" value="merah" />
                <label class="form-check-label" for="merah">MERAH</label>
              </div>
            </div>
          </div>
        </form>
        
      </div>
      <div class="col-md-7" :class="!detailGrading || !selectedRow ? 'd-none' : ''">
        <h2 class="text-center mb-4 h4">FORM LAPORAN INVESTIGASI SEDERHANA</h2>
        <div class="p-3 bg-white shadow-sm rounded border">

          <form ref="formInvestigasi" @submit.prevent="submitForm">
            <div class="mb-1 row">
              <label for="pasien"  class="col-sm-4 col-form-label">Pasien:</label>
              <div class="col-sm-6">
                <input type="text" class="form-control form-control-sm" :value="selectedRow && selectedRow.NAMAPASIEN"  name="pasien" disabled>
              </div>
              <div class="col-sm-2">
                <input type="text" class="form-control form-control-sm" :value="selectedRow && selectedRow.KD_PASIEN" name="no_rm" disabled>
              </div>
            </div>
            <div class="mb-1 row">
              <label for="latarbelakang" class="col-sm-4 col-form-label">Penyebab yang melatarbelakangi / akar masalah Insiden:</label>
              <div class="col-sm-8">
                <textarea name="latarbelakang" id="latarbelakang" cols="30" rows="4" class="form-control form-control-sm"></textarea>
              </div>
            </div>
            <div class="mb-1 row">
              <label for="tglMulai" class="col-sm-4 col-form-label">Tgl. Mulai Investigasi:</label>
              <div class="col-sm-8">
                <input type="date" class="form-control form-control-sm" id="tglMulai" name="tglMulai">
              </div>
            </div>
            <div class="mb-1 row">
              <label for="tglSelesai" class="col-sm-4 col-form-label">Tgl. Selesai Investigasi:</label>
              <div class="col-sm-8">
                <input type="date" class="form-control form-control-sm" id="tglSelesai" name="tglSelesai">
              </div>
            </div>
            <div class="mb-1 row">
              <label for="kepalaRuangan" class="col-sm-4 col-form-label">Kepala Ruangan:</label>
              <div class="col-sm-8">
                <input type="text" class="form-control form-control-sm" id="kepalaRuangan" name="kepalaRuangan">
              </div>
            </div>
            <div class="mb-1 row">
              <label for="kasieKasubag" class="col-sm-4 col-form-label">Kasie / Kasubag:</label>
              <div class="col-sm-8">
                <input type="text" class="form-control form-control-sm" id="kasieKasubag" name="kasieKasubag">
              </div>
            </div>
            <h4 class="mt-4">ANALISA SUB KOMITE KESELAMATAN PASIEN:</h4>
            <div class="mb-1 row">
              <label for="tglAnalisa" class="col-sm-4 col-form-label">Tanggal:</label>
              <div class="col-sm-8">
                <input type="date" class="form-control form-control-sm" id="tglAnalisa" name="tglAnalisa">
              </div>
            </div>
            <div class="mb-1 row">
              <label class="col-sm-4 col-form-label">Investigasi Lengkap:</label>
              <div class="col-sm-8">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" id="investigasiYa" name="investigasiLengkap" value="YA">
                  <label class="form-check-label" for="investigasiYa">YA</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" id="investigasiTidak" name="investigasiLengkap"
                    value="TIDAK">
                  <label class="form-check-label" for="investigasiTidak">TIDAK</label>
                </div>
              </div>
            </div>
            <div class="mb-1 row">
              <label class="col-sm-4 col-form-label">Diperlukan Investigasi lebih lanjut:</label>
              <div class="col-sm-8">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" id="investigasiLanjutYa" name="investigasiLanjut"
                    value="YA">
                  <label class="form-check-label" for="investigasiLanjutYa">YA</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" id="investigasiLanjutTidak" name="investigasiLanjut"
                    value="TIDAK">
                  <label class="form-check-label" for="investigasiLanjutTidak">TIDAK</label>
                </div>
              </div>
            </div>
            <div class="mb-1 row">
              <label class="col-sm-4 col-form-label">Investigasi setelah Grading ulang:</label>
              <div class="col-sm-8">
                <select class="form-select" name="grading" id="grading">
                  <option value="BIRU">BIRU</option>
                  <option value="HIJAU">HIJAU</option>
                  <option value="KUNING">KUNING</option>
                  <option value="MERAH">MERAH</option>
                </select>
              </div>
            </div>
            <div class="text-center">
              <button type="submit" class="btn btn-primary">Submit</button>
            </div>
          </form>

        </div>
      </div>

    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'

const loading = ref(false)
const formInvestigasi = ref(null)
const investigasi = ref({})

const formDetailGrading = ref(null)
function setFormDetailGrading(data) {
  console.log('set form detail grading', data);
  console.log(formDetailGrading.value)
  const isEmpty = Object.keys(data).length === 0;

  formDetailGrading.value.querySelectorAll("[name]").forEach((element) => {
    if (isEmpty) {
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = false;
      } else {
        element.value = "";
      }
    } else {
      // add atribute disabled
      element.disabled = true
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

function setFormInvestigasi(data) {
  
  console.log('set form detail investigasi', data);
  console.log(formDetailGrading.value)
  const isEmpty = Object.keys(data).length === 0;

  formInvestigasi.value.querySelectorAll("[name]").forEach((element) => {
    if (isEmpty) {
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = false;
      } else {
        element.value = "";
      }
    } else {
      // add atribute disabled
      // element.disabled = true
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

const submitForm = async (e) => {
  e.preventDefault();

  loading.value = true;

  const formData = new FormData(e.target);
  investigasi.value = Object.fromEntries(formData);

  console.log('investigasi', investigasi.value);

  try {
    const res = await fetch('http://localhost:8009/investigasi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'pasien': {
          KD_PASIEN: selectedRow.value.KD_PASIEN,
          no_transaksi: selectedRow.value.no_transaksi
        },
        'investigasi': investigasi.value,
        'dibuat_oleh': sessionStorage.getItem('user')
      })
    });

    if (!res.ok) throw new Error('Network response was not ok');

    await res.json();

    Swal.fire({
      icon: 'success',
      title: 'Investigasi Berhasil Disimpan',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      window.location.href = '/investigasi';
    });

    formInvestigasi.value.reset();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
};

const riwayatInvestigasi = ref([])
const getRiwayatInvestigasi = async () => {
  try {
    const res = await fetch('http://localhost:8009/investigasi');
    const data = await res.json();
    console.log('riwayat investigasi', data);
    return riwayatInvestigasi.value = data.data;
  } catch (error) {
    console.error('Error fetching investigasi:', error);
  }
}

const riwayatGrading = ref([])
const getRiwayatGrading = async (no_transaksi = '') => {
  try {
    const res = await fetch(`http://localhost:8009/grading?cari=${no_transaksi}`);
    const data = await res.json();
    console.log('riwayat grading', data);
    return riwayatGrading.value = data.data;
  } catch (error) {
    console.error('Error fetching investigasi:', error);
  }
}

const detailGrading = ref(null)
const getDetailGrading = async (data) => {
  console.log('detail grading: ', data)
  detailGrading.value = data

  setFormDetailGrading(JSON.parse(detailGrading.value.rincian_kejadian) || {})
  setFormInvestigasi(JSON.parse(detailGrading.value.investigasi) || {})
}

const selectedRow = ref(null)
const selectRow = (row) => {
  if (selectedRow.value === row) {
    selectedRow.value = null;
  } else {
    selectedRow.value = row;
  }
  console.log('selected row', selectedRow.value)
}

onMounted(() => {
  getRiwayatGrading()
  console.log('form detail grading', formDetailGrading.value)
  console.log('form investigasi', formInvestigasi.value)
})
</script>
<style scoped>
.form-label { 
  font-weight: bold;
  margin-bottom: 0; 
}
.rowActive td {
  background-color: aquamarine;
}
</style>
