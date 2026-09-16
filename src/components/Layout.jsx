import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ currentPage, setCurrentPage, children, user, logout, theme, onToggleTheme }) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("qmetrix-sidebar-collapsed");
      if (saved !== null) return saved === "true";
    } catch { /* Preferences are optional when storage is unavailable. */ }
    return window.matchMedia("(min-width: 768px) and (max-width: 1199px)").matches;
  });
  useEffect(() => {
    try { localStorage.setItem("qmetrix-sidebar-collapsed", String(sidebarCollapsed)); }
    catch { /* The toggle still works for this session. */ }
  }, [sidebarCollapsed]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeMobileNav = () => { if (desktop.matches) setNavOpen(false); };
    desktop.addEventListener("change", closeMobileNav);
    return () => desktop.removeEventListener("change", closeMobileNav);
  }, []);
  useEffect(() => {
    if (!navOpen) return;
    const drawer = document.getElementById("app-navigation");
    const toggle = document.querySelector(".q-mobile-toggle");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus once the drawer has moved into view.
    const focusTimer = setTimeout(() => drawer?.querySelector("button")?.focus(), 220);
    const keydown = e => {
      if (e.key === "Escape") { e.preventDefault(); setNavOpen(false); return; }
      if (e.key !== "Tab" || !drawer) return;
      const buttons = [...drawer.querySelectorAll("button")].filter(el => el.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (!drawer.contains(document.activeElement)) { e.preventDefault(); first?.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      toggle?.focus();
    };
  }, [navOpen]);
  return <div className="q-shell" data-nav-open={navOpen} data-sidebar-collapsed={sidebarCollapsed}>
    {navOpen && <button tabIndex={-1} className="q-nav-backdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
    <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onClose={() => setNavOpen(false)} />
    <div className="q-shell-body" inert={navOpen || undefined}>
      <Topbar user={user} companyName={localStorage.getItem("companyName") || "Organization"} logout={logout} currentPage={currentPage} onToggleNav={() => setNavOpen(v => !v)} navOpen={navOpen} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(v => !v)} theme={theme} onToggleTheme={onToggleTheme} />
      <main className="q-main" id="main-content">{children}</main>
    </div>
  </div>;
}
