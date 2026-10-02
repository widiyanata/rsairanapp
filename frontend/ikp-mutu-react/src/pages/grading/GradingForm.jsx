import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import SignatureCanvas from '../../components/ui/SignatureCanvas';
import { showLoading, hideLoading } from '../../components/ui/LoadingOverlay';

export default function GradingForm() {
  const { user } = useAuth();
  const formRef = useRef(null);

  // State
  const [loading, setLoading] = useState(false);
  const [riwayatKronologi, setRiwayatKronologi] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailPasien, setDetailPasien] = useState({});
  const [rincianKejadian, setRincianKejadian] = useState({});
  const [riwayatGrading, setRiwayatGrading] = useState([]);
  const [listKronologi, setListKronologi] = useState([]);
  const [tandaTanganPelapor, setTandaTanganPelapor] = useState(null);
  const [tandaTanganPenerima, setTandaTanganPenerima] = useState(null);
  const [penerimaLaporan, setPenerimaLaporan] = useState('');
  const [activeTab, setActiveTab] = useState('data-pasien');
  const [showKronologiMobile, setShowKronologiMobile] = useState(false);

  const dibuatOleh = {
    user_id: user?.id || '',
    user_name: user?.username || '',
    jabatan: user?.role || '',
  };

  // Group kronologi by no_transaksi
  const riwayatKronologiGrouped = useMemo(() => {
    const map = new Map();
    const sorted = [...riwayatKronologi].sort((a, b) => {
      if (b.id_kronologi !== a.id_kronologi) return b.id_kronologi - a.id_kronologi;
      return new Date(b.Tanggal) - new Date(a.Tanggal);
    });

    sorted.forEach((entry) => {
      let username = '-';
      try {
        username = JSON.parse(entry.dibuat_oleh).username;
      } catch {}
      if (!map.has(entry.no_transaksi)) {
        map.set(entry.no_transaksi, { ...entry, pembuat: [username] });
      } else {
        const existing = map.get(entry.no_transaksi);
        if (!existing.pembuat.includes(username)) {
          existing.pembuat.push(username);
        }
      }
    });
    return Array.from(map.values());
  }, [riwayatKronologi]);

  const umurPasien = useMemo(() => {
    if (!detailPasien?.TGL_LAHIR) return '';
    const today = new Date();
    const birthDate = new Date(detailPasien.TGL_LAHIR);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [detailPasien]);

  // API calls
  const getKronologi = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/kronologi');
      let kronologis = data.data || [];
      if (user?.role === 'karu') {
        kronologis = kronologis.filter((r) => r.kirimke === user.id);
      }
      setRiwayatKronologi(kronologis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDetailPasien = async (noTransaksi) => {
    showLoading();
    try {
      const { data } = await api.get(`/kunjunganPasien?cari=${noTransaksi}`);
      setDetailPasien(data.data?.[0] || {});
      await getRiwayatGrading(noTransaksi);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const getRiwayatGrading = async (noTransaksi = '') => {
    try {
      const { data } = await api.get(`/grading?no_transaksi=${noTransaksi}`);
      setRiwayatGrading(data.data || []);

      if (noTransaksi && data.data?.length > 0) {
        const parsed = JSON.parse(data.data[0].rincian_kejadian || '{}');
        setRincianKejadian(parsed);
        setTandaTanganPelapor(data.data[0].tanda_tangan_pelapor);
        setTandaTanganPenerima(data.data[0].tanda_tangan_penerima);
        setPenerimaLaporan(data.data[0].penerima_laporan || '');
      } else {
        setRincianKejadian({});
        setTandaTanganPelapor(null);
        setTandaTanganPenerima(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getListKronologi = async (noTransaksi) => {
    try {
      const { data } = await api.get(`/getListKronologi?no_transaksi=${noTransaksi}`);
      setListKronologi(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    showLoading();
    try {
      const formData = new FormData(e.target);
      const rincian = Object.fromEntries(formData);

      await api.post('/grading', {
        pasien: detailPasien,
        kejadian: rincian,
        dibuat_oleh: dibuatOleh,
        tanda_tangan_pelapor: tandaTanganPelapor || null,
        tanda_tangan_penerima: tandaTanganPenerima || null,
        penerima_laporan: penerimaLaporan,
      });
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const selectRow = (row) => {
    setSelectedRow(row);
    setActiveTab('data-pasien');
    getDetailPasien(row.no_transaksi);
    getListKronologi(row.no_transaksi);
  };

  useEffect(() => {
    getKronologi();
    getRiwayatGrading();
  }, []);

  // Set form values when rincianKejadian changes
  useEffect(() => {
    if (formRef.current && selectedRow) {
      const data = rincianKejadian;
      const isEmpty = Object.keys(data).length === 0;

      formRef.current.querySelectorAll('[name]').forEach((el) => {
        if (isEmpty) {
          if (el.type === 'radio' || el.type === 'checkbox') el.checked = false;
          else el.value = '';
        } else {
          const key = el.name;
          if (el.type === 'radio' || el.type === 'checkbox') {
            el.checked = Array.isArray(data[key])
              ? data[key].includes(el.value)
              : data[key] === el.value;
          } else {
            el.value = data[key] || '';
          }
        }
      });
    }
  }, [rincianKejadian, selectedRow]);

  // Tab config
  const tabs = [
    { id: 'data-pasien', label: 'I. DATA PASIEN' },
    { id: 'rincian-kejadian', label: 'II. RINCIAN KEJADIAN' },
    { id: 'tanda-tangan', label: 'TANDA TANGAN' },
  ];

  return (
    <div className="grading-page pb-4">
      <div className="container-fluid p-0">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4 no-print">
          <div>
            <h1 className="h3 fw-bold mb-1">Grading Risiko Insiden</h1>
            <p className="text-muted small mb-0">
              Penilaian matriks risiko kejadian oleh Kepala Ruangan / Unit Terkait.
            </p>
          </div>
        </div>

        {/* List View */}
        {!selectedRow && (
          <div className="card-minimal p-0 overflow-hidden shadow-sm no-print">
            <div className="p-3 border-bottom bg-light bg-opacity-50">
              <h3 className="h6 mb-0 text-uppercase fw-bold ls-1">
                Daftar Pelaporan Menunggu Grading ({riwayatKronologiGrouped.length})
              </h3>
            </div>

            {/* Mobile Cards (d-md-none) */}
            <div className="d-md-none p-2 bg-light bg-opacity-25">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-spinner fa-spin h3 mb-2"></i>
                  <p className="small mb-0">Memuat data...</p>
                </div>
              ) : riwayatKronologiGrouped.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {riwayatKronologiGrouped.map((entry, index) => (
                    <div
                      key={index}
                      className="card-minimal p-3 bg-white border rounded-3 cursor-pointer shadow-none mobile-item-card"
                      onClick={() => selectRow(entry)}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-light text-dark border small fw-normal">
                          <i className="far fa-calendar-alt me-1 text-muted"></i>
                          {entry.Tanggal?.replace('T', ' ')}
                        </span>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>
                          {entry.no_transaksi}
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '240px' }}>
                            {entry.nama_pasien}
                          </div>
                          <div className="text-muted small mt-1 d-flex flex-wrap align-items-center gap-1">
                            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                              RM: {entry.no_rm}
                            </span>
                            {entry.pembuat?.map((nama, i) => (
                              <span key={i} className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>
                                <i className="far fa-user me-1"></i>{nama}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-primary ps-2">
                          <i className="fas fa-chevron-right small"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-clipboard-check h2 opacity-50 mb-2"></i>
                  <p className="small mb-0">Tidak ada laporan yang menunggu grading</p>
                </div>
              )}
            </div>

            {/* Desktop Table (d-none d-md-block) */}
            <div className="table-responsive d-none d-md-block">
              <table className="table-minimal align-middle">
                <thead>
                  <tr>
                    <th className="ps-4">No.</th>
                    <th>Tanggal</th>
                    <th>Nama Pasien</th>
                    <th>No Transaksi</th>
                    <th>Dibuat Oleh</th>
                    <th className="text-end pe-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatKronologiGrouped.map((entry, index) => (
                    <tr
                      key={index}
                      className="cursor-pointer hover-fade"
                      onClick={() => selectRow(entry)}
                    >
                      <td className="ps-4 text-muted small">#{index + 1}</td>
                      <td>
                        <small className="fw-medium">{entry.Tanggal?.replace('T', ' jam ')}</small>
                      </td>
                      <td>
                        <span className="fw-bold">{entry.nama_pasien}</span>{' '}
                        <span className="badge bg-light text-secondary border ms-1">
                          RM: {entry.no_rm}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-white text-primary border">
                          <small>{entry.no_transaksi}</small>
                        </span>
                      </td>
                      <td>
                        {entry.pembuat?.map((nama, i) => (
                          <span key={i} className="badge text-secondary bg-light border ms-1">
                            {nama}
                          </span>
                        ))}
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1" style={{ fontSize: '12px' }}>
                          Grade <i className="fas fa-arrow-right ms-1"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail View */}
        {selectedRow && (
          <div className="row g-4">
            <div className="col-12 no-print">
              <div className="p-3 bg-white border rounded-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-dark btn-sm rounded-circle flex-center"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => setSelectedRow(null)}
                    title="Kembali ke Daftar"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <div>
                    <div className="fw-bold text-dark fs-6">
                      {detailPasien?.NAMAPASIEN || selectedRow.nama_pasien}
                    </div>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      RM: <strong>{detailPasien?.KD_PASIEN || selectedRow.no_rm}</strong> • Trans: <strong>{selectedRow.no_transaksi}</strong>
                    </div>
                  </div>
                </div>

                {/* Mobile Kronologi Toggle Button */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-md-none rounded-pill px-3"
                  onClick={() => setShowKronologiMobile(!showKronologiMobile)}
                >
                  <i className={`fas ${showKronologiMobile ? 'fa-eye-slash' : 'fa-history'} me-1`}></i>
                  {showKronologiMobile ? 'Tutup Kronologi' : `Kronologi (${listKronologi.length})`}
                </button>
              </div>
            </div>

            {/* Left / Top: Detail Kronologi */}
            <div className={`col-12 col-md-4 no-print ${showKronologiMobile ? 'd-block' : 'd-none d-md-block'}`}>
              <div className="card-minimal p-3 bg-white shadow-sm border mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <h6 className="label-minimal mb-0">Detail Kronologi</h6>
                  <span className="badge bg-light text-muted border">{listKronologi.length} Kejadian</span>
                </div>
                {listKronologi.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr className="bg-light">
                          <th style={{ width: '40%' }}>Waktu</th>
                          <th>Uraian</th>
                        </tr>
                      </thead>
                      {listKronologi.map((kronologi, index) => {
                        let username = '-';
                        let uraianArr = [];
                        try {
                          username = JSON.parse(kronologi.dibuat_oleh).username;
                          uraianArr = JSON.parse(kronologi.Uraian);
                        } catch {}
                        return (
                          <tbody key={index}>
                            <tr className="table-secondary">
                              <td colSpan="2" className="small fw-semibold">
                                <i className="far fa-user me-1"></i>Oleh: {username}
                              </td>
                            </tr>
                            {uraianArr.map((uraian, idx) => (
                              <tr key={idx}>
                                <td>
                                  <span className="badge bg-light text-dark border small" style={{ fontSize: '9px' }}>
                                    {uraian.Tanggal}
                                  </span>
                                </td>
                                <td className="small">{uraian.Uraian}</td>
                              </tr>
                            ))}
                          </tbody>
                        );
                      })}
                    </table>
                  </div>
                ) : (
                  <div className="text-muted small py-3 text-center">Tidak ada catatan kronologi</div>
                )}
              </div>
            </div>

            {/* Right: Form Grading */}
            <div className="col-12 col-md-8">
              {detailPasien.KPNO_TRANSAKSI && (
                <div>
                  <div className="kop-surat mb-4 print w-100">
                    <img src="/kop_surat.jpg" alt="" className="w-100" />
                  </div>
                  <form ref={formRef} id="formInsiden" onSubmit={submitForm}>
                    {/* Mobile Pill-Style Tabs */}
                    <div className="mobile-tabs-container mb-3 no-print">
                      <div className="d-flex gap-2 p-1 bg-light rounded-pill border overflow-x-auto text-nowrap no-scrollbar">
                        {tabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-2 flex-fill text-nowrap transition-all ${
                              activeTab === tab.id
                                ? 'btn-dark shadow-sm fw-bold'
                                : 'btn-light border-0 text-muted'
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ minHeight: '38px', fontSize: '12px' }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content mb-4">
                      {/* Tab 1: Data Pasien */}
                      <div className={`tab-pane p-3 bg-white shadow mb-4 ${activeTab === 'data-pasien' ? 'active show' : 'd-none'}`}>
                        <h5>I. DATA PASIEN</h5>
                        <div className="mb-2">
                          <label className="form-label fw-bold">Nama</label>
                          <input type="text" className="form-control form-control-sm" value={detailPasien?.NAMAPASIEN || ''} disabled />
                        </div>
                        <div className="row mb-2">
                          <div className="col">
                            <label className="form-label fw-bold">No MR</label>
                            <input type="text" className="form-control form-control-sm" value={detailPasien?.KD_PASIEN || ''} disabled />
                          </div>
                          <div className="col">
                            <label className="form-label fw-bold">Ruangan</label>
                            <input type="text" className="form-control form-control-sm" />
                          </div>
                        </div>
                        <label className="form-label fw-bold">Umur</label>
                        <div className="mb-2">
                          <input type="text" className="form-control form-control-sm" value={umurPasien || ''} disabled />
                        </div>
                        <label className="form-label fw-bold">Jenis Kelamin</label>
                        <div className="mb-2">
                          <span>{detailPasien.JENIS_KELAMIN === '1' ? 'Laki-laki' : detailPasien.JENIS_KELAMIN === '2' ? 'Perempuan' : ''}</span>
                        </div>
                        <label className="form-label fw-bold">Penanggung biaya pasien</label>
                        <div className="mb-2">
                          <input type="text" className="form-control form-control-sm" value={detailPasien.KD_PERUSAHAAN ? `${detailPasien.KD_PERUSAHAAN} ${detailPasien.PEMEGANG_ASURANSI || ''}` : ''} disabled />
                        </div>
                        <div className="row mb-2">
                          <div className="col">
                            <label className="form-label fw-bold">Tanggal Masuk RS</label>
                            <input type="date" className="form-control form-control-sm" value={detailPasien.KPTGL_PERIKSA?.slice(0, 10) || ''} disabled />
                          </div>
                          <div className="col">
                            <label className="form-label fw-bold">Jam</label>
                            <input type="time" className="form-control form-control-sm" value={detailPasien.KPJAM_MASUK?.split('T')[1] || ''} disabled />
                          </div>
                        </div>
                      </div>

                      {/* Tab 2: Rincian Kejadian */}
                      <div className={`tab-pane p-3 bg-white shadow ${activeTab === 'rincian-kejadian' ? 'active show' : 'd-none'}`}>
                        <h5>II. RINCIAN KEJADIAN</h5>
                        <div className="row mb-2">
                          <div className="col">
                            <label className="form-label fw-bold">Tanggal Insiden</label>
                            <input type="date" className="form-control form-control-sm" name="tanggalinsiden" />
                          </div>
                          <div className="col">
                            <label className="form-label fw-bold">Jam</label>
                            <input type="time" className="form-control form-control-sm" name="jamInsiden" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="form-label fw-bold">Insiden</label>
                          <input type="text" className="form-control form-control-sm" name="insiden" />
                        </div>
                        <div className="mb-2">
                          <label className="form-label fw-bold">Kronologis Insiden</label>
                          <textarea className="form-control form-control-sm" rows="3" name="kronologiInsiden" placeholder="kronologi insiden"></textarea>
                        </div>

                        <label className="form-label fw-bold">Jenis Insiden *</label>
                        <div className="mb-2">
                          {[
                            { id: 'knc', value: 'KNC', label: 'Kejadian Nyaris Cedera / KNC (Near miss)' },
                            { id: 'ktd', value: 'KTD', label: 'Kejadian Tidak diharapkan / KTD (Adverse Event)' },
                            { id: 'sentinel', value: 'SENTINEL', label: 'Kejadian Sentinel (Sentinel Event)' },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="jenisInsiden" id={`grading-${item.id}`} value={item.value} required />
                              <label className="form-check-label" htmlFor={`grading-${item.id}`}>{item.label}</label>
                            </div>
                          ))}
                        </div>

                        <label className="form-label fw-bold">Orang Pertama Yang Melaporkan Insiden *</label>
                        <div className="mb-2">
                          {[
                            { id: 'karyawan', value: 'karyawan', label: 'Karyawan: Dokter / Perawat / Petugas lainnya' },
                            { id: 'pasien-pelapor', value: 'pasien', label: 'Pasien' },
                            { id: 'keluarga', value: 'keluarga', label: 'Keluarga / Pendamping Pasien' },
                            { id: 'pengunjung', value: 'pengunjung', label: 'Pengunjung' },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="pelaporPertama" id={`grading-${item.id}`} value={item.value} required />
                              <label className="form-check-label" htmlFor={`grading-${item.id}`}>{item.label}</label>
                            </div>
                          ))}
                          <div className="form-check">
                            <input className="form-check-input" type="radio" name="pelaporPertama" id="grading-lainlain1" value="lainlain" />
                            <label className="form-check-label" htmlFor="grading-lainlain1">Lain-lain</label>
                            <input type="text" className="form-control mt-2" name="pelaporPertamaText" placeholder="Sebutkan" />
                          </div>
                        </div>

                        <label className="form-label fw-bold">Insiden terjadi pada *</label>
                        <div className="mb-2">
                          <div className="form-check">
                            <input className="form-check-input" type="radio" name="insindentuj" id="grading-it-pasien" value="pasien" required />
                            <label className="form-check-label" htmlFor="grading-it-pasien">Pasien</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="radio" name="insindentuj" id="grading-it-lainlain" value="lainlain" required />
                            <label className="form-check-label" htmlFor="grading-it-lainlain">Lain-lain</label>
                            <input type="text" className="form-control form-control-sm mt-2" placeholder="Sebutkan, misal: Karyawan / Pengunjung" name="insindentujText" />
                          </div>
                        </div>

                        <label className="form-label fw-bold">Insiden menyangkut pasien</label>
                        <div className="mb-2">
                          {[
                            { id: 'rawatinap', value: 'pasien rawat inap', label: 'Pasien rawat inap' },
                            { id: 'rawatjalan', value: 'pasien rawat jalan', label: 'Pasien rawat jalan' },
                            { id: 'ugd', value: 'pasien ugd', label: 'Pasien UGD' },
                            { id: 'lainlain3', value: 'lainlain', label: 'Lain-lain' },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="insidenmenyangkut" id={`grading-im-${item.id}`} value={item.value} />
                              <label className="form-check-label" htmlFor={`grading-im-${item.id}`}>{item.label}</label>
                            </div>
                          ))}
                        </div>

                        <div className="mb-2">
                          <label className="form-label fw-bold">Insiden terjadi pada pasien</label>
                          <input type="text" className="form-control form-control-sm" name="insidenTerjadiPada" placeholder="Sebutkan detail spesialisasi" />
                        </div>

                        <div className="mb-2">
                          <label className="form-label fw-bold">Tempat Insiden</label>
                          <input type="text" className="form-control form-control-sm" name="tempatInsiden" placeholder="Lokasi kejadian (sebutkan)" />
                        </div>
                        <div className="mb-2">
                          <label className="form-label fw-bold">Unit Kerja tempat terjadinya insiden</label>
                          <input type="text" className="form-control form-control-sm" name="unitKerja" placeholder="Unit kerja (sebutkan)" />
                        </div>

                        <label className="form-label fw-bold">Akibat Insiden Terhadap Pasien *</label>
                        <div className="mb-2">
                          {[
                            { id: 'kematian', value: 'kematian', label: 'Kematian' },
                            { id: 'cederairreversibel', value: 'cedera irreversibel', label: 'Cedera Irreversibel / Cedera Berat' },
                            { id: 'cederareversibel', value: 'cedera reversibel', label: 'Cedera Reversibel / Cedera Sedang' },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="akibatinsiden" id={`grading-${item.id}`} value={item.value} />
                              <label className="form-check-label" htmlFor={`grading-${item.id}`}>{item.label}</label>
                            </div>
                          ))}
                        </div>

                        <div className="mb-2">
                          <label className="form-label fw-bold">Tindakan yang dilakukan segera setelah kejadian, dan hasilnya</label>
                          <textarea className="form-control form-control-sm" rows="3" name="tindakanHasil" placeholder="Sebutkan"></textarea>
                        </div>

                        <label className="form-label fw-bold">Tindakan dilakukan oleh *</label>
                        <div className="mb-2">
                          {[
                            { id: 'tim', value: 'tim', label: 'Tim', extra: <input type="text" className="form-control mt-2" name="dilakukanOlehTim" placeholder="Terdiri dari..." /> },
                            { id: 'dokter', value: 'dokter', label: 'Dokter' },
                            { id: 'perawat-pelaku', value: 'perawat', label: 'Perawat' },
                            { id: 'petugaslainnya', value: 'petugaslainnya', label: 'Petugas lainnya', extra: <input type="text" className="form-control mt-2" name="dilakukanOlehLainnya" placeholder="Sebutan" /> },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="dilakukanOleh" id={`grading-${item.id}`} value={item.value} required />
                              <label className="form-check-label" htmlFor={`grading-${item.id}`}>{item.label}</label>
                              {item.extra}
                            </div>
                          ))}
                        </div>

                        <label className="form-label fw-bold">Apakah kejadian yang sama pernah terjadi di Unit Kerja lain? *</label>
                        <div className="mb-2">
                          <div className="form-check">
                            <input className="form-check-input" type="radio" name="kejadiansama" id="grading-ks-ya" value="ya" required />
                            <label className="form-check-label" htmlFor="grading-ks-ya">Ya</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="radio" name="kejadiansama" id="grading-ks-tidak" value="tidak" required />
                            <label className="form-check-label" htmlFor="grading-ks-tidak">Tidak</label>
                          </div>
                        </div>

                        <div className="mb-2">
                          <label className="form-label fw-bold">Jika ya, kapan dan langkah/tindakan apa yang telah diambil?</label>
                          <textarea className="form-control form-control-sm" rows="3" name="kejadianSamaText" placeholder="Jelaskan langkah/tindakan"></textarea>
                        </div>

                        <label className="form-label fw-bold">Grading Risiko Kejadian * (Diisi oleh atasan pelapor)</label>
                        <div className="mb-2">
                          {[
                            { id: 'biru', value: 'biru', label: 'BIRU' },
                            { id: 'hijau', value: 'hijau', label: 'HIJAU' },
                            { id: 'kuning', value: 'kuning', label: 'KUNING' },
                            { id: 'merah', value: 'merah', label: 'MERAH' },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="gradingrisiko" id={`grading-${item.id}`} value={item.value} required />
                              <label className="form-check-label" htmlFor={`grading-${item.id}`}>{item.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tab 3: Tanda Tangan */}
                      <div className={`tab-pane p-3 bg-white shadow ${activeTab === 'tanda-tangan' ? 'active show' : 'd-none'}`}>
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Pembuat Laporan</label>
                            <p>{user?.username}</p>
                            <b>Tanda tangan:</b>
                            <SignatureCanvas base64={tandaTanganPelapor} onSave={setTandaTanganPelapor} />
                          </div>
                          <div className="col-md-6">
                            <div className="mb-1">
                              <label className="form-label fw-bold">Penerima Laporan</label>
                              <input type="text" className="form-control" value={penerimaLaporan} onChange={(e) => setPenerimaLaporan(e.target.value)} required />
                            </div>
                            <b>Tanda tangan:</b>
                            <SignatureCanvas base64={tandaTanganPenerima} onSave={setTandaTanganPenerima} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mb-5 p-3 no-print border-top bg-light rounded-3">
                      <button
                        type="button"
                        className="btn btn-outline-dark py-2 px-3 rounded-3 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => setSelectedRow(null)}
                        style={{ minHeight: '44px' }}
                      >
                        <i className="fas fa-chevron-left"></i> <span>Kembali</span>
                      </button>
                      <button
                        type="submit"
                        className="btn btn-dark py-2 px-4 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        style={{ minHeight: '44px' }}
                      >
                        <i className="fas fa-save"></i> <span>Simpan Grading</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-light border py-2 px-3 rounded-3 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => window.print()}
                        style={{ minHeight: '44px' }}
                      >
                        <i className="fas fa-print"></i> <span>Cetak</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
