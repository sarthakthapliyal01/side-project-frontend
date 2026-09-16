import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { Activity, X } from "lucide-react";

export function Brand() {
  return <div className="q-brand"><span className="q-brand-mark" aria-hidden="true">Q</span><span className="q-brand-label">QMetrix<span style={{color:"var(--text-secondary)"}}>360</span></span></div>;
}
export function PageHeader({ eyebrow = "Workspace intelligence", title, description, children }) {
  return <div className="q-page-header"><div><div className="q-eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>;
}
export function EmptyState({ title = "No data available", description = "Select a project and sprint to see the available data.", loading = false }) {
  return <div className="q-chart-empty" role="status">{loading ? <div className="q-skeleton" aria-hidden="true" /> : <Activity size={25} strokeWidth={1.5} aria-hidden="true" />}<strong>{loading ? "Loading data…" : title}</strong>{!loading && <p>{description}</p>}</div>;
}
export function PlaceholderPage({ title, description = "This page is coming soon." }) {
  return <section className="q-page"><PageHeader title={title} /><div className="q-placeholder"><Activity aria-hidden="true" /><span className="q-badge">COMING SOON</span><h2>{title}</h2><p>{description}</p></div></section>;
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();
    const keydown = (e) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); }
      if (e.key !== "Tab") return;
      const items = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { e.preventDefault(); first.focus(); }
    };
    dialog?.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; dialog?.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  return createPortal(<div className="q-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section ref={ref} className="q-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><header className="q-modal-head"><h2 id={titleId}>{title}</h2><button className="q-icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></header><div className="q-modal-body">{children}</div></section></div>,document.body);
}
