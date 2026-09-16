import { API_BASE_URL } from "../utils/api";
import { useState, useEffect } from "react";
import { Search, Info, X, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function JiraIntegration({ onClose, embedded = false }) {
  const [formData, setFormData] = useState({ hostName: "", apiToken: "", email: "" });
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'synced'
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'selected' | 'integrated'

  // --- Connection & Project Status ---
  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/jira/connection/${companyName}`)
      .then((res) => (res.ok ? res.json() : { connected: false }))
      .then(async (connData) => {
        if (connData?.connected) {
          setIsConnected(true);
          setShowConnectionForm(false);
          if (connData.jira_host || connData.jira_email || connData.jira_token) {
            setFormData((prev) => ({
              ...prev,
              hostName: connData.jira_host || "",
              email: connData.jira_email || "",
              apiToken: connData.jira_token || "",
            }));
          }
          let projRes = await fetch(`${API_BASE_URL}/jira/projects/${companyName}`);
          let projData = projRes.ok ? await projRes.json() : null;
          
          if (!projData?.projects || projData.projects.length === 0) {
            await fetch(`${API_BASE_URL}/jira/sync-projects/${companyName}`, { method: "POST" }).catch(() => {});
            projRes = await fetch(`${API_BASE_URL}/jira/projects/${companyName}`);
            projData = projRes.ok ? await projRes.json() : null;
          }

          if (projData?.projects) {
            setProjects(projData.projects);
          }
        } else {
          setIsConnected(false);
          setShowConnectionForm(true);
          setProjects([]);
        }
      })
      .catch((err) => console.error("Error loading Jira details:", err))
      .finally(() => setLoading(false));
  }, []);


  const selectedCount = projects.filter((p) => p.isSelected).length;
  const integratedCount = projects.filter((p) => p.isIntegrated || p.isSelected).length;

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectKey?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "synced" && !p.isSelected) return false;
    if (activeFilter === "selected" && !p.isSelected) return false;
    if (activeFilter === "integrated" && !p.isIntegrated && !p.isSelected) return false;

    return matchesSearch;
  });

  const allFilteredSelected =
    filteredProjects.length > 0 && filteredProjects.every((p) => p.isSelected);

  const handleToggleProject = (projectId) => {
    const companyName = localStorage.getItem("companyName");
    let nextState = false;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.projectId === projectId) {
          nextState = !p.isSelected;
          return { ...p, isSelected: nextState };
        }
        return p;
      })
    );

    if (companyName) {
      fetch(`${API_BASE_URL}/jira/project-selection/${companyName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, isSelected: nextState }),
      })
        .then(() => {
          window.dispatchEvent(new Event("jiraProjectsUpdated"));
        })
        .catch(() => {});
    }
  };

  const handleSelectAllToggle = () => {
    const targetStatus = !allFilteredSelected;
    const companyName = localStorage.getItem("companyName");

    setProjects((prev) =>
      prev.map((p) =>
        filteredProjects.some((fp) => fp.projectId === p.projectId)
          ? { ...p, isSelected: targetStatus }
          : p
      )
    );

    if (companyName && filteredProjects.length > 0) {
      Promise.all(
        filteredProjects.map((p) =>
          fetch(`${API_BASE_URL}/jira/project-selection/${companyName}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId: p.projectId, isSelected: targetStatus }),
          })
        )
      )
        .then(() => {
          window.dispatchEvent(new Event("jiraProjectsUpdated"));
        })
        .catch(console.error);
    }
  };


  const handleSubmitConnection = async (e) => {
    e.preventDefault();
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      toast.error("Company name missing in local storage.");
      return;
    }

    setConnecting(true);
    const toastId = toast.loading("Saving Jira credentials...");

    try {
      // 1. Save Jira connection
      const saveRes = await fetch("${API_BASE_URL}/jira/save-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          jira_host: formData.hostName,
          jira_email: formData.email,
          jira_token: formData.apiToken,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save Jira connection");
      }

      // 2. Sync Projects from Jira API
      toast.loading("Fetching projects from Jira...", { id: toastId });
      const syncProjRes = await fetch(`${API_BASE_URL}/jira/sync-projects/${companyName}`, {
        method: "POST",
      });

      if (!syncProjRes.ok) {
        const errorData = await syncProjRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to sync Jira projects. Check credentials.");
      }

      // 3. Fetch synced projects list so modal lists projects immediately
      const projRes = await fetch(`${API_BASE_URL}/jira/projects/${companyName}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      }

      // 4. Orchestrated Sync: Sync Boards, Sprints & Sprint Issues to MongoDB
      toast.loading("Syncing boards, sprints & issues to MongoDB...", { id: toastId });
      await fetch(`${API_BASE_URL}/jira/sync-all/${companyName}`, { method: "POST" }).catch(() => {});

      // Notify Topbar and all UI components in real time
      window.dispatchEvent(new CustomEvent("jiraProjectsUpdated"));
      window.dispatchEvent(new CustomEvent("jiraConnectionUpdated"));
      window.dispatchEvent(new CustomEvent("jiraSyncCompleted"));

      toast.success("Jira connected & all data synced successfully!", { id: toastId });
      setIsConnected(true);
      setShowConnectionForm(false);
    } catch (err) {
      console.error("Jira connection error:", err);
      toast.error(err.message || "Failed to connect Jira", { id: toastId });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-surface text-ink rounded-2xl border border-line shadow-none p-16 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-9 h-9 text-ink animate-spin" />
        <p className="text-sm font-medium text-muted">Checking Jira connection...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface text-ink rounded-2xl border border-line shadow-none overflow-hidden font-sans flex flex-col">
      {/* Header Bar */}
      <div className="px-7 py-5 border-b border-line/90 flex items-center justify-between bg-raised">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
            {showConnectionForm ? "Jira Integration" : "Project Details"}
          </h2>
          {!showConnectionForm && <Info size={18} className="text-muted" />}
        </div>
        {onClose && !embedded && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink transition p-1.5 rounded-lg hover:bg-control"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {!showConnectionForm ? (
        <div className="flex flex-col bg-surface">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-8 px-7 pt-4 border-b border-line/80 bg-raised">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setActiveFilter("all");
              }}
              className={`pb-3.5 text-sm font-semibold tracking-wide transition-all relative ${
                activeTab === "all" ? "text-ink font-bold" : "text-muted hover:text-ink"
              }`}
            >
              All Projects ({projects.length})
              {activeTab === "all" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-inverse rounded-full" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("synced");
                setActiveFilter("selected");
              }}
              className={`pb-3.5 text-sm font-semibold tracking-wide transition-all relative ${
                activeTab === "synced" ? "text-ink font-bold" : "text-muted hover:text-ink"
              }`}
            >
              Synced Projects ({selectedCount})
              {activeTab === "synced" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-inverse rounded-full" />}
            </button>
          </div>

          {/* Filter Badges / Pills Bar */}
          <div className="flex items-center gap-3 px-7 py-4 border-b border-line/60 bg-surface">
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "selected" ? "all" : "selected")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition ${
                activeFilter === "selected"
                  ? "bg-inverse text-on-inverse font-bold shadow-sm"
                  : "bg-control text-ink border border-line hover:bg-hover"
              }`}
            >
              <span>Selected</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeFilter === "selected" ? "bg-black text-ink" : "bg-control text-ink"
                }`}
              >
                {selectedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "integrated" ? "all" : "integrated")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition ${
                activeFilter === "integrated"
                  ? "bg-inverse text-on-inverse font-bold shadow-sm"
                  : "bg-control text-ink border border-line hover:bg-hover"
              }`}
            >
              <span>Integrated</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeFilter === "integrated" ? "bg-black text-ink" : "bg-control text-ink"
                }`}
              >
                {integratedCount}
              </span>
            </button>
          </div>

          {/* Search Box & Select All Bar */}
          <div className="px-7 pt-4 pb-2 space-y-3.5">
            {/* Flex container ensuring icon & search text can never overlap */}
            <div className="flex items-center gap-3 bg-control border border-line rounded-xl px-4 py-3 focus-within:border-line-strong transition">
              <Search size={18} className="text-muted shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects" placeholder="Search projects"
                style={{ padding: 0, margin: 0, background: "transparent" }}
                className="w-full bg-transparent border-none text-sm text-ink placeholder-neutral-500 focus:outline-none focus:ring-0"
              />
            </div>

            <div className="flex items-center px-1 py-1">
              <label className="flex items-center gap-3 text-sm font-semibold text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleSelectAllToggle}
                  className="w-4 h-4 rounded border-line bg-control accent-white cursor-pointer"
                />
                <span>Select All</span>
              </label>
            </div>
          </div>

          {/* Scrollable Project List */}
          <div className="px-7 py-3 overflow-y-auto max-h-[380px] space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm font-medium">
                No matching projects found.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.projectId}
                  onClick={() => handleToggleProject(project.projectId)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none shadow-sm ${
                    project.isSelected
                      ? "bg-control border-line"
                      : "bg-control border-line hover:border-line"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 pr-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
                        project.isSelected
                          ? "bg-inverse border-ink text-on-inverse"
                          : "border-line-strong bg-control"
                      }`}
                    >
                      {project.isSelected && <Check size={14} strokeWidth={3} className="text-on-inverse" />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-ink tracking-tight truncate">
                        {project.projectName}
                      </h4>
                      <p className="text-xs md:text-sm font-medium text-muted mt-1 truncate">
                        {project.projectKey}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-5 px-7 border-t border-line/90 flex items-center justify-between bg-raised">
            <button
              type="button"
              onClick={() => setShowConnectionForm(true)}
              className="px-6 py-2.5 text-sm font-semibold text-ink bg-control border border-line rounded-xl hover:bg-hover hover:text-ink transition"
            >
              Back To Integration
            </button>

            <button
              type="button"
              onClick={() => {
                toast.success("Projects saved successfully");
                if (onClose) onClose();
              }}
              className="px-7 py-2.5 text-sm font-bold text-on-inverse bg-inverse hover:bg-inverse rounded-full shadow-none transition active:scale-95 cursor-pointer"
            >
              Select Projects
            </button>
          </div>
        </div>
      ) : (
        /* Connection Form Screen - Fits content naturally without empty vertical void */
        <form onSubmit={handleSubmitConnection} className="p-8 space-y-6 bg-surface">
          <div>
            <label className="block text-sm font-bold text-ink mb-1">
              Jira Organisation Name
            </label>
            <p className="text-xs text-muted mt-1 mb-2.5">
              Get your Jira sitename from your Jira URL (e.g. <span className="text-ink font-mono">https://[sitename].atlassian.net</span>) and only enter the <span className="text-ink font-mono">[sitename]</span> portion.
            </p>
            <input
              type="text"
              name="hostName" aria-label="Jira organization name"
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              placeholder="Enter host name"
              className="w-full bg-control border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-neutral-500 focus:outline-none focus:border-line-strong transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-1">API Token</label>
            <p className="text-xs text-muted mt-1 mb-2.5">
              Create an API token in Jira to authenticate your account.
            </p>
            <input
              type="password"
              name="apiToken" aria-label="Jira API token"
              value={formData.apiToken}
              onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
              placeholder="••••••••••••••••"
              className="w-full bg-control border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-neutral-500 focus:outline-none focus:border-line-strong transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-1">Jira Login Email</label>
            <p className="text-xs text-muted mt-1 mb-2.5">
              Enter the email address associated with your Jira account.
            </p>
            <input
              type="email"
              name="email" aria-label="Jira login email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.com"
              className="w-full bg-control border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-neutral-500 focus:outline-none focus:border-line-strong transition"
              required
            />
          </div>

          <div className="pt-6 border-t border-line/80 flex items-center justify-between">
            {isConnected ? (
              <button
                type="button"
                onClick={() => setShowConnectionForm(false)}
                className="px-5 py-2.5 text-sm font-semibold text-ink bg-control border border-line rounded-xl hover:bg-hover hover:text-ink transition"
              >
                Back To Projects
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={connecting}
              className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-on-inverse bg-inverse hover:bg-inverse rounded-full shadow-none transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {connecting && <Loader2 className="w-4 h-4 animate-spin text-on-inverse" />}
              {connecting ? "Connecting..." : "Connect Jira"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default JiraIntegration;
