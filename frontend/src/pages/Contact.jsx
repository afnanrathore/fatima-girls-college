import { useState } from 'react';
import api from '../api';
import { useSettings } from '../context/SettingsContext';
import { withoutDigits } from '../utils/nameInput';
import { FieldError, clearFieldError, emailError, requiredError } from '../components/FieldError';

export default function Contact() {
  const { college } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'name' ? withoutDigits(value) : value });
    setFieldErrors((errors) => clearFieldError(errors, name));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const errors = {
      name: requiredError(form.name, 'Name'),
      email: emailError(form.email),
      subject: requiredError(form.subject, 'Subject'),
      message: requiredError(form.message, 'Message'),
    };
    if (form.name && /\d/.test(form.name)) errors.name = 'Digits are not allowed in the name.';
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    try {
      const { data } = await api.post('/contact', form);
      setMsg(data.message);
      setForm({ name: '', email: '', subject: '', message: '' });
      setFieldErrors({});
    } catch (ex) {
      const message = ex.response?.data?.message || 'Failed to send.';
      if (/name/i.test(message)) setFieldErrors({ name: message });
      else setErr(message);
    }
  };

  const mapQ = encodeURIComponent(college.map_query || college.address || '');
  const invalid = (key) => (fieldErrors[key] ? 'is-invalid' : '');

  return (
    <>
      <section className="page-hero"><div className="hero-content"><h1>Contact</h1><p>We are here to help with admissions and campus questions.</p></div></section>
      <section className="contact-page">
        <div className="container">
          <div className="contact-shell">
            <div className="contact-panel">
              <h2>Visit or call</h2>
              <ul className="contact-details">
                <li><strong>Address</strong><span>{college.address}</span></li>
                <li><strong>Phone</strong><a href={`tel:${college.phone}`}>{college.phone_display}</a></li>
                <li><strong>Email</strong><a href={`mailto:${college.email}`}>{college.email}</a></li>
                <li><strong>Office hours</strong><span>{college.office_hours}</span></li>
              </ul>
            </div>
            <div className="contact-form-card">
              <h2>Send a message</h2>
              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              <form onSubmit={submit} noValidate>
                <div className="form-group">
                  <label>Name</label>
                  <input className={invalid('name')} name="name" value={form.name} onChange={onChange} pattern="[^0-9]*" title="Digits are not allowed in the name" />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className={invalid('email')} type="email" name="email" value={form.email} onChange={onChange} />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input className={invalid('subject')} name="subject" value={form.subject} onChange={onChange} />
                  <FieldError message={fieldErrors.subject} />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea className={invalid('message')} name="message" rows={5} value={form.message} onChange={onChange} />
                  <FieldError message={fieldErrors.message} />
                </div>
                <button className="btn btn-primary" type="submit">Send Message</button>
              </form>
            </div>
          </div>
          <div className="contact-map">
            <h2>Map</h2>
            <div className="map-container">
              <iframe title="Campus map" src={`https://maps.google.com/maps?q=${mapQ}&output=embed`} loading="lazy" />
            </div>
            <p>{college.address}</p>
          </div>
        </div>
      </section>
    </>
  );
}
