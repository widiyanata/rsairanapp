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
    <div>
      <div className="container-fluid">
        <div className="row no-print">
          <div className="col-12">
            <h1 className="text-uppercase h2 fw-bold">Grading Insiden</h1>
            <hr />
          </div>
        </div>

        {/* List View */}
        {!selectedRow && (
          <div className="row">
            <div className="col-md-12 no-print">
              <h3>Riwayat Kronologi</h3>
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Tanggal</th>
                      <th>Nama</th>
                      <th>No Trans.</th>
                      <th>Dibuat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatKronologiGrouped.map((entry, index) => (
                      <tr
                        key={index}
                        className="cursor-pointer"
                        onClick={() => selectRow(entry)}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <small>{entry.Tanggal?.replace('T', ' jam ')}</small>
                        </td>
                        <td>
                          <small className="fw-bold">{entry.nama_pasien}</small>{' '}
                          <small className="badge bg-white text-secondary border">
                            ({entry.no_rm})
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-white text-primary border">
                            <small>{entry.no_transaksi}</small>
                          </span>
                        </td>
                        <td>
                          {entry.pembuat?.map((nama, i) => (
                            <span key={i} className="badge text-secondary ms-1 border">
                              {nama}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detail View */}
        {selectedRow && (
          <div className="row">
            <div className="col-12 no-print">
              <div className="d-flex align-items-center mb-3">
                <button
                  type="button"
                  className="btn btn-sm btn-dark me-2"
                  onClick={() => setSelectedRow(null)}
                >
                  <i className="fas fa-chevron-left"></i> <span>Kembali</span>
                </button>
                <span>
                  <b>{detailPasien?.KD_PASIEN}</b> -{' '}
                  <b className="text-primary">{detailPasien?.NAMAPASIEN}</b>
                </span>
              </div>
            </div>

            {/* Left: Detail Kronologi */}
            <div className="col-md-4 no-print">
              <h4>Detail Kronologi</h4>
              {listKronologi.length > 0 && (
                <div className="border-bottom">
                  <table className="table table-sm table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Tgl.</th>
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
                          <tr className="table-warning">
                            <td colSpan="2">Dibuat Oleh: {username}</td>
                          </tr>
                          {uraianArr.map((uraian, idx) => (
                            <tr key={idx}>
                              <td>
                                <span className="badge bg-white text-dark border">
                                  {uraian.Tanggal}
                                </span>
                              </td>
                              <td>{uraian.Uraian}</td>
                            </tr>
                          ))}
                        </tbody>
                      );
                    })}
                  </table>
                </div>
              )}
            </div>

            {/* Right: Form Grading */}
            <div className="col-md-8">
              {detailPasien.KPNO_TRANSAKSI && (
                <div>
                  <div className="kop-surat mb-4 print w-100">
                    <img src="/kop_surat.jpg" alt="" className="w-100" />
                  </div>
                  <form ref={formRef} id="formInsiden" onSubmit={submitForm}>
                    <h3 className="mb-4 text-uppercase">Laporan Insiden</h3>

                    {/* Tabs */}
                    <div className="d-flex justify-content-between align-items-center no-print">
                      <ul className="nav nav-tabs nav-fill" role="tablist">
                        {tabs.map((tab) => (
                          <li key={tab.id} className="nav-item">
                            <button
                              type="button"
                              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                              onClick={() => setActiveTab(tab.id)}
                            >
                              {tab.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content mb-5">
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
                    <div className="text-center mb-4 p-3 no-print">
                      <button type="button" className="btn btn-dark me-2" onClick={() => setSelectedRow(null)}>
                        <i className="fas fa-chevron-left"></i> <span>Kembali</span>
                      </button>
                      <div className="btn-group">
                        <button type="submit" className="btn btn-success">
                          <i className="fas fa-save"></i> Simpan
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                          <i className="fas fa-print"></i> Cetak
                        </button>
                      </div>
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
