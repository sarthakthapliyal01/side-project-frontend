import React, { useEffect, useState, useCallback } from "react";
import DashboardCard from "./DashboardCard";

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

export default JiraStatusCard;
