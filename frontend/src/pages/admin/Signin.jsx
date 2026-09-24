import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, REMEMBER_EMAIL_KEY } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { FieldError, clearFieldError, emailError, requiredError } from '../../components/FieldError';
import api from '../../api';
import '../../styles/home.css';

export default function Signin() {
  useEffect(() => {
    document.title = 'Admin Signin — Fatima Girls College';
  }, []);
  const { user, signin } = useAuth();
  const { college } = useSettings();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY)));
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLink, setForgotLink] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotErrors, setForgotErrors] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {
      email: emailError(email),
      password: requiredError(password, 'Password'),
    };
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    try {
      await signin(email, password, rememberMe);
      navigate('/admin');
    } catch (ex) {
      const message = ex.response?.data?.message || 'Signin failed';
      if (/password/i.test(message)) setFieldErrors({ password: message });
      else if (/email|user|credential|invalid|match/i.test(message)) setFieldErrors({ email: message, password: message });
      else setError(message);
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setForgotLink('');
    const errors = { email: emailError(forgotEmail) };
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setForgotErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    setForgotBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(data.message);
      if (data.resetLink) setForgotLink(data.resetLink);
    } catch (ex) {
      const message = ex.response?.data?.message || 'Could not process request.';
      const field = ex.response?.data?.field;
      if (field) setForgotErrors({ [field]: message });
      else setForgotMsg(message);
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#FCE4EC,#F3E5F5)', padding: 16 }}>
      <form onSubmit={submit} noValidate style={{ width: 'min(420px, 92vw)', background: '#fff', padding: 28, borderRadius: 16, boxShadow: '0 12px 40px rgba(80,20,60,.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/images/logo.svg" alt="" width={56} height={56} style={{ margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: 22, margin: 0 }}>{college.name}</h1>
          <p style={{ color: '#666', margin: '8px 0 0' }}>Admin signin</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input
            className={fieldErrors.email ? 'is-invalid' : ''}
            type="email"
            value={email}
            autoComplete="username"
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((err) => clearFieldError(err, 'email'));
            }}
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            className={fieldErrors.password ? 'is-invalid' : ''}
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((err) => clearFieldError(err, 'password'));
            }}
          />
          <FieldError message={fieldErrors.password} />
        </div>

        <div className="signin-row">
          <label className="signin-check">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="signin-forgot" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMsg(''); setForgotLink(''); setForgotErrors({}); }}>
            Forgot password?
          </button>
        </div>

        <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Sign in</button>
      </form>

      {showForgot && (
        <div className="signin-modal-backdrop" onClick={() => setShowForgot(false)}>
          <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Forgot password</h2>
            <p>Enter your admin email and we will provide a password reset link.</p>
            {forgotMsg && <div className="alert alert-success">{forgotMsg}</div>}
            {forgotLink && (
              <p className="signin-reset-link">
                <Link to={`/reset-password?token=${new URL(forgotLink).searchParams.get('token')}`}>
                  Open reset link
                </Link>
              </p>
            )}
            <form onSubmit={submitForgot} noValidate>
              <div className="form-group">
                <label>Email</label>
                <input
                  className={forgotErrors.email ? 'is-invalid' : ''}
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setForgotErrors((err) => clearFieldError(err, 'email'));
                  }}
                />
                <FieldError message={forgotErrors.email} />
              </div>
              <div className="signin-modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForgot(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={forgotBusy}>
                  {forgotBusy ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
