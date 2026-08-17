import { useEffect, useState } from "react";
import { Filter, ChevronLeft, ChevronRight, Info } from "lucide-react";

function DashboardCard({ title, children, className = "", headerRight = null, infoText = null }) {
  return (
    <div className={`bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 border border-[#1e1e24] shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col h-full overflow-hidden ${className}`}>
      <h3 className="text-white text-base md:text-xl font-bold tracking-tight mb-4 flex items-center justify-between shrink-0 gap-2">
        <span className="pt-0.5 flex items-center gap-1.5 min-w-0">
          <span className="truncate">{title}</span>
          {infoText && (
            <span className="group relative cursor-pointer text-slate-400 hover:text-white transition-colors">
              <Info className="w-4 h-4 shrink-0" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-[#1c1c24] text-xs text-slate-200 px-3 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50">
                {infoText}
              </span>
            </span>
          )}
        </span>
        {headerRight ? (
          <div className="shrink-0 flex items-center">{headerRight}</div>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm shadow-white/50 shrink-0" />
        )}
      </h3>
      <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">{children}</div>
    </div>
  );
}

// ==============================================================================
// 1. JIRA STATUS CARD (ORIGINAL COMPONENT)
// ==============================================================================
const DEFAULT_STATUS_CONFIG = [
  { key: "QA - Inprogress", label: "QA - Inprogress", color: "#4ade80", defaultCount: 0 },
  { key: "Development", label: "Development", color: "#f43f5e", defaultCount: 0 },
  { key: "Closed", label: "Closed", color: "#f97316", defaultCount: 0 },
  { key: "In-Progress", label: "In-Progress", color: "#06b6d4", defaultCount: 0 },
  { key: "To Do", label: "To Do", color: "#3b82f6", defaultCount: 0 },
];

function JiraStatusCard({ currentSprint, currentProject }) {
  const [sortMode, setSortMode] = useState("default");
  const [activeSprintId, setActiveSprintId] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.sprintId || parsed?.id || "");
      } catch {}
    }
    return currentSprint || "";
  });

  const [statusCounts, setStatusCounts] = useState({
    "QA - Inprogress": 0,
    "Development": 0,
    "Closed": 0,
    "In-Progress": 0,
    "To Do": 0,
  });
  const [hoveredKey, setHoveredKey] = useState(null);

  useEffect(() => {
    const handleSprintSelected = (e) => {
      const sprint = e?.detail;
      if (sprint) {
        const sid = String(sprint.sprintId || sprint.id || sprint.name || "");
        setActiveSprintId(sid);
      } else {
        setActiveSprintId("");
      }
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    return () => window.removeEventListener("sprintSelected", handleSprintSelected);
  }, []);

  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setStatusCounts({
        "QA - Inprogress": 0,
        "Development": 0,
        "Closed": 0,
        "In-Progress": 0,
        "To Do": 0,
      });
      return;
    }

    const targetSprint = activeSprintId || currentSprint;
    const targetProject = currentProject || localStorage.getItem("currentProject");

    const params = new URLSearchParams();
    if (targetSprint) params.append("sprint_id", targetSprint);
    if (targetProject) params.append("project_id", targetProject);

    const queryString = params.toString();
    const url = queryString
      ? `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}?${queryString}`
      : `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.issues && Array.isArray(data.issues)) {
          const counts = {
            "QA - Inprogress": 0,
            "Development": 0,
            "Closed": 0,
            "In-Progress": 0,
            "To Do": 0,
          };

          data.issues.forEach((issue) => {
            let statusName = "";
            if (typeof issue.status === "string") statusName = issue.status;
            else if (issue.status?.name) statusName = issue.status.name;

            const s = statusName.toLowerCase().trim();
            if (s.includes("qa") || s.includes("testing") || s.includes("test")) {
              counts["QA - Inprogress"] += 1;
            } else if (s.includes("dev") || s.includes("development") || s.includes("code review") || s.includes("review")) {
              counts["Development"] += 1;
            } else if (s.includes("close") || s.includes("done") || s.includes("resolve") || s.includes("complete")) {
              counts["Closed"] += 1;
            } else if (s.includes("in-progress") || s.includes("in progress") || s.includes("inprogress") || s.includes("wip") || s.includes("doing")) {
              counts["In-Progress"] += 1;
            } else {
              counts["To Do"] += 1;
            }
          });

          setStatusCounts(counts);
        } else {
          setStatusCounts({
            "QA - Inprogress": 0,
            "Development": 0,
            "Closed": 0,
            "In-Progress": 0,
            "To Do": 0,
          });
        }
      })
      .catch(() => {
        setStatusCounts({
          "QA - Inprogress": 0,
          "Development": 0,
          "Closed": 0,
          "In-Progress": 0,
          "To Do": 0,
        });
      });
  }, [activeSprintId, currentSprint, currentProject]);

  let items = DEFAULT_STATUS_CONFIG.map((cfg) => ({
    ...cfg,
    count: statusCounts[cfg.key] ?? cfg.defaultCount,
  }));

  if (sortMode === "asc") {
    items = [...items].sort((a, b) => a.count - b.count);
  } else if (sortMode === "desc") {
    items = [...items].sort((a, b) => b.count - a.count);
  }

  const maxVal = Math.max(...items.map((i) => i.count), 8);
  const step = Math.max(2, Math.ceil(maxVal / 4));
  const ticks = [0, step, step * 2, step * 3, step * 4];
  const maxScale = ticks[ticks.length - 1] || maxVal || 8;

  const headerRight = (
    <div className="flex items-center gap-2 shrink-0 mr-6 md:mr-8">
      <button
        onClick={() => setSortMode("default")}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          sortMode === "default"
            ? "bg-white text-black shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Default
      </button>
      <button
        onClick={() => setSortMode("asc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${
          sortMode === "asc"
            ? "bg-white text-black px-3 font-semibold rounded-full shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
        }`}
      >
        ASC
      </button>
      <button
        onClick={() => setSortMode("desc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${
          sortMode === "desc"
            ? "bg-white text-black px-3 font-semibold rounded-full shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
        }`}
      >
        DSC
      </button>
    </div>
  );

  return (
    <DashboardCard title="Jira" infoText="Sprint issue breakdown by workflow status" headerRight={headerRight} className="col-span-12 md:col-span-4 min-h-[260px]">
      <div className="flex flex-col h-full justify-center py-2 md:py-3 pl-7 md:pl-9 pr-6 md:pr-8 gap-5 md:gap-6">
        <div className="flex flex-col gap-5 md:gap-6 my-auto">
          {items.map((item) => {
            const pct = item.count > 0 ? Math.min(100, Math.max(6, (item.count / maxScale) * 100)) : 0;
            const isHovered = hoveredKey === item.key;
            const showTooltip = isHovered;

            return (
              <div
                key={item.key}
                className="flex items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <span className="w-28 md:w-32 text-xs md:text-sm font-medium text-slate-300 shrink-0 text-left pr-3 truncate group-hover:text-white transition-colors">
                  {item.label}
                </span>

                <div className="flex-1 max-w-[65%] md:max-w-[68%] relative h-2 md:h-2.5 bg-[#18181c] border border-white/5 rounded-full flex items-center">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                      boxShadow: isHovered ? `0 0 12px ${item.color}aa` : "none",
                    }}
                  />

                  {showTooltip && (
                    <div
                      className="absolute z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                      style={{ left: `${Math.max(25, Math.min(85, pct))}%`, top: "-32px", transform: "translateX(-50%)" }}
                    >
                      <div className="bg-[#18181d] border border-white/20 text-white text-[11px] md:text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span>{item.label}: {item.count}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center text-slate-400 text-xs font-mono font-medium pt-1">
          <div className="w-28 md:w-32 shrink-0" />
          <div className="flex-1 max-w-[65%] md:max-w-[68%] relative h-5">
            {ticks.map((t, idx) => {
              const posPct = (idx / (ticks.length - 1)) * 100;
              let transformClass = "-translate-x-1/2";
              if (idx === 0) transformClass = "translate-x-0";
              else if (idx === ticks.length - 1) transformClass = "-translate-x-full";

              return (
                <span
                  key={t}
                  className={`absolute top-0.5 select-none text-[11px] md:text-xs text-slate-400 font-medium ${transformClass}`}
                  style={{ left: `${posPct}%` }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

// ==============================================================================
// 2. PULL REQUESTS SUMMARY CARD
// ==============================================================================
function PullRequestsSummaryCard({ summary }) {
  const total = summary.totalPRs || 0;
  const openCount = summary.openPRs || 0;
  const mergedCount = summary.mergedPRs || 0;
  const closedNoMergeCount = summary.closedNoMerge || 0;

  const openPct = total > 0 ? (openCount / total) * 100 : 0;
  const mergedPct = total > 0 ? (mergedCount / total) * 100 : 0;
  const closedPct = total > 0 ? (closedNoMergeCount / total) * 100 : 0;

  return (
    <DashboardCard
      title="Pull Requests Summary"
      infoText="Overview of repository pull request states and merge metrics"
      className="col-span-12 lg:col-span-4 min-h-[320px]"
    >
      <div className="flex flex-col h-full justify-between gap-4 py-1">
        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-slate-300">
          <span>Total PRs</span>
          <span className="text-[#3b82f6] text-xl font-extrabold">{total}</span>
        </div>

        <div className="w-full space-y-2">
          <div className="w-full h-3 bg-[#18181c] rounded-full overflow-hidden flex gap-0.5 border border-white/10 p-0.5">
            {openCount > 0 && (
              <div
                style={{ width: `${openPct}%` }}
                className="h-full bg-[#6366f1] rounded-l-full transition-all duration-500"
                title={`Open PRs: ${openCount}`}
              />
            )}
            {mergedCount > 0 && (
              <div
                style={{ width: `${mergedPct}%` }}
                className="h-full bg-[#f59e0b] transition-all duration-500"
                title={`Merged PRs: ${mergedCount}`}
              />
            )}
            {closedNoMergeCount > 0 && (
              <div
                style={{ width: `${closedPct}%` }}
                className="h-full bg-[#64748b] rounded-r-full transition-all duration-500"
                title={`Closed W/O Merge: ${closedNoMergeCount}`}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{openCount}</span>
              <span className="text-slate-400 font-semibold text-[11px]">Open PRs</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                <span>Reviewed <strong className="text-white">{summary.reviewed ?? 0}</strong></span>
                <span>Unreviewed <strong className="text-white">{summary.unreviewed ?? 0}</strong></span>
              </div>
            </div>

            <div className="flex flex-col items-center border-x border-white/10 px-1">
              <span className="text-xl font-bold text-white">{mergedCount}</span>
              <span className="text-slate-400 font-semibold text-[11px]">Merged PRs</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{closedNoMergeCount}</span>
              <span className="text-slate-400 font-semibold text-[11px]">Closed W/O Merge</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Average Time To Merge</span>
            <span className="text-white font-bold">{summary.avgTimeToMerge || "0h 0m"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">First-Time Pass Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold">{summary.firstTimePassRate || "0%"}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

// ==============================================================================
// 3. PRs TABLE CARD
// ==============================================================================
function PRsTableCard({ prs }) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPRs = prs.length;
  const totalPages = Math.ceil(totalPRs / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentPRs = prs.slice(startIndex, startIndex + pageSize);

  return (
    <DashboardCard
      title="PRs"
      infoText="Pull request list with author, status, and reviewer details"
      className="col-span-12 lg:col-span-8 min-h-[320px]"
    >
      <div className="flex flex-col h-full justify-between overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">PR ID</th>
                <th className="py-2.5 px-3">TITLE</th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>AUTHOR</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>MERGED</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>DAYS OPEN</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">REVIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {currentPRs.map((pr, index) => (
                <tr key={pr.prId || index} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#3b82f6] cursor-pointer hover:underline">
                    {pr.prId}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white max-w-[220px] truncate" title={pr.title}>
                    {pr.title}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                    {pr.author}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pr.status === "open" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-slate-300"
                    }`}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white">
                    {pr.merged}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-center">
                    {pr.daysOpen}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]" title={pr.reviewer}>
                    {pr.reviewer}
                  </td>
                </tr>
              ))}
              {currentPRs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No pull requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#18181c] text-white border border-white/10 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {totalPRs > 0 ? `${startIndex + 1} to ${Math.min(startIndex + pageSize, totalPRs)} of ${totalPRs}` : "0 of 0"}
            </span>

            <div className="flex items-center gap-2 font-medium text-slate-300">
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

// ==============================================================================
// MAIN STANDUP COMPONENT
// ==============================================================================
function Standup() {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState("");
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState("");
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(() => localStorage.getItem("selectedRepo") || "All repositories");
  
  const [prData, setPrData] = useState({
    summary: {
      totalPRs: 0,
      openPRs: 0,
      reviewed: 0,
      unreviewed: 0,
      mergedPRs: 0,
      closedNoMerge: 0,
      avgTimeToMerge: "0h 0m",
      firstTimePassRate: "0%"
    },
    prs: []
  });

  // Project Data
  const fetchProjects = () => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    fetch(`http://127.0.0.1:8000/jira/selected-projects/${companyName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const projects = data.projects || data;
        if (Array.isArray(projects)) {
          setSelectedProjects(projects);
          if (projects.length > 0) {
            const savedProject = localStorage.getItem("currentProject");
            if (savedProject && projects.some((p) => String(p.projectId) === savedProject)) {
              setCurrentProject(savedProject);
            } else {
              setCurrentProject(String(projects[0].projectId));
            }
          } else {
            setCurrentProject("");
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProjects();
    const handleUpdate = () => fetchProjects();
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    return () => window.removeEventListener("jiraProjectsUpdated", handleUpdate);
  }, []);

  // Sprint Data
  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    setLoadingSprints(true);
    setSprints([]);
    setCurrentSprint("");

    const url = currentProject
      ? `http://127.0.0.1:8000/jira/sprints/${companyName}?project_id=${currentProject}`
      : `http://127.0.0.1:8000/jira/sprints/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.sprints?.length > 0) {
          setSprints(data.sprints);
          setCurrentSprint(String(data.sprints[0].id || data.sprints[0].name));
        }
      })
      .catch((err) => console.error("Error fetching sprints:", err))
      .finally(() => setLoadingSprints(false));
  }, [currentProject]);

  // Repository Selection Event Listener
  useEffect(() => {
    const handleRepoSelected = (e) => {
      const repo = e?.detail || "All repositories";
      setSelectedRepo(repo);
    };

    window.addEventListener("repoSelected", handleRepoSelected);
    return () => window.removeEventListener("repoSelected", handleRepoSelected);
  }, []);

  // Fetch PR Data from MongoDB
  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    const url = selectedRepo && selectedRepo !== "All repositories"
      ? `http://127.0.0.1:8000/github/prs/${companyName}?repo_name=${encodeURIComponent(selectedRepo)}`
      : `http://127.0.0.1:8000/github/prs/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.summary && data?.prs) {
          setPrData(data);
        }
      })
      .catch((err) => console.error("Error fetching PR data:", err));
  }, [selectedRepo]);

  return (
    <div className="w-full h-full bg-transparent font-sans text-white px-6 md:px-8 py-4 md:py-6 box-border">
      <div className="grid grid-cols-12 gap-5 md:gap-6 pb-8">
        <DashboardCard title="Churn" className="col-span-12 md:col-span-5 min-h-[260px]" />
        <DashboardCard title="Capacity" className="col-span-12 md:col-span-3 min-h-[260px]" />
        <JiraStatusCard currentSprint={currentSprint} currentProject={currentProject} />
        <DashboardCard title="Burndown" className="col-span-12 md:col-span-6 min-h-[350px]" />
        <DashboardCard title="Burnup" className="col-span-12 md:col-span-6 min-h-[350px]" />
        <PullRequestsSummaryCard summary={prData.summary} />
        <PRsTableCard prs={prData.prs} />
      </div>
    </div>
  );
}

export default Standup;
