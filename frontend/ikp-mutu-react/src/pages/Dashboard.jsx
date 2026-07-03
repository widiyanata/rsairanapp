import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DASHBOARD_CARDS, hasAccess } from '../config/permissions';
import api from '../config/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ kronologi: 0, grading: 0, investigasi: 0 });
  const [loading, setLoading] = useState(true);

  const visibleCards = DASHBOARD_CARDS.filter((card) =>
    hasAccess(user?.role, card.roles)
  );

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
    <div className="home-container py-4">
      {/* Welcome */}
      <div className="welcome-section mb-5 animate-fade-in">
        <div className="d-flex align-items-center gap-3 mb-2">
          <div className="v-bar"></div>
          <h1 className="h3 fw-bold mb-0">Selamat Datang, {user?.username}</h1>
        </div>
        <p className="text-muted small ms-4">
          Dashboard Komite Mutu & Keselamatan Pasien RS Airan Raya
        </p>
      </div>

      {/* Module Cards */}
      <div className="row g-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {visibleCards.map((card, index) => (
          <div key={index} className="col-12 col-md-4">
            <Link to={card.path} className="text-decoration-none">
              <div className="card-minimal h-100 d-flex flex-column gap-3 p-4">
                <div className="icon-box-minimal flex-center mb-1">
                  <i className={card.icon}></i>
                </div>
                <div>
                  <h3 className="h5 mb-2">{card.title}</h3>
                  <p className="text-muted small mb-0">{card.description}</p>
                </div>
                <div className="mt-auto pt-3 d-flex align-items-center gap-2 text-primary small fw-bold">
                  Buka Modul
                  <i className="fas fa-arrow-right" style={{ fontSize: '10px' }}></i>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dynamic Stats */}
      <div className="mt-5 pt-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h6 className="label-minimal mb-4">Statistik Terkini</h6>
        <div className="row g-4">
          <div className="col-6 col-md-3">
            <div className="p-4 border-start border-3 border-dark bg-light bg-opacity-50">
              <div className="h2 fw-bold mb-1">
                {loading ? '...' : formatStat(stats.kronologi)}
              </div>
              <div className="text-muted small text-uppercase ls-1">Kronologi</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-4 border-start border-3 border-dark bg-light bg-opacity-50">
              <div className="h2 fw-bold mb-1">
                {loading ? '...' : formatStat(stats.grading)}
              </div>
              <div className="text-muted small text-uppercase ls-1">Grading</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-4 border-start border-3 border-dark bg-light bg-opacity-50">
              <div className="h2 fw-bold mb-1">
                {loading ? '...' : formatStat(stats.investigasi)}
              </div>
              <div className="text-muted small text-uppercase ls-1">Investigasi</div>
            </div>
          </div>
          <div className="col-12 col-md-3 d-flex align-items-end">
            <div className="ms-md-auto text-muted small pb-2">
              <i className="fas fa-circle text-success me-2" style={{ fontSize: '8px' }}></i>
              Sistem Stabil
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
