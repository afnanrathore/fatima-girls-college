import { useEffect, useState } from 'react';
import api, { assetUrl } from '../api';
import { useSettings } from '../context/SettingsContext';

export default function About() {
  const { college } = useSettings();
  const [data, setData] = useState({});
  useEffect(() => { api.get('/about').then((r) => setData(r.data)); }, []);

  return (
    <>
      <section className="page-hero"><div className="hero-content"><h1>About Us</h1><p>{college.tagline}</p></div></section>
      <section className="page-content">
        <div className="container">
          <div className="about-grid">
            {['vision', 'mission'].map((key) => data[key] && (
              <article className="about-card" key={key}>
                <h2>{data[key].title}</h2>
                <p>{data[key].content}</p>
              </article>
            ))}
          </div>
          {data.history && (
            <article className="about-card">
              <h2>{data.history.title}</h2>
              <p>{data.history.content}</p>
            </article>
          )}
          {data.principal_message && (
            <article className="about-card about-principal">
              <div className="about-intro">
                {data.principal_message.image_path && (
                  <figure className="about-photo">
                    <img src={assetUrl(data.principal_message.image_path)} alt="Principal" />
                    <figcaption>Principal</figcaption>
                  </figure>
                )}
                <div>
                  <h2>{data.principal_message.title}</h2>
                  <p>{data.principal_message.content}</p>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
