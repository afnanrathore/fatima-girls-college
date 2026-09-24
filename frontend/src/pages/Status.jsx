import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { statusLabel } from '../api';
import { FieldError, clearFieldError, requiredError } from '../components/FieldError';

export default function Status() {
  const location = useLocation();
  const [cnic, setCnic] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [application, setApplication] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const success = location.state?.success;

  const check = async (e) => {
    e.preventDefault();
    setError('');
    setApplication(null);
    const errors = {
      cnic: requiredError(cnic, 'CNIC / B-Form'),
    };
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    try {
      const { data } = await api.post('/apply/status', { cnic, application_id: applicationId });
      setApplication(data.application);
    } catch (ex) {
      const message = ex.response?.data?.message || 'Not found';
      if (/cnic|b-form|application/i.test(message)) {
        setFieldErrors({ cnic: message });
      } else {
        setError(message);
      }
    }
  };

  return (
    <>
      <section className="page-hero"><div className="hero-content"><h1>Application Status</h1><p>Look up your application with CNIC / B-Form.</p></div></section>
      <section className="form-page status-page">
        <div className="container">
          {success && <div className="alert alert-success">{success}</div>}
          <div className="status-shell">
            <div className="status-panel">
              <h2>Check status</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={check} noValidate>
                <div className="form-group">
                  <label>CNIC / B-Form</label>
                  <input
                    className={fieldErrors.cnic ? 'is-invalid' : ''}
                    value={cnic}
                    onChange={(e) => {
                      setCnic(e.target.value);
                      setFieldErrors((err) => clearFieldError(err, 'cnic'));
                    }}
                  />
                  <FieldError message={fieldErrors.cnic} />
                </div>
                <div className="form-group">
                  <label>Application ID (optional)</label>
                  <input value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="FGC2026001" />
                </div>
                <button className="btn btn-primary" type="submit">Check</button>
              </form>
            </div>
            <div className="status-panel status-help">
              <h2>What the statuses mean</h2>
              <ul className="status-guide">
                <li><strong>Pending</strong><span>Received, waiting for review</span></li>
                <li><strong>Under review</strong><span>Being evaluated by admissions</span></li>
                <li><strong>Approved</strong><span>Selected — follow joining instructions</span></li>
                <li><strong>Rejected</strong><span>Not selected for this cycle</span></li>
                <li><strong>Interview scheduled</strong><span>You will be contacted for interview</span></li>
              </ul>
            </div>
          </div>

          {application && (
            <div className="status-panel">
              <h2>{application.full_name}</h2>
              <div className="status-badge-wrap">
                <span className={`badge badge-${application.status}`}>{statusLabel(application.status)}</span>
              </div>
              <dl className="status-facts">
                <div><dt>Application ID</dt><dd>{application.application_id}</dd></div>
                <div><dt>Program</dt><dd>{application.program_id?.name || '—'}</dd></div>
                <div><dt>Percentage</dt><dd>{application.percentage}%</dd></div>
                <div><dt>Submitted</dt><dd>{application.submitted_at ? new Date(application.submitted_at).toLocaleString() : '—'}</dd></div>
              </dl>
              {application.remarks && <p className="status-remarks"><strong>Remarks:</strong> {application.remarks}</p>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
