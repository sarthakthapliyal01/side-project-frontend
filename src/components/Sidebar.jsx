import { Home, LineChart, Users, Shield, Plug, Settings, X } from "lucide-react";
import { Brand } from "./ui/ProductUI";
export default function Sidebar({ currentPage, setCurrentPage, onClose }) {
  const items = [
    { id: "qmetry360", label: "QMetry360", icon: Home },
    { id: "eng-metrics", label: "Eng Metrics", icon: LineChart },
    { id: "standup", label: "Standup", icon: Users },
    { id: "tech-quality", label: "Tech Quality", icon: Shield },
    { id: "integration", label: "Integration", icon: Plug },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return <aside className="q-sidebar" id="app-navigation">
    <Brand /><button className="q-icon-button q-drawer-close" aria-label="Close navigation" onClick={onClose}><X size={18} /></button>
    <div className="q-nav-caption">Workspace</div>
    <nav className="q-nav" aria-label="Main navigation">{items.map(({ id, label, icon: Icon }) => <button key={id} title={label} aria-label={label} aria-current={currentPage === id || (id === "integration" && ["capacity-planning","roles-and-billing"].includes(currentPage)) ? "page" : undefined} onClick={() => { setCurrentPage(id); onClose?.(); }}><Icon size={19} strokeWidth={1.7} /><span>{label}</span></button>)}</nav>
  </aside>;
}
