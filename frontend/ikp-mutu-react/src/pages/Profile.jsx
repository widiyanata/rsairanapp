import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import Swal from 'sweetalert2';
import { showLoading, hideLoading } from '../components/ui/LoadingOverlay';

export default function Profile() {
  const { user, updateUser, permissions } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'permissions'

  // Form Profile State
  const [nama, setNama] = useState(user?.nama || '');
  const [telp, setTelp] = useState(user?.telp || '');

  // Form Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setTelp(user.telp || '');
    }
  }, [user]);

  // Handle Update Profile (Nama & No WA)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Wajib Diisi',
        text: 'Silakan masukkan nama lengkap beserta gelar/jabatan Anda.',
      });
      return;
    }

    showLoading();
    try {
      const { data } = await api.post('/updateProfile', {
        username: user?.username,
        nama: nama.trim(),
        telp: telp.trim(),
      });

      if (data.status) {
        const updatedUser = data.data?.[0];
        if (updatedUser) {
          updateUser(updatedUser);
        } else {
          updateUser({ nama: nama.trim(), telp: telp.trim() });
        }

        Swal.fire({
          icon: 'success',
          title: 'Profil Berhasil Disimpan',
          text: 'Data profil Anda telah berhasil diperbarui.',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memperbarui Profil',
          text: data.message || 'Terjadi kesalahan pada server.',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: err.response?.data?.message || 'Gagal menghubungi server.',
      });
    } finally {
      hideLoading();
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Kata Sandi Lama Kosong',
        text: 'Harap masukkan kata sandi saat ini untuk verifikasi.',
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Kata Sandi Terlalu Pendek',
        text: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Konfirmasi Sandi Tidak Cocok',
        text: 'Kata sandi baru dan konfirmasi kata sandi tidak sama.',
      });
      return;
    }

    showLoading();
    try {
      const { data } = await api.post('/updateProfile', {
        username: user?.username,
        nama: nama.trim() || user?.nama,
        telp: telp.trim() || user?.telp,
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (data.status) {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        Swal.fire({
          icon: 'success',
          title: 'Kata Sandi Berhasil Diubah',
          text: 'Kata sandi akun Anda telah berhasil diperbarui.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengubah Sandi',
          text: data.message || 'Kata sandi lama tidak sesuai.',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: err.response?.data?.message || 'Kata sandi lama salah atau koneksi gagal.',
      });
    } finally {
      hideLoading();
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { label: 'Administrator', bg: 'bg-dark text-white', icon: 'fa-user-shield' };
      case 'mutu':
        return { label: 'Komite Mutu', bg: 'bg-primary text-white', icon: 'fa-award' };
      case 'kasie':
        return { label: 'Kepala Seksi (Kasie)', bg: 'bg-success text-white', icon: 'fa-user-check' };
      case 'karu':
        return { label: 'Kepala Ruangan (Karu)', bg: 'bg-info text-dark', icon: 'fa-user-tie' };
      default:
        return { label: 'Staff / Perawat', bg: 'bg-secondary text-white', icon: 'fa-user-nurse' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  // Filter accessible features
  const userFeatures = permissions
    .filter((p) => p.role.toLowerCase() === user?.role?.toLowerCase())
    .map((p) => p.feature);

  return (
    <div className="profile-page pb-5 w-100">
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Manajemen Profil</h1>
          <p className="text-muted small mb-0">
            Kelola data diri, nomor kontak notifikasi WhatsApp, dan keamanan kata sandi akun Anda.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Profile Card */}
        <div className="col-12 col-lg-4">
          <div className="card-minimal p-4 bg-white border rounded-3 shadow-sm text-center position-relative overflow-hidden mb-4">
            {/* Top Decorative Banner */}
            <div
              className="position-absolute top-0 start-0 w-100"
              style={{
                height: '75px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              }}
            ></div>

            {/* Avatar */}
            <div className="position-relative mt-4 mb-3">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center bg-white shadow-sm border border-3 border-white text-dark fw-bold fs-2"
                style={{
                  width: '90px',
                  height: '90px',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>

            <h5 className="fw-bold mb-1 text-dark text-truncate" title={user?.nama || user?.username}>
              {user?.nama || user?.username}
            </h5>
            <p className="text-muted small mb-2">@{user?.username}</p>

            <div className="d-flex justify-content-center mb-3">
              <span className={`badge rounded-pill px-3 py-2 fw-medium ${roleInfo.bg}`}>
                <i className={`fas ${roleInfo.icon} me-1`}></i>
                {roleInfo.label}
              </span>
            </div>

            <hr className="my-3 opacity-25" />

            <div className="d-flex flex-column gap-2 text-start small">
              <div className="d-flex align-items-center justify-content-between text-muted">
                <span>Instansi:</span>
                <span className="fw-semibold text-dark">RS Airan Raya</span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-muted">
                <span>WhatsApp:</span>
                <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                  {user?.telp && user.telp !== '-' ? user.telp : 'Belum diatur'}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-muted">
                <span>Status Akun:</span>
                <span className="badge bg-success-subtle text-success border border-success px-2 py-1">
                  <i className="fas fa-check-circle me-1"></i> Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="card-minimal p-3 bg-light bg-opacity-75 border rounded-3">
            <h6 className="fw-bold small mb-2 d-flex align-items-center gap-2">
              <i className="fab fa-whatsapp text-success fs-5"></i>
              <span>Integrasi WhatsApp Gateway</span>
            </h6>
            <p className="small text-muted mb-0" style={{ fontSize: '11px', lineHeight: '1.5' }}>
              Pastikan nomor WhatsApp Anda aktif. Sistem mengirimkan pengingat otomatis saat ada
              laporan insiden baru, verifikasi grading Kasie, dan hasil investigasi mutu.
            </p>
          </div>
        </div>

        {/* Right Column: Settings Tabs & Forms */}
        <div className="col-12 col-lg-8">
          <div className="card-minimal p-0 bg-white border rounded-3 shadow-sm overflow-hidden">
            {/* Navigation Tabs */}
            <div className="d-flex border-bottom bg-light bg-opacity-50 px-3 pt-2 gap-2 overflow-x-auto">
              <button
                type="button"
                className={`btn btn-sm rounded-top-2 rounded-bottom-0 py-2 px-3 fw-medium border-bottom-0 ${
                  activeTab === 'profile'
                    ? 'bg-white text-primary border border-bottom-0 fw-bold shadow-none'
                    : 'text-muted border-0 bg-transparent'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user-edit me-2"></i>
                Informasi Profil
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-top-2 rounded-bottom-0 py-2 px-3 fw-medium border-bottom-0 ${
                  activeTab === 'security'
                    ? 'bg-white text-primary border border-bottom-0 fw-bold shadow-none'
                    : 'text-muted border-0 bg-transparent'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-shield-alt me-2"></i>
                Kata Sandi & Keamanan
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-top-2 rounded-bottom-0 py-2 px-3 fw-medium border-bottom-0 ${
                  activeTab === 'permissions'
                    ? 'bg-white text-primary border border-bottom-0 fw-bold shadow-none'
                    : 'text-muted border-0 bg-transparent'
                }`}
                onClick={() => setActiveTab('permissions')}
              >
                <i className="fas fa-key me-2"></i>
                Hak Akses Modul
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4">
              {/* TAB 1: INFORMASI PROFIL */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile}>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="label-minimal mb-1">Username (Login ID)</label>
                      <input
                        type="text"
                        className="input-minimal bg-light text-muted"
                        value={user?.username || ''}
                        disabled
                        title="Username tidak dapat diubah"
                      />
                      <small className="text-muted" style={{ fontSize: '10px' }}>
                        * Username bersifat permanen untuk integritas riwayat berkas.
                      </small>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="label-minimal mb-1">Role / Peran Sistem</label>
                      <input
                        type="text"
                        className="input-minimal bg-light text-muted text-uppercase"
                        value={user?.role || ''}
                        disabled
                      />
                    </div>

                    <div className="col-12">
                      <label className="label-minimal mb-1">
                        Nama Lengkap & Gelar / Posisi Jabatan <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-minimal"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: dr. Putri Rinawati - Kepala Seksi Penunjang Medis"
                        required
                      />
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        Nama ini akan otomatis tercantum pada tanda tangan laporan insiden, grading, dan investigasi.
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="label-minimal mb-1">
                        Nomor Handphone / WhatsApp Aktif
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border text-muted">
                          <i className="fab fa-whatsapp text-success fs-6"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={telp}
                          onChange={(e) => setTelp(e.target.value)}
                          placeholder="Contoh: 081234567890"
                        />
                      </div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        Digunakan untuk menerima notifikasi pesan WhatsApp otomatis saat ada laporan yang perlu ditindaklanjuti.
                      </small>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-dark py-2 px-4 rounded-3 d-flex align-items-center gap-2 shadow-sm"
                    >
                      <i className="fas fa-save"></i>
                      <span>Simpan Perubahan Profil</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: KEAMANAN & KATA SANDI */}
              {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword}>
                  <div className="alert alert-light border d-flex align-items-center gap-2 mb-4 py-2 px-3 rounded-3">
                    <i className="fas fa-info-circle text-primary fs-5"></i>
                    <div className="small text-muted">
                      Untuk menjaga keamanan akun Anda, gunakan kata sandi yang kuat dengan minimal 6 karakter.
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="label-minimal mb-1">
                        Kata Sandi Saat Ini <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          className="form-control"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Masukkan kata sandi lama Anda"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                        >
                          <i className={showOldPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="label-minimal mb-1">
                        Kata Sandi Baru <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          className="form-control"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          <i className={showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="label-minimal mb-1">
                        Konfirmasi Kata Sandi Baru <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className={`form-control ${
                          confirmPassword && newPassword !== confirmPassword ? 'is-invalid' : ''
                        }`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        required
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <div className="invalid-feedback">Kata sandi tidak cocok.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary py-2 px-4 rounded-3 d-flex align-items-center gap-2 shadow-sm"
                    >
                      <i className="fas fa-lock"></i>
                      <span>Perbarui Kata Sandi</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: HAK AKSES MODUL */}
              {activeTab === 'permissions' && (
                <div>
                  <h6 className="fw-bold mb-2">Hak Akses Modul Aktif</h6>
                  <p className="small text-muted mb-3">
                    Berikut adalah daftar hak akses modul yang diberikan kepada role Anda (
                    <strong className="text-uppercase">{user?.role}</strong>):
                  </p>

                  <div className="row g-2 mb-4">
                    {[
                      { key: 'dashboard', label: 'Dashboard & Statistik', icon: 'fa-chart-line' },
                      { key: 'kronologi', label: 'Laporan Kronologi Insiden', icon: 'fa-history' },
                      { key: 'grading', label: 'Grading Risiko & Verifikasi Kasie', icon: 'fa-layer-group' },
                      { key: 'investigasi', label: 'Investigasi Komite Mutu', icon: 'fa-search-plus' },
                      { key: 'users', label: 'Manajemen Pengguna (Admin)', icon: 'fa-users-cog' },
                    ].map((item) => {
                      const hasAccess =
                        user?.role === 'admin' ||
                        userFeatures.includes(item.key) ||
                        (user?.role === 'kasie' && ['dashboard', 'grading'].includes(item.key)) ||
                        (user?.role === 'karu' && ['dashboard', 'kronologi', 'grading'].includes(item.key)) ||
                        (user?.role === 'mutu' && ['dashboard', 'kronologi', 'grading', 'investigasi'].includes(item.key)) ||
                        (user?.role === 'perawat' && item.key === 'kronologi');

                      return (
                        <div key={item.key} className="col-12 col-sm-6">
                          <div
                            className={`p-3 rounded-3 border d-flex align-items-center justify-content-between ${
                              hasAccess ? 'bg-white border-success' : 'bg-light opacity-50'
                            }`}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <i
                                className={`fas ${item.icon} ${hasAccess ? 'text-primary' : 'text-muted'}`}
                              ></i>
                              <span className="small fw-semibold">{item.label}</span>
                            </div>
                            {hasAccess ? (
                              <span className="badge bg-success-subtle text-success border border-success" style={{ fontSize: '10px' }}>
                                Diizinkan
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-muted" style={{ fontSize: '10px' }}>
                                Terkunci
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-light rounded-3 border">
                    <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                      <i className="fas fa-info-circle text-primary me-1"></i>
                      Pengaturan hak akses modul dikelola secara terpusat oleh Administrator melalui menu
                      <strong> User Management</strong>.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
