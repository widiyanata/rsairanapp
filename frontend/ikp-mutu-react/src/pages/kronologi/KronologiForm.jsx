import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const [kejadianEntries, setKejadianEntries] = useState([{ Tanggal: '', Uraian: '' }]);
  const [loading, setLoading] = useState(false);
  const [idKronologi, setIdKronologi] = useState('');
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
      const { data } = await api.get(`/kunjunganPasien?cari=${cari}`);
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
      const { data } = await api.get(
        `/kronologi?no_transaksi=${noTransaksi}&dibuat_oleh=${JSON.stringify(user)}`
      );
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
        setIdKronologi(item.id_kronologi);
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

  const simpanKronologi = async () => {
    if (!tandaTangan) {
      alert('Tanda tangan wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/kronologi', {
        pasien,
        kejadian: kejadianEntries,
        dibuat_oleh: namaPembuat,
        tanda_tangan: tandaTangan,
      });
      navigate('/kronologi');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const kirimKronologi = async () => {
    if (!kirimke) return;
    setLoading(true);
    try {
      await api.post('/kirimKronologi', {
        id_kronologi: idKronologi,
        kirimke,
      });
      navigate('/kronologi');
    } catch (err) {
      console.error(err);
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

  return (
    <div className="kronologi-detail-wrapper">
      <div className="kronologi-detail-page animate-fade-in">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-5 no-print">
          <div className="d-flex align-items-center gap-4">
            <Link to="/kronologi" className="btn-minimal btn-minimal-outline p-2 border-0">
              <i className="fas fa-chevron-left"></i>
            </Link>
            <div>
              <h1 className="h3 fw-bold mb-0">
                {isEdit ? 'Edit Laporan' : 'Pelaporan Baru'}
              </h1>
              {pasien.KPKD_PASIEN && (
                <div className="text-muted small mt-1">
                  Pasien Terpilih: <strong>{pasien.KPKD_PASIENN}</strong>
                </div>
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => window.print()} className="btn-minimal btn-minimal-outline">
              <i className="fas fa-print"></i>
              <span>Cetak</span>
            </button>
            {pasien.KPKD_PASIEN && !isKirim && (
              <button className="btn-minimal btn-minimal-primary" onClick={simpanKronologi}>
                <i className="fas fa-save"></i>
                <span>{isEdit ? 'Perbarui Draf' : 'Simpan Draf'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="row g-5">
          {/* Form Body */}
          <div className="col-lg-8">
            {/* Patient Selection */}
            <div className="card-minimal mb-4 shadow-sm">
              <h6 className="label-minimal mb-3">Pilih Pasien *</h6>
              {!pasien.KPKD_PASIEN ? (
                <div>
                  <div className="input-group-minimal border-bottom d-flex align-items-center gap-2 mb-3 py-1">
                    <i className="fas fa-search text-muted small"></i>
                    <input
                      type="text"
                      value={cari}
                      onChange={(e) => setCari(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && cariPasien()}
                      className="bg-transparent border-0 small w-100 py-2"
                      placeholder="Cari No. RM / Nama..."
                    />
                  </div>
                  {pasiens && (
                    <div className="search-results border rounded-3 mt-2 overflow-hidden animate-fade-in shadow-lg">
                      {pasiens.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => pilihPasien(p)}
                          className="p-3 border-bottom hover-bg cursor-pointer bg-white"
                        >
                          <div className="fw-bold small">{p.KPKD_PASIENN}</div>
                          <div className="text-muted" style={{ fontSize: '10px' }}>
                            {p.KPNO_TRANSAKSI}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-light border-start border-3 border-primary rounded-1 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold small">{pasien.KPKD_PASIENN}</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>
                      RM: {pasien.KPKD_PASIEN}
                    </div>
                  </div>
                  {!isKirim && (
                    <button
                      onClick={() => {
                        setPasien({ KPKD_PASIEN: '', KPKD_PASIENN: '' });
                        setPasiens(null);
                      }}
                      className="btn btn-sm text-muted p-0"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Kejadian Entries */}
            <div className="form-section mb-5">
              <h6 className="label-minimal mb-4">Informasi Kejadian</h6>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="small text-muted">Uraian Detil Kejadian (Siabidibame)</span>
                {!isKirim && (
                  <button
                    className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-bold small"
                    onClick={tambahRow}
                  >
                    + Tambah Baris
                  </button>
                )}
              </div>

              <div className="timeline-minimal">
                {kejadianEntries.map((entry, idx) => (
                  <div key={idx} className="timeline-item mb-4 animate-fade-in">
                    <div className="timeline-content p-4 bg-light bg-opacity-50 border rounded-3 position-relative">
                      <div className="row g-4">
                        <div className="col-md-5">
                          <label className="label-minimal mb-2">Tanggal & Jam</label>
                          <input
                            type="datetime-local"
                            value={entry.Tanggal || ''}
                            onChange={(e) => updateEntry(idx, 'Tanggal', e.target.value)}
                            className="input-minimal border-0 shadow-sm"
                            disabled={isKirim}
                          />
                        </div>
                        <div className="col-md-7">
                          <div className="d-flex justify-content-between">
                            <label className="label-minimal mb-2">Uraian Singkat</label>
                            {!isKirim && kejadianEntries.length > 1 && (
                              <button
                                onClick={() => hapusRow(idx)}
                                className="btn btn-sm text-danger p-0 opacity-50"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            )}
                          </div>
                          <textarea
                            value={entry.Uraian || ''}
                            onChange={(e) => updateEntry(idx, 'Uraian', e.target.value)}
                            rows="2"
                            className="input-minimal border-0 shadow-sm"
                            placeholder="Jelaskan kronologi secara singkat..."
                            disabled={isKirim}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div className="signature-minimal pt-5 border-top">
              <h6 className="label-minimal mb-4">Konfirmasi & Tanda Tangan</h6>
              <div className="bg-light bg-opacity-50 p-4 border rounded-3 d-inline-block shadow-sm">
                <SignatureCanvas
                  base64={tandaTangan}
                  onSave={simpanTandaTangan}
                  disabled={isKirim}
                />
                <p className="text-muted mt-3 mb-0 small text-center">
                  Bubuhkan tanda tangan pembuat laporan
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '100px' }}>
              {/* Report Info */}
              <div className="card-minimal mb-4 shadow-sm bg-light bg-opacity-25" style={{ borderStyle: 'dashed' }}>
                <h6 className="label-minimal mb-3">Laporan Oleh</h6>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="avatar-sm bg-dark text-white rounded-circle flex-center"
                    style={{ width: '32px', height: '32px', fontSize: '12px' }}
                  >
                    {namaPembuat.username?.charAt(0)}
                  </div>
                  <div>
                    <div className="fw-bold small">{namaPembuat.username}</div>
                    <div className="text-muted" style={{ fontSize: '9px' }}>
                      {namaPembuat.role}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <label className="label-minimal mb-2">Kirim ke Atasan (Karu)</label>
                  <select
                    value={kirimke}
                    onChange={(e) => setKirimke(e.target.value)}
                    className="input-minimal"
                    disabled={isKirim}
                  >
                    <option value="">-- Pilih Karu --</option>
                    {listKaru.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {pasien.KPKD_PASIEN && (
                <button
                  className="btn-minimal btn-minimal-primary py-3 w-100 justify-content-center border-0 shadow-md"
                  disabled={isKirim || !kirimke}
                  onClick={kirimKronologi}
                >
                  <span>{isKirim ? 'Selesai / Terkirim' : 'Kirim Laporan'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Template */}
      <div className="print-container d-none">
        <div className="print-header d-flex align-items-center justify-content-between pb-3 border-bottom border-3 border-dark mb-4">
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

        <div className="text-center mb-4">
          <h4 className="fw-bold text-decoration-underline">LAPORAN KRONOLOGI INSIDEN</h4>
          <div className="small">No. Transaksi: {pasien.KPNO_TRANSAKSI || '-'}</div>
        </div>

        <div className="print-section mb-4">
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

        <div className="print-section mb-4">
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

        <div className="print-signatures mt-5 pt-4">
          <div className="row text-center">
            <div className="col-6">
              <div className="mb-5">Mengetahui,</div>
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
