import { useEffect } from 'react';
import { statusMeta } from '../context/SiteContext.jsx';

/* ------------------------------------------------------------------ logo */
export function Logo({ size = 42, className = 'brand__logo' }) {
  return <img src="/logo.svg" alt="" width={size} height={size} className={className} />;
}

/* ------------------------------------------------------------------ text */
export function SectionHead({ eyebrow, title, description, center, accent, children }) {
  return (
    <div className={`section-head${center ? ' section-head--center' : ''}`}>
      {eyebrow ? <span className={`eyebrow${accent ? ' eyebrow--accent' : ''}`}>{eyebrow}</span> : null}
      {title ? <h2>{title}</h2> : null}
      {description ? <p className="lead">{description}</p> : null}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- badges */
export function Badge({ tone = 'muted', children, className = '' }) {
  return <span className={`badge badge--${tone} ${className}`.trim()}>{children}</span>;
}

export function StatusBadge({ status }) {
  const { label, tone } = statusMeta(status);
  return <Badge tone={tone}>{label}</Badge>;
}

export function StatCard({ icon, value, label, tone = 'brand', accent }) {
  return (
    <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
      {icon ? <div className={`stat-card__icon stat-card__icon--${tone}`}>{icon}</div> : null}
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- forms */
export function Field({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={`field${error ? ' field--error' : ''} ${className}`.trim()}>
      {label ? (
        <label className="field__label">
          {label}
          {required ? <span>*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  );
}

export function TextInput({ label, required, hint, error, className, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      <input className="input" {...props} />
    </Field>
  );
}

export function TextArea({ label, required, hint, error, className, rows = 4, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      <textarea className="textarea" rows={rows} {...props} />
    </Field>
  );
}

export function Select({ label, required, hint, error, options = [], placeholder, className, children, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      <select className="select" {...props}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {children ||
          options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const text = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
      </select>
    </Field>
  );
}

export function Checkbox({ label, description, className = '', ...props }) {
  return (
    <label className={`checkbox ${className}`.trim()}>
      <input type="checkbox" {...props} />
      <span>
        {label}
        {description ? <span className="field__hint" style={{ display: 'block' }}>{description}</span> : null}
      </span>
    </label>
  );
}

export function RadioGroup({ label, options = [], value, onChange, name, required, error, columns }) {
  return (
    <Field label={label} required={required} error={error}>
      <div className="checkbox-grid" style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <label key={optionValue} className="radio">
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={String(value) === String(optionValue)}
                onChange={() => onChange(optionValue)}
              />
              <span>{optionLabel}</span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

export function CheckboxGroup({ label, options = [], values = [], onToggle, hint, error }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="checkbox-grid">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <label key={optionValue} className="checkbox">
              <input type="checkbox" checked={values.includes(optionValue)} onChange={() => onToggle(optionValue)} />
              <span>{optionLabel}</span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

export function FileField({ label, required, hint, error, name, onChange, accept = '.pdf,.jpg,.jpeg,.png,.webp', fileName }) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <div className="file-drop">
        <input type="file" name={name} accept={accept} onChange={(event) => onChange(name, event.target.files?.[0] || null)} />
        {fileName ? <span className="file-drop__name">✓ {fileName} attached</span> : <span className="field__hint">PDF, JPG or PNG · max 5MB</span>}
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------------ misc */
export function Alert({ tone = 'info', title, children }) {
  return (
    <div className={`alert alert--${tone}`}>
      <div>
        {title ? <strong>{title}</strong> : null}
        {title ? <br /> : null}
        {children}
      </div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-block">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="pagination">
      <span>
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>
      </span>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Previous
        </button>
        <span className="badge badge--muted">
          Page {page} / {pages}
        </span>
        <button type="button" className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    const handler = (event) => event.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose?.()} role="dialog" aria-modal="true">
      <div className={`modal${wide ? ' modal--wide' : ''}`}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{value}</span>
    </div>
  );
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...options });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `LKR ${number.toLocaleString('en-LK')}`;
}

export function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(`${dateString}T23:59:59`);
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function initialOf(name = '') {
  return name.trim().charAt(0).toUpperCase() || 'U';
}
