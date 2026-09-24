import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../api';
import { useSettings } from '../context/SettingsContext';

export default function Admission() {
  const { admissionsOpen } = useSettings();
  const [data, setData] = useState({});
  useEffect(() => { api.get('/admission').then((r) => setData(r.data)); }, []);

  const blocks = [
    ['admission_schedule', 'Schedule'],
    ['eligibility_criteria', 'Eligibility'],
    ['required_documents', 'Documents'],
    ['admission_guidelines', 'Guidelines'],
  ];

  return (
    <>
      <section className="page-hero">
        <div className="hero-content">
          <h1>Admissions</h1>
          <p>{admissionsOpen ? 'Applications are open. Apply online today.' : 'Admissions are currently closed.'}</p>
          <div className="buttons">
            {admissionsOpen && <Link className="btn btn-primary" to="/apply">Apply Online</Link>}
            <Link className="btn btn-secondary" to="/status">Check Status</Link>
          </div>
        </div>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="info-grid">
            {blocks.map(([key]) => data[key] && (
              <article className="info-card" key={key}>
                <h2>{data[key].title}</h2>
                <p style={{ whiteSpace: 'pre-wrap' }}>{data[key].content}</p>
              </article>
            ))}
          </div>
          {data.selected_candidates_pdf?.image_path && (
            <div className="help-box" style={{ marginTop: 24 }}>
              <h2>Selected Candidates</h2>
              <a className="btn btn-primary" href={assetUrl(data.selected_candidates_pdf.image_path)} target="_blank" rel="noreferrer">
                Download list (PDF)
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
