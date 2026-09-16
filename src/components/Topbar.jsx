import { API_BASE_URL } from "../utils/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  ChevronDown,
  RefreshCw,
  Search,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Menu,
  LogOut,
  Building2
} from "lucide-react";

function formatLastSynced(lastSyncedDate) {
  if (!lastSyncedDate) return "Never synced";
  return `Last synced: ${lastSyncedDate.toLocaleDateString()} ${lastSyncedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function Topbar({ user, companyName, logout, currentPage, onToggleNav, navOpen, sidebarCollapsed, onToggleSidebar, theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(() => {
    const stored = localStorage.getItem("lastSyncedBoards");
    return stored ? new Date(stored) : new Date();
  });

  const [projects, setProjects] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [activeSprint, setActiveSprint] = useState(null);

  const [releases, setReleases] = useState([]);
  const [selectedReleaseName, setSelectedReleaseName] = useState("");

  const [selectedRepo, setSelectedRepo] = useState("All repositories");
  const [repos, setRepos] = useState([]);
  const [selectedFilterType, setSelectedFilterType] = useState(() => localStorage.getItem("selectedFilterType") || "Sprint");
  const [selectedDev, setSelectedDev] = useState("Select Developer");

  const compName = companyName || localStorage.getItem("companyName") || "Organization";

  useEffect(() => {
    if (currentPage === "release") {
      setSelectedFilterType("Release");
      localStorage.setItem("selectedFilterType", "Release");
      window.dispatchEvent(new CustomEvent("filterTypeChanged", { detail: "Release" }));
    }
  }, [currentPage]);

  // --- Project Data ---
  const handleProjectChange = (boardId) => {
    setSelectedBoard(boardId);
    if (boardId) {
      localStorage.setItem("currentProject", boardId);
      window.dispatchEvent(new CustomEvent("projectSelected", { detail: boardId }));
    } else {
      localStorage.removeItem("currentProject");
      window.dispatchEvent(new CustomEvent("projectSelected", { detail: "" }));
    }
  };

  const fetchProjects = () => {
    if (!compName) return;

    fetch(`${API_BASE_URL}/jira/selected-projects/${compName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const fetchedProjects = data.projects || data;
        if (Array.isArray(fetchedProjects)) {
          setProjects(fetchedProjects);
          if (fetchedProjects.length > 0) {
            const savedProject = localStorage.getItem("currentProject");
            const isSavedValid = savedProject && fetchedProjects.some((p) => String(p.projectId) === String(savedProject) || String(p.projectKey) === String(savedProject));
            const activeId = isSavedValid ? savedProject : String(fetchedProjects[0].projectId);
            setSelectedBoard(activeId);
            localStorage.setItem("currentProject", activeId);
            window.dispatchEvent(new CustomEvent("projectSelected", { detail: activeId }));
          } else {
            setSelectedBoard("");
            localStorage.removeItem("currentProject");
            window.dispatchEvent(new CustomEvent("projectSelected", { detail: "" }));
          }
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchProjects();

    const handleUpdate = () => fetchProjects();
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    window.addEventListener("jiraConnectionUpdated", handleUpdate);
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    return () => {
      window.removeEventListener("jiraProjectsUpdated", handleUpdate);
      window.removeEventListener("jiraConnectionUpdated", handleUpdate);
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
    };
  }, [compName]);

  // --- GitHub Repositories Data ---
  const fetchRepos = () => {
    if (!compName) return;

    fetch(`${API_BASE_URL}/github/repos/${compName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.repos && Array.isArray(data.repos)) {
          setRepos(data.repos);
        } else {
          setRepos([]);
        }
      })
      .catch(() => setRepos([]));
  };

  useEffect(() => {
    fetchRepos();
    const handleReposUpdate = () => fetchRepos();
    window.addEventListener("githubReposUpdated", handleReposUpdate);
    window.addEventListener("githubConnectionUpdated", handleReposUpdate);
    return () => {
      window.removeEventListener("githubReposUpdated", handleReposUpdate);
      window.removeEventListener("githubConnectionUpdated", handleReposUpdate);
    };
  }, [compName]);


  // --- Sprint Data ---
  const fetchSprints = () => {
    if (!compName || !selectedBoard) return;

    fetch(`${API_BASE_URL}/jira/sprints/${compName}?board_id=${selectedBoard}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.sprints?.length > 0) {
          setSprints(data.sprints);
        } else {
          setSprints([]);
        }
      })
      .catch(() => setSprints([]));
  };

  useEffect(() => {
    fetchSprints();
    const handleUpdate = () => fetchSprints();
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    window.addEventListener("jiraSprintsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
      window.removeEventListener("jiraSprintsUpdated", handleUpdate);
    };
  }, [compName, selectedBoard]);

  // --- Releases Data ---
  const fetchReleases = () => {
    if (!compName || !selectedBoard) return;

    fetch(`${API_BASE_URL}/jira/releases/${compName}?project_id=${selectedBoard}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.releases?.length > 0) {
          setReleases(data.releases);
        } else {
          setReleases([]);
        }
      })
      .catch(() => setReleases([]));
  };

  useEffect(() => {
    fetchReleases();
    const handleUpdate = () => fetchReleases();
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    window.addEventListener("jiraReleasesUpdated", handleUpdate);
    return () => {
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
      window.removeEventListener("jiraReleasesUpdated", handleUpdate);
    };
  }, [compName, selectedBoard]);

  // Dynamic Sprint Filtering based on selectedFilterType
  const filteredSprints = sprints.filter((s) => {
    if (selectedFilterType === "Active") return s.state === "active";
    if (selectedFilterType === "Closed") return s.state === "closed";
    if (selectedFilterType === "Future") return s.state === "future";
    return true; // "Sprint", "Created", "Release"
  });

  useEffect(() => {
    if (selectedFilterType === "Release") {
      if (releases.length > 0) {
        const savedReleaseStr = localStorage.getItem("selectedRelease");
        let initialRelease = null;
        if (savedReleaseStr) {
          try {
            const parsed = JSON.parse(savedReleaseStr);
            initialRelease = releases.find((r) => String(r.releaseName || r.name) === String(parsed?.releaseName || parsed?.name || parsed));
          } catch {}
        }
        if (!initialRelease) {
          initialRelease = releases[0];
        }
        const relName = String(initialRelease.releaseName || initialRelease.name);
        setSelectedReleaseName(relName);
        const relObj = { ...initialRelease, id: relName, name: relName, isRelease: true, filterType: "Release" };
        localStorage.setItem("selectedRelease", JSON.stringify(relObj));
        localStorage.setItem("selectedFilterType", "Release");
        window.dispatchEvent(new CustomEvent("sprintSelected", { detail: relObj }));
        window.dispatchEvent(new CustomEvent("releaseSelected", { detail: relObj }));
        window.dispatchEvent(new CustomEvent("filterTypeChanged", { detail: "Release" }));
      } else {
        setSelectedReleaseName("");
        localStorage.setItem("selectedFilterType", "Release");
        window.dispatchEvent(new CustomEvent("filterTypeChanged", { detail: "Release" }));
      }
    } else {
      localStorage.setItem("selectedFilterType", selectedFilterType);
      window.dispatchEvent(new CustomEvent("filterTypeChanged", { detail: selectedFilterType }));
      if (filteredSprints.length > 0) {
        const savedSprint = localStorage.getItem("selectedSprint");
        let initialSprint = null;

        if (savedSprint) {
          try {
            const parsed = JSON.parse(savedSprint);
            initialSprint = filteredSprints.find(
              (s) => String(s.sprintId || s.id || s.name) === String(parsed?.sprintId || parsed?.id || parsed?.name)
            );
          } catch {}
        }

        if (!initialSprint) {
          initialSprint = filteredSprints.find((s) => s.state === "active") || filteredSprints[0];
        }

        const sprintIdStr = String(initialSprint.sprintId || initialSprint.id || initialSprint.name);
        setSelectedSprintId(sprintIdStr);
        setActiveSprint(initialSprint);
        localStorage.setItem("selectedSprint", JSON.stringify(initialSprint));
        window.dispatchEvent(new CustomEvent("sprintSelected", { detail: initialSprint }));
      } else {
        setSelectedSprintId("");
        setActiveSprint(null);
        localStorage.removeItem("selectedSprint");
        window.dispatchEvent(new CustomEvent("sprintSelected", { detail: null }));
      }
    }
  }, [selectedFilterType, sprints, releases]);

  const handleSprintSelect = (sprintId) => {
    setSelectedSprintId(sprintId);
    const found = sprints.find((s) => String(s.sprintId || s.id || s.name) === String(sprintId));
    setActiveSprint(found || null);
    if (found) {
      localStorage.setItem("selectedSprint", JSON.stringify(found));
    } else {
      localStorage.removeItem("selectedSprint");
    }
    window.dispatchEvent(new CustomEvent("sprintSelected", { detail: found || null }));
  };

  const handleReleaseSelect = (relName) => {
    setSelectedReleaseName(relName);
    const found = releases.find((r) => String(r.releaseName || r.name) === String(relName));
    const relObj = found ? { ...found, id: relName, name: relName, isRelease: true, filterType: "Release" } : { id: relName, name: relName, isRelease: true, filterType: "Release" };
    localStorage.setItem("selectedRelease", JSON.stringify(relObj));
    window.dispatchEvent(new CustomEvent("sprintSelected", { detail: relObj }));
    window.dispatchEvent(new CustomEvent("releaseSelected", { detail: relObj }));
  };


  // --- Board Sync Action ---
  const handleSync = async () => {
    if (!compName) return;

    setSyncing(true);
    const toastId = toast.loading("Syncing workspace data...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/jira/sync-all/${compName}`,
        { method: "POST" }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.synced === false) {
          toast.error(data.message || "Nothing to sync: Neither Jira nor GitHub is connected.", { id: toastId });
        } else {
          const syncedAt = new Date();
          setLastSynced(syncedAt);
          localStorage.setItem("lastSyncedBoards", syncedAt.toISOString());
          window.dispatchEvent(new CustomEvent("jiraProjectsUpdated"));
          window.dispatchEvent(new CustomEvent("jiraSyncCompleted"));
          window.dispatchEvent(new CustomEvent("jiraIssuesUpdated"));
          window.dispatchEvent(new CustomEvent("githubReposUpdated"));
          window.dispatchEvent(new CustomEvent("githubPrsUpdated"));
          toast.success("Workspace data synced successfully!", { id: toastId });
        }
      } else {
        toast.error("Failed to sync workspace data.", { id: toastId });
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Error syncing workspace data.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const formatDateStr = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      return new Date(dateVal).toLocaleDateString("en-GB");
    } catch {
      return String(dateVal);
    }
  };

  return (
    <header className="q-topbar">
      {/* Top Navbar */}
      <div className="q-topline">
        <div className="q-top-left"><button className="q-icon-button q-desktop-toggle" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!sidebarCollapsed} aria-controls="app-navigation">{sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button><button className="q-icon-button q-mobile-toggle" onClick={onToggleNav} aria-label="Open navigation" aria-expanded={navOpen} aria-controls="app-navigation"><Menu size={20} /></button>
          <div className="flex flex-col">
            <div className="q-top-name">
              {{ "standup": "Standup", "qmetry360": "Release readiness", "eng-metrics": "Engineering metrics", "tech-quality": "Tech quality", "release": "Release", "integration": "Integrations", "settings": "Settings", "capacity-planning": "Capacity planning", "roles-and-billing": "Roles & rate card" }[currentPage] || "QMetrix360"}
            </div>
            <span className="q-top-sub">
              Quality Quantified
            </span>
          </div>

          <div className="q-search">
            <Search size={18} className="text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search workspace…" aria-label="Search workspace"
              className="bg-transparent border-none outline-none text-sm text-ink placeholder-muted w-full"
            />
          </div>
        </div>

        <div className="q-top-actions">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="q-sync" title="Sync workspace data"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            <span className="whitespace-nowrap">
              {syncing ? "Syncing..." : formatLastSynced(lastSynced)}
            </span>
          </button>

          <button onClick={onToggleTheme} title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="q-icon-button q-theme-toggle">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button title="Notifications" className="q-icon-button">
            <Bell size={20} />

          </button>

          <button title="Apps" className="q-icon-button">
            <LayoutGrid size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="q-profile" aria-label="Account menu" aria-expanded={menuOpen}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-ink/20"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-inverse text-on-inverse flex items-center justify-center font-bold text-xs shadow-none">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className="q-profile-name">
                {user?.name || user?.email?.split("@")[0] || "User"}
              </span>
              <ChevronDown size={16} className="text-muted" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-control border border-line shadow-none overflow-hidden z-50 p-2 flex flex-col gap-1">
                <div className="px-3 py-2 border-b border-line mb-1">
                  <p className="text-sm font-bold text-ink truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("switchOrganization"));
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 text-left text-ink hover:bg-hover rounded-xl transition-colors text-xs font-bold cursor-pointer"
                >
                  <Building2 size={16} className="text-muted" />
                  <span>Switch / New Organization</span>
                </button>
                <button
                  onClick={() => logout?.({ logoutParams: { returnTo: window.location.origin } })}
                  className="w-full px-3 py-2 flex items-center gap-3 text-left text-danger hover:bg-red-950/30 rounded-xl transition-colors text-xs font-bold cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Sub-bar */}
      {(currentPage === "qmetry360" || currentPage === "standup") && (
        <div className="q-filterbar" aria-label="Workspace filters">
          <div className="q-filter-row">
            <div className="q-filter-primary">
              <div
                onClick={() => window.dispatchEvent(new CustomEvent("switchOrganization"))}
                className="q-workspace-chip cursor-pointer hover:border-ink/40 transition-colors"
                title="Click to switch or create organization"
              >
                <span className="truncate">{compName}</span>
                <ChevronDown size={14} className="text-muted shrink-0 ml-1" />
              </div>

              <select
                aria-label="Project" value={selectedBoard}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-52 md:w-60 bg-control text-ink border border-line hover:border-ink/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.projectId || p.projectKey} value={p.projectId || p.projectKey} className="bg-control">
                      {p.projectName} ({p.projectKey})
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-control">No Jira Projects</option>
                )}
              </select>

              <select
                aria-label="Repository" value={selectedRepo}
                onChange={(e) => {
                  setSelectedRepo(e.target.value);
                  localStorage.setItem("selectedRepo", e.target.value);
                  window.dispatchEvent(new CustomEvent("repoSelected", { detail: e.target.value }));
                }}
                className="w-40 md:w-48 bg-control text-ink border border-line hover:border-ink/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                <option value="All repositories">All repositories</option>
                {repos.map((r) => (
                  <option key={r.repoId || r.id || r.name} value={r.name} className="bg-control">
                    {r.name || r.fullName}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sprint status" value={selectedFilterType}
                onChange={(e) => setSelectedFilterType(e.target.value)}
                className="w-32 md:w-36 bg-control text-ink border border-line hover:border-ink/30 rounded-full px-3.5 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm"
              >
                <option value="Sprint">All Sprints</option>
                <option value="Active">Active Sprints</option>
                <option value="Closed">Closed Sprints</option>
                <option value="Future">Future Sprints</option>
                <option value="Created">Created</option>
                <option value="Release">Release</option>
              </select>

              {selectedFilterType === "Release" ? (
                <select
                  aria-label="Release" value={selectedReleaseName}
                  onChange={(e) => handleReleaseSelect(e.target.value)}
                  className="w-48 md:w-56 bg-control text-ink border border-line hover:border-ink/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
                >
                  {releases.length > 0 ? (
                    releases.map((r) => {
                      const rVal = String(r.releaseName || r.name);
                      return (
                        <option key={rVal} value={rVal} className="bg-control">
                          {rVal} {r.status ? `(${r.status})` : ""}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" className="bg-control">No Jira Releases</option>
                  )}
                </select>
              ) : (
                <select
                  aria-label="Sprint" value={selectedSprintId}
                  onChange={(e) => handleSprintSelect(e.target.value)}
                  className="w-48 md:w-56 bg-control text-ink border border-line hover:border-ink/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
                >
                  {filteredSprints.length > 0 ? (
                    filteredSprints.map((s) => {
                      const sVal = String(s.sprintId || s.id || s.name);
                      return (
                        <option key={sVal} value={sVal} className="bg-control">
                          {s.name} {s.state ? `(${s.state})` : ""}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" className="bg-control">No Matching Sprints</option>
                  )}
                </select>
              )}
            </div>

            <div className="q-filter-secondary">
              <button className="w-28 md:w-32 bg-control hover:bg-hover border border-line text-ink px-3.5 py-2 rounded-full text-xs md:text-sm font-bold cursor-pointer transition shadow-sm truncate">
                Multi Project
              </button>

              <select
                aria-label="Developer" value={selectedDev}
                onChange={(e) => setSelectedDev(e.target.value)}
                className="w-40 md:w-48 bg-control text-ink border border-line hover:border-ink/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                <option value="Select Developer">Select Developer</option>
                <option value={user?.name || "Developer"}>{user?.name || "Developer"}</option>
              </select>

              <button className="w-24 md:w-28 bg-control hover:bg-hover border border-line text-ink px-3.5 py-2 rounded-full text-xs md:text-sm font-bold flex items-center justify-between cursor-pointer transition shadow-sm">
                <span>Team</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="q-sprint-context">
            <span className="text-muted flex items-center gap-2">
              Sprint Status:
              <span className={`font-semibold uppercase px-2.5 py-0.5 rounded-full text-xs tracking-wider ${activeSprint?.state === "active"
                  ? "bg-success/15 text-success border border-success/30"
                  : activeSprint?.state === "closed"
                    ? "bg-control text-ink border border-line"
                    : "bg-accent/15 text-accent border border-accent/30"
                }`}>
                {activeSprint?.state || "N/A"}
              </span>
            </span>

            <span className="text-muted">
              Sprint Start & End Date:{" "}
              <span className="font-semibold text-ink ml-1">
                {activeSprint?.startDate && activeSprint?.endDate
                  ? `${formatDateStr(activeSprint.startDate)} - ${formatDateStr(activeSprint.endDate)}`
                  : "Not Created"}
              </span>
            </span>

            <span className="text-muted">
              Actual Sprint End Date:{" "}
              <span className="font-semibold text-ink ml-1">
                {activeSprint?.completeDate
                  ? formatDateStr(activeSprint.completeDate)
                  : activeSprint?.state === "active"
                    ? "In Progress"
                    : "Not Closed"}
              </span>
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

export default Topbar;


