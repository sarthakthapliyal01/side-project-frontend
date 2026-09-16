import { Brand } from "../components/ui/ProductUI";
import { useState } from "react";
import axios from "axios";
import { Loader2, ArrowRight, Kanban, GitBranch, ChartNoAxesCombined } from "lucide-react";
import { API_BASE_URL } from "../utils/api";

function OrganizationPage({ onOrganizationCreated, onDevBypass }) {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/companies`, {
        companyName,
      });

      const savedName = response.data?.companyName || companyName;
      localStorage.setItem("companyName", savedName);
      onOrganizationCreated();
    } catch (error) {
      console.error("Organization submission error:", error);
      alert("Failed to process organization request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="q-auth q-onboarding">
      <div className="q-auth-brand"><Brand /></div>
      <div className="q-auth-layout">
      <section className="q-auth-intro">
        <div className="q-eyebrow">Workspace setup</div>
        <h1>Your team.<br /><span>One workspace.</span></h1>
        <p className="q-auth-lead">Enter your organization name to set up or access your workspace.</p>
        <div className="q-workspace-flow" aria-hidden="true">
          <span><Kanban size={22} />Plan</span><i />
          <span><GitBranch size={22} />Build</span><i />
          <span><ChartNoAxesCombined size={22} />Deliver</span>
        </div>
      </section>
      <section className="q-auth-content q-auth-setup" aria-labelledby="workspace-details">
        <form onSubmit={handleSubmit} className="q-auth-form">
          <h2 id="workspace-details" className="q-auth-form-heading">Workspace details</h2>
          <label htmlFor="organization-name">Organization name</label>
          <input id="organization-name" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Inc." autoComplete="organization" required aria-describedby="organization-help" />
          <p className="q-auth-help" id="organization-help">Use the organization name shared by your team.</p>
          <button type="submit" disabled={loading} className="q-button q-button--primary">{loading ? <><Loader2 size={18} className="animate-spin" />Processing…</> : <>Continue to workspace<ArrowRight size={18} /></>}</button>
        </form>
        <p className="q-auth-meta">A shared view of your team's delivery.</p>
      </section>
      </div>
    </main>
  );
}
export default OrganizationPage;
