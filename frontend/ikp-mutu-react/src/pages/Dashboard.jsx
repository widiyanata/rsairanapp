import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_CARDS } from '../config/permissions';
import api from '../config/api';

export default function Dashboard() {
  const { user, hasAccessDynamic } = useAuth();
  const [stats, setStats] = useState({ kronologi: 0, grading: 0, investigasi: 0 });
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
      try {
        const [kronRes, gradRes, invRes] = await Promise.allSettled([
          api.get('/kronologi'),
          api.get('/grading'),
          api.get('/investigasi'),
        ]);

        setStats({
          kronologi: kronRes.status === 'fulfilled' ? (kronRes.value.data?.data?.length || 0) : 0,
          grading: gradRes.status === 'fulfilled' ? (gradRes.value.data?.data?.length || 0) : 0,
          investigasi: invRes.status === 'fulfilled' ? (invRes.value.data?.data?.length || 0) : 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatStat = (num) => String(num).padStart(2, '0');

  return (
    <div className="home-container pb-4">
      {/* Welcome Banner */}
      <div className="welcome-section mb-4 p-4 rounded-4 bg-white border shadow-sm animate-fade-in position-relative overflow-hidden">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-uppercase" style={{ fontSize: '10px' }}>
                {user?.role || 'Staff'}
              </span>
              <span className="text-muted small">• RS Airan Raya</span>
            </div>
            <h1 className="h4 fw-bold mb-1 text-dark">
              Halo, {user?.username} 👋
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

      {/* Module Cards */}
      <div className="mb-4">
        <h6 className="label-minimal mb-3">Modul Layanan</h6>
        <div className="row g-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {visibleCards.map((card, index) => (
            <div key={index} className="col-12 col-md-4">
              <Link to={card.path} className="text-decoration-none">
                <div className="card-minimal h-100 d-flex flex-column gap-2 p-3 p-md-3 mobile-item-card">
                  <div className="d-flex align-items-center justify-content-between">
                    {/* <div className="icon-box-minimal flex-center rounded-3 bg-light text-primary">
                      <i className={card.icon}></i>
                    </div> */}
                    <div className="">
                      <h3 className="h6 fw-bold mb-1 text-dark">{card.title}</h3>
                      <p className="text-muted small mb-0" style={{ fontSize: '12px' }}>{card.description}</p>
                    </div>
                    <i className="fas fa-arrow-right text-muted small"></i>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Stats */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h6 className="label-minimal mb-3">Statistik Terkini</h6>
        <div className="row g-3">
          <div className="col-6 col-md-4">
            <div className="p-3 bg-white border rounded-3 shadow-none">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small text-uppercase ls-1">Kronologi</span>
                <i className="fas fa-history text-muted small"></i>
              </div>
              <div className="h3 fw-bold mb-0 text-dark">
                {loading ? '...' : formatStat(stats.kronologi)}
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="p-3 bg-white border rounded-3 shadow-none">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-muted small text-uppercase ls-1">Grading</span>
                <i className="fas fa-chart-line text-muted small"></i>
              </div>
              <div className="h3 fw-bold mb-0 text-dark">
                {loading ? '...' : formatStat(stats.grading)}
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 bg-white border rounded-3 shadow-none d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small text-uppercase ls-1 d-block mb-1">Investigasi</span>
                <div className="h3 fw-bold mb-0 text-dark">
                  {loading ? '...' : formatStat(stats.investigasi)}
                </div>
              </div>
              <div className="text-end text-muted small">
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  <i className="fas fa-circle text-success me-1" style={{ fontSize: '7px' }}></i>
                  Aktif & Terhubung
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
