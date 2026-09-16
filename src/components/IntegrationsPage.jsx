import { PageHeader } from "./ui/ProductUI";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Kanban, Layers } from "lucide-react";
import { FaGithub, FaGitlab } from "react-icons/fa";
import { VscAzureDevops } from "react-icons/vsc";

function IntegrationsPage({ onOpenJiraModal, onOpenAzureBoardsModal, onOpenGithubModal, onOpenGitlabModal, onOpenCapacityPlanning, onOpenRolesAndBilling }) {
  const [jiraConnected, setJiraConnected] = useState(false);
  const [azureConnected, setAzureConnected] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const companyName = localStorage.getItem("companyName") || "";

  // --- Integration Status Check ---
  const checkStatuses = async () => {
    if (!companyName) return;
    setLoading(true);
    try {
      // Check Jira
      const jiraRes = await fetch(`http://127.0.0.1:8000/jira/connection/${companyName}`).catch(() => null);
      if (jiraRes?.ok) {
        const data = await jiraRes.json();
        setJiraConnected(Boolean(data?.connected));
      }
      // Check Azure Boards
      const azureRes = await fetch(`http://127.0.0.1:8000/azure-boards/connection/${companyName}`).catch(() => null);
      if (azureRes?.ok) {
        const azData = await azureRes.json();
        setAzureConnected(Boolean(azData?.connected));
      }
      // Check GitHub
      const githubRes = await fetch(`http://127.0.0.1:8000/github/connection/${companyName}`).catch(() => null);
      if (githubRes?.ok) {
        const ghData = await githubRes.json();
        setGithubConnected(Boolean(ghData?.connected));
      }
      // Check GitLab
      const gitlabRes = await fetch(`http://127.0.0.1:8000/gitlab/connection/${companyName}`).catch(() => null);
      if (gitlabRes?.ok) {
        const glData = await gitlabRes.json();
        setGitlabConnected(Boolean(glData?.connected));
      }
    } catch (err) {
      console.error("Error checking integration status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatuses();
    const handleUpdate = () => checkStatuses();
    window.addEventListener("githubConnectionUpdated", handleUpdate);
    window.addEventListener("gitlabConnectionUpdated", handleUpdate);
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    window.addEventListener("azureBoardsConnectionUpdated", handleUpdate);
    window.addEventListener("azureBoardsProjectsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("githubConnectionUpdated", handleUpdate);
      window.removeEventListener("gitlabConnectionUpdated", handleUpdate);
      window.removeEventListener("jiraProjectsUpdated", handleUpdate);
      window.removeEventListener("azureBoardsConnectionUpdated", handleUpdate);
      window.removeEventListener("azureBoardsProjectsUpdated", handleUpdate);
    };
  }, [companyName]);

  const providers = [
    { name: "Jira Software", category: "Ticket sources", description: "Issues, epics, sprint boards, and workflow status.", icon: <Kanban size={23} />, color: "var(--accent)", connected: jiraConnected, open: onOpenJiraModal },
    { name: "Microsoft Azure Boards", category: "Ticket sources", description: "Azure DevOps work items, features, tasks, and bugs.", icon: <VscAzureDevops />, color: "var(--cyan)", connected: azureConnected, open: onOpenAzureBoardsModal },
    { name: "GitHub Repositories", category: "Code sources", description: "Pull requests, commits, branches, and code metrics.", icon: <FaGithub />, color: "var(--text-primary)", connected: githubConnected, open: onOpenGithubModal },
    { name: "GitLab Repositories", category: "Code sources", description: "Merge requests, commits, branches, and code metrics.", icon: <FaGitlab />, color: "var(--warning)", connected: gitlabConnected, open: onOpenGitlabModal },
  ];
  return <section className="q-page">
    <PageHeader eyebrow="Workspace configuration" title="Connect your tools." description="Bring your tickets and code together for a shared view of delivery." />
    <section className="q-integration-grid" aria-label="Available integrations">
      {providers.map(p => <article className="q-integration" key={p.name}>
        <div className="q-integration-top">
          <div className="q-provider-icon" style={{color:p.color}} aria-hidden="true">{p.icon}</div>
          <div><span className="q-integration-category">{p.category}</span><h3>{p.name}</h3></div>
        </div>
        <p>{p.description}</p>
        <div className="q-integration-bottom">
          <span className="q-badge" data-success={p.connected}><i />{loading ? "CHECKING" : p.connected ? "CONFIGURED" : "NOT CONNECTED"}</span>
          <button className="q-button" onClick={p.open} aria-label={`${p.connected ? "Configure" : "Connect"} ${p.name}`}>{p.connected ? "Configure" : "Connect"}<ArrowUpRight size={14} /></button>
        </div>
      </article>)}
    </section>
    <section className="q-integration-section"><h2 className="q-section-title"><Layers />Capacity planning</h2>
      <div className="q-settings-links">
        <button onClick={() => onOpenCapacityPlanning?.()}><span>Capacity planning<small>Manage team allocation and sprint availability.</small></span><ChevronRight size={18} /></button>
        <button onClick={() => onOpenRolesAndBilling?.()}><span>Roles & rate card<small>Set team roles and default billing rates.</small></span><ChevronRight size={18} /></button>
      </div>
    </section>
  </section>;
}
export default IntegrationsPage;
