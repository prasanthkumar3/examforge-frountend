import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

/* ---------- Icons (inline SVG, no extra dependency) ---------- */
const paths = {
  grid: "M4 4h6v6H4z|M14 4h6v6h-6z|M4 14h6v6H4z|M14 14h6v6h-6z",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z|M14 3v5h5|M9 13h6|M9 17h6",
  bank: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z|M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6|M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1|M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z|M21 20v-1a4 4 0 0 0-3-3.9|M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 7v5l3 2",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9",
  menu: "M4 6h16|M4 12h16|M4 18h16",
  x: "M6 6l12 12|M18 6 6 18",
  plus: "M12 5v14|M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7",
  arrowLeft: "M19 12H5|M11 6l-6 6 6 6",
  arrowRight: "M5 12h14|M13 6l6 6-6 6",
  arrowUp: "M12 19V5|M6 11l6-6 6 6",
  arrowDown: "M12 5v14|M6 13l6 6 6-6",
  upload: "M12 16V4|M7 9l5-5 5 5|M5 20h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3",
  lock: "M6 11h12v9H6z|M8 11V8a4 4 0 0 1 8 0v3",
  edit: "M4 20h4L19 9l-4-4L4 16z|M13.5 6.5l4 4",
  chart: "M5 20V10|M12 20V4|M19 20v-7",
  trash: "M4 7h16|M9 7V4h6v3|M6 7l1 13h10l1-13",
  copy: "M9 9h10v11H9z|M5 15V4h10",
  list: "M8 6h13|M8 12h13|M8 18h13|M3.5 6h.01|M3.5 12h.01|M3.5 18h.01",
};

export function Icon({ name, className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      {(paths[name] || "").split("|").map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export function Logo({ tone = "light", to = "/" }) {
  const text = tone === "dark" ? "text-white" : "text-ink";
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-600 text-sm font-extrabold text-white">E</span>
      <span className={`text-[17px] font-extrabold tracking-tight ${text}`}>ExamForge</span>
    </Link>
  );
}

/* ---------- Formatting ---------- */
export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function label(value) {
  if (!value) return "";
  const s = String(value).replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

/* ---------- Badges ---------- */
const tones = {
  neutral: "bg-slate-100 text-slate-600",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
};
const statusTone = {
  DRAFT: "amber", PUBLISHED: "green", CLOSED: "neutral",
  APPROVED: "green", REJECTED: "red",
  IN_PROGRESS: "blue", SUBMITTED: "green",
};
export function Badge({ children, tone = "neutral" }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
export function StatusBadge({ value }) {
  return <Badge tone={statusTone[value] || "neutral"}>{label(value)}</Badge>;
}

/* ---------- Form helpers ---------- */
export function Field({ label: text, hint, children }) {
  return (
    <label className="block">
      <span className="label">{text}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}
export function ErrorBox({ children }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>;
}
export function Notice({ tone = "amber", children }) {
  const cls = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

/* ---------- Layout building blocks ---------- */
export function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="mb-6">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink">
          <Icon name="arrowLeft" className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="muted mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Stat({ label: text, value, hint }) {
  return (
    <div className="card p-5">
      <div className="text-sm font-medium text-slate-500">{text}</div>
      <div className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ text = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-accent-600" />
      {text}
    </div>
  );
}

export function FullScreenMessage({ text, loading }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      {loading ? <Spinner text={text} /> : <p className="max-w-sm text-center text-sm text-slate-500">{text}</p>}
    </div>
  );
}

export function Tabs({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${value === t.value ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"}`}
        >
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Dialogs ---------- */
export function Modal({ open, title, onClose, children, footer, className = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full max-w-md rounded-xl bg-white p-6 shadow-xl ${className}`}>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <div className="mt-3">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-600">{body}</p>
    </Modal>
  );
}

/* ---------- Toasts ---------- */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === "error" ? "bg-red-600" : "bg-slate-900"}`}>
            <Icon name={t.kind === "error" ? "x" : "check"} className="h-4 w-4" /> {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
