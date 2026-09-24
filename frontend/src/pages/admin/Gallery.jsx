import { useEffect, useRef, useState } from 'react';
import api, { assetUrl } from '../../api';
import AdminFlash from '../../components/AdminFlash';

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState('success');
  const fileRef = useRef(null);

  const load = () => api.get('/admin/gallery').then((r) => setItems(r.data.items));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setFlashType('error');
      setFlash('Please choose an image.');
      return;
    }
    const fd = new FormData();
    fd.append('title', title || 'Gallery');
    fd.append('image', file);
    try {
      await api.post('/admin/gallery', fd);
      setTitle('');
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = '';
      setFlashType('success');
      setFlash('Image uploaded successfully.');
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Upload failed.');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete image?')) return;
    try {
      await api.delete(`/admin/gallery/${id}`);
      setFlashType('success');
      setFlash('Image deleted successfully.');
      load();
    } catch (ex) {
      setFlashType('error');
      setFlash(ex.response?.data?.message || 'Failed to delete image.');
    }
  };

  const activeCount = items.filter((i) => i.is_active !== false).length;
  const avgOrder = items.length
    ? Math.round(items.reduce((sum, i) => sum + (Number(i.sort_order) || 0), 0) / items.length)
    : 0;
  const recent = items.filter((i) => {
    if (!i.createdAt) return false;
    return Date.now() - new Date(i.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div>
      <AdminFlash message={flash} type={flashType} onClose={() => setFlash('')} />
      <div className="admin-page-head">
        <div>
          <h1><i className="fa fa-images page-icon" /> Gallery Management</h1>
          <p>Upload and manage college gallery images.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowForm(true)}>
            <i className="fa fa-plus" /> Upload Images
          </button>
        </div>
      </div>

      <div className="admin-card-grid-3">
        {items.map((item) => (
          <article className="admin-card" key={item._id}>
            <div className="admin-card-header">
              <h3><i className="fa fa-image" /> {item.title}</h3>
              <span className="admin-badge badge-active">Active</span>
            </div>
            <div className="admin-card-body">
              <img className="admin-gallery-thumb" src={assetUrl(item.image_path)} alt={item.title} />
              <div className="admin-gallery-meta">
                <span><i className="fa fa-calendar" /> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
                <span>Order: {item.sort_order ?? 0}</span>
              </div>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-block" onClick={() => remove(item._id)}>
                <i className="fa fa-trash" /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="admin-stats-bar">
        <div><strong style={{ color: '#0d6efd' }}>{items.length}</strong><span>Total Images</span></div>
        <div><strong style={{ color: '#198754' }}>{activeCount}</strong><span>Active Images</span></div>
        <div><strong style={{ color: '#0dcaf0' }}>{avgOrder}</strong><span>Avg. Sort Order</span></div>
        <div><strong style={{ color: '#ffc107' }}>{recent}</strong><span>Recent Uploads</span></div>
      </div>

      {showForm && (
        <div className="admin-form-modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="admin-form-modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>Upload Image</h2>
            <div className="admin-form-group">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Campus View" />
            </div>
            <div className="admin-form-group">
              <label>Image</label>
              <input ref={fileRef} type="file" accept="image/*" required />
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn" style={{ border: '1px solid #ced4da', background: '#fff' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary">Upload</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
