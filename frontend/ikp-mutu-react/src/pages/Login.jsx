import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // For perawat search
  const [userPerawat, setUserPerawat] = useState([]);

  // For karyawan lainnya
  const [karyawan, setKaryawan] = useState({ id: '', username: '', email: '', role: '' });
  const [listKaryawan, setListKaryawan] = useState([]);
  const [isKaryawan, setIsKaryawan] = useState(false);

  const cariUser = async (value) => {
    if (value.length < 3) return;
    try {
      const { data } = await api.get(`/cariUser?cari=${value}&role=${role}`);
      setUserPerawat(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const pilihUser = (user) => {
    setUsername(user.FMPPERAWATN);
    sessionStorage.setItem('_temp_user', JSON.stringify(user));
    setUserPerawat([]);
  };

  const loginPerawat = () => {
    const temp = JSON.parse(sessionStorage.getItem('_temp_user'));
    if (temp && temp.FMPPERAWATN === username && temp.FMPPW === password) {
      const userData = { username: temp.FMPPERAWATN, id: temp.FMPPERAWAT_ID, role: 'perawat' };
      login(userData);
      navigate('/');
    } else {
      setError('Data login tidak sesuai');
    }
  };

  const loginMutu = async () => {
    try {
      const { data } = await api.post('/loginMutu', { username, password });
      if (data.status.success) {
        login(data.data[0]);
        navigate('/');
      } else {
        setError('Username/Password salah');
      }
    } catch {
      setError('Koneksi gagal');
    }
  };

  const cekKaryawan = async (nama) => {
    if (nama.length < 3) return;
    try {
      const { data } = await api.get(`/cekKaryawan?q=${nama}`);
      setListKaryawan(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const pilihKaryawan = (data) => {
    setKaryawan({ id: data.nik, username: data.nama, role: data.unit, email: '' });
    setIsKaryawan(true);
    setListKaryawan([]);
  };

  const loginLainya = (e) => {
    e.preventDefault();
    if (karyawan.username && karyawan.email) {
      login({ ...karyawan });
      navigate('/');
    } else {
      setError('Lengkapi data login');
    }
  };

  const handleStandardLogin = (e) => {
    e.preventDefault();
    if (role === 'perawat') {
      loginPerawat();
    } else {
      loginMutu();
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="card-minimal login-card shadow-sm border-0 p-4 p-md-5 bg-white"
        style={{ maxWidth: '400px', width: '100%' }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div
            className="logo-placeholder mx-auto mb-4 flex-center bg-dark text-white rounded-circle"
            style={{ width: '48px', height: '48px' }}
          >
            <i className="fas fa-plus"></i>
          </div>
          <h2 className="h5 fw-bold mb-1">RS Airan Raya</h2>
          <p className="text-muted small">Sistem Informasi Komite Mutu</p>
        </div>

        {/* Role Selection */}
        <div className="form-group-minimal mb-4">
          <label htmlFor="role" className="label-minimal">Akses Sebagai</label>
          <select
            id="role"
            value={role}
            onChange={(e) => { setRole(e.target.value); setError(null); }}
            className="input-minimal"
          >
            <option value="">-- Pilih Role --</option>
            <option value="mutu">Tim Mutu</option>
            <option value="karu">Kepala Ruangan</option>
            <option value="perawat">Tenaga Perawat</option>
            <option value="lainya">Karyawan Lainnya</option>
          </select>
        </div>

        {role && (
          <div className="animate-fade-in">
            {role === 'lainya' ? (
              /* Karyawan Lainnya Login */
              <form onSubmit={loginLainya} className="d-flex flex-column gap-3">
                <div className="form-group-minimal">
                  <label className="label-minimal">Nama Lengkap</label>
                  <input
                    type="search"
                    value={karyawan.username}
                    onChange={(e) => {
                      setKaryawan((prev) => ({ ...prev, username: e.target.value }));
                      setIsKaryawan(false);
                      cekKaryawan(e.target.value);
                    }}
                    className="input-minimal"
                    placeholder="Cari nama..."
                    required
                  />
                  {karyawan.username.length > 2 && listKaryawan.length > 0 && (
                    <div className="search-results-list border rounded-3 mt-1 bg-white shadow-sm overflow-hidden">
                      {listKaryawan.map((user) => (
                        <div
                          key={user.nik}
                          onClick={() => pilihKaryawan(user)}
                          className="p-2 border-bottom hover-bg cursor-pointer small"
                        >
                          {user.nama}{' '}
                          <span className="text-muted" style={{ fontSize: '9px' }}>
                            ({user.nik})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isKaryawan && (
                  <div className="animate-fade-in d-flex flex-column gap-3">
                    <div className="form-group-minimal">
                      <label className="label-minimal">Email</label>
                      <input
                        type="email"
                        value={karyawan.email}
                        onChange={(e) =>
                          setKaryawan((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="input-minimal"
                        placeholder="email@domain.com"
                        required
                      />
                    </div>
                    <div className="form-group-minimal">
                      <label className="label-minimal">Unit Kerja</label>
                      <input
                        type="text"
                        value={karyawan.role}
                        className="input-minimal"
                        readOnly
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-minimal btn-minimal-primary w-100 justify-content-center"
                    >
                      Masuk
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* Standard Login (Mutu / Karu / Perawat) */
              <form onSubmit={handleStandardLogin} className="d-flex flex-column gap-3">
                <div className="form-group-minimal position-relative">
                  <label className="label-minimal">Username</label>
                  <input
                    type="search"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (role === 'perawat' && e.target.value.length > 2) {
                        cariUser(e.target.value);
                      }
                    }}
                    className="input-minimal"
                    placeholder="Username"
                    required
                  />
                  {role === 'perawat' && userPerawat.length > 0 && username.length > 2 && (
                    <div className="search-results-list border rounded-3 mt-1 bg-white shadow-sm overflow-hidden position-absolute w-100 z-3">
                      {userPerawat.map((user) => (
                        <div
                          key={user.FMPPERAWAT_ID}
                          onClick={() => pilihUser(user)}
                          className="p-2 border-bottom hover-bg cursor-pointer small"
                        >
                          {user.FMPPERAWATN}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group-minimal">
                  <label className="label-minimal">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-minimal"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-minimal btn-minimal-primary w-100 justify-content-center mt-2"
                >
                  Masuk
                </button>
              </form>
            )}
          </div>
        )}

        {error && (
          <div className="text-danger small mt-4 text-center animate-fade-in">
            {error}
          </div>
        )}

        <div className="text-center mt-5 text-muted" style={{ fontSize: '10px' }}>
          &copy; 2024 IT RS Airan Raya
        </div>
      </div>
    </div>
  );
}
