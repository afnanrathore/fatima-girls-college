import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { statusLabel } from '../../api';
import AdminFlash from '../../components/AdminFlash';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'interview_scheduled', label: 'Interview Candidates' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'interview_scheduled'];

export default function AdminApplicants({ interviewsOnly = false }) {
  const [searchParams] = useSearchParams();
  const initial = interviewsOnly
    ? 'interview_scheduled'
    : (searchParams.get('status') || '');
  const [applicants, setApplicants] = useState([]);
  const [status, setStatus] = useState(initial);
  const [stats, setStats] = useState(null);
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState('success');

  const load = () => {
    api.get('/admin/applicants', { params: { status: status || undefined } })
      .then((r) => setApplicants(r.data.applicants));
  };

  useEffect(() => {
    load();
  }, [status]);

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setStats(r.data.stats));
  }, [applicants]);

  const downloadPdf = async () => {
    try {
      const res = await api.post('/admin/applicants/download-pdf', {}, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected-applicants.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setFlashType('success');
      setFlash('Selected applicants PDF downloaded.');
    } catch {
      setFlashType('error');
      setFlash('Failed to download PDF.');
    }
  };

  const uploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('pdf', file);
    try {
      await api.post('/admin/applicants/upload-selected-pdf', fd);
      setFlashType('success');
      setFlash('Selected candidates PDF uploaded successfully.');
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'PDF upload failed.');
    }
    e.target.value = '';
  };

  const updateStatus = async (id, next) => {
    try {
      const { data } = await api.put(`/admin/applicants/${id}/status`, { status: next });
      setFlashType('success');
      setFlash(data.message || `Status updated to ${statusLabel(next)}.`);
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div>
      <AdminFlash message={flash} type={flashType} onClose={() => setFlash('')} />
      <div className="admin-page-head">
        <div>
          <h1>
            <i className={`fa ${interviewsOnly ? 'fa-calendar-check' : 'fa-users'} page-icon`} />
            {interviewsOnly ? 'Interview Candidates' : 'Applicants'}
          </h1>
          <p>
            {interviewsOnly
              ? 'Students marked as Interview Scheduled appear here.'
              : 'Review applications. Mark someone as Interview Scheduled to move them to Interviews.'}
          </p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn-success" onClick={downloadPdf}>
            <i className="fa fa-download" /> Download Selected PDF
          </button>
          <label className="admin-btn admin-btn-primary mb-0" style={{ cursor: 'pointer' }}>
            <i className="fa fa-upload" /> Upload Selected Candidates PDF
            <input type="file" accept=".pdf" hidden onChange={uploadPdf} />
          </label>
        </div>
      </div>

      <div className="admin-filters">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            className={`admin-filter-tab filter-${f.value || 'all'}${status === f.value ? ' active' : ''}`}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {applicants.length === 0 ? (
        <div className="admin-empty">
          <i className="fa fa-users" />
          <h3>{interviewsOnly ? 'No interview candidates yet' : 'No applicants found'}</h3>
          <p>
            {interviewsOnly
              ? 'Open an application and set status to Interview Scheduled. That student will appear here.'
              : 'New applications will appear here once students submit the form.'}
          </p>
        </div>
      ) : (
        <div className="admin-card-grid">
          {applicants.map((a) => (
            <article className="admin-card admin-applicant-card" key={a._id}>
              <div className="admin-card-body">
                <div className="app-id-row">
                  <span>{a.application_id}</span>
                  <span>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                  <span className={`admin-badge badge-${a.status}`}>{statusLabel(a.status)}</span>
                </div>
                <h3 className="app-name">{a.full_name}</h3>
                <div className="app-contact">{a.email} · {a.phone}</div>
                <div className="admin-meta-grid">
                  <div>
                    <span className="admin-meta-label">CNIC</span>
                    <div className="admin-meta-value">{a.cnic || '—'}</div>
                  </div>
                  <div>
                    <span className="admin-meta-label">Date of Birth</span>
                    <div className="admin-meta-value">
                      {a.date_of_birth ? new Date(a.date_of_birth).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="admin-meta-label">Marks</span>
                    <div className="admin-meta-value">
                      {a.marks_obtained}/{a.total_marks} ({a.percentage}%)
                    </div>
                  </div>
                  <div>
                    <span className="admin-meta-label">Board</span>
                    <div className="admin-meta-value">{a.board || '—'}</div>
                  </div>
                </div>
                <div className="app-program">{a.program_id?.name || '—'}</div>
              </div>
              <div className="admin-card-footer admin-card-footer-status">
                <Link className="admin-btn admin-btn-info" to={`/admin/applicants/${a._id}`}>
                  View Details
                </Link>
                <Link className="admin-btn admin-btn-outline" to={`/admin/applicants/${a._id}?edit=1`}>
                  <i className="fa fa-pen" /> Edit
                </Link>
                <div className="admin-status-btns">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`admin-status-btn status-${s}${a.status === s ? ' is-current' : ''}`}
                      onClick={() => a.status !== s && updateStatus(a._id, s)}
                      disabled={a.status === s}
                    >
                      {statusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {stats && (
        <div className="admin-stats-bar">
          <div><strong style={{ color: '#0d6efd' }}>{stats.total}</strong><span>Total Applications</span></div>
          <div><strong style={{ color: '#ffc107' }}>{stats.pending}</strong><span>Pending</span></div>
          <div><strong style={{ color: '#87ceeb' }}>{stats.under_review}</strong><span>Under Review</span></div>
          <div><strong style={{ color: '#198754' }}>{stats.approved}</strong><span>Approved</span></div>
          <div><strong style={{ color: '#dc3545' }}>{stats.rejected}</strong><span>Rejected</span></div>
          <div><strong style={{ color: '#0d6efd' }}>{stats.interview_scheduled}</strong><span>Interview Scheduled</span></div>
        </div>
      )}
    </div>
  );
}
