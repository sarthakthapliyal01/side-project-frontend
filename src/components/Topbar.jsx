import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  ChevronDown,
  RefreshCw,
  Search,
  Sun,
  LayoutGrid,
  LogOut
} from "lucide-react";

function formatLastSynced(lastSyncedDate) {
  if (!lastSyncedDate) return "Never synced";
  return `Last synced: ${lastSyncedDate.toLocaleDateString()} ${lastSyncedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function Topbar({ user, companyName, logout, currentPage }) {
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

  const [selectedRepo, setSelectedRepo] = useState("All repositories");
  const [repos, setRepos] = useState([]);
  const [selectedFilterType, setSelectedFilterType] = useState("Sprint");
  const [selectedDev, setSelectedDev] = useState("Select Developer");

  const compName = companyName || localStorage.getItem("companyName") || "Organization";

  // --- Project Data ---
  const fetchProjects = () => {
    if (!compName) return;

    fetch(`http://127.0.0.1:8000/jira/selected-projects/${compName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const fetchedProjects = data.projects || data;
        if (Array.isArray(fetchedProjects)) {
          setProjects(fetchedProjects);
          if (fetchedProjects.length > 0) {
            setSelectedBoard((prev) => prev || String(fetchedProjects[0].projectId));
          } else {
            setSelectedBoard("");
          }
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchProjects();

    const handleUpdate = () => fetchProjects();
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    return () => window.removeEventListener("jiraProjectsUpdated", handleUpdate);
  }, [compName]);

  // --- GitHub Repositories Data ---
  const fetchRepos = () => {
    if (!compName) return;

    fetch(`http://127.0.0.1:8000/github/db-repos/${compName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.repos && Array.isArray(data.repos)) {
          setRepos(data.repos);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchRepos();
    const handleReposUpdate = () => fetchRepos();
    window.addEventListener("githubReposUpdated", handleReposUpdate);
    return () => window.removeEventListener("githubReposUpdated", handleReposUpdate);
  }, [compName]);


  // --- Sprint Data ---
  useEffect(() => {
    if (!compName || !selectedBoard) return;

    // First try DB sprints for immediate loading
    fetch(`http://127.0.0.1:8000/jira/db-sprints/${compName}?board_id=${selectedBoard}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.sprints?.length > 0) {
          setSprints(data.sprints);
        } else {
          // Fallback to Jira API endpoint
          fetch(`http://127.0.0.1:8000/jira/sprints/${compName}?project_id=${selectedBoard}`)
            .then((res) => res.ok && res.json())
            .then((apiData) => {
              if (apiData?.sprints?.length > 0) {
                setSprints(apiData.sprints);
              } else {
                setSprints([]);
              }
            })
            .catch(() => setSprints([]));
        }
      })
      .catch(() => setSprints([]));
  }, [compName, selectedBoard]);

  // Dynamic Sprint Filtering based on selectedFilterType
  const filteredSprints = sprints.filter((s) => {
    if (selectedFilterType === "Active") return s.state === "active";
    if (selectedFilterType === "Closed") return s.state === "closed";
    if (selectedFilterType === "Future") return s.state === "future";
    return true; // "Sprint", "Created", "Release"
  });

  useEffect(() => {
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
  }, [selectedFilterType, sprints]);

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


  // --- Board Sync Action ---
  const handleSync = async () => {
    if (!compName) return;

    setSyncing(true);
    const toastId = toast.loading("Syncing workspace data...");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/jira/sync-all/${compName}`,
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
          window.dispatchEvent(new CustomEvent("githubReposUpdated"));
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
    <header className="bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-[#1e1e24] flex flex-col shrink-0 font-sans select-none">
      {/* Top Navbar */}
      <div className="h-18 lg:h-22 px-6 md:px-10 flex items-center justify-between gap-8 border-b border-[#1e1e24]">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-none">
              {currentPage === "standup" ? "Standup" : "QMetry360"}
            </h1>
            <span className="text-xs font-semibold text-[#888888] tracking-wider leading-tight mt-1.5">
              Quality Quantified
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-[#141418] border border-[#24242c] focus-within:border-white/40 rounded-full px-5 py-2.5 w-64 md:w-80 text-sm text-[#a1a1a1] transition shadow-inner">
            <Search size={18} className="text-[#777777] shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder-[#666666] w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2.5 bg-white hover:bg-neutral-200 text-black rounded-full px-5 py-2.5 text-xs md:text-sm font-bold transition cursor-pointer active:scale-95 shadow-md"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin text-black" : "text-black"} />
            <span className="whitespace-nowrap">
              {syncing ? "Syncing..." : formatLastSynced(lastSynced)}
            </span>
          </button>

          <button title="Toggle Theme" className="text-[#a1a1a1] hover:text-white p-2.5 rounded-full hover:bg-[#18181d] transition cursor-pointer">
            <Sun size={20} />
          </button>

          <button title="Notifications" className="text-[#a1a1a1] hover:text-white p-2.5 rounded-full hover:bg-[#18181d] transition relative cursor-pointer">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
          </button>

          <button title="Apps" className="text-[#a1a1a1] hover:text-white p-2.5 rounded-full hover:bg-[#18181d] transition cursor-pointer">
            <LayoutGrid size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 bg-[#141418] border border-[#24242c] hover:border-white/30 rounded-full px-4 py-2 text-sm text-white font-bold transition cursor-pointer shadow-sm"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-inner">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className="max-w-[140px] truncate text-xs md:text-sm font-bold">
                {user?.name || user?.email?.split("@")[0] || "User"}
              </span>
              <ChevronDown size={16} className="text-[#888888]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-[#141418] border border-[#24242c] shadow-2xl overflow-hidden z-50 p-2">
                <div className="px-3 py-2 border-b border-[#24242c] mb-1">
                  <p className="text-sm font-bold text-white truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-[#a1a1a1] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => logout?.({ logoutParams: { returnTo: window.location.origin } })}
                  className="w-full px-3 py-2.5 flex items-center gap-3 text-left text-red-400 hover:bg-red-950/30 rounded-xl transition-colors text-xs font-bold cursor-pointer"
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
        <div className="px-6 md:px-10 py-4 bg-[#09090b]/80 flex flex-col gap-3.5 border-b border-[#1e1e24]">
          <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-36 md:w-40 flex items-center justify-between bg-[#141418] border border-[#24242c] rounded-full px-4 py-2 font-bold text-white shadow-sm text-xs md:text-sm truncate">
                <span className="truncate">{compName}</span>
                <ChevronDown size={14} className="text-[#888888] shrink-0 ml-1" />
              </div>

              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-52 md:w-60 bg-[#141418] text-white border border-[#24242c] hover:border-white/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.projectId} value={p.projectId} className="bg-[#141418]">
                      {p.projectName} ({p.projectKey})
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-[#141418]">No Jira Projects</option>
                )}
              </select>

              <select
                value={selectedRepo}
                onChange={(e) => {
                  setSelectedRepo(e.target.value);
                  localStorage.setItem("selectedRepo", e.target.value);
                  window.dispatchEvent(new CustomEvent("repoSelected", { detail: e.target.value }));
                }}
                className="w-40 md:w-48 bg-[#141418] text-white border border-[#24242c] hover:border-white/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                <option value="All repositories">All repositories</option>
                {repos.map((r) => (
                  <option key={r.repoId || r.id || r.name} value={r.name} className="bg-[#141418]">
                    {r.name || r.fullName}
                  </option>
                ))}
              </select>

              <select
                value={selectedFilterType}
                onChange={(e) => setSelectedFilterType(e.target.value)}
                className="w-32 md:w-36 bg-[#141418] text-white border border-[#24242c] hover:border-white/30 rounded-full px-3.5 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm"
              >
                <option value="Sprint">All Sprints</option>
                <option value="Active">Active Sprints</option>
                <option value="Closed">Closed Sprints</option>
                <option value="Future">Future Sprints</option>
                <option value="Created">Created</option>
                <option value="Release">Release</option>
              </select>

              <select
                value={selectedSprintId}
                onChange={(e) => handleSprintSelect(e.target.value)}
                className="w-48 md:w-56 bg-[#141418] text-white border border-[#24242c] hover:border-white/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                {filteredSprints.length > 0 ? (
                  filteredSprints.map((s) => {
                    const sVal = String(s.sprintId || s.id || s.name);
                    return (
                      <option key={sVal} value={sVal} className="bg-[#141418]">
                        {s.name} {s.state ? `(${s.state})` : ""}
                      </option>
                    );
                  })
                ) : (
                  <option value="" className="bg-[#141418]">No Matching Sprints</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <button className="w-28 md:w-32 bg-[#141418] hover:bg-[#1a1a20] border border-[#24242c] text-white px-3.5 py-2 rounded-full text-xs md:text-sm font-bold cursor-pointer transition shadow-sm truncate">
                Multi Project
              </button>

              <select
                value={selectedDev}
                onChange={(e) => setSelectedDev(e.target.value)}
                className="w-40 md:w-48 bg-[#141418] text-white border border-[#24242c] hover:border-white/30 rounded-full px-4 py-2 text-xs md:text-sm font-bold focus:outline-none cursor-pointer transition shadow-sm truncate"
              >
                <option value="Select Developer">Select Developer</option>
                <option value={user?.name || "Developer"}>{user?.name || "Developer"}</option>
              </select>

              <button className="w-24 md:w-28 bg-[#141418] hover:bg-[#1a1a20] border border-[#24242c] text-white px-3.5 py-2 rounded-full text-xs md:text-sm font-bold flex items-center justify-between cursor-pointer transition shadow-sm">
                <span>Team</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-xs md:text-sm font-bold pt-2.5 border-t border-[#1e1e24]">
            <span className="text-[#999999] flex items-center gap-2">
              Sprint Status:
              <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-xs tracking-wider ${activeSprint?.state === "active"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : activeSprint?.state === "closed"
                    ? "bg-neutral-800 text-neutral-300 border border-neutral-700"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}>
                {activeSprint?.state || "N/A"}
              </span>
            </span>

            <span className="text-[#999999]">
              Sprint Start & End Date:{" "}
              <span className="font-extrabold text-white ml-1">
                {activeSprint?.startDate && activeSprint?.endDate
                  ? `${formatDateStr(activeSprint.startDate)} - ${formatDateStr(activeSprint.endDate)}`
                  : "Not Created"}
              </span>
            </span>

            <span className="text-[#999999]">
              Actual Sprint End Date:{" "}
              <span className="font-extrabold text-white ml-1">
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


