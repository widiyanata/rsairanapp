import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import SignatureCanvas from '../../components/ui/SignatureCanvas';
import { showLoading, hideLoading } from '../../components/ui/LoadingOverlay';
import Swal from 'sweetalert2';

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
  const [statusVerifikasi, setStatusVerifikasi] = useState('MENUNGGU_VERIFIKASI');
  const [tglVerifikasi, setTglVerifikasi] = useState(null);
  const [verifiedByKasie, setVerifiedByKasie] = useState(null);
  const [gradingCreator, setGradingCreator] = useState(null);

  // Disposisi Kasie
  const [listKasie, setListKasie] = useState([]);
  const [kirimKeKasie, setKirimKeKasie] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('data-pasien');
  const [showKronologiMobile, setShowKronologiMobile] = useState(false);
  const [filterStatus, setFilterStatus] = useState('semua'); // 'semua' | 'menunggu_verifikasi' | 'terverifikasi' | 'menunggu_grading'
  const [searchQuery, setSearchQuery] = useState('');

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

  // Status helper
  const getGradingInfo = (noTransaksi) => {
    const g = riwayatGrading.find((item) => item.no_transaksi === noTransaksi);
    if (!g) {
      return {
        status: 'menunggu_grading',
        label: 'Menunggu Grading Karu',
        badgeClass: 'bg-warning-subtle text-warning border border-warning-subtle',
        icon: 'fas fa-pen-alt',
      };
    }
    if (g.status_verifikasi_kasie === 'TERVERIFIKASI' || g.tanda_tangan_penerima) {
      return {
        status: 'terverifikasi',
        label: 'Terverifikasi Kasie',
        badgeClass: 'bg-success-subtle text-success border border-success-subtle',
        icon: 'fas fa-check-circle',
        gradingData: g,
      };
    }
    return {
      status: 'menunggu_verifikasi',
      label: 'Menunggu Verifikasi Kasie',
      badgeClass: 'bg-info-subtle text-info border border-info-subtle',
      icon: 'fas fa-hourglass-half',
      gradingData: g,
    };
  };

  // Base list for current user role
  const userRoleBaseList = useMemo(() => {
    if (user?.role === 'kasie') {
      // Kasie only sees reports graded by Karu and designated to this Kasie (or unassigned legacy)
      return riwayatKronologiGrouped.filter((item) => {
        const g = riwayatGrading.find((gItem) => gItem.no_transaksi === item.no_transaksi);
        if (!g) return false;
        if (g.kirim_ke_kasie && String(g.kirim_ke_kasie) !== String(user.id)) {
          return false;
        }
        return true;
      });
    }
    return riwayatKronologiGrouped;
  }, [riwayatKronologiGrouped, riwayatGrading, user]);

  // Filtered list with search & status filter
  const filteredList = useMemo(() => {
    return userRoleBaseList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.nama_pasien?.toLowerCase().includes(q) ||
        item.no_rm?.toLowerCase().includes(q) ||
        item.no_transaksi?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === 'semua') return true;
      const info = getGradingInfo(item.no_transaksi);
      return info.status === filterStatus;
    });
  }, [userRoleBaseList, searchQuery, filterStatus, riwayatGrading]);

  // Counters for tabs
  const counts = useMemo(() => {
    let menungguGrading = 0;
    let menungguVerifikasi = 0;
    let terverifikasi = 0;

    userRoleBaseList.forEach((item) => {
      const info = getGradingInfo(item.no_transaksi);
      if (info.status === 'menunggu_grading') menungguGrading++;
      else if (info.status === 'menunggu_verifikasi') menungguVerifikasi++;
      else if (info.status === 'terverifikasi') terverifikasi++;
    });

    return {
      semua: userRoleBaseList.length,
      menungguGrading,
      menungguVerifikasi,
      terverifikasi,
    };
  }, [userRoleBaseList, riwayatGrading]);

  // API calls
  const getKronologi = async () => {
    setLoading(true);
    try {
      const [kronRes, gradRes] = await Promise.allSettled([
        api.get('/kronologi'),
        api.get('/grading'),
      ]);
      let kronologis = kronRes.status === 'fulfilled' ? (kronRes.value.data?.data || []) : [];
      if (user?.role === 'karu') {
        kronologis = kronologis.filter((r) => r.kirimke === user.id);
      }
      setRiwayatKronologi(kronologis);
      if (gradRes.status === 'fulfilled') {
        setRiwayatGrading(gradRes.value.data?.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getListKasie = async () => {
    try {
      const { data } = await api.get('/cariKaru?role=kasie');
      setListKasie(data.data || []);
    } catch (err) {
      console.error(err);
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
      if (noTransaksi && data.data?.length > 0) {
        const item = data.data[0];
        const parsed = JSON.parse(item.rincian_kejadian || '{}');
        setRincianKejadian(parsed);
        setTandaTanganPelapor(item.tanda_tangan_pelapor || null);
        setTandaTanganPenerima(item.tanda_tangan_penerima || null);
        setKirimKeKasie(item.kirim_ke_kasie ? String(item.kirim_ke_kasie) : '');

        setPenerimaLaporan(
          item.penerima_laporan || (user?.role === 'kasie' ? (user?.nama || user?.username) : '')
        );
        setStatusVerifikasi(
          item.status_verifikasi_kasie || (item.tanda_tangan_penerima ? 'TERVERIFIKASI' : 'MENUNGGU_VERIFIKASI')
        );
        setTglVerifikasi(item.tgl_verifikasi_kasie || null);

        try {
          setVerifiedByKasie(item.verified_by_kasie ? JSON.parse(item.verified_by_kasie) : null);
        } catch {
          setVerifiedByKasie(null);
        }

        try {
          setGradingCreator(item.dibuat_oleh ? JSON.parse(item.dibuat_oleh) : null);
        } catch {
          setGradingCreator(null);
        }
      } else {
        setRincianKejadian({});
        setTandaTanganPelapor(null);
        setTandaTanganPenerima(null);
        setKirimKeKasie('');
        setPenerimaLaporan(user?.role === 'kasie' ? (user?.nama || user?.username) : '');
        setStatusVerifikasi('MENUNGGU_VERIFIKASI');
        setTglVerifikasi(null);
        setVerifiedByKasie(null);
        setGradingCreator(null);
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

    const isKasie = user?.role === 'kasie';
    const isKaru = user?.role === 'karu';

    // Validation for Karu
    if (isKaru && !kirimKeKasie) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Kasie Tujuan',
        text: 'Silakan pilih Kepala Seksi (Kasie) tujuan verifikasi pada tab TTD & VERIFIKASI terlebih dahulu.',
        confirmButtonColor: '#1a1a1a',
      });
      setActiveTab('tanda-tangan');
      return;
    }

    if (isKaru && !tandaTanganPelapor) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanda Tangan Karu Diperlukan',
        text: 'Silakan goreskan tanda tangan Pembuat Laporan (tab TTD & VERIFIKASI) terlebih dahulu.',
        confirmButtonColor: '#1a1a1a',
      });
      setActiveTab('tanda-tangan');
      return;
    }

    // Validation for Kasie
    if (isKasie && !tandaTanganPenerima) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanda Tangan Kasie Diperlukan',
        text: 'Silakan goreskan tanda tangan pada kolom Verifikasi Kasie (tab TTD & VERIFIKASI) terlebih dahulu.',
        confirmButtonColor: '#1a1a1a',
      });
      setActiveTab('tanda-tangan');
      return;
    }

    showLoading();
    try {
      const formData = new FormData(e.target);
      const rincian = Object.fromEntries(formData);

      const finalStatus = isKasie && tandaTanganPenerima ? 'TERVERIFIKASI' : statusVerifikasi;
      const finalVerifiedBy = isKasie && tandaTanganPenerima ? {
        id: user?.id,
        username: user?.username,
        nama: user?.nama || user?.username,
        role: 'kasie',
      } : verifiedByKasie;

      const targetKasieObj = listKasie.find((k) => String(k.id) === String(kirimKeKasie));
      const finalPenerima = penerimaLaporan || targetKasieObj?.nama || (isKasie ? (user?.nama || user?.username) : '');

      const payload = {
        pasien: detailPasien,
        kejadian: rincian,
        dibuat_oleh: gradingCreator || dibuatOleh,
        tanda_tangan_pelapor: tandaTanganPelapor || null,
        tanda_tangan_penerima: tandaTanganPenerima || null,
        penerima_laporan: finalPenerima,
        status_verifikasi_kasie: finalStatus,
        verified_by_kasie: finalVerifiedBy,
        kirim_ke_kasie: kirimKeKasie ? parseInt(kirimKeKasie, 10) : (isKasie ? user?.id : null),
      };

      const res = await api.post('/grading', payload);
      if (res.data?.status) {
        Swal.fire({
          icon: 'success',
          title: isKasie ? 'Verifikasi Kasie Berhasil' : 'Grading Berhasil Dikirim',
          text: isKasie
            ? 'Laporan grading risiko telah berhasil diverifikasi & disahkan.'
            : `Data grading telah disimpan dan diteruskan ke Kasie (${targetKasieObj?.nama || 'Tujuan'}) untuk verifikasi.`,
          confirmButtonColor: '#1a1a1a',
          timer: 2400,
          showConfirmButton: false,
        });

        await getRiwayatGrading(selectedRow.no_transaksi);
        await getKronologi();
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan data grading', 'error');
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
    getListKasie();
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
    { id: 'data-pasien', label: 'I. DATA' },
    { id: 'rincian-kejadian', label: 'II. RINCIAN' },
    { id: 'tanda-tangan', label: 'TTD & VERIFIKASI' },
  ];

  return (
    <div className="grading-page pb-4">
      <div className="container-fluid p-0">
        {/* Page Header */}
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4 no-print">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className={`badge text-uppercase border ${
                user?.role === 'kasie'
                  ? 'bg-info-subtle text-info border-info-subtle'
                  : 'bg-primary-subtle text-primary border-primary-subtle'
              }`} style={{ fontSize: '11px' }}>
                Role: {user?.role === 'kasie' ? 'Kepala Seksi (Kasie)' : user?.role === 'karu' ? 'Kepala Ruangan (Karu)' : user?.role}
              </span>
              <span className="text-muted small">• IKP-2 Mutu</span>
            </div>
            <h1 className="h3 fw-bold mb-1">
              {user?.role === 'kasie' ? 'Verifikasi Grading Risiko' : 'Grading Risiko Insiden'}
            </h1>
            <p className="text-muted small mb-0">
              {user?.role === 'kasie'
                ? 'Verifikasi dan pengesahan (tanda tangan) data penilaian risiko yang ditujukan kepada Anda dari Kepala Ruangan.'
                : 'Penilaian matriks risiko kejadian oleh Kepala Ruangan (Karu) dan disposisi verifikasi ke Kepala Seksi (Kasie).'}
            </p>
          </div>
        </div>

        {/* List View */}
        {!selectedRow && (
          <div className="card-minimal p-0 overflow-hidden shadow-sm no-print mb-4">
            <div className="p-3 border-bottom bg-light bg-opacity-50 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h3 className="h6 mb-0 text-uppercase fw-bold ls-1">
                  Daftar Pelaporan Kejadian ({filteredList.length})
                </h3>
                <span className="small text-muted" style={{ fontSize: '12px' }}>
                  {user?.role === 'kasie'
                    ? 'Daftar grading risiko yang diteruskan oleh Karu ke bagian Anda'
                    : 'Pilih laporan untuk melakukan penilaian grading dan disposisi ke Kasie'}
                </span>
              </div>

              {/* Search Bar */}
              <div className="position-relative" style={{ minWidth: '260px' }}>
                <i className="fas fa-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 rounded-pill"
                  placeholder="Cari pasien / RM / no trans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-2 border-bottom bg-white overflow-x-auto text-nowrap no-scrollbar">
              <div className="d-flex gap-2">
                {[
                  { key: 'semua', label: 'Semua', count: counts.semua },
                  { key: 'menunggu_verifikasi', label: 'Menunggu Verifikasi Kasie', count: counts.menungguVerifikasi, highlight: user?.role === 'kasie' },
                  { key: 'terverifikasi', label: 'Terverifikasi', count: counts.terverifikasi },
                  ...(user?.role !== 'kasie' ? [{ key: 'menunggu_grading', label: 'Menunggu Grading Karu', count: counts.menungguGrading, highlight: user?.role === 'karu' }] : []),
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 transition-all ${
                      filterStatus === f.key
                        ? 'btn-dark fw-bold shadow-sm'
                        : f.highlight
                        ? 'btn-outline-primary'
                        : 'btn-light text-muted border'
                    }`}
                    onClick={() => setFilterStatus(f.key)}
                    style={{ fontSize: '12px' }}
                  >
                    <span>{f.label}</span>
                    <span className={`badge rounded-pill ${filterStatus === f.key ? 'bg-white text-dark' : 'bg-secondary bg-opacity-25 text-dark'}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Cards (d-md-none) */}
            <div className="d-md-none p-2 bg-light bg-opacity-25">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-spinner fa-spin h3 mb-2"></i>
                  <p className="small mb-0">Memuat data...</p>
                </div>
              ) : filteredList.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {filteredList.map((entry, index) => {
                    const info = getGradingInfo(entry.no_transaksi);
                    const assignedKasie = listKasie.find((k) => String(k.id) === String(info.gradingData?.kirim_ke_kasie));
                    return (
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
                          <span className={`badge ${info.badgeClass}`} style={{ fontSize: '10px' }}>
                            <i className={`${info.icon} me-1`}></i>
                            {info.label}
                          </span>
                        </div>

                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '220px' }}>
                              {entry.nama_pasien}
                            </div>
                            <div className="text-muted small mt-1 d-flex flex-wrap align-items-center gap-1">
                              <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                                RM: {entry.no_rm}
                              </span>
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>
                                {entry.no_transaksi}
                              </span>
                              {assignedKasie && (
                                <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '10px' }}>
                                  <i className="fas fa-user-shield me-1"></i>Kasie: {assignedKasie.nama}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-primary ps-2">
                            <i className="fas fa-chevron-right small"></i>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-clipboard-check h2 opacity-50 mb-2"></i>
                  <p className="small mb-0">Tidak ada laporan dengan filter ini</p>
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
                    <th>Kasie Tujuan</th>
                    <th>Status Verifikasi</th>
                    <th className="text-end pe-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((entry, index) => {
                    const info = getGradingInfo(entry.no_transaksi);
                    const assignedKasie = listKasie.find((k) => String(k.id) === String(info.gradingData?.kirim_ke_kasie));
                    return (
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
                        <td>
                          {assignedKasie ? (
                            <span className="badge bg-info-subtle text-info border border-info-subtle">
                              <i className="fas fa-user-shield me-1"></i>{assignedKasie.nama}
                            </span>
                          ) : (
                            <span className="text-muted small fst-italic">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${info.badgeClass} px-2 py-1`} style={{ fontSize: '11px' }}>
                            <i className={`${info.icon} me-1`}></i>
                            {info.label}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className={`btn btn-sm rounded-pill px-3 py-1 ${
                              user?.role === 'kasie' && info.status === 'menunggu_verifikasi'
                                ? 'btn-primary text-white shadow-sm'
                                : 'btn-outline-dark'
                            }`}
                            style={{ fontSize: '12px' }}
                          >
                            {user?.role === 'kasie'
                              ? info.status === 'terverifikasi' ? 'Lihat TTD' : 'Verifikasi TTD'
                              : 'Grade'} <i className="fas fa-arrow-right ms-1"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredList.length === 0 && !loading && (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <i className="fas fa-inbox h3 opacity-50 mb-2"></i>
                        <p className="small mb-0">Tidak ada laporan ditemukan</p>
                      </td>
                    </tr>
                  )}
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
                    <div className="d-flex align-items-center gap-2">
                      <div className="fw-bold text-dark fs-6">
                        {detailPasien?.NAMAPASIEN || selectedRow.nama_pasien}
                      </div>
                      <span className={`badge ${getGradingInfo(selectedRow.no_transaksi).badgeClass}`} style={{ fontSize: '10px' }}>
                        {getGradingInfo(selectedRow.no_transaksi).label}
                      </span>
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

                  {/* Mode Banner */}
                  {user?.role === 'kasie' && (
                    <div className="alert alert-info border-info border-opacity-25 d-flex align-items-center gap-3 mb-3 no-print">
                      <i className="fas fa-user-check fs-4 text-info"></i>
                      <div className="small">
                        <strong>Mode Verifikasi Kasie:</strong> Tinjau rincian kejadian dan grading risiko yang diisi oleh Kepala Ruangan (Karu), lalu berikan tanda tangan verifikasi pada tab <strong>TTD & VERIFIKASI</strong>.
                      </div>
                    </div>
                  )}

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
                            <input type="text" className="form-control form-control-sm" defaultValue={detailPasien?.RUANGAN || ''} />
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

                        <label className="form-label fw-bold">Grading Risiko Kejadian * (Diisi oleh atasan pelapor / Karu)</label>
                        <div className="mb-2">
                          {[
                            { id: 'biru', value: 'biru', label: 'BIRU', colorClass: 'text-primary' },
                            { id: 'hijau', value: 'hijau', label: 'HIJAU', colorClass: 'text-success' },
                            { id: 'kuning', value: 'kuning', label: 'KUNING', colorClass: 'text-warning' },
                            { id: 'merah', value: 'merah', label: 'MERAH', colorClass: 'text-danger' },
                          ].map((item) => (
                            <div key={item.id} className="form-check">
                              <input className="form-check-input" type="radio" name="gradingrisiko" id={`grading-${item.id}`} value={item.value} required />
                              <label className={`form-check-label fw-bold ${item.colorClass}`} htmlFor={`grading-${item.id}`}>{item.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tab 3: Tanda Tangan & Verifikasi Kasie */}
                      <div className={`tab-pane p-3 bg-white shadow ${activeTab === 'tanda-tangan' ? 'active show' : 'd-none'}`}>
                        {statusVerifikasi === 'TERVERIFIKASI' ? (
                          <div className="alert alert-success d-flex align-items-center gap-3 mb-4">
                            <i className="fas fa-check-circle fs-3 text-success"></i>
                            <div>
                              <div className="fw-bold">Laporan Grading Telah Terverifikasi</div>
                              <div className="small text-muted">
                                Diverifikasi dan disahkan oleh Kepala Seksi (Kasie): <strong>{penerimaLaporan || 'Kasie'}</strong>
                                {tglVerifikasi && ` pada ${new Date(tglVerifikasi).toLocaleString('id-ID')}`}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="alert alert-warning d-flex align-items-center gap-3 mb-4">
                            <i className="fas fa-clock fs-3 text-warning"></i>
                            <div>
                              <div className="fw-bold">Menunggu Verifikasi & Pengesahan Kasie</div>
                              <div className="small text-muted">
                                Data grading risiko yang diisi Kepala Ruangan (Karu) harus diverifikasi dan ditandatangani oleh Kepala Seksi (Kasie) bagian terkait.
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="row g-4">
                          {/* Pembuat Laporan (Karu) */}
                          <div className="col-md-6 border-end-md">
                            <div className="p-3 bg-light rounded-3 h-100">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-bold mb-0">I. Pembuat Laporan (Kepala Ruangan)</label>
                                {tandaTanganPelapor ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '11px' }}>
                                    <i className="fas fa-check me-1"></i>Sudah TTD
                                  </span>
                                ) : (
                                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '11px' }}>
                                    Belum TTD
                                  </span>
                                )}
                              </div>

                              <div className="text-muted small mb-3">
                                Nama: <strong className="text-dark">{gradingCreator?.user_name || (user?.role === 'karu' ? (user?.nama || user?.username) : 'Kepala Ruangan')}</strong>
                                {gradingCreator?.jabatan && <span className="ms-1">({gradingCreator.jabatan})</span>}
                              </div>

                              {/* If Kasie viewing: show Karu signature as image preview */}
                              {user?.role === 'kasie' ? (
                                <div>
                                  <span className="small text-muted d-block mb-2">Tanda Tangan Karu:</span>
                                  {tandaTanganPelapor ? (
                                    <div className="bg-white border rounded-3 p-3 text-center shadow-sm">
                                      <img
                                        src={tandaTanganPelapor}
                                        alt="Tanda Tangan Karu"
                                        style={{ maxHeight: '140px', maxWidth: '100%' }}
                                      />
                                      <div className="small text-muted border-top pt-2 mt-2">
                                        <i className="fas fa-signature text-success me-1"></i>Ditandatangani oleh Karu
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-white border rounded-3 p-4 text-center text-muted">
                                      <i className="fas fa-exclamation-triangle text-warning h3 mb-2 d-block"></i>
                                      <span className="small">Karu belum menandatangani laporan ini</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Karu or Admin signs here */
                                <div>
                                  <span className="small text-muted d-block mb-1">Goreskan Tanda Tangan:</span>
                                  <SignatureCanvas base64={tandaTanganPelapor} onSave={setTandaTanganPelapor} />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Penerima Laporan / Verifikasi (Kasie) */}
                          <div className="col-md-6">
                            <div className="p-3 bg-light rounded-3 h-100">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-bold mb-0">II. Penerima Laporan / Verifikasi (Kasie)</label>
                                {tandaTanganPenerima ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '11px' }}>
                                    <i className="fas fa-check-double me-1"></i>Terverifikasi Kasie
                                  </span>
                                ) : (
                                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '11px' }}>
                                    Menunggu Kasie
                                  </span>
                                )}
                              </div>

                              {/* Karu chooses Kasie from dropdown (Opsi 1) */}
                              {user?.role === 'karu' || user?.role === 'admin' ? (
                                <div className="mb-3">
                                  <label className="form-label small fw-bold text-dark mb-1">
                                    Pilih Kepala Seksi (Kasie) Tujuan Verifikasi: *
                                  </label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={kirimKeKasie}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setKirimKeKasie(val);
                                      const found = listKasie.find((k) => String(k.id) === String(val));
                                      if (found) {
                                        setPenerimaLaporan(found.nama);
                                      }
                                    }}
                                    required
                                  >
                                    <option value="">-- Pilih Kasie yang Membawahi Unit Ini --</option>
                                    {listKasie.map((k) => (
                                      <option key={k.id} value={k.id}>
                                        {k.nama} ({k.username})
                                      </option>
                                    ))}
                                  </select>
                                  <div className="text-muted small mt-1" style={{ fontSize: '11px' }}>
                                    <i className="fas fa-info-circle me-1"></i>Laporan grading risiko ini akan diteruskan ke akun Kasie yang dipilih untuk diverifikasi & ditandatangani.
                                  </div>
                                </div>
                              ) : (
                                /* Kasie views their assignment */
                                <div className="mb-3">
                                  <label className="form-label small fw-semibold text-muted mb-1">
                                    Kasie Verifikator:
                                  </label>
                                  <div className="p-2 bg-white border rounded small d-flex align-items-center justify-content-between">
                                    <div>
                                      <div className="fw-bold text-dark">
                                        {listKasie.find((k) => String(k.id) === String(kirimKeKasie))?.nama || penerimaLaporan || user?.nama || user?.username}
                                      </div>
                                      <div className="text-muted" style={{ fontSize: '11px' }}>Kepala Seksi (Kasie)</div>
                                    </div>
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>
                                      Ditugaskan
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* If Karu viewing: show Kasie signature as image preview */}
                              {user?.role === 'karu' ? (
                                <div>
                                  <span className="small text-muted d-block mb-2">Tanda Tangan Verifikasi Kasie:</span>
                                  {tandaTanganPenerima ? (
                                    <div className="bg-white border rounded-3 p-3 text-center shadow-sm">
                                      <img
                                        src={tandaTanganPenerima}
                                        alt="Tanda Tangan Kasie"
                                        style={{ maxHeight: '140px', maxWidth: '100%' }}
                                      />
                                      <div className="small text-success border-top pt-2 mt-2">
                                        <i className="fas fa-check-circle me-1"></i>Diverifikasi oleh: <strong>{penerimaLaporan}</strong>
                                        {tglVerifikasi && (
                                          <span className="d-block text-muted">{new Date(tglVerifikasi).toLocaleString('id-ID')}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-white border rounded-3 p-4 text-center text-muted">
                                      <i className="fas fa-clock text-secondary h3 mb-2 d-block"></i>
                                      <span className="small">Menunggu tanda tangan verifikasi dari Kepala Seksi (Kasie)</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Kasie or Admin can sign / verify */
                                <div>
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <span className="small text-muted">Goreskan Tanda Tangan Verifikasi Kasie:</span>
                                    {tandaTanganPenerima && (
                                      <span className="badge bg-success text-white" style={{ fontSize: '10px' }}>
                                        <i className="fas fa-check me-1"></i>TTD Tersimpan
                                      </span>
                                    )}
                                  </div>
                                  <SignatureCanvas base64={tandaTanganPenerima} onSave={setTandaTanganPenerima} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Printable Signatures Footer (Only visible when printing) */}
                        <div className="d-none d-print-block mt-5 pt-3 border-top">
                          <div className="row text-center">
                            <div className="col-6">
                              <p className="mb-2 fw-semibold">Pembuat Laporan (Kepala Ruangan):</p>
                              <div style={{ height: '90px' }} className="d-flex align-items-center justify-content-center">
                                {tandaTanganPelapor ? (
                                  <img src={tandaTanganPelapor} alt="TTD Karu" style={{ maxHeight: '80px', maxWidth: '180px' }} />
                                ) : (
                                  <span className="text-muted fst-italic small">Belum Ditandatangani</span>
                                )}
                              </div>
                              <p className="fw-bold mt-2 text-decoration-underline mb-0">
                                {gradingCreator?.user_name || (user?.role === 'karu' ? (user?.nama || user?.username) : '................................')}
                              </p>
                              <span className="small text-muted">Kepala Ruangan</span>
                            </div>

                            <div className="col-6">
                              <p className="mb-2 fw-semibold">Penerima Laporan / Verifikasi (Kasie):</p>
                              <div style={{ height: '90px' }} className="d-flex align-items-center justify-content-center">
                                {tandaTanganPenerima ? (
                                  <img src={tandaTanganPenerima} alt="TTD Kasie" style={{ maxHeight: '80px', maxWidth: '180px' }} />
                                ) : (
                                  <span className="text-muted fst-italic small">Belum Diverifikasi</span>
                                )}
                              </div>
                              <p className="fw-bold mt-2 text-decoration-underline mb-0">
                                {penerimaLaporan || listKasie.find((k) => String(k.id) === String(kirimKeKasie))?.nama || '................................'}
                              </p>
                              <span className="small text-muted">Kepala Seksi (Kasie)</span>
                            </div>
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

                      {user?.role === 'kasie' ? (
                        <button
                          type="submit"
                          className="btn btn-success py-2 px-4 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm text-white fw-bold"
                          style={{ minHeight: '44px' }}
                        >
                          <i className="fas fa-clipboard-check"></i>
                          <span>Verifikasi & Sahkan Grading (Kasie)</span>
                        </button>
                      ) : user?.role === 'karu' ? (
                        <button
                          type="submit"
                          className="btn btn-dark py-2 px-4 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                          style={{ minHeight: '44px' }}
                        >
                          <i className="fas fa-paper-plane"></i> <span>Simpan & Teruskan ke Kasie</span>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="btn btn-dark py-2 px-4 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                          style={{ minHeight: '44px' }}
                        >
                          <i className="fas fa-save"></i> <span>Simpan Data Grading</span>
                        </button>
                      )}

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
