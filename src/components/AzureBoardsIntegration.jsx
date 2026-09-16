import { API_BASE_URL } from "../utils/api";
import { useState, useEffect } from "react";
import axios from "axios";
import { VscAzureDevops } from "react-icons/vsc";
import { Search, X, Check, Loader2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

function AzureBoardsIntegration({ onClose, embedded = false }) {
  const [formData, setFormData] = useState({
    organization: "",
    pat: "",
    azureUrl: "https://dev.azure.com",
  });
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'synced'
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'selected' | 'integrated'
  const [message, setMessage] = useState("");

  const companyName = localStorage.getItem("companyName") || "";

  // --- Initial Status & Projects Fetch ---
  useEffect(() => {
    if (!companyName) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE_URL}/azure-boards/connection/${companyName}`)
      .then(async (res) => {
        if (res.data?.connected) {
          setIsConnected(true);
          setShowConnectionForm(false);
          if (res.data.organization) {
            setFormData((prev) => ({
              ...prev,
              organization: res.data.organization || "",
              azureUrl: res.data.azure_url || "https://dev.azure.com",
            }));
          }
          setMessage(`Connected to Azure Organization: ${res.data.organization}`);

          // Fetch stored projects
          let projRes = await axios
            .get(`${API_BASE_URL}/azure-boards/projects/${companyName}`)
            .catch(() => null);

          if (!projRes?.data?.projects || projRes.data.projects.length === 0) {
            // Auto sync projects if empty
            await axios
              .post(`${API_BASE_URL}/azure-boards/sync-projects/${companyName}`)
              .catch(() => {});
            projRes = await axios
              .get(`${API_BASE_URL}/azure-boards/projects/${companyName}`)
              .catch(() => null);
          }

          if (projRes?.data?.projects) {
            setProjects(projRes.data.projects);
          }
        } else {
          setIsConnected(false);
          setShowConnectionForm(true);
          setProjects([]);
        }
      })
      .catch((err) => console.error("Error loading Azure details:", err))
      .finally(() => setLoading(false));
  }, [companyName]);

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
      axios
        .put(`${API_BASE_URL}/azure-boards/project-selection/${companyName}`, {
          projectId,
          isSelected: nextState,
        })
        .then(() => {
          window.dispatchEvent(new Event("azureBoardsProjectsUpdated"));
        })
        .catch(() => {});
    }
  };

  const handleSelectAllToggle = () => {
    const targetStatus = !allFilteredSelected;

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
          axios.put(`${API_BASE_URL}/azure-boards/project-selection/${companyName}`, {
            projectId: p.projectId,
            isSelected: targetStatus,
          })
        )
      )
        .then(() => {
          window.dispatchEvent(new Event("azureBoardsProjectsUpdated"));
        })
        .catch(console.error);
    }
  };

  const handleSubmitConnection = async (e) => {
    e.preventDefault();
    if (!companyName) {
      toast.error("Company name missing.");
      return;
    }
    if (!formData.organization.trim()) {
      toast.error("Please enter your Azure DevOps Organization Name.");
      return;
    }
    if (!formData.pat.trim()) {
      toast.error("Please enter your Personal Access Token (PAT).");
      return;
    }

    setConnecting(true);
    setMessage("");
    const toastId = toast.loading("Verifying Azure DevOps credentials...");

    try {
      // 1. Test connection
      const testRes = await axios.post("${API_BASE_URL}/azure-boards/test-connection", {
        organization: formData.organization.trim(),
        pat: formData.pat.trim(),
        azure_url: formData.azureUrl.trim() || "https://dev.azure.com",
      });

      if (!testRes.data?.connected) {
        throw new Error("Unable to verify Azure DevOps credentials.");
      }

      // 2. Save connection
      toast.loading("Saving connection...", { id: toastId });
      await axios.post("${API_BASE_URL}/azure-boards/save-connection", {
        companyName,
        organization: formData.organization.trim(),
        pat: formData.pat.trim(),
        azure_url: formData.azureUrl.trim() || "https://dev.azure.com",
      });

      // 3. Sync projects from Azure DevOps
      toast.loading("Fetching projects from Azure DevOps...", { id: toastId });
      const syncRes = await axios.post(`${API_BASE_URL}/azure-boards/sync-projects/${companyName}`);

      if (syncRes.data?.projects) {
        setProjects(syncRes.data.projects);
      }

      // 4. Sync work items
      toast.loading("Syncing Azure Boards work items...", { id: toastId });
      await axios.post(`${API_BASE_URL}/azure-boards/sync-work-items/${companyName}`).catch(() => {});

      window.dispatchEvent(new Event("azureBoardsConnectionUpdated"));
      window.dispatchEvent(new Event("azureBoardsProjectsUpdated"));

      setIsConnected(true);
      setShowConnectionForm(false);
      setMessage(`Connected to Azure Organization: ${formData.organization}`);
      toast.success("Azure Boards connected & projects synced successfully!", { id: toastId });
    } catch (err) {
      setIsConnected(false);
      const errMsg = err.response?.data?.detail || err.message || "Failed to connect Azure Boards.";
      setMessage(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-surface text-ink rounded-2xl border border-line shadow-none p-16 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-9 h-9 text-ink animate-spin" />
        <p className="text-sm font-medium text-muted">Checking Azure Boards connection...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface text-ink rounded-2xl border border-line shadow-none overflow-hidden font-sans flex flex-col">
      {/* Header Bar */}
      <div className="px-7 py-5 border-b border-line/90 flex items-center justify-between bg-raised">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0078d4]/10 border border-[#0078d4]/30 text-[#0078d4] text-xl">
            <VscAzureDevops />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-ink tracking-tight">
              {showConnectionForm ? "Azure Boards Integration" : "Azure Project Details"}
            </h2>
          </div>
        </div>
        {onClose && !embedded && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink transition p-1.5 rounded-lg hover:bg-control cursor-pointer"
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
              className={`pb-3.5 text-sm font-semibold tracking-wide transition-all relative cursor-pointer ${
                activeTab === "all" ? "text-ink font-bold" : "text-muted hover:text-ink"
              }`}
            >
              All Projects ({projects.length})
              {activeTab === "all" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0078d4] rounded-full" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("synced");
                setActiveFilter("selected");
              }}
              className={`pb-3.5 text-sm font-semibold tracking-wide transition-all relative cursor-pointer ${
                activeTab === "synced" ? "text-ink font-bold" : "text-muted hover:text-ink"
              }`}
            >
              Synced Projects ({selectedCount})
              {activeTab === "synced" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0078d4] rounded-full" />}
            </button>
          </div>

          {/* Filter Badges / Pills Bar */}
          <div className="flex items-center gap-3 px-7 py-4 border-b border-line/60 bg-surface">
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "selected" ? "all" : "selected")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer ${
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
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer ${
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
            <div className="flex items-center gap-3 bg-control border border-line rounded-xl px-4 py-3 focus-within:border-line-strong transition">
              <Search size={18} className="text-muted shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Azure projects"
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
                  className="w-4 h-4 rounded border-line bg-control accent-[#0078d4] cursor-pointer"
                />
                <span>Select All</span>
              </label>
            </div>
          </div>

          {/* Scrollable Project List */}
          <div className="px-7 py-3 overflow-y-auto max-h-[380px] space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm font-medium">
                No matching Azure projects found.
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
                      {project.description && (
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {project.description}
                        </p>
                      )}
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
              className="px-6 py-2.5 text-sm font-semibold text-ink bg-control border border-line rounded-xl hover:bg-hover hover:text-ink transition cursor-pointer"
            >
              Back To Integration
            </button>

            <button
              type="button"
              onClick={() => {
                toast.success("Azure projects saved successfully");
                if (onClose) onClose();
              }}
              className="px-7 py-2.5 text-sm font-bold text-on-inverse bg-inverse hover:bg-inverse rounded-full shadow-none transition active:scale-95 cursor-pointer"
            >
              Select Projects
            </button>
          </div>
        </div>
      ) : (
        /* Connection Form Screen */
        <form onSubmit={handleSubmitConnection} className="p-8 space-y-6 bg-surface">
          <div>
            <label className="block text-sm font-bold text-ink mb-1">
              Azure DevOps Organization Name or URL
            </label>
            <p className="text-xs text-muted mt-1 mb-2.5">
              Enter your Azure DevOps Organization name (e.g. <span className="text-ink font-mono">my-org</span> from <span className="text-ink font-mono">https://dev.azure.com/my-org</span>).
            </p>
            <input
              type="text"
              name="organization" aria-label="Azure DevOps organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g. my-organization"
              className="w-full bg-control border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-neutral-500 focus:outline-none focus:border-line-strong transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-ink mb-1">
              Personal Access Token (PAT)
            </label>
            <p className="text-xs text-muted mt-1 mb-2.5">
              Generate a PAT in Azure DevOps User Settings with Work Items & Project Read permissions.
            </p>
            <input
              type="password"
              name="pat" aria-label="Azure personal access token"
              value={formData.pat}
              onChange={(e) => setFormData({ ...formData, pat: e.target.value })}
              placeholder="••••••••••••••••••••••••••••••••••••••••••••"
              className="w-full bg-control border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-neutral-500 focus:outline-none focus:border-line-strong transition"
              required
            />
          </div>

          {message && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border text-sm font-medium ${
              isConnected ? "bg-success/10 text-success border-success/30" : "bg-danger/10 text-danger border-danger/30"
            }`}>
              {isConnected ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {message}
            </div>
          )}

          <div className="pt-6 border-t border-line/80 flex items-center justify-between">
            {isConnected ? (
              <button
                type="button"
                onClick={() => setShowConnectionForm(false)}
                className="px-5 py-2.5 text-sm font-semibold text-ink bg-control border border-line rounded-xl hover:bg-hover hover:text-ink transition cursor-pointer"
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
              {connecting ? "Connecting..." : isConnected ? "Reconnect Azure Boards" : "Connect Azure Boards"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AzureBoardsIntegration;
