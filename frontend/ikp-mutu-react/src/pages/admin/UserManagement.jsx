import { useEffect, useState } from 'react';
import api from '../../config/api';
import Swal from 'sweetalert2';
import { showLoading, hideLoading } from '../../components/ui/LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement() {
  const { refreshPermissions } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'permissions'

  // Access Control states
  const [selectedRole, setSelectedRole] = useState('perawat');
  const [globalPermissions, setGlobalPermissions] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    password: '',
    role: '',
    nama: '',
    telp: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/userMutu');
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await api.get('/getPermissions');
      setGlobalPermissions(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const savePermissions = async () => {
    showLoading();
    try {
      await api.post('/updatePermissions', {
        role: selectedRole,
        features: selectedFeatures
      });
      Swal.fire('Berhasil', 'Pengaturan hak akses berhasil diperbarui', 'success');
      await fetchPermissions();
      refreshPermissions?.();
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, []);

  // Update selectedFeatures when selectedRole or globalPermissions changes
  useEffect(() => {
    const rolePerms = globalPermissions
      .filter((p) => p.role.toLowerCase() === selectedRole.toLowerCase())
      .map((p) => p.feature);
    setSelectedFeatures(rolePerms);
  }, [selectedRole, globalPermissions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setFormData({
      id: '',
      username: '',
      password: '',
      role: '',
      nama: '',
      telp: ''
    });
    setIsEdit(false);
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setFormData({
      id: user.id,
      username: user.username,
      password: '', // Leave blank for no password change
      role: user.role,
      nama: user.nama,
      telp: user.telp || ''
    });
    setIsEdit(true);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoading();
    try {
      if (isEdit) {
        await api.post('/updateUserMutu', formData);
        Swal.fire('Berhasil', 'Data user berhasil diperbarui', 'success');
      } else {
        await api.post('/createUserMutu', formData);
        Swal.fire('Berhasil', 'User baru berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan sistem';
      Swal.fire('Gagal', errMsg, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async (user) => {
    const confirm = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Menghapus user "${user.nama}" (${user.username})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      showLoading();
      try {
        await api.post('/deleteUserMutu', { id: user.id });
        Swal.fire('Terhapus', 'User berhasil dihapus.', 'success');
        fetchUsers();
      } catch (err) {
        console.error(err);
        Swal.fire('Gagal', 'Gagal menghapus user', 'error');
      } finally {
        hideLoading();
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nama?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="user-management-page animate-fade-in pb-4">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Manajemen Pengguna</h1>
          <p className="text-muted small mb-0">Kelola kredensial, role, dan kontak WhatsApp pengguna aplikasi IKP-Mutu.</p>
        </div>
        {activeTab === 'users' && !showForm && (
          <button
            onClick={openAddForm}
            className="btn-minimal btn-minimal-primary shadow-sm justify-content-center py-2 px-3"
            style={{ minHeight: '42px' }}
          >
            <i className="fas fa-plus"></i>
            <span>Tambah Pengguna</span>
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      {!showForm && (
        <div className="mobile-tabs-container mb-4">
          <div className="d-flex gap-2 p-1 bg-light rounded-pill border overflow-x-auto text-nowrap no-scrollbar">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-2 flex-fill text-nowrap transition-all ${
                activeTab === 'users' ? 'btn-dark shadow-sm fw-bold' : 'btn-light border-0 text-muted'
              }`}
              onClick={() => setActiveTab('users')}
              style={{ minHeight: '38px' }}
            >
              <i className="fas fa-user-friends me-2"></i> Data Pengguna
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-2 flex-fill text-nowrap transition-all ${
                activeTab === 'permissions' ? 'btn-dark shadow-sm fw-bold' : 'btn-light border-0 text-muted'
              }`}
              onClick={() => setActiveTab('permissions')}
              style={{ minHeight: '38px' }}
            >
              <i className="fas fa-user-shield me-2"></i> Akses Kontrol Dinamis
            </button>
          </div>
        </div>
      )}

      {activeTab === 'users' ? (
        showForm ? (
          /* Add/Edit Form Card */
          <div className="card-minimal shadow-sm max-w-lg mb-5 animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
              <h3 className="h5 mb-0">{isEdit ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="btn-icon text-muted">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div className="form-group-minimal">
                <label className="label-minimal">Nama Lengkap *</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className="input-minimal"
                  placeholder="Nama Lengkap"
                  required
                />
              </div>

              <div className="form-group-minimal">
                <label className="label-minimal">Username / NIK *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input-minimal"
                  placeholder="Username untuk login"
                  required
                />
              </div>

              <div className="form-group-minimal">
                <label className="label-minimal">
                  Password {isEdit ? '(Biarkan kosong jika tidak ingin diubah)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-minimal"
                  placeholder="••••••••"
                  required={!isEdit}
                />
              </div>

              <div className="form-group-minimal">
                <label className="label-minimal">Akses Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="input-minimal"
                  required
                >
                  <option value="">-- Pilih Role --</option>
                  <option value="admin">Administrator</option>
                  <option value="mutu">Tim Mutu</option>
                  <option value="kasie">Kepala Seksi (Kasie)</option>
                  <option value="karu">Kepala Ruangan (Karu)</option>
                  <option value="perawat">Tenaga Perawat</option>
                  <option value="lainya">Karyawan Lainnya</option>
                </select>
              </div>

              <div className="form-group-minimal">
                <label className="label-minimal">No. HP WhatsApp (Contoh: 08123456789) *</label>
                <input
                  type="text"
                  name="telp"
                  value={formData.telp}
                  onChange={handleInputChange}
                  className="input-minimal"
                  placeholder="08xxxxxxxxxx"
                  required
                />
                <span className="text-muted" style={{ fontSize: '10px' }}>
                  Digunakan untuk mengirimkan notifikasi alur pelaporan insiden secara real-time.
                </span>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <button type="button" onClick={() => setShowForm(false)} className="btn-minimal btn-minimal-outline">
                  Batal
                </button>
                <button type="submit" className="btn-minimal btn-minimal-primary">
                  <i className="fas fa-save"></i>
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Users List View */
          <div className="card-minimal p-0 overflow-hidden shadow-sm animate-fade-in">
            <div className="p-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 bg-light bg-opacity-50">
              <h3 className="h6 mb-0 text-uppercase fw-bold ls-1 d-none d-sm-block">
                Daftar Pengguna ({filteredUsers.length})
              </h3>
              <div
                className="search-minimal d-flex align-items-center gap-2 border bg-white rounded-pill px-3 py-1 w-100"
                style={{ maxWidth: '320px' }}
              >
                <i className="fas fa-search text-muted small"></i>
                <input
                  type="text"
                  className="bg-transparent border-0 small w-100 py-1"
                  placeholder="Cari nama, username, role..."
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

            {/* Mobile Cards (d-md-none) */}
            <div className="d-md-none p-2 bg-light bg-opacity-25">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-spinner fa-spin h3 mb-2"></i>
                  <p className="small mb-0">Memuat data pengguna...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="card-minimal p-3 bg-white border rounded-3 shadow-none mobile-item-card"
                    >
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div>
                          <div className="fw-bold text-dark">{user.nama}</div>
                          <div className="text-muted small">@{user.username}</div>
                        </div>
                        <span className={`badge rounded-pill fw-normal px-2 py-1 border text-uppercase ${
                          user.role === 'admin' 
                            ? 'text-danger bg-danger-subtle border-danger' 
                            : user.role === 'mutu' 
                            ? 'text-primary bg-primary-subtle border-primary'
                            : user.role === 'kasie'
                            ? 'text-info bg-info-subtle border-info'
                            : user.role === 'karu'
                            ? 'text-success bg-success-subtle border-success'
                            : 'text-muted bg-light border-secondary border-opacity-25'
                        }`} style={{ fontSize: '10px' }}>
                          {user.role}
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
                        <div className="small text-muted">
                          {user.telp ? (
                            <a
                              href={`https://wa.me/${user.telp.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-decoration-none text-success d-flex align-items-center gap-1"
                            >
                              <i className="fab fa-whatsapp"></i>
                              <span>{user.telp}</span>
                            </a>
                          ) : (
                            <span className="text-muted fst-italic" style={{ fontSize: '11px' }}>
                              Tidak ada WA
                            </span>
                          )}
                        </div>

                        <div className="d-flex gap-1">
                          <button
                            onClick={() => openEditForm(user)}
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
                            style={{ fontSize: '12px' }}
                          >
                            <i className="fas fa-edit me-1"></i> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1"
                            style={{ fontSize: '12px' }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-users-slash h2 opacity-50 mb-2"></i>
                  <p className="small mb-0">Tidak ada pengguna ditemukan</p>
                </div>
              )}
            </div>

            {/* Desktop Table (d-none d-md-block) */}
            <div className="table-responsive d-none d-md-block">
              <table className="table-minimal">
                <thead>
                  <tr>
                    <th className="ps-4">No.</th>
                    <th>Nama Pengguna</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>No. WhatsApp</th>
                    <th className="text-end pe-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover-fade">
                      <td className="ps-4">
                        <span className="text-muted small">#{index + 1}</span>
                      </td>
                      <td>
                        <div className="fw-bold small">{user.nama}</div>
                      </td>
                      <td>
                        <div className="small text-muted">{user.username}</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill fw-normal px-3 py-1 border ${
                          user.role === 'admin' 
                            ? 'text-danger bg-danger-subtle border-danger' 
                            : user.role === 'mutu' 
                            ? 'text-primary bg-primary-subtle border-primary'
                            : user.role === 'kasie'
                            ? 'text-info bg-info-subtle border-info'
                            : user.role === 'karu'
                            ? 'text-success bg-success-subtle border-success'
                            : 'text-muted bg-light border-secondary border-opacity-25'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="small text-muted">
                          <i className="fab fa-whatsapp text-success me-1"></i>
                          {user.telp || '-'}
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group gap-2 justify-content-end">
                          <button
                            onClick={() => openEditForm(user)}
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit User"
                            style={{ border: 'none' }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="btn btn-sm btn-outline-danger"
                            title="Hapus User"
                            style={{ border: 'none' }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="text-muted opacity-50">
                          <i className="fas fa-users-slash h1 mb-3"></i>
                          <p className="small">Tidak ada data pengguna ditemukan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Tab: Akses Kontrol / Hak Akses */
        <div className="card-minimal shadow-sm p-4 animate-fade-in">
          <h3 className="h5 mb-4">Pengaturan Hak Akses Dinamis</h3>

          <div className="row g-4 align-items-center mb-4">
            <div className="col-md-4">
              <label className="label-minimal">Pilih Role Akses</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-minimal"
              >
                <option value="admin">Administrator</option>
                <option value="mutu">Tim Mutu</option>
                <option value="kasie">Kepala Seksi (Kasie)</option>
                <option value="karu">Kepala Ruangan (Karu)</option>
                <option value="perawat">Tenaga Perawat</option>
                <option value="lainya">Karyawan Lainnya</option>
              </select>
            </div>
            <div className="col-md-8 text-muted small pt-3">
              * Perubahan hak akses untuk role terpilih akan langsung memengaruhi menu navigasi & hak buka halaman secara real-time.
            </div>
          </div>

          <div className="border rounded p-3 mb-4 bg-light bg-opacity-25">
            <h6 className="label-minimal mb-3 border-bottom pb-2">Fitur / Modul yang Dapat Diakses:</h6>

            {[
              { key: 'dashboard', title: 'Dashboard', desc: 'Akses halaman statistik utama dan shortcut modul' },
              { key: 'kronologi', title: 'Lembar Kronologi (IKP-1)', desc: 'Mengisi laporan kejadian insiden baru dan melihat riwayat draf pribadi' },
              { key: 'grading', title: 'Grading Risiko (IKP-2)', desc: 'Melihat laporan kiriman unit dan melakukan grading risiko matrix' },
              { key: 'investigasi', title: 'Investigasi Lanjutan (IKP-3)', desc: 'Melakukan investigasi komparatif, rekomendasi tindakan, dan verifikasi' },
              { key: 'users', title: 'User Management', desc: 'Mengelola data kredensial, role, dan hak akses dinamis (Administrator)' }
            ].map((feature) => {
              const isChecked = selectedFeatures.includes(feature.key);
              const handleCheckboxChange = (e) => {
                if (e.target.checked) {
                  setSelectedFeatures((prev) => [...prev, feature.key]);
                } else {
                  setSelectedFeatures((prev) => prev.filter((f) => f !== feature.key));
                }
              };

              return (
                <div key={feature.key} className="form-check p-3 border-bottom d-flex align-items-start gap-3">
                  <input
                    type="checkbox"
                    className="form-check-input mt-1"
                    id={`feat-${feature.key}`}
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    disabled={selectedRole === 'admin'}
                  />
                  <div style={{ marginLeft: '10px' }}>
                    <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor={`feat-${feature.key}`}>
                      {feature.title}
                    </label>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      {feature.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              onClick={savePermissions}
              className="btn-minimal btn-minimal-primary"
              disabled={selectedRole === 'admin'}
            >
              <i className="fas fa-save"></i> Simpan Akses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
