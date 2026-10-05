import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_CARDS } from '../config/permissions';
import api from '../config/api';

export default function Dashboard() {
  const { user, hasAccessDynamic } = useAuth();
  const [rawData, setRawData] = useState({
    kronologi: [],
    grading: [],
    investigasi: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);

  const visibleCards = DASHBOARD_CARDS.filter((card) => {
    let feature = 'dashboard';
    if (card.path === '/kronologi') feature = 'kronologi';
    else if (card.path === '/grading') feature = 'grading';
    else if (card.path === '/investigasi') feature = 'investigasi';
    else if (card.path === '/users') feature = 'users';

    return hasAccessDynamic(feature);
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const promises = [
          api.get('/kronologi'),
          api.get('/grading'),
          api.get('/investigasi'),
        ];

        if (user?.role === 'admin') {
          promises.push(api.get('/userMutu'));
        }

        const [kronRes, gradRes, invRes, userRes] = await Promise.allSettled(promises);

        setRawData({
          kronologi: kronRes.status === 'fulfilled' ? (kronRes.value.data?.data || []) : [],
          grading: gradRes.status === 'fulfilled' ? (gradRes.value.data?.data || []) : [],
          investigasi: invRes.status === 'fulfilled' ? (invRes.value.data?.data || []) : [],
          users: userRes?.status === 'fulfilled' ? (userRes.value.data?.data || []) : [],
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const formatStat = (num) => String(num).padStart(2, '0');

  // Role-specific statistics calculation
  const roleStats = useMemo(() => {
    if (!user) return [];

    const role = user.role?.toLowerCase();

    // 1. KASIE (Kepala Seksi)
    if (role === 'kasie') {
      const gradingBagian = rawData.grading.filter(
        (g) => String(g.kirim_ke_kasie) === String(user.id)
      );
      const perluVerifikasi = gradingBagian.filter(
        (g) => g.status_verifikasi_kasie !== 'TERVERIFIKASI' && !g.tanda_tangan_penerima
      ).length;
      const sudahVerifikasi = gradingBagian.filter(
        (g) => g.status_verifikasi_kasie === 'TERVERIFIKASI' || !!g.tanda_tangan_penerima
      ).length;

      return [
        {
          title: 'Perlu Verifikasi Kasie',
          value: perluVerifikasi,
          icon: 'fas fa-signature',
          color: 'text-warning',
          bgLight: 'bg-warning-subtle',
          border: 'border-warning-subtle',
          desc: 'Menunggu tanda tangan verifikasi Anda',
          path: '/grading',
          urgent: perluVerifikasi > 0,
        },
        {
          title: 'Sudah Diverifikasi',
          value: sudahVerifikasi,
          icon: 'fas fa-check-double',
          color: 'text-success',
          bgLight: 'bg-success-subtle',
          border: 'border-success-subtle',
          desc: 'Telah disahkan & ditandatangani',
          path: '/grading',
        },
        {
          title: 'Total Laporan Seksi',
          value: gradingBagian.length,
          icon: 'fas fa-shield-alt',
          color: 'text-primary',
          bgLight: 'bg-primary-subtle',
          border: 'border-primary-subtle',
          desc: 'Seluruh insiden bagian Anda',
          path: '/grading',
        },
      ];
    }

    // 2. KARU (Kepala Ruangan)
    if (role === 'karu') {
      const kronologiMasuk = rawData.kronologi.filter(
        (k) => String(k.kirimke) === String(user.id)
      );
      const distinctNoTrans = Array.from(new Set(kronologiMasuk.map((k) => k.no_transaksi)));

      const gradingByKaru = rawData.grading.filter((g) => {
        try {
          const d = JSON.parse(g.dibuat_oleh);
          return String(d.user_id) === String(user.id) || d.user_name === user.username;
        } catch {
          return false;
        }
      });

      const belumGrading = distinctNoTrans.filter(
        (nt) => !rawData.grading.some((g) => g.no_transaksi === nt)
      ).length;

      const menungguKasie = gradingByKaru.filter(
        (g) => g.status_verifikasi_kasie !== 'TERVERIFIKASI' && !g.tanda_tangan_penerima
      ).length;

      const terverifikasi = gradingByKaru.filter(
        (g) => g.status_verifikasi_kasie === 'TERVERIFIKASI' || !!g.tanda_tangan_penerima
      ).length;

      return [
        {
          title: 'Laporan Masuk (Unit)',
          value: distinctNoTrans.length,
          icon: 'fas fa-inbox',
          color: 'text-primary',
          bgLight: 'bg-primary-subtle',
          border: 'border-primary-subtle',
          desc: 'Dari perawat/staf ruangan Anda',
          path: '/grading',
        },
        {
          title: 'Menunggu Grading Karu',
          value: belumGrading,
          icon: 'fas fa-hourglass-half',
          color: 'text-warning',
          bgLight: 'bg-warning-subtle',
          border: 'border-warning-subtle',
          desc: 'Perlu penilaian matriks risiko',
          path: '/grading',
          urgent: belumGrading > 0,
        },
        {
          title: 'Menunggu Verifikasi Kasie',
          value: menungguKasie,
          icon: 'fas fa-paper-plane',
          color: 'text-info',
          bgLight: 'bg-info-subtle',
          border: 'border-info-subtle',
          desc: 'Sudah diteruskan ke Kasie',
          path: '/grading',
        },
        {
          title: 'Terverifikasi Kasie',
          value: terverifikasi,
          icon: 'fas fa-check-circle',
          color: 'text-success',
          bgLight: 'bg-success-subtle',
          border: 'border-success-subtle',
          desc: 'Selesai diverifikasi Kasie',
          path: '/grading',
        },
      ];
    }

    // 3. MUTU (Komite Mutu)
    if (role === 'mutu') {
      const terverifikasiKasie = rawData.grading.filter(
        (g) => g.status_verifikasi_kasie === 'TERVERIFIKASI' || !!g.tanda_tangan_penerima
      );
      const investigasiIds = new Set(rawData.investigasi.map((i) => i.no_transaksi));
      const perluInvestigasi = terverifikasiKasie.filter(
        (g) => !investigasiIds.has(g.no_transaksi)
      ).length;
      const selesaiInvestigasi = rawData.investigasi.length;
      const resikoTinggi = rawData.grading.filter((g) => {
        try {
          const r = JSON.parse(g.rincian_kejadian || '{}');
          return r.gradingrisiko === 'merah' || r.gradingrisiko === 'kuning';
        } catch {
          return false;
        }
      }).length;

      return [
        {
          title: 'Siap Diinvestigasi',
          value: perluInvestigasi,
          icon: 'fas fa-clipboard-check',
          color: 'text-warning',
          bgLight: 'bg-warning-subtle',
          border: 'border-warning-subtle',
          desc: 'Terverifikasi Kasie & perlu investigasi',
          path: '/investigasi',
          urgent: perluInvestigasi > 0,
        },
        {
          title: 'Investigasi Selesai',
          value: selesaiInvestigasi,
          icon: 'fas fa-search-plus',
          color: 'text-success',
          bgLight: 'bg-success-subtle',
          border: 'border-success-subtle',
          desc: 'Laporan investigasi komite mutu',
          path: '/investigasi',
        },
        {
          title: 'Insiden Risiko Tinggi',
          value: resikoTinggi,
          icon: 'fas fa-exclamation-triangle',
          color: 'text-danger',
          bgLight: 'bg-danger-subtle',
          border: 'border-danger-subtle',
          desc: 'Kategori Kuning / Merah (Prioritas)',
          path: '/investigasi',
        },
        {
          title: 'Total Pelaporan RS',
          value: rawData.kronologi.length,
          icon: 'fas fa-database',
          color: 'text-primary',
          bgLight: 'bg-primary-subtle',
          border: 'border-primary-subtle',
          desc: 'Seluruh insiden tercatat di RS',
          path: '/investigasi',
        },
      ];
    }

    // 4. PERAWAT / LAINYA (Staf Pelapor)
    if (role === 'perawat' || role === 'lainya') {
      const laporanSaya = rawData.kronologi.filter((k) => {
        try {
          const d = JSON.parse(k.dibuat_oleh);
          return String(d.id) === String(user.id) || d.username === user.username;
        } catch {
          return false;
        }
      });
      const terkirim = laporanSaya.filter((k) => k.kirimke && k.kirimke !== '0').length;
      const draf = laporanSaya.filter((k) => !k.kirimke || k.kirimke === '0').length;
      const terverifikasi = laporanSaya.filter((k) => {
        return rawData.grading.some(
          (g) =>
            g.no_transaksi === k.no_transaksi &&
            (g.status_verifikasi_kasie === 'TERVERIFIKASI' || !!g.tanda_tangan_penerima)
        );
      }).length;

      return [
        {
          title: 'Total Laporan Saya',
          value: laporanSaya.length,
          icon: 'fas fa-file-alt',
          color: 'text-primary',
          bgLight: 'bg-primary-subtle',
          border: 'border-primary-subtle',
          desc: 'Kronologi insiden yang Anda buat',
          path: '/kronologi',
        },
        {
          title: 'Terkirim ke Karu',
          value: terkirim,
          icon: 'fas fa-paper-plane',
          color: 'text-info',
          bgLight: 'bg-info-subtle',
          border: 'border-info-subtle',
          desc: 'Sedang ditindaklanjuti unit',
          path: '/kronologi',
        },
        {
          title: 'Draf Belum Terkirim',
          value: draf,
          icon: 'fas fa-edit',
          color: 'text-warning',
          bgLight: 'bg-warning-subtle',
          border: 'border-warning-subtle',
          desc: 'Segera kirimkan ke Kepala Ruangan',
          path: '/kronologi',
          urgent: draf > 0,
        },
        {
          title: 'Terverifikasi Selesai',
          value: terverifikasi,
          icon: 'fas fa-check-circle',
          color: 'text-success',
          bgLight: 'bg-success-subtle',
          border: 'border-success-subtle',
          desc: 'Telah disahkan oleh Kasie',
          path: '/kronologi',
        },
      ];
    }

    // 5. ADMIN (Overview Keseluruhan Sistem)
    return [
      {
        title: 'Lembar Kronologi (IKP-1)',
        value: rawData.kronologi.length,
        icon: 'fas fa-history',
        color: 'text-primary',
        bgLight: 'bg-primary-subtle',
        border: 'border-primary-subtle',
        desc: 'Laporan insiden seluruh staf',
        path: '/kronologi',
      },
      {
        title: 'Grading Risiko (IKP-2)',
        value: rawData.grading.length,
        icon: 'fas fa-chart-line',
        color: 'text-info',
        bgLight: 'bg-info-subtle',
        border: 'border-info-subtle',
        desc: 'Penilaian matriks unit & Kasie',
        path: '/grading',
      },
      {
        title: 'Investigasi Mutu (IKP-3)',
        value: rawData.investigasi.length,
        icon: 'fas fa-search-plus',
        color: 'text-success',
        bgLight: 'bg-success-subtle',
        border: 'border-success-subtle',
        desc: 'Investigasi komite mutu RS',
        path: '/investigasi',
      },
      {
        title: 'Pengguna Terdaftar',
        value: rawData.users.length,
        icon: 'fas fa-users-cog',
        color: 'text-secondary',
        bgLight: 'bg-light',
        border: 'border-secondary-subtle',
        desc: 'Akun staf, Karu, Kasie, & Mutu',
        path: '/users',
      },
    ];
  }, [user, rawData]);

  const roleTitleMapping = {
    kasie: 'Ringkasan Verifikasi Kasie',
    karu: 'Ringkasan Tugas Kepala Ruangan',
    mutu: 'Monitoring Komite Mutu',
    perawat: 'Aktivitas Pelaporan Saya',
    lainya: 'Aktivitas Pelaporan Saya',
    admin: 'Statistik Keseluruhan Sistem',
  };

  const currentRoleTitle = roleTitleMapping[user?.role?.toLowerCase()] || 'Statistik Terkini';

  return (
    <div className="home-container pb-4">
      {/* Welcome Banner */}
      <div className="welcome-section mb-4 p-4 rounded-4 bg-white border shadow-sm animate-fade-in position-relative overflow-hidden">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className={`badge border text-uppercase ${
                  user?.role === 'kasie'
                    ? 'bg-info-subtle text-info border-info-subtle'
                    : user?.role === 'karu'
                    ? 'bg-success-subtle text-success border-success-subtle'
                    : user?.role === 'mutu'
                    ? 'bg-warning-subtle text-warning border-warning-subtle'
                    : 'bg-primary-subtle text-primary border-primary-subtle'
                }`}
                style={{ fontSize: '10px' }}
              >
                {user?.role === 'kasie'
                  ? 'Kepala Seksi (Kasie)'
                  : user?.role === 'karu'
                  ? 'Kepala Ruangan (Karu)'
                  : user?.role === 'mutu'
                  ? 'Komite Mutu'
                  : user?.role || 'Staff'}
              </span>
              <span className="text-muted small">• RS Airan Raya</span>
            </div>
            <h1 className="h4 fw-bold mb-1 text-dark">
              Halo, {user?.nama || user?.username} 👋
            </h1>
            <p className="text-muted small mb-0">
              Sistem Pelaporan Mutu & Keselamatan Pasien (IKP)
            </p>
          </div>

          {/* Quick Action Button for Nurses / Staff */}
          {hasAccessDynamic('kronologi') && (
            <Link
              to="/kronologi/form"
              className="btn btn-dark btn-sm rounded-pill px-3 py-2 d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-nowrap"
              style={{ minHeight: '40px' }}
            >
              <i className="fas fa-plus-circle text-primary"></i>
              <span>+ Buat Laporan Baru</span>
            </Link>
          )}
        </div>
      </div>

      {/* Role-tailored Dynamic Stats */}
      <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="label-minimal mb-0">{currentRoleTitle}</h6>
          <span className="small text-muted" style={{ fontSize: '11px' }}>
            <i className="fas fa-sync-alt fa-spin me-1" style={{ display: loading ? 'inline-block' : 'none' }}></i>
            Real-time
          </span>
        </div>

        <div className="row g-3">
          {roleStats.map((item, idx) => (
            <div
              key={idx}
              className={`col-12 col-sm-6 ${roleStats.length === 3 ? 'col-md-4' : 'col-md-3'}`}
            >
              <Link to={item.path} className="text-decoration-none">
                <div className="card-minimal h-100 p-3 bg-white border rounded-3 shadow-none hover-fade position-relative overflow-hidden">
                  {item.urgent && (
                    <span
                      className="position-absolute top-0 end-0 m-2 badge bg-danger text-white rounded-pill px-2 py-1"
                      style={{ fontSize: '9px' }}
                    >
                      <i className="fas fa-bell me-1"></i>Perlu Tindakan
                    </span>
                  )}

                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted small text-uppercase ls-1" style={{ fontSize: '11px' }}>
                      {item.title}
                    </span>
                    <div
                      className={`flex-center rounded-2 ${item.bgLight} ${item.color}`}
                      style={{ width: '32px', height: '32px' }}
                    >
                      <i className={item.icon} style={{ fontSize: '14px' }}></i>
                    </div>
                  </div>

                  <div className="d-flex align-items-baseline gap-2 mb-1">
                    <div className="h3 fw-bold mb-0 text-dark">
                      {loading ? '...' : formatStat(item.value)}
                    </div>
                  </div>

                  <p className="text-muted small mb-0 text-truncate" style={{ fontSize: '11px' }}>
                    {item.desc}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Module Shortcuts */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h6 className="label-minimal mb-3">Modul Layanan</h6>
        <div className="row g-3">
          {visibleCards.map((card, index) => (
            <div key={index} className="col-12 col-md-4">
              <Link to={card.path} className="text-decoration-none">
                <div className="card-minimal h-100 d-flex flex-column gap-2 p-3 p-md-3 mobile-item-card bg-white border rounded-3 shadow-none">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h3 className="h6 fw-bold mb-1 text-dark">{card.title}</h3>
                      <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>
                        {card.description}
                      </p>
                    </div>
                    <i className="fas fa-arrow-right text-muted small ms-2"></i>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
