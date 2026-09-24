import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { FieldError, clearFieldError, requiredError } from '../../components/FieldError';
import api from '../../api';
import '../../styles/home.css';

export default function ResetPassword() {
  const { college } = useSettings();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Reset Password — Fatima Girls College';
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const errors = {
      password: requiredError(password, 'Password') || (password.length < 6 ? 'Password must be at least 6 characters.' : ''),
      password_confirm: password !== passwordConfirm ? 'Passwords do not match.' : '',
    };
    if (!token) setError('Reset token is missing. Request a new link from the signin page.');
    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length || !token) return;

    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess(data.message);
      setTimeout(() => navigate('/signin'), 1800);
    } catch (ex) {
      const message = ex.response?.data?.message || 'Could not reset password.';
      const field = ex.response?.data?.field;
      if (field) setFieldErrors({ [field]: message });
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#FCE4EC,#F3E5F5)', padding: 16 }}>
      <form onSubmit={submit} noValidate style={{ width: 'min(420px, 92vw)', background: '#fff', padding: 28, borderRadius: 16, boxShadow: '0 12px 40px rgba(80,20,60,.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/images/logo.svg" alt="" width={56} height={56} style={{ margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: 22, margin: 0 }}>{college.name}</h1>
          <p style={{ color: '#666', margin: '8px 0 0' }}>Reset password</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="form-group">
          <label>New password</label>
          <input
            className={fieldErrors.password ? 'is-invalid' : ''}
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((err) => clearFieldError(err, 'password'));
            }}
          />
          <FieldError message={fieldErrors.password} />
        </div>
        <div className="form-group">
          <label>Confirm password</label>
          <input
            className={fieldErrors.password_confirm ? 'is-invalid' : ''}
            type="password"
            value={passwordConfirm}
            autoComplete="new-password"
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setFieldErrors((err) => clearFieldError(err, 'password_confirm'));
            }}
          />
          <FieldError message={fieldErrors.password_confirm} />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={busy || Boolean(success)}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/signin">Back to signin</Link>
        </p>
      </form>
    </div>
  );
}
