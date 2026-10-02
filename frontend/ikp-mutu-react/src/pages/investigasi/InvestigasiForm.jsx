import React, { useEffect, useState, useRef } from 'react';
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

  // Set form values when detail changes
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
      formInvestigasiRef.current.querySelectorAll('[name]').forEach((el) => {
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
  }, [detailGrading]);

  useEffect(() => {
    getRiwayatGrading();
  }, []);

  return (
    <div className="investigasi-page pb-4">
      <div className="container-fluid p-0">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4 no-print">
          <div>
            <h1 className="h3 fw-bold mb-1">Investigasi Insiden</h1>
            <p className="text-muted small mb-0">
              Laporan investigasi komprehensif keselamatan pasien oleh Komite Mutu.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* Left: Riwayat Grading */}
          <div className="col-12 col-md-5 no-print">
            <div className="card-minimal p-0 overflow-hidden shadow-sm mb-4">
              <div className="p-3 border-bottom bg-light bg-opacity-50">
                <h3 className="h6 mb-0 text-uppercase fw-bold ls-1">
                  Riwayat Grading ({riwayatGrading.length})
                </h3>
              </div>

              {/* Mobile Card List (d-md-none) */}
              <div className="d-md-none p-2 bg-light bg-opacity-25">
                {riwayatGrading.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {riwayatGrading.map((entry, index) => {
                      const isSelected = selectedRow === entry;
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
                            <span
                              className={`badge rounded-pill fw-medium px-2 py-1 ${
                                entry.verifikasi
                                  ? 'text-success bg-success-subtle border border-success'
                                  : 'text-warning-emphasis bg-warning-subtle border border-warning'
                              }`}
                              style={{ fontSize: '10px' }}
                            >
                              {entry.verifikasi ? '✓ Diverifikasi' : 'Belum Verifikasi'}
                            </span>
                          </div>

                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '240px' }}>
                            {entry.NAMAPASIEN}
                          </div>
                          <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                              RM: {entry.no_rm}
                            </span>
                            <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>
                              {entry.no_transaksi}
                            </span>
                          </div>

                          {!entry.verifikasi && isSelected && (
                            <div className="mt-3 pt-2 border-top">
                              <button
                                className="btn btn-sm btn-success w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  verifikasiKronologi(entry.no_transaksi);
                                }}
                                style={{ minHeight: '40px' }}
                              >
                                <i className="fas fa-check-double"></i>
                                <span>Verifikasi Insiden Ini</span>
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
                    <p className="small mb-0">Belum ada riwayat grading</p>
                  </div>
                )}
              </div>

              {/* Desktop Table (d-none d-md-block) */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-sm table-hover mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3">#</th>
                      <th>Tanggal</th>
                      <th>Pasien</th>
                      <th>No Trans.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatGrading.map((entry, index) => (
                      <React.Fragment key={index}>
                        <tr
                          onClick={() => selectRow(entry)}
                          className={`cursor-pointer ${selectedRow === entry ? 'table-active' : ''} ${entry.verifikasi ? 'table-success' : ''}`}
                        >
                          <td className="ps-3">{index + 1}</td>
                          <td>
                            <span className="badge text-secondary">{entry.created_at?.split('T')[0]}</span>{' '}
                            <span className="badge text-secondary">{entry.created_at?.split('T')[1]}</span>
                          </td>
                          <td>
                            <small className="me-1 fw-bold">{entry.NAMAPASIEN}</small>
                            <span className="badge text-dark bg-white border">{entry.no_rm}</span>
                          </td>
                          <td>
                            <span className="badge text-dark">{entry.no_transaksi}</span>
                            <br />
                            {entry.verifikasi && (
                              <span className="badge bg-success">
                                <i className="fas fa-check-double"></i> Diverifikasi
                              </span>
                            )}
                          </td>
                        </tr>
                        {!entry.verifikasi && entry === selectedRow && (
                          <tr>
                            <td></td>
                            <th className="text-end">Aksi:</th>
                            <td colSpan="2">
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => verifikasiKronologi(entry.no_transaksi)}
                              >
                                <i className="fas fa-check-square"></i> Verifikasi
                              </button>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Accordion: Detail Grading & Kronologi */}
          {detailGrading && selectedRow && (
            <div className="mb-4">
              {/* Detail Grading Accordion */}
              <div className="border rounded mb-2">
                <button
                  className="w-100 btn btn-light fw-bold text-start p-3"
                  onClick={() => setShowDetailGrading(!showDetailGrading)}
                >
                  Detail Grading {showDetailGrading ? '▲' : '▼'}
                </button>
                {showDetailGrading && (
                  <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
        <div className={`col-md-7 ${!detailGrading || !selectedRow ? 'd-none' : ''}`}>
          <div className="kop-surat mb-4 print">
            <img className="w-100" src="/kop_surat.jpg" alt="" />
          </div>
          <h2 className="text-center mb-4 h4">FORM LAPORAN INVESTIGASI SEDERHANA</h2>
          <div className="container bg-white">
            <form ref={formInvestigasiRef} onSubmit={submitForm} className="py-3">
              <div className="mb-1 row">
                <label className="col-sm-4">Pasien:</label>
                <div className="col-sm-6 no-print">
                  <input type="text" className="form-control form-control-sm" value={selectedRow?.NAMAPASIEN || ''} disabled />
                </div>
                <div className="col-sm-2">
                  <input type="text" className="form-control form-control-sm" value={selectedRow?.KD_PASIEN || ''} disabled />
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Penyebab yang melatarbelakangi / akar masalah Insiden:</label>
                <div className="col-sm-8">
                  <textarea name="latarbelakang" rows="4" className="form-control form-control-sm"></textarea>
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Tgl. Mulai Investigasi:</label>
                <div className="col-sm-8">
                  <input type="date" className="form-control form-control-sm" name="tglMulai" />
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Tgl. Selesai Investigasi:</label>
                <div className="col-sm-8">
                  <input type="date" className="form-control form-control-sm" name="tglSelesai" />
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Kepala Ruangan:</label>
                <div className="col-sm-8">
                  <input type="text" className="form-control form-control-sm" name="kepalaRuangan" />
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Kasie / Kasubag:</label>
                <div className="col-sm-8">
                  <input type="text" className="form-control form-control-sm" name="kasieKasubag" />
                </div>
              </div>

              {/* Rekomendasi Table */}
              <div className="row">
                <div className="col">
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light align-top">
                        <tr>
                          <th className="text-center">No</th>
                          <th>Rekomendasi</th>
                          <th>Tindakan yang telah dilakukan</th>
                          <th>Penanggung jawab</th>
                          <th>Tanggal</th>
                          <th className="no-print">#</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekomendasi?.map((entry, index) => (
                          <tr key={index}>
                            <td className="text-center">{index + 1}</td>
                            <td>
                              <textarea value={entry.Rekomendasi} onChange={(e) => updateRekomendasi(index, 'Rekomendasi', e.target.value)} rows="2" className="form-control form-control-sm"></textarea>
                            </td>
                            <td>
                              <textarea value={entry.Tindakan} onChange={(e) => updateRekomendasi(index, 'Tindakan', e.target.value)} rows="2" className="form-control form-control-sm"></textarea>
                            </td>
                            <td>
                              <textarea value={entry.PenanggungJawab} onChange={(e) => updateRekomendasi(index, 'PenanggungJawab', e.target.value)} rows="2" className="form-control form-control-sm"></textarea>
                            </td>
                            <td>
                              <input type="date" value={entry.Tanggal} onChange={(e) => updateRekomendasi(index, 'Tanggal', e.target.value)} className="form-control form-control-sm" />
                            </td>
                            <td className="no-print text-center">
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => hapusRowRekomendasi(index)}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="btn-group no-print">
                    {selectedRow && selectedRow.verifikasi !== 1 && (
                      <button type="button" className="btn btn-success btn-sm" onClick={tambahRowRekomendasi}>
                        + Tambah baris
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Analisa */}
              <h4 className="mt-4">ANALISA SUB KOMITE KESELAMATAN PASIEN:</h4>
              <div className="mb-1 row">
                <label className="col-sm-4">Tanggal:</label>
                <div className="col-sm-8">
                  <input type="date" className="form-control form-control-sm" name="tglAnalisa" />
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Investigasi Lengkap:</label>
                <div className="col-sm-8">
                  {['YA', 'TIDAK'].map((val) => (
                    <div key={val} className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="investigasiLengkap" id={`inv-lengkap-${val}`} value={val} />
                      <label className="form-check-label" htmlFor={`inv-lengkap-${val}`}>{val}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Diperlukan Investigasi lebih lanjut:</label>
                <div className="col-sm-8">
                  {['YA', 'TIDAK'].map((val) => (
                    <div key={val} className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="investigasiLanjut" id={`inv-lanjut-${val}`} value={val} />
                      <label className="form-check-label" htmlFor={`inv-lanjut-${val}`}>{val}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-1 row">
                <label className="col-sm-4">Investigasi setelah Grading ulang:</label>
                <div className="col-sm-8">
                  <select className="form-select" name="grading">
                    <option value="BIRU">BIRU</option>
                    <option value="HIJAU">HIJAU</option>
                    <option value="KUNING">KUNING</option>
                    <option value="MERAH">MERAH</option>
                  </select>
                </div>
              </div>

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
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
