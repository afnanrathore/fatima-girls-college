import { useEffect, useState } from 'react';
import api, { formatFee } from '../../api';
import { FieldError, clearFieldError, requiredError } from '../../components/FieldError';
import AdminFlash from '../../components/AdminFlash';

const blank = {
  name: '', code: '', description: '', duration_years: 2, capacity: 50,
  eligibility_criteria: '', fee_per_year: 0, is_active: true,
};

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState('success');

  const load = () => api.get('/admin/programs').then((r) => setPrograms(r.data.programs));
  useEffect(() => { load(); }, []);

  const setFormField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => clearFieldError(e, key));
  };

  const openNew = () => {
    setEditId(null);
    setForm(blank);
    setFieldErrors({});
    setShowForm(true);
  };

  const startEdit = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name, code: p.code, description: p.description || '',
      duration_years: p.duration_years, capacity: p.capacity,
      eligibility_criteria: p.eligibility_criteria || '', fee_per_year: p.fee_per_year,
      is_active: p.is_active,
    });
    setFieldErrors({});
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const errors = {
      name: requiredError(form.name, 'Name'),
      code: requiredError(form.code, 'Code'),
    };
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    try {
      if (editId) await api.put(`/admin/programs/${editId}`, form);
      else await api.post('/admin/programs', form);
      setFlashType('success');
      setFlash(editId ? 'Program updated successfully.' : 'Program created successfully.');
      setForm(blank);
      setEditId(null);
      setShowForm(false);
      setFieldErrors({});
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to save program.');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this program?')) return;
    try {
      await api.delete(`/admin/programs/${id}`);
      setFlashType('success');
      setFlash('Program deleted successfully.');
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to delete program.');
    }
  };

  return (
    <div>
      <AdminFlash message={flash} type={flashType} onClose={() => setFlash('')} />
      <div className="admin-page-head">
        <div>
          <h1><i className="fa fa-graduation-cap page-icon" /> Programs Management</h1>
          <p>Manage academic programs and courses offered by the college</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={openNew}>
            <i className="fa fa-plus" /> Add New Program
          </button>
        </div>
      </div>

      <div className="admin-card-grid-3">
        {programs.map((p) => (
          <article className="admin-card" key={p._id}>
            <div className="admin-card-header">
              <h3><i className="fa fa-file-lines" /> {p.name}</h3>
              <span className={`admin-badge ${p.is_active ? 'badge-active' : 'badge-rejected'}`}>
                {p.is_active ? '✔ Active' : 'Inactive'}
              </span>
            </div>
            <div className="admin-card-body">
              <div className="admin-meta-grid">
                <div>
                  <span className="admin-meta-label">Code</span>
                  <div className="admin-meta-value">{p.code}</div>
                </div>
                <div>
                  <span className="admin-meta-label">Duration</span>
                  <div className="admin-meta-value">{p.duration_years} year{p.duration_years > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <span className="admin-meta-label">Capacity</span>
                  <div className="admin-meta-value">{p.capacity} students</div>
                </div>
                <div>
                  <span className="admin-meta-label">Fee/Year</span>
                  <div className="admin-meta-value">{formatFee(p.fee_per_year)}</div>
                </div>
              </div>
              {p.description && (
                <div>
                  <span className="admin-meta-label">Description</span>
                  <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: 14 }}>{p.description}</p>
                </div>
              )}
            </div>
            <div className="admin-card-footer">
              <button type="button" className="admin-btn admin-btn-warning" onClick={() => startEdit(p)}>
                <i className="fa fa-pen" /> Edit
              </button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => remove(p._id)}>
                <i className="fa fa-trash" /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {showForm && (
        <div className="admin-form-modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="admin-form-modal" onClick={(e) => e.stopPropagation()} onSubmit={save} noValidate>
            <h2>{editId ? 'Edit Program' : 'Add New Program'}</h2>
            {['name', 'code', 'description', 'eligibility_criteria'].map((k) => (
              <div className="admin-form-group" key={k}>
                <label className="text-capitalize">{k.replace(/_/g, ' ')}</label>
                {k === 'description' || k === 'eligibility_criteria' ? (
                  <textarea value={form[k]} onChange={(e) => setFormField(k, e.target.value)} />
                ) : (
                  <input
                    className={fieldErrors[k] ? 'is-invalid' : ''}
                    value={form[k]}
                    onChange={(e) => setFormField(k, e.target.value)}
                  />
                )}
                <FieldError message={fieldErrors[k]} />
              </div>
            ))}
            <div className="admin-meta-grid">
              <div className="admin-form-group">
                <label>Years</label>
                <input type="number" value={form.duration_years} onChange={(e) => setFormField('duration_years', Number(e.target.value))} />
              </div>
              <div className="admin-form-group">
                <label>Capacity</label>
                <input type="number" value={form.capacity} onChange={(e) => setFormField('capacity', Number(e.target.value))} />
              </div>
              <div className="admin-form-group">
                <label>Fee / Year</label>
                <input type="number" value={form.fee_per_year} onChange={(e) => setFormField('fee_per_year', Number(e.target.value))} />
              </div>
            </div>
            <div className="admin-form-group" style={{ marginTop: 4 }}>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setFormField('is_active', e.target.checked)}
                />
                Active
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" style={{ border: '1px solid #ced4da' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary">{editId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
