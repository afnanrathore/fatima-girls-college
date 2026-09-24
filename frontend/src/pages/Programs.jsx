import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatFee, isBsProgram } from '../api';
import { useSettings } from '../context/SettingsContext';

export default function Programs() {
  const { admissionsOpen } = useSettings();
  const [programs, setPrograms] = useState([]);
  useEffect(() => { api.get('/programs').then((r) => setPrograms(r.data.programs)); }, []);

  return (
    <>
      <section className="page-hero"><div className="hero-content"><h1>Programs</h1><p>Intermediate and bachelor pathways for young women.</p></div></section>
      <section className="page-content">
        <div className="container">
          <div className="programs-list">
            {programs.map((p) => (
              <article className="program-offer" key={p._id}>
                <div className="program-offer-top">
                  <span className="program-code">{String(p.code).replace(/_/g, ' ')}</span>
                  <span className="program-level">{isBsProgram(p) ? 'Bachelor' : 'Intermediate'}</span>
                </div>
                <h3>{p.name}</h3>
                <p className="program-desc">{p.description}</p>
                <dl className="program-meta">
                  <div><dt>Duration</dt><dd>{p.duration_years} yrs</dd></div>
                  <div><dt>Seats</dt><dd>{p.capacity}</dd></div>
                  <div><dt>Fee / year</dt><dd>{formatFee(p.fee_per_year)}</dd></div>
                </dl>
                {p.eligibility_criteria && (
                  <p className="program-eligibility"><strong>Eligibility</strong>{p.eligibility_criteria}</p>
                )}
                <Link className="btn btn-primary" to={admissionsOpen ? '/apply' : '/admission'}>
                  {admissionsOpen ? 'Apply Now' : 'Admissions Info'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
