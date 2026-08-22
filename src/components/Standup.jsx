import { useEffect, useState, useCallback } from "react";
import { Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info, Plus, AlertTriangle, Clock, Flame, MinusCircle } from "lucide-react";

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
      } catch { }
    }
    return currentSprint || "";
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return currentProject || localStorage.getItem("currentProject") || "";
  });

  const [statusCounts, setStatusCounts] = useState({
    "QA - Inprogress": 0,
    "Development": 0,
    "Closed": 0,
    "In-Progress": 0,
    "To Do": 0,
  });
  const [hoveredKey, setHoveredKey] = useState(null);

  const fetchStatusCounts = useCallback(() => {
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

    let targetSprint = activeSprintId || currentSprint;
    if (!targetSprint) {
      const savedSprint = localStorage.getItem("selectedSprint");
      if (savedSprint) {
        try {
          const parsed = JSON.parse(savedSprint);
          targetSprint = String(parsed?.sprintId || parsed?.id || parsed?.name || "");
        } catch {
          targetSprint = savedSprint;
        }
      }
    }

    const targetProject = activeProjectId || currentProject || localStorage.getItem("currentProject") || "";

    const params = new URLSearchParams();
    if (targetSprint) params.append("sprint_id", targetSprint);
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}?${params.toString()}`;

    fetch(url, { cache: "no-store" })
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
  }, [activeSprintId, currentSprint, activeProjectId, currentProject]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

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

    const handleProjectSelected = (e) => {
      const pid = e?.detail || localStorage.getItem("currentProject") || "";
      setActiveProjectId(String(pid));
    };

    const handleJiraUpdated = () => {
      fetchStatusCounts();
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("projectSelected", handleProjectSelected);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);

    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("projectSelected", handleProjectSelected);
      window.removeEventListener("jiraProjectsUpdated", handleJiraUpdated);
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
    };
  }, [fetchStatusCounts]);

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
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${sortMode === "default"
          ? "bg-white text-black shadow-md shadow-white/10"
          : "text-slate-400 hover:text-white"
          }`}
      >
        Default
      </button>
      <button
        onClick={() => setSortMode("asc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${sortMode === "asc"
          ? "bg-white text-black px-3 font-semibold rounded-full shadow-md shadow-white/10"
          : "text-slate-400 hover:text-white"
          }`}
      >
        ASC
      </button>
      <button
        onClick={() => setSortMode("desc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${sortMode === "desc"
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pr.status === "open" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-slate-300"
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
// 4. BURNDOWN CARD COMPONENT (IDEAL & ACTUAL SP/HRS BURNDOWN)
// ==============================================================================
function BurndownCard({ currentSprint, currentProject }) {
  const [unitMode, setUnitMode] = useState("SP"); // "SP" or "Hrs"
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeSprintId, setActiveSprintId] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.sprintId || parsed?.id || "");
      } catch { }
    }
    return currentSprint || "";
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return currentProject || localStorage.getItem("currentProject") || "";
  });

  const [burndownData, setBurndownData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBurndown = useCallback(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setLoading(false);
      return;
    }

    let targetSprint = activeSprintId || currentSprint;
    if (!targetSprint) {
      const savedSprint = localStorage.getItem("selectedSprint");
      if (savedSprint) {
        try {
          const parsed = JSON.parse(savedSprint);
          targetSprint = String(parsed?.sprintId || parsed?.id || parsed?.name || "");
        } catch {
          targetSprint = savedSprint;
        }
      }
    }

    const targetProject = activeProjectId || currentProject || localStorage.getItem("currentProject") || "";

    const params = new URLSearchParams();
    if (targetSprint) params.append("sprint_id", targetSprint);
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `http://127.0.0.1:8000/jira/burndown/${companyName}?${params.toString()}`;

    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data && data.dates && data.sp) {
          setBurndownData(data);
        } else {
          setBurndownData(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching burndown data:", err);
        setBurndownData(null);
      })
      .finally(() => setLoading(false));
  }, [activeSprintId, currentSprint, activeProjectId, currentProject]);

  useEffect(() => {
    fetchBurndown();
  }, [fetchBurndown]);

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

    const handleProjectSelected = (e) => {
      const pid = e?.detail || localStorage.getItem("currentProject") || "";
      setActiveProjectId(String(pid));
    };

    const handleJiraUpdated = () => {
      fetchBurndown();
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("projectSelected", handleProjectSelected);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);

    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("projectSelected", handleProjectSelected);
      window.removeEventListener("jiraProjectsUpdated", handleJiraUpdated);
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
    };
  }, [fetchBurndown]);

  const dates = burndownData?.dates || [];
  const currentMetrics = unitMode === "SP" ? burndownData?.sp : burndownData?.hrs;
  const hasData = Boolean(burndownData && currentMetrics && dates.length > 0);

  const totalPoints = currentMetrics?.total || 0;
  const idealLine = currentMetrics?.ideal || [];
  const actualLine = currentMetrics?.actual || [];

  // Y-axis ticks calculation
  const maxVal = Math.max(totalPoints, ...idealLine, ...actualLine.filter((v) => v !== null && v !== undefined), 10);
  const step = Math.ceil(maxVal / 4);
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const scaleMax = yTicks[yTicks.length - 1] || maxVal || 60;

  // Header Control: Toggle between SP and Hrs
  const headerRight = (
    <div className="flex items-center gap-1 bg-[#18181d] p-1 rounded-full border border-white/10 shrink-0">
      <button
        onClick={() => setUnitMode("SP")}
        className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 ${unitMode === "SP"
          ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
          : "text-slate-400 hover:text-white"
          }`}
      >
        SP
      </button>
      <button
        onClick={() => setUnitMode("Hrs")}
        className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 ${unitMode === "Hrs"
          ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
          : "text-slate-400 hover:text-white"
          }`}
      >
        Hrs
      </button>
    </div>
  );

  if (loading) {
    return (
      <DashboardCard
        title="Burndown"
        infoText="Daily sprint story points and hours burndown tracking progress"
        headerRight={headerRight}
        className="col-span-12 md:col-span-6 min-h-[380px]"
      >
        <div className="flex flex-col items-center justify-center h-[320px] text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Burndown Data...</span>
        </div>
      </DashboardCard>
    );
  }

  if (!hasData) {
    return (
      <DashboardCard
        title="Burndown"
        infoText="Daily sprint story points and hours burndown tracking progress"
        headerRight={headerRight}
        className="col-span-12 md:col-span-6 min-h-[380px]"
      >
        <div className="flex flex-col items-center justify-center h-[320px] text-slate-500 gap-2">
          <span className="text-sm font-medium">No burndown data available</span>
        </div>
      </DashboardCard>
    );
  }

  // SVG dimensions & padding
  const svgWidth = 500;
  const svgHeight = 180;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getX = (idx) => {
    const steps = Math.max(1, dates.length);
    return padLeft + ((idx + 1) / steps) * chartW;
  };

  const getY = (val) => {
    if (val === null || val === undefined) return null;
    const pct = Math.min(1, Math.max(0, val / scaleMax));
    return padTop + chartH - pct * chartH;
  };

  // SVG Paths
  let idealPoints = [];
  if (idealLine.length > 0) {
    idealPoints.push({ x: getX(-1), y: getY(totalPoints) });
    idealLine.forEach((val, idx) => {
      idealPoints.push({ x: getX(idx), y: getY(val) });
    });
  }
  const idealPathStr = idealPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const actualValidPoints = actualLine
    .map((val, idx) => ({ val, x: getX(idx), y: getY(val), idx }))
    .filter((p) => p.y !== null);

  // Prepend (x-1, totalPoints) so actual line always draws a continuous line starting from Day 0 (Y-axis)
  let actualPoints = [];
  if (actualValidPoints.length > 0) {
    const startY = getY(totalPoints);
    actualPoints.push({ x: getX(-1), y: startY });

    actualValidPoints.forEach((pt) => {
      if (!(pt.idx === -1 && Math.abs(pt.y - startY) < 0.1)) {
        actualPoints.push(pt);
      }
    });
  }

  const actualPathStr = actualPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const isWeekendDay = (dateStr, idx) => {
    if (burndownData?.isWeekend && burndownData.isWeekend[idx] !== undefined) {
      return burndownData.isWeekend[idx];
    }
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.split("/");
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = new Date().getFullYear();
      const d = new Date(year, month, day);
      return d.getDay() === 0 || d.getDay() === 6;
    }
    return false;
  };

  return (
    <DashboardCard
      title="Burndown"
      infoText="Daily sprint story points and hours burndown tracking progress"
      headerRight={headerRight}
      className="col-span-12 md:col-span-6 min-h-[380px]"
    >
      <div className="flex flex-col h-full justify-between pt-1 pb-2 px-1">
        {/* 1. TOP 5 STAT CARDS */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          <div className="bg-[#141419] border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-inner">
            <span className="text-[10px] md:text-[11px] font-medium text-slate-400 truncate">Today's</span>
            <div className="flex items-center justify-center gap-1 text-sm md:text-base font-bold text-[#3b82f6]">
              <span>{currentMetrics.todaysBurned ?? 0}</span>
              {currentMetrics.todaysBurned > 0 && <span className="text-xs text-emerald-400 font-extrabold">↗</span>}
            </div>
          </div>

          <div className="bg-[#141419] border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-inner">
            <span className="text-[10px] md:text-[11px] font-medium text-slate-400 truncate">Yesterday's</span>
            <span className="text-sm md:text-base font-bold text-[#3b82f6]">
              {currentMetrics.yesterdaysBurned ?? 0}
            </span>
          </div>

          <div className="bg-[#141419] border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-inner">
            <span className="text-[10px] md:text-[11px] font-medium text-slate-400 truncate">Target</span>
            <span className="text-sm md:text-base font-bold text-[#3b82f6]">
              {currentMetrics.target ?? 0}
            </span>
          </div>

          <div className="bg-[#141419] border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-inner">
            <span className="text-[10px] md:text-[11px] font-medium text-slate-400 truncate">Comple. TT</span>
            <span className="text-sm md:text-base font-bold text-[#3b82f6]">
              {currentMetrics.compleTT ?? 0}
            </span>
          </div>

          <div className="bg-[#141419] border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-inner">
            <span className="text-[10px] md:text-[11px] font-medium text-slate-400 truncate">5 Spts. Avg</span>
            <span className="text-sm md:text-base font-bold text-[#3b82f6]">
              {currentMetrics.fiveSptsAvg ?? 0}
            </span>
          </div>
        </div>

        {/* 2. CHART AREA */}
        <div className="relative flex-1 w-full min-h-[200px] flex items-center justify-center select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Weekend Shaded Columns (Saturday & Sunday) */}
            {dates.map((dateStr, idx) => {
              if (!isWeekendDay(dateStr, idx)) return null;
              const xPos = getX(idx);
              const colW = chartW / Math.max(1, dates.length);
              const colLeft = Math.max(padLeft, xPos - colW / 2);
              const colRight = Math.min(svgWidth - padRight, xPos + colW / 2);
              const rectWidth = colRight - colLeft;

              return (
                <g key={`weekend-${idx}`}>
                  <rect
                    x={colLeft}
                    y={padTop}
                    width={rectWidth}
                    height={chartH}
                    fill="rgba(255, 255, 255, 0.05)"
                    rx="2"
                  />
                  <line
                    x1={colLeft}
                    y1={padTop}
                    x2={colLeft}
                    y2={padTop + chartH}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={colRight}
                    y1={padTop}
                    x2={colRight}
                    y2={padTop + chartH}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeDasharray="2 2"
                  />
                </g>
              );
            })}
            {/* Horizontal Grid Lines & Y-Ticks */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={yPos + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Vertical Guide Lines & X-Labels */}
            {dates.map((dateStr, idx) => {
              const xPos = getX(idx);
              const isHovered = hoverIndex === idx;
              return (
                <g key={dateStr}>
                  <line
                    x1={xPos}
                    y1={padTop}
                    x2={xPos}
                    y2={padTop + chartH}
                    stroke={isHovered ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.04)"}
                    strokeDasharray="2 2"
                    strokeWidth={isHovered ? "1.5" : "1"}
                  />
                  <text
                    x={xPos}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fill={isHovered ? "#ffffff" : "#94a3b8"}
                    fontSize="10"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {dateStr}
                  </text>
                </g>
              );
            })}

            {/* IDEAL BURNDOWN LINE (Dashed Amber/Orange) */}
            {idealPathStr && (
              <path
                d={idealPathStr}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            )}

            {/* ACTUAL BURNDOWN LINE (Solid Cyan/Teal with points) */}
            {actualPathStr && (
              <path
                d={actualPathStr}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Actual Data Points */}
            {actualValidPoints.map((pt) => {
              const isHovered = hoverIndex === pt.idx;
              return (
                <g key={pt.idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "5" : "3.5"}
                    fill="#06b6d4"
                    stroke="#0c0c0e"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer"
                  />
                  {isHovered && (
                    <circle cx={pt.x} cy={pt.y} r="8" fill="#06b6d4" fillOpacity="0.3" />
                  )}
                </g>
              );
            })}

            {/* Invisible Hover Rectangles per date column */}
            {dates.map((_, idx) => {
              const xPos = getX(idx);
              const colW = chartW / Math.max(1, dates.length - 1);
              return (
                <rect
                  key={idx}
                  x={xPos - colW / 2}
                  y={0}
                  width={colW}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoverIndex !== null && dates[hoverIndex] && (
            <div
              className="absolute z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{
                left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
                top: "10px",
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-[#18181d] border border-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl shadow-2xl space-y-1 backdrop-blur-md">
                <div className="text-[11px] font-bold text-slate-300 border-b border-white/10 pb-1 flex items-center justify-between gap-3">
                  <span>Date: {dates[hoverIndex]}</span>
                  <span className="text-[10px] text-blue-400 font-semibold">{unitMode}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-0.5 bg-amber-400 rounded-sm" /> Ideal:
                  </span>
                  <span className="font-bold text-white">
                    {idealLine[hoverIndex] !== undefined ? idealLine[hoverIndex] : "N/A"}
                  </span>
                </div>
                {actualLine[hoverIndex] !== null && actualLine[hoverIndex] !== undefined && (
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" /> Actual:
                    </span>
                    <span className="font-bold text-white">{actualLine[hoverIndex]}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. BOTTOM LEGEND (Ideal and Actual only) */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/5 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#f59e0b] rounded-full" />
            <span className="text-slate-300">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-sm shadow-cyan-500/50" />
            <span className="text-slate-300">Actual</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}



// ==============================================================================
// 4b. BURNUP CARD COMPONENT (IDEAL & ACTUAL WORK COMPLETED BURNUP)
// ==============================================================================
function BurnupCard({ currentSprint, currentProject }) {
  const [unitMode, setUnitMode] = useState("SP"); // "SP" or "Hrs"
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeSprintId, setActiveSprintId] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.sprintId || parsed?.id || "");
      } catch { }
    }
    return currentSprint || "";
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return currentProject || localStorage.getItem("currentProject") || "";
  });

  const [burndownData, setBurndownData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBurndown = useCallback(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setLoading(false);
      return;
    }

    let targetSprint = activeSprintId || currentSprint;
    if (!targetSprint) {
      const savedSprint = localStorage.getItem("selectedSprint");
      if (savedSprint) {
        try {
          const parsed = JSON.parse(savedSprint);
          targetSprint = String(parsed?.sprintId || parsed?.id || parsed?.name || "");
        } catch {
          targetSprint = savedSprint;
        }
      }
    }

    const targetProject = activeProjectId || currentProject || localStorage.getItem("currentProject") || "";

    const params = new URLSearchParams();
    if (targetSprint) params.append("sprint_id", targetSprint);
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `http://127.0.0.1:8000/jira/burnup/${companyName}?${params.toString()}`;

    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data && data.dates && data.sp) {
          setBurndownData(data);
        } else {
          setBurndownData(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching burnup data:", err);
        setBurndownData(null);
      })
      .finally(() => setLoading(false));
  }, [activeSprintId, currentSprint, activeProjectId, currentProject]);

  useEffect(() => {
    fetchBurndown();
  }, [fetchBurndown]);

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

    const handleProjectSelected = (e) => {
      const pid = e?.detail || localStorage.getItem("currentProject") || "";
      setActiveProjectId(String(pid));
    };

    const handleJiraUpdated = () => {
      fetchBurndown();
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("projectSelected", handleProjectSelected);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);
    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("projectSelected", handleProjectSelected);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
    };
  }, [fetchBurndown]);

  const dates = burndownData?.dates || [];
  const rawMetrics = unitMode === "SP" ? burndownData?.sp : burndownData?.hrs;
  const hasData = Boolean(burndownData && rawMetrics && dates.length > 0);

  const totalPoints = rawMetrics?.total || 0;
  const burnupIdealLine = rawMetrics?.ideal || [];
  const burnupActualLine = rawMetrics?.actual || [];

  const maxVal = Math.max(totalPoints, ...burnupIdealLine.filter((v) => v !== null), ...burnupActualLine.filter((v) => v !== null), 10);
  const step = Math.ceil(maxVal / 4);
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const scaleMax = yTicks[yTicks.length - 1] || maxVal || 60;

  const headerRight = (
    <div className="flex items-center gap-1 bg-[#18181d] p-1 rounded-full border border-white/10 shrink-0">
      <button
        onClick={() => setUnitMode("SP")}
        className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 ${unitMode === "SP"
          ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
          : "text-slate-400 hover:text-white"
          }`}
      >
        SP
      </button>
      <button
        onClick={() => setUnitMode("Hrs")}
        className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 ${unitMode === "Hrs"
          ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
          : "text-slate-400 hover:text-white"
          }`}
      >
        Hrs
      </button>
    </div>
  );

  if (loading) {
    return (
      <DashboardCard
        title="Burnup"
        infoText="Daily sprint story points and hours burnup tracking progress"
        headerRight={headerRight}
        className="col-span-12 md:col-span-6 min-h-[380px]"
      >
        <div className="flex flex-col items-center justify-center h-[320px] text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Burnup Data...</span>
        </div>
      </DashboardCard>
    );
  }

  if (!hasData) {
    return (
      <DashboardCard
        title="Burnup"
        infoText="Daily sprint story points and hours burnup tracking progress"
        headerRight={headerRight}
        className="col-span-12 md:col-span-6 min-h-[380px]"
      >
        <div className="flex flex-col items-center justify-center h-[320px] text-slate-500 gap-2">
          <span className="text-sm font-medium">No burnup data available</span>
        </div>
      </DashboardCard>
    );
  }

  const svgWidth = 500;
  const svgHeight = 180;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getX = (idx) => {
    const steps = Math.max(1, dates.length);
    return padLeft + ((idx + 1) / steps) * chartW;
  };

  const getY = (val) => {
    if (val === null || val === undefined) return null;
    const pct = Math.min(1, Math.max(0, val / scaleMax));
    return padTop + chartH - pct * chartH;
  };

  // SVG Paths
  let idealPoints = [];
  if (burnupIdealLine.length > 0) {
    idealPoints.push({ x: getX(-1), y: getY(0) });
    burnupIdealLine.forEach((val, idx) => {
      idealPoints.push({ x: getX(idx), y: getY(val) });
    });
  }
  const idealPathStr = idealPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const actualValidPoints = burnupActualLine
    .map((val, idx) => ({ val, x: getX(idx), y: getY(val), idx }))
    .filter((p) => p.y !== null);

  let actualPoints = [];
  if (actualValidPoints.length > 0) {
    const startY = getY(0);
    actualPoints.push({ x: getX(-1), y: startY });

    actualValidPoints.forEach((pt) => {
      if (!(pt.idx === -1 && Math.abs(pt.y - startY) < 0.1)) {
        actualPoints.push(pt);
      }
    });
  }
  const actualPathStr = actualPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const isWeekendDay = (dateStr, idx) => {
    if (burndownData?.isWeekend && burndownData.isWeekend[idx] !== undefined) {
      return burndownData.isWeekend[idx];
    }
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.split("/");
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = new Date().getFullYear();
      const d = new Date(year, month, day);
      return d.getDay() === 0 || d.getDay() === 6;
    }
    return false;
  };

  return (
    <DashboardCard
      title="Burnup"
      infoText="Daily sprint story points and hours burnup tracking progress"
      headerRight={headerRight}
      className="col-span-12 md:col-span-6 min-h-[380px]"
    >
      <div className="flex flex-col h-full justify-between pt-1 pb-2 px-1">
        {/* CHART AREA */}
        <div className="relative flex-1 w-full min-h-[200px] flex items-center justify-center select-none mt-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Weekend Shaded Columns */}
            {dates.map((dateStr, idx) => {
              if (!isWeekendDay(dateStr, idx)) return null;
              const xPos = getX(idx);
              const colW = chartW / Math.max(1, dates.length);
              const colLeft = Math.max(padLeft, xPos - colW / 2);
              const colRight = Math.min(svgWidth - padRight, xPos + colW / 2);
              const rectWidth = colRight - colLeft;

              return (
                <g key={`weekend-${idx}`}>
                  <rect
                    x={colLeft}
                    y={padTop}
                    width={rectWidth}
                    height={chartH}
                    fill="rgba(255, 255, 255, 0.05)"
                    rx="2"
                  />
                  <line
                    x1={colLeft}
                    y1={padTop}
                    x2={colLeft}
                    y2={padTop + chartH}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={colRight}
                    y1={padTop}
                    x2={colRight}
                    y2={padTop + chartH}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeDasharray="2 2"
                  />
                </g>
              );
            })}
            {/* Horizontal Grid Lines & Y-Ticks */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={yPos + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Vertical Guide Lines & X-Labels */}
            {dates.map((dateStr, idx) => {
              const xPos = getX(idx);
              const isHovered = hoverIndex === idx;
              return (
                <g key={dateStr}>
                  <line
                    x1={xPos}
                    y1={padTop}
                    x2={xPos}
                    y2={padTop + chartH}
                    stroke={isHovered ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.04)"}
                    strokeDasharray="2 2"
                    strokeWidth={isHovered ? "1.5" : "1"}
                  />
                  <text
                    x={xPos}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fill={isHovered ? "#ffffff" : "#94a3b8"}
                    fontSize="10"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {dateStr}
                  </text>
                </g>
              );
            })}

            {/* IDEAL BURNUP LINE (Amber/Orange Solid) */}
            {idealPathStr && (
              <path
                d={idealPathStr}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* ACTUAL BURNUP LINE (Cyan/Teal Solid with points) */}
            {actualPathStr && (
              <path
                d={actualPathStr}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Actual Data Points */}
            {actualValidPoints.map((pt) => {
              const isHovered = hoverIndex === pt.idx;
              return (
                <g key={pt.idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "5" : "3.5"}
                    fill="#06b6d4"
                    stroke="#0c0c0e"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer"
                  />
                  {isHovered && (
                    <circle cx={pt.x} cy={pt.y} r="8" fill="#06b6d4" fillOpacity="0.3" />
                  )}
                </g>
              );
            })}

            {/* Invisible Hover Rectangles per date column */}
            {dates.map((_, idx) => {
              const xPos = getX(idx);
              const colW = chartW / Math.max(1, dates.length);
              return (
                <rect
                  key={idx}
                  x={xPos - colW / 2}
                  y={0}
                  width={colW}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoverIndex !== null && dates[hoverIndex] && (
            <div
              className="absolute z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{
                left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
                top: "10px",
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-[#18181d] border border-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl shadow-2xl space-y-1 backdrop-blur-md">
                <div className="text-[11px] font-bold text-slate-300 border-b border-white/10 pb-1 flex items-center justify-between gap-3">
                  <span>Date: {dates[hoverIndex]}</span>
                  <span className="text-[10px] text-blue-400 font-semibold">{unitMode}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-0.5 bg-amber-400 rounded-sm" /> Ideal:
                  </span>
                  <span className="font-bold text-white">
                    {burnupIdealLine[hoverIndex] !== undefined ? burnupIdealLine[hoverIndex] : "N/A"}
                  </span>
                </div>
                {burnupActualLine[hoverIndex] !== null && burnupActualLine[hoverIndex] !== undefined && (
                  <div className="flex items-center justify-between gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" /> Actual:
                    </span>
                    <span className="font-bold text-white">{burnupActualLine[hoverIndex]}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM LEGEND */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/5 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#f59e0b] rounded-full" />
            <span className="text-slate-300">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-sm shadow-cyan-500/50" />
            <span className="text-slate-300">Actual</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}


// ==============================================================================
// 5. SPRINT ISSUES TABLE CARD (MATCHING IMAGE 2 WITH DYNAMIC MONGODB DATA)
// ==============================================================================
function SprintIssuesCard({ currentSprint, currentProject, prs = [] }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [activeSprintId, setActiveSprintId] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.sprintId || parsed?.id || "");
      } catch { }
    }
    return currentSprint || "";
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return currentProject || localStorage.getItem("currentProject") || "";
  });

  // Column / Status filter state
  const [statusFilter, setStatusFilter] = useState("ALL");

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

    const handleProjectSelected = (e) => {
      const pid = e?.detail || localStorage.getItem("currentProject") || "";
      setActiveProjectId(String(pid));
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("projectSelected", handleProjectSelected);
    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("projectSelected", handleProjectSelected);
    };
  }, []);

  const loadIssues = () => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setIssues([]);
      return;
    }

    setLoading(true);
    const targetSprint = activeSprintId || currentSprint;
    const targetProject = activeProjectId || currentProject || localStorage.getItem("currentProject");

    const params = new URLSearchParams();
    if (targetSprint) params.append("sprint_id", targetSprint);
    if (targetProject) params.append("project_id", targetProject);

    const queryString = params.toString();
    const primaryUrl = queryString
      ? `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}?${queryString}`
      : `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}`;

    fetch(primaryUrl)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.issues && Array.isArray(data.issues)) {
          setIssues(data.issues);
        } else {
          setIssues([]);
        }
      })
      .catch(() => {
        setIssues([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIssues();
    window.addEventListener("jiraProjectsUpdated", loadIssues);
    return () => window.removeEventListener("jiraProjectsUpdated", loadIssues);
  }, [activeSprintId, currentSprint, activeProjectId, currentProject]);

  // Helper function to map issue status to unified category
  const getIssueCategory = (iss) => {
    let s = "";
    if (typeof iss === "string") s = iss;
    else if (typeof iss?.status === "string") s = iss.status;
    else if (iss?.status?.name) s = iss.status.name;
    s = (s || "").toLowerCase().trim();

    if (s.includes("qa ready") || s.includes("ready for qa")) {
      return "QA Ready";
    } else if (s.includes("closed") || s.includes("done") || s.includes("resolved") || s.includes("completed")) {
      return "Closed";
    } else if (s.includes("dev") || s.includes("development") || s.includes("code review") || s.includes("review")) {
      return "Development";
    } else if (s.includes("qa") || s.includes("testing") || s.includes("test")) {
      return "QA - Inprogress";
    } else if (s.includes("in-progress") || s.includes("in progress") || s.includes("inprogress") || s.includes("wip")) {
      return "In-Progress";
    }
    return "To Do";
  };

  // Dynamic calculation of status counts from MongoDB issues
  const statusCounts = {
    Closed: 0,
    Development: 0,
    "To Do": 0,
    "QA - Inprogress": 0,
    "In-Progress": 0,
    "QA Ready": 0,
  };

  issues.forEach((iss) => {
    const cat = getIssueCategory(iss);
    if (statusCounts[cat] !== undefined) {
      statusCounts[cat] += 1;
    }
  });

  // Filter matcher for status pills
  const matchStatusFilter = (iss, filterKey) => {
    if (filterKey === "ALL") return true;
    const cat = getIssueCategory(iss);
    return cat === filterKey;
  };

  const filteredIssues = issues.filter((iss) => matchStatusFilter(iss, statusFilter));

  const totalRecords = filteredIssues.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentIssues = filteredIssues.slice(startIndex, startIndex + pageSize);

  const formatDueDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toISOString().split("T")[0];
    } catch {
      return String(dateVal);
    }
  };

  const findPrId = (issKey) => {
    if (!issKey || !prs.length) return "NA";
    const keyLower = String(issKey).toLowerCase();
    const matched = prs.find((p) => (p.title || "").toLowerCase().includes(keyLower) || (p.prId || "").toLowerCase().includes(keyLower));
    return matched ? matched.prId : "NA";
  };

  const handlePillToggle = (key) => {
    if (statusFilter === key && key !== "ALL") {
      setStatusFilter("ALL");
    } else {
      setStatusFilter(key);
    }
    setCurrentPage(1);
  };

  const STATUS_PILLS = [
    { key: "ALL", label: `All (${issues.length})`, count: issues.length, dotBg: "bg-slate-400", border: "border-slate-700", text: "text-slate-200" },
    { key: "Closed", label: "Closed", count: statusCounts.Closed, dotBg: "bg-emerald-500", border: "border-[#1b3d2b]", text: "text-emerald-400" },
    { key: "Development", label: "Development", count: statusCounts.Development, dotBg: "bg-fuchsia-500", border: "border-[#3b1f4c]", text: "text-fuchsia-400" },
    { key: "To Do", label: "To Do", count: statusCounts["To Do"], dotBg: "bg-orange-500", border: "border-[#4d321d]", text: "text-orange-400" },
    { key: "QA - Inprogress", label: "QA - Inprogress", count: statusCounts["QA - Inprogress"], dotBg: "bg-cyan-400", border: "border-[#1b434d]", text: "text-cyan-400" },
    { key: "In-Progress", label: "In-Progress", count: statusCounts["In-Progress"], dotBg: "bg-blue-500", border: "border-[#1d3052]", text: "text-blue-400" },
    { key: "QA Ready", label: "QA Ready", count: statusCounts["QA Ready"], dotBg: "bg-amber-400", border: "border-[#47401b]", text: "text-amber-400" },
  ];

  const renderStatusBadge = (iss) => {
    const cat = getIssueCategory(iss);
    if (cat === "QA Ready") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">QA Ready</span>;
    } else if (cat === "Closed") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">Closed</span>;
    } else if (cat === "Development") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 whitespace-nowrap">Development</span>;
    } else if (cat === "QA - Inprogress") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">QA - Inprogress</span>;
    } else if (cat === "In-Progress") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">In-Progress</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 whitespace-nowrap">To Do</span>;
  };

  const renderTypeBadge = (typeName) => {
    const t = String(typeName || "").toLowerCase();
    if (t.includes("bug")) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Bug</span>;
    } else if (t.includes("story")) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Story</span>;
    }
    return <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">Task</span>;
  };

  return (
    <div className="bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-[#1e1e24] shadow-2xl col-span-12 w-full font-sans overflow-hidden">
      {/* Top Status Pills Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {STATUS_PILLS.map((pill) => {
            const isActive = statusFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => handlePillToggle(pill.key)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer select-none active:scale-95 ${isActive
                  ? "bg-white text-black border-white shadow-md font-bold scale-105"
                  : `${pill.border} bg-[#121216] text-slate-300 hover:border-white/40 hover:bg-[#181820]`
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${pill.dotBg} shadow-sm`} />
                <span>
                  {pill.key === "ALL" ? (
                    <span className="font-bold">All ({issues.length})</span>
                  ) : (
                    <>
                      <span className={isActive ? "text-black font-bold" : "text-white font-bold"}>
                        {pill.count}
                      </span>{" "}
                      <span className={isActive ? "text-neutral-900" : "text-slate-300"}>{pill.label}</span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {statusFilter !== "ALL" && (
          <button
            onClick={() => setStatusFilter("ALL")}
            className="text-xs font-medium text-slate-400 hover:text-white underline transition cursor-pointer"
          >
            Clear Status Filter
          </button>
        )}
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 min-h-[280px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider bg-[#141418]/60 h-10">
              <th className="py-3.5 px-4 min-w-[90px]">ID</th>
              <th className="py-3.5 px-4 min-w-[110px]">
                <div className="flex items-center gap-1.5">
                  <span>TYPE</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[90px]">
                <div className="flex items-center gap-1.5">
                  <span>PR ID</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <span>DUE DATE</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[150px] text-center">SPRINT OUTCOMES</th>
              <th className="py-3.5 px-4 min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <span>STATUS</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[280px]">SUMMARY</th>
              <th className="py-3.5 px-4 min-w-[150px]">
                <div className="flex items-center gap-1.5">
                  <span>ASSIGNED TO</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[110px]">
                <div className="flex items-center gap-1.5">
                  <span>BLOCKER</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[100px]">
                <div className="flex items-center gap-1.5">
                  <span>PRIORITY</span>
                  <Filter className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[100px] text-right">STORY POINTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {currentIssues.map((iss, index) => {
              const issueKey = iss.key || iss.issueKey || (iss.issueId ? String(iss.issueId) : "");
              const issueType = typeof iss.type === "string" ? iss.type : iss.type?.name || "Task";
              const issueStatus = typeof iss.status === "string" ? iss.status : iss.status?.name || "To Do";
              const issueAssignee = iss.assignee || "Unassigned";
              const issuePriority = iss.priority || "Medium";
              const prId = findPrId(issueKey);
              const isBlocker = (iss.priority || "").toLowerCase() === "blocker" || (iss.priority || "").toLowerCase() === "highest";

              return (
                <tr key={iss.issueId || issueKey || index} className="hover:bg-white/[0.03] transition-colors h-12">
                  <td className="py-3.5 px-4 font-semibold text-[#38bdf8] cursor-pointer hover:underline whitespace-nowrap">
                    {issueKey}
                  </td>
                  <td className="py-3.5 px-4">
                    {renderTypeBadge(issueType)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                    {prId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#22c55e] font-mono whitespace-nowrap">
                    {formatDueDate(iss.duedate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] inline-block" title="Sprint outcome" />
                  </td>
                  <td className="py-3.5 px-4">
                    {renderStatusBadge(iss)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200 max-w-[320px] truncate" title={iss.summary}>
                    {iss.summary}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                    {issueAssignee}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {isBlocker ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Blocker</span>
                    ) : (
                      <span className="text-slate-400">No blocker</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {issuePriority.toLowerCase() === "highest" || issuePriority.toLowerCase() === "high" ? (
                      <span className="text-rose-400 font-bold">{issuePriority}</span>
                    ) : issuePriority.toLowerCase() === "medium" ? (
                      <span className="text-amber-300 font-medium">{issuePriority}</span>
                    ) : (
                      <span className="text-slate-400">{issuePriority}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white text-right font-mono">
                    {iss.storyPoints ?? 0}
                  </td>
                </tr>
              );
            })}
            {currentIssues.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 text-xs font-medium">
                  {loading ? "Loading sprint issues from MongoDB..." : `No sprint issues found matching status "${statusFilter}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-white/10 pt-3 mt-3 text-xs text-slate-400 gap-3">
        <div>
          <span>Total Records: <strong className="text-white font-bold">{totalRecords}</strong></span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#141418] text-white border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <span>
            {totalRecords > 0 ? `${startIndex + 1} to ${Math.min(startIndex + pageSize, totalRecords)} of ${totalRecords}` : "0 of 0"}
          </span>

          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <button
              title="First Page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              title="Previous Page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-1.5 font-semibold text-xs">Page {currentPage} of {totalPages}</span>
            <button
              title="Next Page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              title="Last Page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
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
      .catch(() => { });
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
  const fetchPRData = () => {
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
  };

  useEffect(() => {
    fetchPRData();
    const handleUpdate = () => fetchPRData();
    window.addEventListener("githubReposUpdated", handleUpdate);
    window.addEventListener("githubPrsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("githubReposUpdated", handleUpdate);
      window.removeEventListener("githubPrsUpdated", handleUpdate);
    };
  }, [selectedRepo]);

  return (
    <div className="w-full h-full bg-transparent font-sans text-white px-6 md:px-8 py-4 md:py-6 box-border">
      <div className="grid grid-cols-12 gap-5 md:gap-6 pb-8">
        <DashboardCard title="Churn" className="col-span-12 md:col-span-5 min-h-[260px]" />
        <DashboardCard title="Capacity" className="col-span-12 md:col-span-3 min-h-[260px]" />
        <JiraStatusCard currentSprint={currentSprint} currentProject={currentProject} />
        <BurndownCard currentSprint={currentSprint} currentProject={currentProject} />
        <BurnupCard currentSprint={currentSprint} currentProject={currentProject} />
        <PullRequestsSummaryCard summary={prData.summary} />
        <PRsTableCard prs={prData.prs} />
        <SprintIssuesCard currentSprint={currentSprint} currentProject={currentProject} prs={prData.prs} />
      </div>
    </div>
  );
}

export default Standup;
