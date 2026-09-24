import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminFlash from '../../components/AdminFlash';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState('success');

  const load = () => api.get('/admin/dashboard').then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async () => {
    try {
      const { data: result } = await api.post('/admin/admissions/toggle');
      await load();
      const open = result?.admissionsOpen ?? !data.admissionsOpen;
      setFlashType('success');
      setFlash(open ? 'Admissions opened successfully.' : 'Admissions closed successfully.');
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to update admissions status.');
    }
  };

  if (!data) return <p>Loading…</p>;
  const s = data.stats;

  return (
    <div>
      <AdminFlash message={flash} type={flashType} onClose={() => setFlash('')} />
      <div className="admin-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'Admin User'}. Here&apos;s a snapshot of admissions.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card admin-stat-blue">
          <div><h3>{s.total}</h3><p>Total Applications</p></div>
          <i className="fa fa-file-lines" />
        </div>
        <div className="admin-stat-card admin-stat-yellow">
          <div><h3>{s.pending}</h3><p>Pending Review</p></div>
          <i className="fa fa-clock" />
        </div>
        <div className="admin-stat-card admin-stat-green">
          <div><h3>{s.approved}</h3><p>Approved</p></div>
          <i className="fa fa-circle-check" />
        </div>
        <div className="admin-stat-card admin-stat-cyan">
          <div><h3>{s.interview_scheduled}</h3><p>Interview Candidates</p></div>
          <i className="fa fa-calendar-days" />
        </div>
      </div>

      <h2 className="admin-section-title"><span>⚡</span> Quick Actions</h2>
      <div className="admin-quick-grid">
        <div className="admin-quick-card">
          <div className="qa-icon qa-blue"><i className="fa fa-graduation-cap" /></div>
          <h3>Programs</h3>
          <p>Add or update academic programs and fees.</p>
          <Link className="admin-btn admin-btn-primary" to="/admin/programs">→ Manage Programs</Link>
        </div>
        <div className="admin-quick-card">
          <div className="qa-icon qa-yellow"><i className="fa fa-users" /></div>
          <h3>Applications</h3>
          <p>Review new applications and update status.</p>
          <Link className="admin-btn admin-btn-warning" to="/admin/applicants">→ Review Applications</Link>
        </div>
        <div className="admin-quick-card">
          <div className="qa-icon qa-cyan"><i className="fa fa-bullhorn" /></div>
          <h3>Announcements</h3>
          <p>Publish news that appears on the homepage.</p>
          <Link className="admin-btn admin-btn-info" to="/admin/announcements">→ Manage Announcements</Link>
        </div>
        <div className="admin-quick-card">
          <div className="qa-icon qa-green"><i className="fa fa-images" /></div>
          <h3>Gallery</h3>
          <p>Upload campus photos for the public site.</p>
          <Link className="admin-btn admin-btn-success" to="/admin/gallery">→ Manage Gallery</Link>
        </div>
      </div>

      <h2 className="admin-section-title"><span>⚙️</span> Admission Controls</h2>
      <div className="admin-panel">
        <p style={{ marginTop: 0, color: '#6c757d' }}>
          Applications can only be submitted on the public site when admissions are open.
        </p>
        <div className={`admin-alert ${data.admissionsOpen ? 'admin-alert-success' : 'admin-alert-warning'}`}>
          Current status: Admissions are {data.admissionsOpen ? 'OPEN' : 'CLOSED'}.
        </div>
        <button
          type="button"
          className={`admin-btn ${data.admissionsOpen ? 'admin-btn-danger' : 'admin-btn-success'}`}
          onClick={toggle}
        >
          {data.admissionsOpen ? 'Close admissions' : 'Open admissions'}
        </button>
      </div>
    </div>
  );
}
