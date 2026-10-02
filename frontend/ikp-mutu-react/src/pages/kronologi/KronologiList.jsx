import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';

export default function KronologiList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let params = '';
        if (user?.role !== 'mutu' && user?.role !== 'admin') {
          params = `&dibuat_oleh=${JSON.stringify(user)}`;
        }
        const { data } = await api.get(`/kronologi?${params}`);
        setRiwayat(data.data || []);
      } catch (err) {
        console.error('Error fetching list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const goToDetail = (entry) => {
    navigate(`/kronologi/form/${entry.no_transaksi}`);
  };

  const filteredRiwayat = riwayat.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.nama_pasien?.toLowerCase().includes(q) ||
      entry.no_rm?.toLowerCase().includes(q) ||
      entry.no_transaksi?.toLowerCase().includes(q)
    );
  });

  const parseUser = (str) => {
    try {
      return JSON.parse(str)?.username || '-';
    } catch {
      return '-';
    }
  };

  return (
    <div className="kronologi-page animate-fade-in pb-4">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Kronologi Kejadian</h1>
          <p className="text-muted small mb-0">
            Riwayat pelaporan insiden keselamatan pasien unit pelayanan.
          </p>
        </div>
        <Link
          to="/kronologi/form"
          className="btn-minimal btn-minimal-primary shadow-sm justify-content-center py-2 px-3"
          style={{ minHeight: '42px' }}
        >
          <i className="fas fa-plus"></i>
          <span>+ Buat Laporan</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="card-minimal p-0 overflow-hidden shadow-sm">
        {/* Search Header */}
        <div className="p-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 bg-light bg-opacity-50">
          <h3 className="h6 mb-0 text-uppercase fw-bold ls-1 d-none d-sm-block">
            Riwayat Pelaporan ({filteredRiwayat.length})
          </h3>
          <div
            className="search-minimal d-flex align-items-center gap-2 border bg-white rounded-pill px-3 py-1 w-100"
            style={{ maxWidth: '320px' }}
          >
            <i className="fas fa-search text-muted small"></i>
            <input
              type="text"
              className="bg-transparent border-0 small w-100 py-1"
              placeholder="Cari pasien / RM / no trans..."
              style={{ outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="btn-icon p-0 text-muted"
                style={{ width: '20px', height: '20px' }}
              >
                <i className="fas fa-times" style={{ fontSize: '11px' }}></i>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View: Clean Incident Cards (d-md-none) */}
        <div className="d-md-none p-2 bg-light bg-opacity-25">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-spinner fa-spin h3 mb-2"></i>
              <p className="small mb-0">Memuat data pelaporan...</p>
            </div>
          ) : filteredRiwayat.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {filteredRiwayat.map((entry, index) => {
                const isSent = entry.kirimke && entry.kirimke !== '0';
                return (
                  <div
                    key={index}
                    onClick={() => goToDetail(entry)}
                    className="card-minimal p-3 bg-white border rounded-3 shadow-none cursor-pointer mobile-item-card"
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-light text-dark border small fw-normal">
                        <i className="far fa-calendar-alt me-1 text-muted"></i>
                        {new Date(entry.Tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span
                        className={`badge rounded-pill fw-medium px-2 py-1 ${
                          isSent
                            ? 'text-success bg-success-subtle border border-success'
                            : 'text-warning-emphasis bg-warning-subtle border border-warning'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {isSent ? '✓ Terkirim' : '✎ Draf'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '240px' }}>
                          {entry.nama_pasien || 'Nama Pasien Tidak Terdaftar'}
                        </div>
                        <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                            RM: {entry.no_rm}
                          </span>
                          <span className="text-truncate" style={{ fontSize: '11px', maxWidth: '140px' }}>
                            <i className="far fa-user me-1"></i>
                            {parseUser(entry.dibuat_oleh)}
                          </span>
                        </div>
                      </div>
                      <div className="text-muted ps-2">
                        <i className="fas fa-chevron-right text-muted small"></i>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="text-muted opacity-50 mb-2">
                <i className="fas fa-inbox h1"></i>
              </div>
              <p className="small text-muted mb-0">Belum ada data pelaporan</p>
            </div>
          )}
        </div>

        {/* Desktop View: Table (d-none d-md-block) */}
        <div className="table-responsive d-none d-md-block">
          <table className="table-minimal">
            <thead>
              <tr>
                <th className="ps-4">No.</th>
                <th>Tanggal & Waktu</th>
                <th>Informasi Pasien</th>
                <th>Pelapor</th>
                <th className="text-end pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <i className="fas fa-spinner fa-spin h4 mb-2"></i>
                    <p className="small mb-0">Memuat data pelaporan...</p>
                  </td>
                </tr>
              ) : filteredRiwayat.length > 0 ? (
                filteredRiwayat.map((entry, index) => (
                  <tr
                    key={index}
                    className="clickable-row hover-fade"
                    onClick={() => goToDetail(entry)}
                  >
                    <td className="ps-4">
                      <span className="text-muted small">#{index + 1}</span>
                    </td>
                    <td>
                      <div className="small fw-medium">
                        {new Date(entry.Tanggal).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>
                        {entry.Tanggal?.split('T')[1]?.substring(0, 5)} WIB
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-truncate fw-bold" style={{ maxWidth: '180px' }}>
                          {entry.nama_pasien}
                        </span>
                        <span className="badge bg-light text-muted border small" style={{ fontSize: '10px' }}>
                          RM: {entry.no_rm}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="small text-muted">
                        <i className="far fa-user me-1"></i>
                        {parseUser(entry.dibuat_oleh)}
                      </div>
                    </td>
                    <td className="text-end pe-4">
                      <span
                        className={`badge rounded-pill fw-normal px-3 py-1 border ${
                          entry.kirimke && entry.kirimke !== '0'
                            ? 'text-success bg-success-subtle border-success'
                            : 'text-muted bg-light border-secondary border-opacity-25'
                        }`}
                      >
                        {entry.kirimke && entry.kirimke !== '0' ? 'Terkirim' : 'Draf'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="text-muted opacity-50">
                      <i className="fas fa-inbox h1 mb-3"></i>
                      <p className="small">Belum ada data tersedia</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

