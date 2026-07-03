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
        if (user?.role !== 'mutu') {
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
    <div className="kronologi-page animate-fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-5">
        <div>
          <h1 className="h2 fw-bold mb-1">Kronologi Kejadian</h1>
          <p className="text-muted small mb-0">
            Riwayat pelaporan insiden keselamatan pasien.
          </p>
        </div>
        <Link to="/kronologi/form" className="btn-minimal btn-minimal-primary shadow-sm">
          <i className="fas fa-plus"></i>
          <span>Tambah Baru</span>
        </Link>
      </div>

      {/* Table */}
      <div className="card-minimal p-0 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light bg-opacity-50">
          <h3 className="h6 mb-0 text-uppercase fw-bold ls-1">Riwayat Pelaporan</h3>
          <div
            className="search-minimal d-flex align-items-center gap-2 border-bottom py-1"
            style={{ width: '200px' }}
          >
            <i className="fas fa-search text-muted small"></i>
            <input
              type="text"
              className="bg-transparent border-0 small w-100"
              placeholder="Cari..."
              style={{ outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-minimal">
            <thead>
              <tr>
                <th className="ps-4">No.</th>
                <th>Tanggal</th>
                <th>Informasi Pasien</th>
                <th>Pelapor</th>
                <th className="text-end pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiwayat.map((entry, index) => (
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
                      <span className="text-muted small" style={{ fontSize: '10px' }}>
                        • RM: {entry.no_rm}
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
              ))}
              {filteredRiwayat.length === 0 && !loading && (
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
