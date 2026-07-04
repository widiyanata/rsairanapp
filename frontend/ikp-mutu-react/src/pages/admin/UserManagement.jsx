import { useEffect, useState } from 'react';
import api from '../../config/api';
import Swal from 'sweetalert2';
import { showLoading, hideLoading } from '../../components/ui/LoadingOverlay';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchUsers();
  }, []);

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
    <div className="user-management-page animate-fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-5">
        <div>
          <h1 className="h2 fw-bold mb-1">Manajemen Pengguna</h1>
          <p className="text-muted small mb-0">Kelola kredensial, role, dan kontak WhatsApp pengguna aplikasi IKP-Mutu.</p>
        </div>
        {!showForm && (
          <button onClick={openAddForm} className="btn-minimal btn-minimal-primary shadow-sm">
            <i className="fas fa-plus"></i>
            <span>Tambah Pengguna</span>
          </button>
        )}
      </div>

      {showForm ? (
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
        <div className="card-minimal p-0 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light bg-opacity-50">
            <h3 className="h6 mb-0 text-uppercase fw-bold ls-1">Daftar Pengguna</h3>
            <div className="search-minimal d-flex align-items-center gap-2 border-bottom py-1" style={{ width: '250px' }}>
              <i className="fas fa-search text-muted small"></i>
              <input
                type="text"
                className="bg-transparent border-0 small w-100"
                placeholder="Cari nama, username, role..."
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
      )}
    </div>
  );
}
