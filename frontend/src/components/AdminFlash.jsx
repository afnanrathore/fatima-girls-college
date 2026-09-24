import { useEffect } from 'react';

/** Sticky success/error banner for admin pages. Auto-hides after 4s when success. */
export default function AdminFlash({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message || type !== 'success' || !onClose) return undefined;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, type, onClose]);

  if (!message) return null;

  return (
    <div className={`admin-flash admin-flash-${type === 'error' ? 'error' : 'success'}`} role="status">
      <span>{message}</span>
      {onClose && (
        <button type="button" aria-label="Dismiss" onClick={onClose}>×</button>
      )}
    </div>
  );
}
