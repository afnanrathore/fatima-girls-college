import { useEffect, useState } from 'react';
import api from '../../api';
import { FieldError, clearFieldError, requiredError } from '../../components/FieldError';
import AdminFlash from '../../components/AdminFlash';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', is_active: true });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState('success');

  const load = () => api.get('/admin/announcements').then((r) => setItems(r.data.announcements));
  useEffect(() => { load(); }, []);

  const setFormField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => clearFieldError(e, key));
  };

  const openNew = () => {
    setEditId(null);
    setForm({ title: '', content: '', is_active: true });
    setFieldErrors({});
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const errors = {
      title: requiredError(form.title, 'Title'),
      content: requiredError(form.content, 'Content'),
    };
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    try {
      if (editId) await api.put(`/admin/announcements/${editId}`, form);
      else await api.post('/admin/announcements', form);
      setFlashType('success');
      setFlash(editId ? 'Announcement updated successfully.' : 'Announcement created successfully.');
      setForm({ title: '', content: '', is_active: true });
      setEditId(null);
      setShowForm(false);
      setFieldErrors({});
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to save announcement.');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete announcement?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setFlashType('success');
      setFlash('Announcement deleted successfully.');
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  return (
    <div>
      <AdminFlash message={flash} type={flashType} onClose={() => setFlash('')} />
      <div className="admin-page-head">
        <div>
          <h1><i className="fa fa-bullhorn page-icon" /> Announcements</h1>
          <p>These appear on the public homepage when they are active.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn-pink" onClick={openNew}>
            <i className="fa fa-plus" /> Add announcement
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Content Preview</th>
              <th>Published At</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#6c757d' }}>No announcements yet.</td>
              </tr>
            ) : items.map((a) => (
              <tr key={a._id}>
                <td><strong>{a.title}</strong></td>
                <td className="preview">{a.content}</td>
                <td>
                  {a.published_at
                    ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—')}
                </td>
                <td>
                  <span className={`admin-badge ${a.is_active ? 'badge-active' : 'badge-rejected'}`}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn-warning"
                    style={{ padding: '6px 10px', marginRight: 6 }}
                    onClick={() => {
                      setEditId(a._id);
                      setForm({ title: a.title, content: a.content, is_active: a.is_active });
                      setFieldErrors({});
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    style={{ padding: '6px 10px' }}
                    onClick={() => remove(a._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="admin-form-modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="admin-form-modal" onClick={(e) => e.stopPropagation()} onSubmit={save} noValidate>
            <h2>{editId ? 'Edit announcement' : 'Add announcement'}</h2>
            <div className="admin-form-group">
              <label>Title</label>
              <input
                className={fieldErrors.title ? 'is-invalid' : ''}
                value={form.title}
                onChange={(e) => setFormField('title', e.target.value)}
              />
              <FieldError message={fieldErrors.title} />
            </div>
            <div className="admin-form-group">
              <label>Content</label>
              <textarea
                className={fieldErrors.content ? 'is-invalid' : ''}
                value={form.content}
                onChange={(e) => setFormField('content', e.target.value)}
              />
              <FieldError message={fieldErrors.content} />
            </div>
            <div className="admin-form-group">
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
              <button type="button" className="admin-btn" style={{ border: '1px solid #ced4da', background: '#fff' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-pink">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
