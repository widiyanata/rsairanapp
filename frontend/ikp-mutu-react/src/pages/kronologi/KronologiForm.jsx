import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import SignatureCanvas from '../../components/ui/SignatureCanvas';

export default function KronologiForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = !!id;

  // States
  const [pasiens, setPasiens] = useState(null);
  const [pasien, setPasien] = useState({ KPKD_PASIEN: '', KPKD_PASIENN: '' });
  const [cari, setCari] = useState('');
  const [jenisPasien, setJenisPasien] = useState('rajal');
  const [kejadianEntries, setKejadianEntries] = useState([{ Tanggal: '', Uraian: '' }]);
  const [loading, setLoading] = useState(false);
  const [kirimke, setKirimke] = useState('');
  const [isKirim, setIsKirim] = useState(false);
  const [listKaru, setListKaru] = useState([]);
  const [tandaTangan, setTandaTangan] = useState('');

  const namaPembuat = user || {};

  // Methods
  const tambahRow = () => {
    setKejadianEntries((prev) => [...prev, { Tanggal: '', Uraian: '' }]);
  };

  const hapusRow = (index) => {
    setKejadianEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index, field, value) => {
    setKejadianEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const cariPasien = async () => {
    if (cari.length < 3) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/kunjunganPasien?cari=${cari}&jenis=${jenisPasien}`);
      setPasiens(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pilihPasien = (p) => {
    setPasien(p);
    setPasiens(null);
    setCari('');
  };

  const getKronologiDetail = async (noTransaksi) => {
    setLoading(true);
    try {
      // mutu/admin melihat kronologi milik siapa pun, sama seperti di list
      const filterPembuat = user?.role !== 'mutu' && user?.role !== 'admin'
        ? `&dibuat_oleh=${JSON.stringify(user)}`
        : '';
      const { data } = await api.get(`/kronologi?no_transaksi=${noTransaksi}${filterPembuat}`);
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        setKejadianEntries(JSON.parse(item.Uraian));
        setPasien({
          KPKD_PASIEN: item.no_rm,
          KPKD_PASIENN: item.nama_pasien,
          KPNO_TRANSAKSI: item.no_transaksi,
        });
        setTandaTangan(item.tanda_tangan);
        setKirimke(item.kirimke || '');
        setIsKirim(!!(item.kirimke && item.kirimke !== '0'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const simpanTandaTangan = (ttd) => {
    setTandaTangan(ttd);
  };

  const saveKronologi = async () => {
    try {
      await api.post('/kronologi', {
        pasien,
        kejadian: kejadianEntries,
        dibuat_oleh: namaPembuat,
        tanda_tangan: tandaTangan,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const simpanKronologi = async () => {
    if (!tandaTangan) {
      alert('Tanda tangan wajib diisi');
      return;
    }
    setLoading(true);
    const ok = await saveKronologi();
    setLoading(false);
    if (ok) {
      navigate('/kronologi');
    } else {
      alert('Gagal menyimpan laporan, coba lagi');
    }
  };

  const kirimKronologi = async () => {
    if (!kirimke) return;
    if (!tandaTangan) {
      alert('Tanda tangan wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const savedOk = await saveKronologi();
      if (!savedOk) {
        alert('Gagal menyimpan laporan, coba lagi');
        return;
      }

      const { data } = await api.post('/kirimKronologi', {
        no_transaksi: pasien.KPNO_TRANSAKSI,
        dibuat_oleh: namaPembuat,
        kirimke,
      });

      if (data.status.success) {
        navigate('/kronologi');
      } else {
        alert(data.status.message || 'Gagal mengirim laporan');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi gagal, laporan belum terkirim');
    } finally {
      setLoading(false);
    }
  };

  const getUserKaru = async () => {
    try {
      const { data } = await api.get('/cariKaru?&role=karu');
      setListKaru(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getUserKaru();
    if (isEdit) getKronologiDetail(id);
  }, [id]);

  const terisi = kejadianEntries.filter((e) => e.Uraian?.trim()).length;
  const checklist = [
    { label: 'Pasien', ok: !!pasien.KPKD_PASIEN },
    { label: `Kronologi (${terisi} baris)`, ok: terisi > 0 },
    { label: 'Tanda tangan', ok: !!tandaTangan },
    { label: 'Karu tujuan', ok: !!kirimke },
  ];
  const bisaKirim = checklist.every((c) => c.ok) && !loading;

  return (
    <div className="kronologi-detail-wrapper pb-4">
      <div className="kronologi-detail-page animate-fade-in no-print">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <h1 className="h5 fw-bold mb-0">{isEdit ? 'Edit Laporan' : 'Pelaporan Baru'}</h1>
            <span className={`badge ${isKirim ? 'bg-success' : 'bg-secondary-subtle text-secondary'}`}>
              {isKirim ? 'Terkirim' : 'Draf'}
            </span>
          </div>
          <button onClick={() => window.print()} className="btn btn-sm btn-outline-dark">
            <i className="fas fa-print me-1"></i>Cetak
          </button>
        </div>

        <div className="row g-3">
          {/* Form Body */}
          <div className="col-12 col-lg-8 d-flex flex-column gap-3">
            {/* 1. Pasien */}
            <div className="card-minimal">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <h6 className="label-minimal mb-0">① Pasien *</h6>
                {!pasien.KPKD_PASIEN && (
                  <div className="btn-group btn-group-sm" role="group">
                    {[['rajal', 'Rawat Jalan'], ['ranap', 'Rawat Inap']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        className={`btn ${jenisPasien === val ? 'btn-dark' : 'btn-outline-dark'}`}
                        onClick={() => { setJenisPasien(val); setPasiens(null); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!pasien.KPKD_PASIEN ? (
                <>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white"><i className="fas fa-search text-muted"></i></span>
                    <input
                      type="text"
                      value={cari}
                      onChange={(e) => setCari(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && cariPasien()}
                      className="form-control"
                      placeholder="Min. 3 huruf No. RM / nama, lalu Enter"
                    />
                    <button
                      type="button"
                      onClick={cariPasien}
                      className="btn btn-dark"
                      disabled={loading || cari.length < 3}
                    >
                      Cari
                    </button>
                  </div>
                  {pasiens && (
                    <div className="border rounded-2 mt-2 bg-white" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {pasiens.length === 0 && (
                        <div className="small text-muted text-center py-3">Tidak ada hasil</div>
                      )}
                      {pasiens.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => pilihPasien(p)}
                          className="px-3 py-2 border-bottom hover-bg cursor-pointer d-flex align-items-center justify-content-between gap-2"
                        >
                          <div className="overflow-hidden">
                            <div className="fw-semibold small text-truncate">{p.KPKD_PASIENN}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>
                              RM {p.KPKD_PASIEN} · {p.KPNO_TRANSAKSI}
                              {p.KPTGL_PERIKSA && ` · ${new Date(p.KPTGL_PERIKSA).toLocaleDateString('id-ID')}`}
                              {p.UNIT && ` · ${p.UNIT}`}
                            </div>
                          </div>
                          <i className="fas fa-chevron-right text-muted small"></i>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="d-flex align-items-center justify-content-between gap-2 px-3 py-2 bg-light border rounded-2">
                  <div className="overflow-hidden">
                    <div className="fw-semibold small text-truncate">{pasien.KPKD_PASIENN}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      RM {pasien.KPKD_PASIEN}
                      {pasien.KPNO_TRANSAKSI && ` · ${pasien.KPNO_TRANSAKSI}`}
                    </div>
                  </div>
                  {!isKirim && (
                    <button
                      onClick={() => {
                        setPasien({ KPKD_PASIEN: '', KPKD_PASIENN: '' });
                        setPasiens(null);
                      }}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Ganti
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Kronologi */}
            <div className="card-minimal">
              <h6 className="label-minimal mb-1">② Kronologi Kejadian *</h6>
              <div className="small text-muted mb-2">Uraian detail kejadian (Siabidibame), urut berdasarkan waktu</div>

              <div className="row g-2 d-none d-md-flex border-bottom pb-1 label-minimal mb-0">
                <div className="col-auto" style={{ width: '32px' }}>#</div>
                <div className="col-md-4">Tanggal & Jam</div>
                <div className="col">Uraian Singkat</div>
                <div className="col-auto" style={{ width: '40px' }}></div>
              </div>
              {kejadianEntries.map((entry, idx) => (
                <div key={idx} className="row g-2 align-items-start py-2 border-bottom">
                  <div className="col-auto small fw-semibold text-muted pt-1" style={{ width: '32px' }}>{idx + 1}</div>
                  <div className="col col-md-4">
                    <input
                      type="datetime-local"
                      value={entry.Tanggal || ''}
                      onChange={(e) => updateEntry(idx, 'Tanggal', e.target.value)}
                      className="form-control form-control-sm"
                      disabled={isKirim}
                    />
                  </div>
                  <div className="col-auto order-md-last" style={{ width: '40px' }}>
                    {!isKirim && kejadianEntries.length > 1 && (
                      <button
                        onClick={() => hapusRow(idx)}
                        className="btn btn-sm text-danger p-1"
                        title="Hapus baris"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                  <div className="col-12 col-md">
                    <textarea
                      value={entry.Uraian || ''}
                      onChange={(e) => updateEntry(idx, 'Uraian', e.target.value)}
                      rows="2"
                      className="form-control form-control-sm"
                      placeholder="Jelaskan kejadian secara singkat..."
                      disabled={isKirim}
                    />
                  </div>
                </div>
              ))}
              {!isKirim && (
                <button className="btn btn-sm btn-outline-dark mt-2" onClick={tambahRow}>
                  <i className="fas fa-plus me-1"></i>Tambah Baris
                </button>
              )}
            </div>

            {/* 3. Tanda Tangan */}
            <div className="card-minimal">
              <h6 className="label-minimal mb-2">③ Tanda Tangan Pelapor *</h6>
              <div className="d-inline-block border rounded-2 p-2 bg-light">
                <SignatureCanvas base64={tandaTangan} onSave={simpanTandaTangan} disabled={isKirim} />
              </div>
              <div className="small text-muted mt-1">Bubuhkan tanda tangan pembuat laporan</div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-12 col-lg-4">
            <div className="card-minimal sticky-lg-top" style={{ top: '72px' }}>
              <h6 className="label-minimal mb-2">Ringkasan</h6>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  className="bg-dark text-white rounded-circle flex-center fw-bold flex-shrink-0"
                  style={{ width: '30px', height: '30px', fontSize: '12px' }}
                >
                  {namaPembuat.username?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold small text-truncate">{namaPembuat.nama || namaPembuat.username}</div>
                  <div className="text-muted text-uppercase" style={{ fontSize: '10px' }}>{namaPembuat.role}</div>
                </div>
              </div>

              <ul className="list-unstyled small mb-3 d-flex flex-column gap-1">
                {checklist.map((c) => (
                  <li key={c.label} className={`d-flex align-items-center gap-2 ${c.ok ? 'text-dark' : 'text-muted'}`}>
                    <i className={c.ok ? 'fas fa-check-circle text-success' : 'far fa-circle'}></i>
                    {c.label}
                  </li>
                ))}
              </ul>

              <label className="label-minimal">Kirim ke Atasan (Karu)</label>
              <select
                value={kirimke}
                onChange={(e) => setKirimke(e.target.value)}
                className="form-select form-select-sm mb-3"
                disabled={isKirim}
              >
                <option value="">-- Pilih Karu --</option>
                {listKaru.map((u) => (
                  <option key={u.id} value={u.id}>{u.nama}</option>
                ))}
              </select>

              {isKirim ? (
                <div className="alert alert-success small py-2 mb-0">
                  <i className="fas fa-check me-1"></i>Laporan sudah terkirim
                </div>
              ) : (
                pasien.KPKD_PASIEN && (
                  <div className="d-none d-lg-grid gap-2">
                    <button className="btn btn-outline-dark" onClick={simpanKronologi} disabled={loading}>
                      <i className="fas fa-save me-1"></i>{isEdit ? 'Perbarui' : 'Simpan Draf'}
                    </button>
                    <button className="btn btn-dark" onClick={kirimKronologi} disabled={!bisaKirim}>
                      <i className="fas fa-paper-plane me-1"></i>Kirim ke Karu
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Action Bar */}
        {pasien.KPKD_PASIEN && !isKirim && (
          <div
            className="mobile-sticky-actions d-lg-none no-print p-3 bg-white border-top shadow-lg position-fixed start-0 end-0 d-flex gap-2"
            style={{ bottom: '56px', zIndex: 95 }}
          >
            <button
              type="button"
              className="btn btn-outline-dark flex-fill py-2 d-flex align-items-center justify-content-center gap-2 rounded-3"
              onClick={simpanKronologi}
              disabled={loading}
              style={{ minHeight: '44px' }}
            >
              <i className="fas fa-save"></i>
              <span>{isEdit ? 'Perbarui' : 'Simpan Draf'}</span>
            </button>
            <button
              type="button"
              className="btn btn-dark flex-fill py-2 d-flex align-items-center justify-content-center gap-2 rounded-3"
              onClick={kirimKronologi}
              disabled={!bisaKirim}
              style={{ minHeight: '44px' }}
            >
              <i className="fas fa-paper-plane"></i>
              <span>Kirim</span>
            </button>
          </div>
        )}
      </div>

      {/* Print Template */}
      <div className="print-container d-none">
        <div className="print-header d-flex align-items-center justify-content-between pb-3 border-bottom border-3 border-dark mb-3">
          <div className="d-flex align-items-center gap-3">
            <img src="/logo-airan-transparant.png" alt="Logo" style={{ height: '60px' }} />
            <div>
              <h4 className="mb-0 fw-bold">RS AIRAN RAYA</h4>
              <div className="small">
                Jl. Airan Raya No. 99, Way Huwi, Kec. Jati Agung, Kab. Lampung Selatan
              </div>
              <div className="small">Telp: (0721) 5617779 | Email: rs.airanraya@gmail.com</div>
            </div>
          </div>
          <div
            className="header-stamp border border-2 border-dark p-2 text-center"
            style={{ width: '120px' }}
          >
            <small className="fw-bold">FORM IKP-1</small>
          </div>
        </div>

        <div className="text-center mb-3">
          <h4 className="fw-bold text-decoration-underline">LAPORAN KRONOLOGI INSIDEN</h4>
          <div className="small">No. Transaksi: {pasien.KPNO_TRANSAKSI || '-'}</div>
        </div>

        <div className="print-section mb-3">
          <h6 className="fw-bold border-bottom pb-1 mb-3">DATA PASIEN</h6>
          <table className="table table-sm table-bordered border-dark">
            <tbody>
              <tr>
                <th width="30%" className="bg-light">Nama Pasien</th>
                <td>{pasien.KPKD_PASIENN || '-'}</td>
              </tr>
              <tr>
                <th className="bg-light">No. Rekam Medis</th>
                <td>{pasien.KPKD_PASIEN || '-'}</td>
              </tr>
              <tr>
                <th className="bg-light">Unit Pelayanan</th>
                <td>{namaPembuat.role || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-section mb-3">
          <h6 className="fw-bold border-bottom pb-1 mb-3">URAIAN KRONOLOGI</h6>
          <table className="table table-bordered border-dark">
            <thead className="bg-light">
              <tr>
                <th width="5%" className="text-center">No</th>
                <th width="25%">Waktu Kejadian</th>
                <th>Kronologi Kejadian (Detil)</th>
              </tr>
            </thead>
            <tbody>
              {kejadianEntries.map((entry, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td>
                    {entry.Tanggal
                      ? new Date(entry.Tanggal).toLocaleString('id-ID')
                      : '-'}
                  </td>
                  <td>{entry.Uraian || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-signatures mt-4 pt-3">
          <div className="row text-center">
            <div className="col-6">
              <div className="mb-4">Mengetahui,</div>
              <div className="signature-space mb-2">
                {isKirim ? (
                  <div className="text-muted small fst-italic">
                    (Telah dikirim & disetujui digital)
                  </div>
                ) : (
                  <div className="text-muted small fst-italic">(Belum dikirim)</div>
                )}
              </div>
              <div className="fw-bold text-decoration-underline">
                {listKaru.find((k) => String(k.id) === String(kirimke))?.nama || '..........................'}
              </div>
              <div className="small">Kepala Ruangan / Atasan</div>
            </div>
            <div className="col-6">
              <div className="mb-2">Pembuat Laporan,</div>
              <div className="signature-space mb-2">
                {tandaTangan ? (
                  <img src={tandaTangan} alt="Tanda Tangan" style={{ height: '80px' }} />
                ) : (
                  <div style={{ height: '80px' }}></div>
                )}
              </div>
              <div className="fw-bold text-decoration-underline">
                {namaPembuat.username || '..........................'}
              </div>
              <div className="small">Pelapor Insiden</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
