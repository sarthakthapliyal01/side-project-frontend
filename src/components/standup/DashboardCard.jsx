import { Info } from "lucide-react";
export default function DashboardCard({ title, children, className = "", headerRight = null, infoText = null }) {
  const type = className.match(/q-card--[a-z]+/)?.[0] || "q-card--chart";
  return <section className={`q-card ${type}`}>
    <header className="q-card-header"><div className="q-card-title"><h2>{title}</h2>{infoText && <span className="q-card-info" title={infoText} aria-label={infoText} tabIndex={0}><Info size={13} /></span>}</div>{headerRight && <div className="q-card-tools">{headerRight}</div>}</header>
    <div className="q-card-body">{children}</div>
  </section>;
}
