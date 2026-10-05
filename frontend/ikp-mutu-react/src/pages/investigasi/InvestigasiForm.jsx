import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import Swal from 'sweetalert2';
import { showLoading, hideLoading } from '../../components/ui/LoadingOverlay';

export default function InvestigasiForm() {
  const { user } = useAuth();
  const formInvestigasiRef = useRef(null);
  const formDetailGradingRef = useRef(null);

  // State
  const [loading, setLoading] = useState(false);
  const [riwayatGrading, setRiwayatGrading] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailGrading, setDetailGrading] = useState(null);
  const [listKronologi, setListKronologi] = useState([]);
  const [rekomendasi, setRekomendasi] = useState([
    { Rekomendasi: '', Tindakan: '', PenanggungJawab: '', Tanggal: '' },
  ]);
  const [showDetailGrading, setShowDetailGrading] = useState(true);
  const [showDetailKronologi, setShowDetailKronologi] = useState(false);

  // Filter & Search state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'ready', 'investigated', 'pending_kasie'
  const [searchQuery, setSearchQuery] = useState('');

  // Helpers
  const getKaruName = (entry) => {
    if (!entry?.dibuat_oleh) return '-';
    try {
      const obj = typeof entry.dibuat_oleh === 'string' ? JSON.parse(entry.dibuat_oleh) : entry.dibuat_oleh;
      return obj?.user_name || obj?.nama || obj?.username || '-';
    } catch {
      return entry.dibuat_oleh || '-';
    }
  };

  const getKasieInfo = (entry) => {
    if (!entry) return { isVerified: false, name: '-', verifiedName: '-', date: null, ttd: null, targetKasie: null };

    const isVerified = entry.status_verifikasi_kasie === 'TERVERIFIKASI' || !!entry.tanda_tangan_penerima;
    let name = entry.penerima_laporan;

    if (!name && entry.verified_by_kasie) {
      try {
        const obj = typeof entry.verified_by_kasie === 'string' ? JSON.parse(entry.verified_by_kasie) : entry.verified_by_kasie;
        name = obj?.user_name || obj?.nama || obj?.username;
      } catch {}
    }

    let targetKasie = null;
    if (entry.kirim_ke_kasie) {
      try {
        const obj = typeof entry.kirim_ke_kasie === 'string' ? JSON.parse(entry.kirim_ke_kasie) : entry.kirim_ke_kasie;
        targetKasie = obj?.user_name || obj?.nama;
      } catch {}
    }

    return {
      isVerified,
      name: name || (targetKasie ? `${targetKasie}` : '-'),
      verifiedName: name || '-',
      targetKasie,
      date: entry.tgl_verifikasi_kasie || null,
      ttd: entry.tanda_tangan_penerima || null,
    };
  };

  const isKasieVerified = (entry) => {
    return entry?.status_verifikasi_kasie === 'TERVERIFIKASI' || !!entry?.tanda_tangan_penerima;
  };

  const hasInvestigasi = (entry) => {
    if (!entry?.investigasi) return false;
    try {
      const inv = typeof entry.investigasi === 'string' ? JSON.parse(entry.investigasi) : entry.investigasi;
      return Object.keys(inv || {}).length > 0;
    } catch {
      return false;
    }
  };

  const getGradeInfo = (entry) => {
    let rincian = {};
    try {
      rincian = typeof entry?.rincian_kejadian === 'string' ? JSON.parse(entry.rincian_kejadian) : (entry?.rincian_kejadian || {});
    } catch {}
    const grade = (rincian.gradingrisiko || '').toUpperCase();

    switch (grade) {
      case 'BIRU':
        return { grade: 'BIRU', badgeClass: 'bg-primary-subtle text-primary border border-primary', label: 'Biru' };
      case 'HIJAU':
        return { grade: 'HIJAU', badgeClass: 'bg-success-subtle text-success border border-success', label: 'Hijau' };
      case 'KUNING':
        return { grade: 'KUNING', badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning', label: 'Kuning' };
      case 'MERAH':
        return { grade: 'MERAH', badgeClass: 'bg-danger-subtle text-danger border border-danger', label: 'Merah' };
      default:
        return { grade: 'N/A', badgeClass: 'bg-light text-muted border', label: 'Belum Grade' };
    }
  };

  // Filter & Search calculations
  const counts = useMemo(() => {
    let ready = 0;
    let investigated = 0;
    let pendingKasie = 0;

    riwayatGrading.forEach((item) => {
      const isKasie = isKasieVerified(item);
      const isInv = hasInvestigasi(item);
      if (isKasie && !isInv) ready++;
      if (isInv) investigated++;
      if (!isKasie) pendingKasie++;
    });

    return {
      all: riwayatGrading.length,
      ready,
      investigated,
      pendingKasie,
    };
  }, [riwayatGrading]);

  const filteredGrading = useMemo(() => {
    return riwayatGrading.filter((item) => {
      const isKasie = isKasieVerified(item);
      const isInv = hasInvestigasi(item);

      if (activeTab === 'ready' && (!isKasie || isInv)) return false;
      if (activeTab === 'investigated' && !isInv) return false;
      if (activeTab === 'pending_kasie' && isKasie) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pasien = (item.NAMAPASIEN || '').toLowerCase();
        const noRm = (item.no_rm || '').toLowerCase();
        const noTrans = (item.no_transaksi || '').toLowerCase();
        const karu = getKaruName(item).toLowerCase();
        const kasie = getKasieInfo(item).name.toLowerCase();

        return (
          pasien.includes(q) ||
          noRm.includes(q) ||
          noTrans.includes(q) ||
          karu.includes(q) ||
          kasie.includes(q)
        );
      }

      return true;
    });
  }, [riwayatGrading, activeTab, searchQuery]);

  // API calls
  const getRiwayatGrading = async () => {
    try {
      const { data } = await api.get('/grading');
      setRiwayatGrading(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getDetailGrading = (data) => {
    setDetailGrading(data);
    const rekom = data.rekomendasi ? JSON.parse(data.rekomendasi) : [
      { Rekomendasi: '', Tindakan: '', PenanggungJawab: '', Tanggal: '' },
    ];
    setRekomendasi(rekom || [{ Rekomendasi: '', Tindakan: '', PenanggungJawab: '', Tanggal: '' }]);
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
      const investigasi = Object.fromEntries(formData);

      const res = await api.post('/investigasi', {
        pasien: {
          KD_PASIEN: selectedRow.KD_PASIEN,
          no_transaksi: selectedRow.no_transaksi,
        },
        investigasi,
        dibuat_oleh: sessionStorage.getItem('user'),
        rekomendasi: rekomendasi || '',
      });

      Swal.fire({
        icon: 'success',
        title: 'Investigasi Berhasil Disimpan',
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        getRiwayatGrading();
        setSelectedRow(null);
      });
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const verifikasiKronologi = async (noTransaksi) => {
    showLoading();
    try {
      const { data } = await api.post('/verifikasiKronologi', {
        no_transaksi: noTransaksi,
        status: 1,
        oleh: sessionStorage.getItem('user'),
      });
      if (data.data?.length > 0) {
        getRiwayatGrading();
        setSelectedRow(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const selectRow = (row) => {
    if (selectedRow === row) {
      setSelectedRow(null);
    } else {
      setSelectedRow(row);
      getDetailGrading(row);
      getListKronologi(row.no_transaksi);
    }
  };

  // Rekomendasi table management
  const tambahRowRekomendasi = () => {
    const newRow = { Rekomendasi: '', Tindakan: '', PenanggungJawab: '', Tanggal: '' };
    setRekomendasi((prev) => (prev ? [...prev, newRow] : [newRow]));
  };

  const hapusRowRekomendasi = (index) => {
    setRekomendasi((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRekomendasi = (index, field, value) => {
    setRekomendasi((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Set form values when detail changes & Auto-fill from grading
  useEffect(() => {
    if (formDetailGradingRef.current && detailGrading) {
      const data = detailGrading.rincian_kejadian ? JSON.parse(detailGrading.rincian_kejadian) : {};
      const isEmpty = Object.keys(data).length === 0;
      formDetailGradingRef.current.querySelectorAll('[name]').forEach((el) => {
        el.disabled = true;
        if (isEmpty) {
          if (el.type === 'radio' || el.type === 'checkbox') el.checked = false;
          else el.value = '';
        } else {
          const key = el.name;
          if (el.type === 'radio' || el.type === 'checkbox') {
            el.checked = Array.isArray(data[key]) ? data[key].includes(el.value) : data[key] === el.value;
          } else {
            el.value = data[key] || '';
          }
        }
      });
    }

    if (formInvestigasiRef.current && detailGrading) {
      const data = detailGrading.investigasi ? JSON.parse(detailGrading.investigasi) : {};
      const isEmpty = Object.keys(data).length === 0;

      // Sinkronkan Karu, Kasie & Grade Risiko dari data grading
      const karuName = getKaruName(detailGrading);
      const kasieInfo = getKasieInfo(detailGrading);
      const rincian = detailGrading.rincian_kejadian ? JSON.parse(detailGrading.rincian_kejadian) : {};
      const gradeColor = (rincian.gradingrisiko || 'BIRU').toUpperCase();

      formInvestigasiRef.current.querySelectorAll('[name]').forEach((el) => {
        const key = el.name;
        if (isEmpty) {
          if (el.type === 'radio' || el.type === 'checkbox') {
            el.checked = false;
          } else if (key === 'kepalaRuangan') {
            el.value = karuName !== '-' ? karuName : '';
          } else if (key === 'kasieKasubag') {
            el.value = kasieInfo.verifiedName !== '-' ? kasieInfo.verifiedName : (kasieInfo.targetKasie || '');
          } else if (key === 'grading') {
            el.value = ['BIRU', 'HIJAU', 'KUNING', 'MERAH'].includes(gradeColor) ? gradeColor : 'BIRU';
          } else if (key === 'tglMulai' || key === 'tglAnalisa') {
            el.value = new Date().toISOString().split('T')[0];
          } else {
            el.value = '';
          }
        } else {
          if (el.type === 'radio' || el.type === 'checkbox') {
            el.checked = Array.isArray(data[key]) ? data[key].includes(el.value) : data[key] === el.value;
          } else {
            let val = data[key] || '';
            // Autofill fallback jika field tersimpan masih kosong
            if (!val) {
              if (key === 'kepalaRuangan' && karuName !== '-') val = karuName;
              if (key === 'kasieKasubag' && kasieInfo.verifiedName !== '-') val = kasieInfo.verifiedName;
              if (key === 'grading') val = ['BIRU', 'HIJAU', 'KUNING', 'MERAH'].includes(gradeColor) ? gradeColor : 'BIRU';
            }
            el.value = val;
          }
        }
      });
    }
  }, [detailGrading]);

  useEffect(() => {
    getRiwayatGrading();
  }, []);

  return (
    <div className="investigasi-page pb-4 w-100 overflow-hidden">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4 no-print">
        <div>
          <h1 className="h3 fw-bold mb-1">Investigasi Insiden</h1>
          <p className="text-muted small mb-0">
            Laporan investigasi keselamatan pasien oleh Komite Mutu terintegrasi dengan grading & verifikasi Kasie.
          </p>
        </div>
      </div>

      <div className="row g-3 g-lg-4">
        {/* Left: Riwayat Grading */}
        <div className="col-12 col-lg-5 no-print" style={{ minWidth: 0 }}>
            <div className="card-minimal p-0 overflow-hidden shadow-sm mb-4">
              <div className="p-3 border-bottom bg-light bg-opacity-50">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h3 className="h6 mb-0 text-uppercase fw-bold ls-1">
                    Riwayat Grading ({riwayatGrading.length})
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="d-flex flex-wrap gap-1 mb-2">
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2 py-1 ${activeTab === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setActiveTab('all')}
                  >
                    Semua ({counts.all})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2 py-1 ${activeTab === 'ready' ? 'btn-success' : 'btn-outline-success'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setActiveTab('ready')}
                    title="Sudah diverifikasi Kasie dan siap diinvestigasi oleh Komite Mutu"
                  >
                    <i className="fas fa-check-double me-1"></i>
                    Siap Investigasi ({counts.ready})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2 py-1 ${activeTab === 'investigated' ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setActiveTab('investigated')}
                  >
                    Selesai ({counts.investigated})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-pill px-2 py-1 ${activeTab === 'pending_kasie' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setActiveTab('pending_kasie')}
                  >
                    Menunggu Kasie ({counts.pendingKasie})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="position-relative">
                  <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '12px' }}></i>
                  <input
                    type="text"
                    className="form-control form-control-sm ps-5 rounded-pill"
                    placeholder="Cari pasien, RM, no trans, kasie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                      onClick={() => setSearchQuery('')}
                      style={{ fontSize: '11px' }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Card List (d-md-none) */}
              <div className="d-md-none p-2 bg-light bg-opacity-25">
                {filteredGrading.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {filteredGrading.map((entry, index) => {
                      const isSelected = selectedRow === entry;
                      const kasieInfo = getKasieInfo(entry);
                      const gradeInfo = getGradeInfo(entry);
                      const isInv = hasInvestigasi(entry);
                      return (
                        <div
                          key={index}
                          onClick={() => selectRow(entry)}
                          className={`card-minimal p-3 bg-white border rounded-3 cursor-pointer shadow-none mobile-item-card ${
                            isSelected ? 'border-primary border-2 shadow-sm' : ''
                          }`}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-light text-dark border small fw-normal">
                              <i className="far fa-calendar-alt me-1 text-muted"></i>
                              {entry.created_at?.split('T')[0]}
                            </span>
                            <span className={`badge rounded-pill fw-bold px-2 py-1 ${gradeInfo.badgeClass}`} style={{ fontSize: '10px' }}>
                              Grade: {gradeInfo.label}
                            </span>
                          </div>

                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '240px' }}>
                            {entry.NAMAPASIEN}
                          </div>
                          <div className="text-muted small mt-1 d-flex flex-wrap align-items-center gap-1">
                            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                              RM: {entry.no_rm}
                            </span>
                            <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>
                              {entry.no_transaksi}
                            </span>
                          </div>

                          {/* Status Verifikasi Kasie & Investigasi */}
                          <div className="d-flex flex-wrap gap-1 mt-2 pt-2 border-top">
                            {kasieInfo.isVerified ? (
                              <span className="badge bg-success-subtle text-success border border-success fw-normal" style={{ fontSize: '10px' }}>
                                <i className="fas fa-check-circle me-1"></i> Kasie: {kasieInfo.verifiedName}
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning fw-normal" style={{ fontSize: '10px' }}>
                                <i className="fas fa-clock me-1"></i> Menunggu Kasie {kasieInfo.targetKasie ? `(${kasieInfo.targetKasie})` : ''}
                              </span>
                            )}

                            {isInv ? (
                              <span className="badge bg-primary-subtle text-primary border border-primary fw-normal" style={{ fontSize: '10px' }}>
                                <i className="fas fa-clipboard-check me-1"></i> Selesai Diinvestigasi
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>
                                Belum Diinvestigasi
                              </span>
                            )}
                          </div>

                          {!entry.verifikasi && isSelected && (
                            <div className="mt-3 pt-2 border-top">
                              <button
                                className="btn btn-sm btn-outline-success w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  verifikasiKronologi(entry.no_transaksi);
                                }}
                                style={{ minHeight: '38px', fontSize: '12px' }}
                              >
                                <i className="fas fa-check-double"></i>
                                <span>Verifikasi Kronologi Ini</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-inbox h2 opacity-50 mb-2"></i>
                    <p className="small mb-0">Tidak ada riwayat grading yang sesuai</p>
                  </div>
                )}
              </div>

              {/* Desktop Table (d-none d-md-block) */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-sm table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3" style={{ width: '35px' }}>#</th>
                      <th>Pasien & Insiden</th>
                      <th style={{ width: '85px' }}>Grade</th>
                      <th>Verifikasi Kasie</th>
                      <th style={{ width: '100px' }}>Investigasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrading.length > 0 ? (
                      filteredGrading.map((entry, index) => {
                        const isSelected = selectedRow === entry;
                        const kasieInfo = getKasieInfo(entry);
                        const gradeInfo = getGradeInfo(entry);
                        const isInv = hasInvestigasi(entry);
                        return (
                          <React.Fragment key={index}>
                            <tr
                              onClick={() => selectRow(entry)}
                              className={`cursor-pointer ${isSelected ? 'table-active border-primary' : ''} ${kasieInfo.isVerified ? 'bg-success bg-opacity-10' : ''}`}
                            >
                              <td className="ps-3 fw-bold small text-muted">{index + 1}</td>
                              <td>
                                <div className="fw-bold small text-dark text-truncate" style={{ maxWidth: '170px' }}>
                                  {entry.NAMAPASIEN}
                                </div>
                                <div className="d-flex align-items-center gap-1 mt-1">
                                  <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '9px' }}>
                                    RM: {entry.no_rm}
                                  </span>
                                  <span className="badge bg-light text-muted border" style={{ fontSize: '9px' }}>
                                    {entry.no_transaksi}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge rounded-pill fw-bold px-2 py-1 ${gradeInfo.badgeClass}`} style={{ fontSize: '10px' }}>
                                  {gradeInfo.label}
                                </span>
                              </td>
                              <td>
                                {kasieInfo.isVerified ? (
                                  <div>
                                    <span className="badge bg-success-subtle text-success border border-success fw-normal py-1" style={{ fontSize: '10px' }}>
                                      <i className="fas fa-check-circle me-1"></i> Disahkan Kasie
                                    </span>
                                    <div className="small text-muted text-truncate mt-1" style={{ fontSize: '10px', maxWidth: '140px' }} title={kasieInfo.verifiedName}>
                                      {kasieInfo.verifiedName}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning fw-normal py-1" style={{ fontSize: '10px' }}>
                                      <i className="fas fa-clock me-1"></i> Menunggu Kasie
                                    </span>
                                    {kasieInfo.targetKasie && (
                                      <div className="small text-muted text-truncate mt-1" style={{ fontSize: '10px', maxWidth: '140px' }}>
                                        Ke: {kasieInfo.targetKasie}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>
                                {isInv ? (
                                  <span className="badge bg-primary-subtle text-primary border border-primary fw-normal" style={{ fontSize: '10px' }}>
                                    <i className="fas fa-check me-1"></i> Selesai
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>
                                    Belum
                                  </span>
                                )}
                              </td>
                            </tr>
                            {!entry.verifikasi && isSelected && (
                              <tr className="bg-light">
                                <td colSpan="5" className="ps-3 py-2">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <small className="text-muted">Kronologi insiden ini belum diverifikasi sistem:</small>
                                    <button
                                      className="btn btn-xs btn-outline-success rounded-pill px-3 py-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        verifikasiKronologi(entry.no_transaksi);
                                      }}
                                      style={{ fontSize: '11px' }}
                                    >
                                      <i className="fas fa-check-double me-1"></i> Verifikasi Kronologi
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted small">
                          <i className="fas fa-inbox me-1"></i> Tidak ada data riwayat grading yang sesuai
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Accordion: Detail Grading & Kronologi */}
          {detailGrading && selectedRow && (
            <div className="mb-4">
              {/* Detail Grading Accordion */}
              <div className="border rounded mb-2 overflow-hidden shadow-sm">
                <button
                  className="w-100 btn btn-light fw-bold text-start p-3 d-flex align-items-center justify-content-between"
                  onClick={() => setShowDetailGrading(!showDetailGrading)}
                >
                  <span className="d-flex align-items-center gap-2">
                    <i className="fas fa-file-alt text-primary"></i>
                    <span>Detail Grading & Pengesahan</span>
                  </span>
                  <span className="small text-muted">{showDetailGrading ? '▲ Tutup' : '▼ Lihat'}</span>
                </button>
                {showDetailGrading && (
                  <div className="p-3 bg-white" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    {/* Kartu Bukti Pengesahan Karu & Kasie */}
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold small text-uppercase text-secondary">
                          <i className="fas fa-signature text-primary me-1"></i> Pengesahan Berjenjang (Karu & Kasie)
                        </span>
                        {isKasieVerified(detailGrading) ? (
                          <span className="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1" style={{ fontSize: '10px' }}>
                            <i className="fas fa-shield-alt me-1"></i> Terverifikasi Kasie
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-1" style={{ fontSize: '10px' }}>
                            <i className="fas fa-clock me-1"></i> Menunggu Kasie
                          </span>
                        )}
                      </div>

                      <div className="row g-2">
                        {/* Kolom Karu */}
                        <div className="col-12 col-sm-6">
                          <div className="bg-white p-2 rounded border h-100">
                            <div className="text-muted" style={{ fontSize: '10px' }}>Kepala Ruangan (Pelapor):</div>
                            <div className="fw-bold small text-dark mt-1">{getKaruName(detailGrading)}</div>
                            {detailGrading.tanda_tangan_pelapor ? (
                              <div className="mt-2 text-center bg-light p-1 rounded border">
                                <img
                                  src={detailGrading.tanda_tangan_pelapor}
                                  alt="TTD Karu"
                                  style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
                                />
                                <div className="text-success mt-1 fw-medium" style={{ fontSize: '9px' }}>
                                  ✓ Ditandatangani Karu
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted small mt-2 text-center py-2 bg-light rounded" style={{ fontSize: '10px' }}>
                                Belum ada TTD Karu
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Kolom Kasie */}
                        <div className="col-12 col-sm-6">
                          <div className={`p-2 rounded border h-100 ${isKasieVerified(detailGrading) ? 'bg-white border-success' : 'bg-white border-warning'}`}>
                            <div className="text-muted" style={{ fontSize: '10px' }}>Kepala Seksi (Verifikator):</div>
                            <div className="fw-bold small text-dark mt-1">
                              {detailGrading.penerima_laporan || getKasieInfo(detailGrading).name}
                            </div>
                            {detailGrading.tanda_tangan_penerima ? (
                              <div className="mt-2 text-center bg-light p-1 rounded border border-success">
                                <img
                                  src={detailGrading.tanda_tangan_penerima}
                                  alt="TTD Kasie"
                                  style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
                                />
                                <div className="text-success mt-1 fw-medium" style={{ fontSize: '9px' }}>
                                  ✓ Terverifikasi Kasie
                                  {detailGrading.tgl_verifikasi_kasie && (
                                    <span className="text-muted ms-1" style={{ fontSize: '8px' }}>
                                      ({detailGrading.tgl_verifikasi_kasie.split('T')[0]})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-warning-emphasis small mt-2 text-center py-2 bg-warning-subtle rounded" style={{ fontSize: '10px' }}>
                                <i className="fas fa-clock me-1"></i> Belum ditandatangani Kasie
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <form ref={formDetailGradingRef}>
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
                        <textarea className="form-control form-control-sm" rows="3" name="kronologiInsiden"></textarea>
                      </div>
                      <label className="form-label fw-bold">Jenis Insiden</label>
                      <div className="mb-2">
                        {['KNC', 'KTD', 'SENTINEL'].map((val) => (
                          <div key={val} className="form-check">
                            <input className="form-check-input" type="radio" name="jenisInsiden" id={`inv-ji-${val}`} value={val} />
                            <label className="form-check-label" htmlFor={`inv-ji-${val}`}>{val}</label>
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
                            <input className="form-check-input" type="radio" name="pelaporPertama" id={`inv-${item.id}`} value={item.value} />
                            <label className="form-check-label" htmlFor={`inv-${item.id}`}>{item.label}</label>
                          </div>
                        ))}
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="pelaporPertama" id="inv-lainlain1" value="lainlain" />
                          <label className="form-check-label" htmlFor="inv-lainlain1">Lain-lain</label>
                          <input type="text" className="form-control mt-2" name="pelaporPertamaText" placeholder="Sebutkan" />
                        </div>
                      </div>

                      <label className="form-label fw-bold">Insiden terjadi pada *</label>
                      <div className="mb-2">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="insindentuj" id="inv-it-pasien" value="pasien" />
                          <label className="form-check-label" htmlFor="inv-it-pasien">Pasien</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="insindentuj" id="inv-it-lainlain" value="lainlain" />
                          <label className="form-check-label" htmlFor="inv-it-lainlain">Lain-lain</label>
                          <input type="text" className="form-control form-control-sm mt-2" placeholder="Sebutkan" name="insindentujText" />
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
                            <input className="form-check-input" type="radio" name="insidenmenyangkut" id={`inv-im-${item.id}`} value={item.value} />
                            <label className="form-check-label" htmlFor={`inv-im-${item.id}`}>{item.label}</label>
                          </div>
                        ))}
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-bold">Tempat Insiden</label>
                        <input type="text" className="form-control form-control-sm" name="tempatInsiden" placeholder="Lokasi kejadian" />
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-bold">Insiden terjadi pada pasien</label>
                        <input type="text" className="form-control form-control-sm" name="insidenTerjadiPada" placeholder="Sebutkan detail spesialisasi" />
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-bold">Unit Kerja tempat terjadinya insiden</label>
                        <input type="text" className="form-control form-control-sm" name="unitKerja" placeholder="Unit kerja" />
                      </div>

                      <label className="form-label fw-bold">Akibat Insiden Terhadap Pasien *</label>
                      <div className="mb-2">
                        {[
                          { id: 'kematian', value: 'kematian', label: 'Kematian' },
                          { id: 'cederairreversibel', value: 'cedera irreversibel', label: 'Cedera Irreversibel / Cedera Berat' },
                          { id: 'cederareversibel', value: 'cedera reversibel', label: 'Cedera Reversibel / Cedera Sedang' },
                        ].map((item) => (
                          <div key={item.id} className="form-check">
                            <input className="form-check-input" type="radio" name="akibatinsiden" id={`inv-ak-${item.id}`} value={item.value} />
                            <label className="form-check-label" htmlFor={`inv-ak-${item.id}`}>{item.label}</label>
                          </div>
                        ))}
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-bold">Tindakan yang dilakukan segera setelah kejadian, dan hasilnya</label>
                        <textarea className="form-control form-control-sm" rows="3" name="tindakanHasil" placeholder="Tindakan segera & hasil"></textarea>
                      </div>

                      <label className="form-label fw-bold">Tindakan dilakukan oleh *</label>
                      <div className="mb-2">
                        {[
                          { id: 'tim', value: 'tim', label: 'Tim', extra: <input type="text" className="form-control mt-2" name="dilakukanOlehTim" placeholder="Terdiri dari..." /> },
                          { id: 'dokter', value: 'dokter', label: 'Dokter' },
                          { id: 'perawat', value: 'perawat', label: 'Perawat' },
                          { id: 'petugaslainnya', value: 'petugaslainnya', label: 'Petugas lainnya', extra: <input type="text" className="form-control mt-2" name="dilakukanOlehLainnya" placeholder="Sebutan" /> },
                        ].map((item) => (
                          <div key={item.id} className="form-check">
                            <input className="form-check-input" type="radio" name="dilakukanOleh" id={`inv-do-${item.id}`} value={item.value} />
                            <label className="form-check-label" htmlFor={`inv-do-${item.id}`}>{item.label}</label>
                            {item.extra}
                          </div>
                        ))}
                      </div>

                      <label className="form-label fw-bold">Apakah kejadian yang sama pernah terjadi di Unit Kerja lain? *</label>
                      <div className="mb-2">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="kejadiansama" id="inv-ks-ya" value="ya" />
                          <label className="form-check-label" htmlFor="inv-ks-ya">Ya</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="kejadiansama" id="inv-ks-tidak" value="tidak" />
                          <label className="form-check-label" htmlFor="inv-ks-tidak">Tidak</label>
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-bold">Jika ya, kapan dan langkah/tindakan apa yang telah diambil?</label>
                        <textarea className="form-control form-control-sm" rows="3" name="kejadianSamaText" placeholder="Jelaskan langkah/tindakan"></textarea>
                      </div>

                      <label className="form-label fw-bold">Grading Risiko</label>
                      <div className="mb-2">
                        {['biru', 'hijau', 'kuning', 'merah'].map((val) => (
                          <div key={val} className="form-check">
                            <input className="form-check-input" type="radio" name="gradingrisiko" id={`inv-gr-${val}`} value={val} />
                            <label className="form-check-label" htmlFor={`inv-gr-${val}`}>{val.toUpperCase()}</label>
                          </div>
                        ))}
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Detail Kronologi Accordion */}
              <div className="border rounded">
                <button
                  className="w-100 btn btn-light fw-bold text-start p-3"
                  onClick={() => setShowDetailKronologi(!showDetailKronologi)}
                >
                  Detail Kronologi {showDetailKronologi ? '▲' : '▼'}
                </button>
                {showDetailKronologi && listKronologi.length > 0 && (
                  <div className="p-3">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr><th>Tgl.</th><th>Uraian</th></tr>
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
                            <tr className="table-warning">
                              <td colSpan="2">Dibuat Oleh: {username}</td>
                            </tr>
                            {uraianArr.map((u, idx) => (
                              <tr key={idx}>
                                <td><span className="badge bg-white text-dark border">{u.Tanggal}</span></td>
                                <td>{u.Uraian}</td>
                              </tr>
                            ))}
                          </tbody>
                        );
                      })}
                    </table>
                  </div>
                )}
              </div>
              <hr />
            </div>
          )}
        </div>

        {/* Right: Investigasi Form */}
        <div className={`col-12 col-lg-7 ${!detailGrading || !selectedRow ? 'd-none' : ''}`} style={{ minWidth: 0 }}>
          <div className="card-minimal p-3 p-sm-4 bg-white border rounded-3 shadow-sm w-100 overflow-hidden">
            <div className="kop-surat mb-4 print">
              <img className="w-100" src="/kop_surat.jpg" alt="" />
            </div>
            
            <h2 className="text-center mb-3 h5 fw-bold text-uppercase">
              FORM LAPORAN INVESTIGASI SEDERHANA
            </h2>

            {/* Banner Status Verifikasi Kasie */}
            {selectedRow && (
              isKasieVerified(selectedRow) ? (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2 px-3 rounded-3 border-success no-print">
                  <i className="fas fa-shield-alt text-success fs-5"></i>
                  <div>
                    <div className="fw-bold small text-success">
                      ✓ Grading Telah Disahkan Kasie
                    </div>
                    <div className="small text-muted" style={{ fontSize: '11px' }}>
                      Diverifikasi & disahkan oleh <strong>{getKasieInfo(selectedRow).verifiedName}</strong>
                      {selectedRow.tgl_verifikasi_kasie && (
                        <span> pada {new Date(selectedRow.tgl_verifikasi_kasie).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}. Laporan siap diinvestigasi oleh Komite Mutu.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-4 py-2 px-3 rounded-3 border-warning no-print">
                  <i className="fas fa-exclamation-triangle text-warning-emphasis fs-5"></i>
                  <div>
                    <div className="fw-bold small text-warning-emphasis">
                      ⚠️ Menunggu Verifikasi Kepala Seksi (Kasie)
                    </div>
                    <div className="small text-muted" style={{ fontSize: '11px' }}>
                      Laporan grading ini belum ditandatangani oleh Kasie terkait
                      {getKasieInfo(selectedRow).targetKasie && ` (${getKasieInfo(selectedRow).targetKasie})`}.
                      Komite Mutu disarankan menunggu verifikasi Kasie sebelum menyelesaikan investigasi.
                    </div>
                  </div>
                </div>
              )
            )}

            <form ref={formInvestigasiRef} onSubmit={submitForm}>
              {/* Pasien Info */}
              <div className="mb-3">
                <label className="label-minimal mb-1">Informasi Pasien</label>
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <input
                    type="text"
                    className="input-minimal flex-grow-1"
                    value={selectedRow?.NAMAPASIEN || ''}
                    disabled
                    placeholder="Nama Pasien"
                  />
                  <input
                    type="text"
                    className="input-minimal"
                    style={{ maxWidth: '140px' }}
                    value={selectedRow?.KD_PASIEN || ''}
                    disabled
                    placeholder="No RM"
                  />
                </div>
              </div>

              {/* Akar Masalah */}
              <div className="mb-3">
                <label className="label-minimal mb-1">Penyebab yang melatarbelakangi / akar masalah Insiden:</label>
                <textarea
                  name="latarbelakang"
                  rows="3"
                  className="input-minimal"
                  placeholder="Jelaskan akar masalah kejadian..."
                ></textarea>
              </div>

              {/* Tanggal Investigasi */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="label-minimal mb-1">Tgl. Mulai Investigasi</label>
                  <input type="date" className="input-minimal" name="tglMulai" />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="label-minimal mb-1">Tgl. Selesai Investigasi</label>
                  <input type="date" className="input-minimal" name="tglSelesai" />
                </div>
              </div>

              {/* Penanggung Jawab */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="label-minimal mb-1">Kepala Ruangan</label>
                  <input
                    type="text"
                    className="input-minimal"
                    name="kepalaRuangan"
                    placeholder="Nama Kepala Ruangan"
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="label-minimal mb-1">Kasie / Kasubag</label>
                  <input
                    type="text"
                    className="input-minimal"
                    name="kasieKasubag"
                    placeholder="Nama Kasie / Kasubag"
                  />
                </div>
              </div>

              {/* Rekomendasi Section */}
              <div className="mb-4 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="label-minimal mb-0">Tindakan & Rekomendasi</h6>
                  {selectedRow && selectedRow.verifikasi !== 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark rounded-pill px-3"
                      onClick={tambahRowRekomendasi}
                    >
                      <i className="fas fa-plus me-1"></i> Tambah Baris
                    </button>
                  )}
                </div>

                {/* Mobile View: Cards (d-md-none) */}
                <div className="d-md-none d-flex flex-column gap-3 mb-3">
                  {rekomendasi?.map((entry, index) => (
                    <div key={index} className="p-3 bg-light border rounded-3 position-relative">
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                        <span className="fw-bold small text-muted">#{index + 1} Rekomendasi</span>
                        {rekomendasi.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm text-danger p-0 border-0"
                            onClick={() => hapusRowRekomendasi(index)}
                            title="Hapus"
                          >
                            <i className="fas fa-trash-alt"></i> Hapus
                          </button>
                        )}
                      </div>
                      <div className="mb-2">
                        <label className="label-minimal" style={{ fontSize: '10px' }}>Rekomendasi</label>
                        <textarea
                          value={entry.Rekomendasi}
                          onChange={(e) => updateRekomendasi(index, 'Rekomendasi', e.target.value)}
                          rows="2"
                          className="input-minimal bg-white"
                          placeholder="Rekomendasi tindakan..."
                        ></textarea>
                      </div>
                      <div className="mb-2">
                        <label className="label-minimal" style={{ fontSize: '10px' }}>Tindakan yang telah dilakukan</label>
                        <textarea
                          value={entry.Tindakan}
                          onChange={(e) => updateRekomendasi(index, 'Tindakan', e.target.value)}
                          rows="2"
                          className="input-minimal bg-white"
                          placeholder="Tindakan yang telah diambil..."
                        ></textarea>
                      </div>
                      <div className="row g-2">
                        <div className="col-12 col-sm-6">
                          <label className="label-minimal" style={{ fontSize: '10px' }}>Penanggung Jawab</label>
                          <textarea
                            value={entry.PenanggungJawab}
                            onChange={(e) => updateRekomendasi(index, 'PenanggungJawab', e.target.value)}
                            rows="1"
                            className="input-minimal bg-white"
                            placeholder="PJ..."
                          ></textarea>
                        </div>
                        <div className="col-12 col-sm-6">
                          <label className="label-minimal" style={{ fontSize: '10px' }}>Tanggal</label>
                          <input
                            type="date"
                            value={entry.Tanggal}
                            onChange={(e) => updateRekomendasi(index, 'Tanggal', e.target.value)}
                            className="input-minimal bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table (d-none d-md-block) */}
                <div className="table-responsive d-none d-md-block mb-3">
                  <table className="table table-bordered mb-0">
                    <thead className="table-light align-top">
                      <tr>
                        <th className="text-center" style={{ width: '40px' }}>No</th>
                        <th>Rekomendasi</th>
                        <th>Tindakan yang telah dilakukan</th>
                        <th>Penanggung jawab</th>
                        <th style={{ width: '150px' }}>Tanggal</th>
                        <th className="no-print text-center" style={{ width: '45px' }}>#</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekomendasi?.map((entry, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <textarea
                              value={entry.Rekomendasi}
                              onChange={(e) => updateRekomendasi(index, 'Rekomendasi', e.target.value)}
                              rows="2"
                              className="input-minimal"
                              placeholder="Rekomendasi..."
                            ></textarea>
                          </td>
                          <td>
                            <textarea
                              value={entry.Tindakan}
                              onChange={(e) => updateRekomendasi(index, 'Tindakan', e.target.value)}
                              rows="2"
                              className="input-minimal"
                              placeholder="Tindakan..."
                            ></textarea>
                          </td>
                          <td>
                            <textarea
                              value={entry.PenanggungJawab}
                              onChange={(e) => updateRekomendasi(index, 'PenanggungJawab', e.target.value)}
                              rows="2"
                              className="input-minimal"
                              placeholder="PJ..."
                            ></textarea>
                          </td>
                          <td>
                            <input
                              type="date"
                              value={entry.Tanggal}
                              onChange={(e) => updateRekomendasi(index, 'Tanggal', e.target.value)}
                              className="input-minimal"
                            />
                          </td>
                          <td className="no-print text-center align-middle">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm rounded-circle p-0"
                              style={{ width: '30px', height: '30px' }}
                              onClick={() => hapusRowRekomendasi(index)}
                              title="Hapus"
                            >
                              <i className="fas fa-trash-alt" style={{ fontSize: '11px' }}></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analisa */}
              <div className="pt-3 border-top mb-4">
                <h6 className="label-minimal mb-3">Analisa Sub Komite Keselamatan Pasien</h6>
                <div className="mb-3">
                  <label className="label-minimal mb-1">Tanggal Analisa</label>
                  <input type="date" className="input-minimal" name="tglAnalisa" style={{ maxWidth: '240px' }} />
                </div>

                <div className="mb-3">
                  <label className="label-minimal mb-1">Investigasi Lengkap:</label>
                  <div className="d-flex gap-3">
                    {['YA', 'TIDAK'].map((val) => (
                      <div key={val} className="form-check m-0">
                        <input className="form-check-input" type="radio" name="investigasiLengkap" id={`inv-lengkap-${val}`} value={val} />
                        <label className="form-check-label ms-1" htmlFor={`inv-lengkap-${val}`}>{val}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="label-minimal mb-1">Diperlukan Investigasi lebih lanjut:</label>
                  <div className="d-flex gap-3">
                    {['YA', 'TIDAK'].map((val) => (
                      <div key={val} className="form-check m-0">
                        <input className="form-check-input" type="radio" name="investigasiLanjut" id={`inv-lanjut-${val}`} value={val} />
                        <label className="form-check-label ms-1" htmlFor={`inv-lanjut-${val}`}>{val}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="label-minimal mb-1">Investigasi setelah Grading ulang:</label>
                  <select className="input-minimal" name="grading" style={{ maxWidth: '240px' }}>
                    <option value="BIRU">BIRU</option>
                    <option value="HIJAU">HIJAU</option>
                    <option value="KUNING">KUNING</option>
                    <option value="MERAH">MERAH</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 no-print my-4 pt-3 border-top">
                {selectedRow && selectedRow.verifikasi !== 1 && (
                  <button
                    type="submit"
                    className="btn btn-dark py-2 px-4 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    style={{ minHeight: '44px' }}
                  >
                    <i className="fas fa-save"></i> <span>Simpan Investigasi</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-light border py-2 px-4 rounded-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => window.print()}
                  style={{ minHeight: '44px' }}
                >
                  <i className="fas fa-print"></i> <span>Cetak Laporan</span>
                </button>
              </div>

              {/* Tanda Tangan Cetak (Hanya tampil saat Print) */}
              <div className="d-none d-print-block mt-5 pt-4">
                <div className="row text-center">
                  <div className="col-4">
                    <p className="mb-5 small">Kepala Ruangan,</p>
                    <p className="fw-bold text-decoration-underline mb-0 small">
                      ( {formInvestigasiRef.current?.querySelector('[name="kepalaRuangan"]')?.value || getKaruName(selectedRow) || '..............................'} )
                    </p>
                  </div>
                  <div className="col-4">
                    <p className="mb-5 small">Kasie / Kasubag,</p>
                    <p className="fw-bold text-decoration-underline mb-0 small">
                      ( {formInvestigasiRef.current?.querySelector('[name="kasieKasubag"]')?.value || getKasieInfo(selectedRow).verifiedName || '..............................'} )
                    </p>
                  </div>
                  <div className="col-4">
                    <p className="mb-5 small">Sub Komite Keselamatan Pasien,</p>
                    <p className="fw-bold text-decoration-underline mb-0 small">
                      ( {user?.username || '..............................'} )
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
