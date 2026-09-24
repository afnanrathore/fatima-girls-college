import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl, formatFee, isBsProgram } from '../api';
import { useSettings } from '../context/SettingsContext';

export default function Home() {
  const { college, admissionsOpen } = useSettings();
  const [data, setData] = useState({ programs: [], announcements: [], galleryItems: [] });
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api.get('/home').then((r) => setData(r.data));
  }, []);

  const campusPhoto = data.galleryItems.find((g) => g.title === 'Campus View');
  const libraryPhoto = data.galleryItems.find((g) => g.title === 'Library');
  const year = new Date().getFullYear();

  return (
    <>
      <section
        className={`hero${campusPhoto ? ' hero-photo' : ''}`}
        style={campusPhoto ? { '--hero-photo': `url('${assetUrl(campusPhoto.image_path)}')` } : undefined}
      >
        <div className="hero-content">
          <h1 className="college-name">{college.name}</h1>
          <h4>{college.tagline}</h4>
          <p>{admissionsOpen ? `Admissions are open for ${year}` : 'Admissions are currently closed. Check back soon.'}</p>
          <div className="buttons">
            <Link className="btn btn-primary" to={admissionsOpen ? '/apply' : '/admission'}>
              {admissionsOpen ? 'Apply Online' : 'View Admission Info'}
            </Link>
            <Link className="btn btn-secondary" to="/programs">View Programs</Link>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon">🏆</div><h3>20+ Years</h3><p>Of excellence in girls’ education</p></div>
            <div className="stat-card"><div className="stat-icon">👩‍🎓</div><h3>500+ Graduates</h3><p>Confident, skilled young women</p></div>
            <div className="stat-card"><div className="stat-icon">📚</div><h3>{data.programs.length} Programs</h3><p>Intermediate and bachelor pathways</p></div>
          </div>
        </div>
      </section>

      <section className="programs">
        <div className="container">
          <h2>Programs We Offer</h2>
          <div className="programs-grid">
            {data.programs.length ? data.programs.map((p) => (
              <article className="program-card" key={p._id}>
                <div className="program-offer-top">
                  <span className="program-code">{String(p.code).replace(/_/g, ' ')}</span>
                  <span className="program-level">{isBsProgram(p) ? 'Bachelor' : 'Intermediate'}</span>
                </div>
                <h3>{p.name}</h3>
                <p>{p.duration_years} year{p.duration_years > 1 ? 's' : ''} · {formatFee(p.fee_per_year)}/year</p>
                <Link className="btn btn-outline" to="/programs">View Details</Link>
              </article>
            )) : <p className="empty-state">Programs will be published shortly.</p>}
          </div>
        </div>
      </section>

      <section className="announcements">
        <div className="container">
          <h2>Latest Announcements</h2>
          <div className="announcements-list">
            {data.announcements.length ? data.announcements.map((a) => (
              <article className="announcement-card" key={a._id}>
                <div className="date-badge">
                  {a.published_at ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'New'}
                </div>
                <h3>{a.title}</h3>
                <p>{a.content}</p>
                <Link to="/admission">Admission details</Link>
              </article>
            )) : <p className="empty-state">No announcements right now. Please check the admissions page for updates.</p>}
          </div>
        </div>
      </section>

      <section className="why-choose">
        <div className="container">
          <div className="why-text">
            <h2>Why Choose Us?</h2>
            <ul>
              <li>Supportive community and mentorship</li>
              <li>Qualified, dedicated faculty</li>
              <li>Modern classrooms and labs</li>
              <li>Career guidance with Islamic values</li>
            </ul>
          </div>
          <div className="why-visual">
            {libraryPhoto ? (
              <><img src={assetUrl(libraryPhoto.image_path)} alt="Library" /><span>Library</span></>
            ) : 'A campus built for focus, confidence, and opportunity.'}
          </div>
        </div>
      </section>

      {data.galleryItems.length > 0 && (
        <section className="gallery">
          <div className="container">
            <h2>Gallery</h2>
            <div className="gallery-grid">
              {data.galleryItems.map((image, index) => (
                <button type="button" className="gallery-item" key={image._id} onClick={() => setLightbox(index)}>
                  <img src={assetUrl(image.image_path)} alt={image.title} />
                  <span>{image.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {lightbox !== null && (
        <div className="gallery-lightbox">
          <div className="gallery-lightbox-panel">
            <div className="gallery-lightbox-toolbar">
              <p>{data.galleryItems[lightbox]?.title}</p>
              <button type="button" className="gallery-lightbox-close" onClick={() => setLightbox(null)}>Close</button>
            </div>
            <div className="gallery-lightbox-stage">
              <button type="button" className="gallery-nav" onClick={() => setLightbox((i) => (i + data.galleryItems.length - 1) % data.galleryItems.length)}>‹</button>
              <img src={assetUrl(data.galleryItems[lightbox]?.image_path)} alt="" />
              <button type="button" className="gallery-nav" onClick={() => setLightbox((i) => (i + 1) % data.galleryItems.length)}>›</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
