import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api, { statusLabel } from '../../api';
import { PERSON_NAME_FIELDS, withoutDigits } from '../../utils/nameInput';
import { FieldError, clearFieldError, emailError, requiredError } from '../../components/FieldError';
import AdminFlash from '../../components/AdminFlash';

const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'interview_scheduled'];

const EMPTY = {
  full_name: '',
  email: '',
  phone: '',
  cnic: '',
  gender: 'Female',
  date_of_birth: '',
  religion: '',
  nationality: '',
  address: '',
  province: '',
  district: '',
  tehsil: '',
  domicile_district: '',
  father_name: '',
  father_cnic: '',
  father_occupation: '',
  father_phone: '',
  mother_name: '',
  mother_occupation: '',
  previous_school: '',
  board: '',
  grade: '',
  marks_obtained: '',
  total_marks: '',
  program_id: '',
};

function toForm(a) {
  return {
    full_name: a.full_name || '',
    email: a.email || '',
    phone: a.phone || '',
    cnic: a.cnic || '',
    gender: a.gender || 'Female',
    date_of_birth: a.date_of_birth ? String(a.date_of_birth).slice(0, 10) : '',
    religion: a.religion || '',
    nationality: a.nationality || '',
    address: a.address || '',
    province: a.province || '',
    district: a.district || '',
    tehsil: a.tehsil || '',
    domicile_district: a.domicile_district || '',
    father_name: a.father_name || '',
    father_cnic: a.father_cnic || '',
    father_occupation: a.father_occupation || '',
    father_phone: a.father_phone || '',
    mother_name: a.mother_name || '',
    mother_occupation: a.mother_occupation || '',
    previous_school: a.previous_school || '',
    board: a.board || '',
    grade: a.grade || '',
    marks_obtained: a.marks_obtained ?? '',
    total_marks: a.total_marks ?? '',
    program_id: a.program_id?._id || a.program_id || '',
  };
}

export default function ApplicantDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [application, setApplication] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const DOC_TYPES = [
    ['photo', 'Photo', 'photo_path'],
    ['cnic_copy', 'ID front', 'cnic_copy_path'],
    ['cnic_back', 'ID back', 'cnic_back_path'],
    ['domicile', 'Domicile', 'domicile_path'],
    ['marksheet', 'Marksheet', 'marksheet_path'],
  ];

  const load = () => api.get(`/admin/applicants/${id}`).then((r) => {
    setApplication(r.data.application);
    setForm(toForm(r.data.application));
    setStatus(r.data.application.status);
    setRemarks(r.data.application.remarks || '');
  });

  useEffect(() => {
    load();
    api.get('/admin/programs').then((r) => setPrograms(r.data.programs || []));
  }, [id]);

  const setField = (key, value) => {
    const next = PERSON_NAME_FIELDS.has(key) ? withoutDigits(value) : value;
    setForm((f) => ({ ...f, [key]: next }));
    setFieldErrors((e) => clearFieldError(e, key));
  };

  const uploadDocument = async (type, file) => {
    if (!file) return;
    setUploadingDoc(type);
    setError('');
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('document', file);
      const { data } = await api.post(`/admin/applicants/${id}/document/${type}`, fd);
      setApplication(data.application);
      setMessage(data.message || 'Document updated.');
    } catch (ex) {
      setError(ex.response?.data?.message || 'Document upload failed.');
    } finally {
      setUploadingDoc('');
    }
  };

  const removeDocument = async (type) => {
    if (!confirm('Remove this document?')) return;
    setError('');
    setMessage('');
    try {
      const { data } = await api.delete(`/admin/applicants/${id}/document/${type}`);
      setApplication(data.application);
      setMessage(data.message || 'Document removed.');
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to remove document.');
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const errors = {
      full_name: requiredError(form.full_name, 'Full name'),
      email: emailError(form.email),
      phone: requiredError(form.phone, 'Phone'),
      cnic: requiredError(form.cnic, 'CNIC'),
      date_of_birth: requiredError(form.date_of_birth, 'Date of birth'),
      program_id: requiredError(form.program_id, 'Program'),
    };
    if (form.full_name && /\d/.test(form.full_name)) errors.full_name = 'Digits are not allowed in the name.';
    if (form.father_name && /\d/.test(form.father_name)) errors.father_name = 'Digits are not allowed in the name.';
    if (form.mother_name && /\d/.test(form.mother_name)) errors.mother_name = 'Digits are not allowed in the name.';
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) {
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...form,
        marks_obtained: form.marks_obtained === '' ? undefined : Number(form.marks_obtained),
        total_marks: form.total_marks === '' ? undefined : Number(form.total_marks),
      };
      const { data } = await api.put(`/admin/applicants/${id}`, payload);
      setApplication(data.application);
      setForm(toForm(data.application));
      setEditing(false);
      setFieldErrors({});
      setMessage(data.message || 'Applicant details updated successfully.');
    } catch (ex) {
      const msg = ex.response?.data?.message || 'Failed to save applicant details.';
      const field = ex.response?.data?.field;
      if (field) {
        setFieldErrors({ [field]: msg });
        setEditing(true);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/admin/applicants/${id}/status`, { status, remarks });
      await load();
      setMessage(data.message || 'Status updated successfully.');
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to update status.');
    }
  };

  if (!application) return <p>Loading…</p>;
  const a = application;

  const fields = [
    ['full_name', 'Full name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'text'],
    ['cnic', 'CNIC', 'text'],
    ['gender', 'Gender', 'select', ['Female', 'Male']],
    ['date_of_birth', 'Date of birth', 'date'],
    ['religion', 'Religion', 'text'],
    ['nationality', 'Nationality', 'text'],
    ['address', 'Address', 'text'],
    ['province', 'Province', 'text'],
    ['district', 'District', 'text'],
    ['tehsil', 'Tehsil', 'text'],
    ['domicile_district', 'Domicile district', 'text'],
    ['father_name', 'Father name', 'text'],
    ['father_cnic', 'Father CNIC', 'text'],
    ['father_occupation', 'Father occupation', 'text'],
    ['father_phone', 'Father phone', 'text'],
    ['mother_name', 'Mother name', 'text'],
    ['mother_occupation', 'Mother occupation', 'text'],
    ['previous_school', 'Previous school', 'text'],
    ['board', 'Board', 'text'],
    ['grade', 'Grade', 'text'],
    ['marks_obtained', 'Marks obtained', 'number'],
    ['total_marks', 'Total marks', 'number'],
  ];

  return (
    <div>
      <Link to="/admin/applicants" className="admin-btn admin-btn-outline" style={{ marginBottom: 16 }}>
        ← Back to Applicants
      </Link>

      <div className="admin-page-head">
        <div>
          <h1>{a.full_name}</h1>
          <p>{a.application_id} · {a.program_id?.name}</p>
        </div>
        <div className="admin-page-actions">
          <span className={`admin-badge badge-${a.status}`}>{statusLabel(a.status)}</span>
          {!editing ? (
            <button type="button" className="admin-btn admin-btn-warning" onClick={() => { setEditing(true); setMessage(''); setError(''); }}>
              <i className="fa fa-pen" /> Edit Details
            </button>
          ) : (
            <button type="button" className="admin-btn" style={{ border: '1px solid #ced4da', background: '#fff' }} onClick={() => { setEditing(false); setForm(toForm(a)); setError(''); }}>
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {message && <AdminFlash message={message} onClose={() => setMessage('')} />}
      {error && <AdminFlash message={error} type="error" onClose={() => setError('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 18 }}>
        <div>
          <form className="admin-panel" style={{ marginBottom: 18 }} onSubmit={saveDetails} noValidate>
            <h2 className="admin-section-title" style={{ marginTop: 0 }}>
              {editing ? 'Edit Applicant Details' : 'Applicant'}
            </h2>

            {editing ? (
              <>
                <div className="admin-meta-grid">
                  {fields.map(([key, label, type, options]) => (
                    <div className="admin-form-group" key={key} style={key === 'address' ? { gridColumn: '1 / -1' } : undefined}>
                      <label>{label}</label>
                      {type === 'select' ? (
                        <select
                          className={fieldErrors[key] ? 'is-invalid' : ''}
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                        >
                          {options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          className={fieldErrors[key] ? 'is-invalid' : ''}
                          type={type}
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                          pattern={PERSON_NAME_FIELDS.has(key) ? '[^0-9]*' : undefined}
                          title={PERSON_NAME_FIELDS.has(key) ? 'Digits are not allowed in the name' : undefined}
                        />
                      )}
                      <FieldError message={fieldErrors[key]} />
                    </div>
                  ))}
                  <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Program</label>
                    <select
                      className={fieldErrors.program_id ? 'is-invalid' : ''}
                      value={form.program_id}
                      onChange={(e) => setField('program_id', e.target.value)}
                    >
                      <option value="">Select program</option>
                      {programs.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.program_id} />
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button type="button" className="admin-btn" style={{ border: '1px solid #ced4da', background: '#fff' }} onClick={() => { setEditing(false); setForm(toForm(a)); setFieldErrors({}); }}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Details'}
                  </button>
                </div>
              </>
            ) : (
              <div className="admin-meta-grid">
                {[
                  ['Email', a.email], ['Phone', a.phone], ['CNIC', a.cnic], ['Gender', a.gender],
                  ['DOB', a.date_of_birth ? new Date(a.date_of_birth).toLocaleDateString() : ''],
                  ['Religion', a.religion], ['Nationality', a.nationality],
                  ['Address', a.address], ['Province', a.province], ['District', a.district],
                  ['Tehsil', a.tehsil], ['Domicile', a.domicile_district],
                  ['Father', a.father_name], ['Father CNIC', a.father_cnic],
                  ['Father occupation', a.father_occupation], ['Father phone', a.father_phone],
                  ['Mother', a.mother_name], ['Mother occupation', a.mother_occupation],
                  ['School', a.previous_school], ['Board', a.board], ['Grade', a.grade],
                  ['Marks', `${a.marks_obtained ?? '—'}/${a.total_marks ?? '—'} (${a.percentage ?? '—'}%)`],
                  ['Program', a.program_id?.name],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="admin-meta-label">{k}</span>
                    <div className="admin-meta-value">{v || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="admin-panel">
            <h2 className="admin-section-title" style={{ marginTop: 0 }}>Documents</h2>
            <p style={{ marginTop: 0, color: '#6c757d', fontSize: 14 }}>
              {editing
                ? 'View, replace, or upload applicant documents (JPG, PNG, or PDF, max 2MB).'
                : 'Click Edit Details to upload or replace documents.'}
            </p>
            <div className="admin-doc-list">
              {DOC_TYPES.map(([type, label, pathKey]) => {
                const hasFile = Boolean(a[pathKey]);
                return (
                  <div className="admin-doc-row" key={type}>
                    <div>
                      <strong>{label}</strong>
                      <div style={{ fontSize: 13, color: hasFile ? '#198754' : '#6c757d' }}>
                        {hasFile ? 'Uploaded' : 'Not uploaded'}
                      </div>
                    </div>
                    <div className="admin-doc-actions">
                      {hasFile && (
                        <a
                          className="admin-btn admin-btn-outline"
                          href={`/api/admin/applicants/${id}/document/${type}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      )}
                      {editing && (
                        <>
                          <label className="admin-btn admin-btn-primary mb-0" style={{ cursor: uploadingDoc === type ? 'wait' : 'pointer' }}>
                            {uploadingDoc === type ? 'Uploading…' : (hasFile ? 'Replace' : 'Upload')}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                              hidden
                              disabled={uploadingDoc === type}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                uploadDocument(type, file);
                              }}
                            />
                          </label>
                          {hasFile && (
                            <button type="button" className="admin-btn admin-btn-danger" onClick={() => removeDocument(type)}>
                              Remove
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <form className="admin-panel" onSubmit={saveStatus} style={{ alignSelf: 'start' }}>
          <h2 className="admin-section-title" style={{ marginTop: 0 }}>Update status</h2>
          <div className="admin-form-group">
            <label>Status</label>
            <div className="admin-status-btns">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`admin-status-btn status-${s}${status === s ? ' is-current' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-form-group">
            <label>Remarks</label>
            <textarea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <button className="admin-btn admin-btn-primary admin-btn-block" type="submit">Save Status</button>
        </form>
      </div>
    </div>
  );
}
