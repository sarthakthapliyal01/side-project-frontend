import React, { useEffect, useState, useCallback } from "react";
import DashboardCard from "./DashboardCard";
import { getActiveTargetParams } from "../../utils/targetHelper";

const DEFAULT_STATUS_CONFIG = [
  { key: "QA - Inprogress", label: "QA - Inprogress", color: "var(--cyan)", defaultCount: 0 },
  { key: "Development", label: "Development", color: "var(--accent)", defaultCount: 0 },
  { key: "Closed", label: "Closed", color: "var(--success)", defaultCount: 0 },
  { key: "In-Progress", label: "In-Progress", color: "var(--accent)", defaultCount: 0 },
  { key: "To Do", label: "To Do", color: "var(--text-secondary)", defaultCount: 0 },
];

function JiraStatusCard({ currentSprint, currentProject, currentRelease, isRelease }) {
  const [sortMode, setSortMode] = useState("default");
  const [statusCounts, setStatusCounts] = useState({
    "QA - Inprogress": 0,
    "Development": 0,
    "Closed": 0,
    "In-Progress": 0,
    "To Do": 0,
  });
  const [hoveredKey, setHoveredKey] = useState(null);

  const fetchStatusCounts = useCallback((signal) => {
    const { companyName, project: targetProject, sprint: targetSprint, release: relName, isRelMode } = getActiveTargetParams({
      currentSprint,
      currentProject,
      currentRelease,
      isRelease
    });

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

    const params = new URLSearchParams();

    if (isRelMode) {
      if (relName) params.append("release_name", relName);
    } else {
      if (targetSprint) params.append("sprint_id", targetSprint);
    }

    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `http://127.0.0.1:8000/jira/sprint-issues/${companyName}?${params.toString()}`;

    fetch(url, { cache: "no-store", signal })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (signal?.aborted) return;
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
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setStatusCounts({
          "QA - Inprogress": 0,
          "Development": 0,
          "Closed": 0,
          "In-Progress": 0,
          "To Do": 0,
        });
      });
  }, [currentSprint, currentProject, currentRelease, isRelease]);

  useEffect(() => {
    let controller = new AbortController();
    fetchStatusCounts(controller.signal);

    const handleJiraUpdated = () => {
      controller.abort();
      controller = new AbortController();
      fetchStatusCounts(controller.signal);
    };

    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("releaseSelected", handleJiraUpdated);
    window.addEventListener("projectSelected", handleJiraUpdated);
    window.addEventListener("filterTypeChanged", handleJiraUpdated);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("releaseSelected", handleJiraUpdated);
      window.removeEventListener("projectSelected", handleJiraUpdated);
      window.removeEventListener("filterTypeChanged", handleJiraUpdated);
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
          ? "bg-inverse text-on-inverse shadow-none shadow-white/10"
          : "text-muted hover:text-ink"
          }`}
      >
        Default
      </button>
      <button
        onClick={() => setSortMode("asc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${sortMode === "asc"
          ? "bg-inverse text-on-inverse px-3 font-semibold rounded-full shadow-none shadow-white/10"
          : "text-muted hover:text-ink"
          }`}
      >
        ASC
      </button>
      <button
        onClick={() => setSortMode("desc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${sortMode === "desc"
          ? "bg-inverse text-on-inverse px-3 font-semibold rounded-full shadow-none shadow-white/10"
          : "text-muted hover:text-ink"
          }`}
      >
        DSC
      </button>
    </div>
  );

  return (
    <DashboardCard title="Jira flow" infoText="Sprint issue breakdown by workflow status" headerRight={headerRight} className="q-card--jira">
      <div className="flex flex-col h-full justify-center py-1 px-0 gap-3.5">
        <div className="flex flex-col gap-3.5 my-auto">
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
                <span className="w-32 text-xs font-medium text-ink shrink-0 text-left pr-2 break-words group-hover:text-ink transition-colors">
                  {item.label}
                </span>

                <div className="flex-1 min-w-0 relative h-2 md:h-2.5 bg-control border border-ink/5 rounded-full flex items-center">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                      boxShadow: "none",
                    }}
                  />

                  {showTooltip && (
                    <div
                      className="absolute z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                      style={{ left: `${Math.max(25, Math.min(85, pct))}%`, top: "-32px", transform: "translateX(-50%)" }}
                    >
                      <div className="bg-hover border border-ink/20 text-ink text-[12px] md:text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-none flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span>{item.label}: {item.count}</span>
                      </div>
                    </div>
                  )}
                </div>
                <span className="ml-3 text-xs font-mono text-muted w-6 text-right">{item.count}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center text-muted text-xs font-mono font-medium pt-1">
          <div className="w-32 shrink-0" />
          <div className="flex-1 min-w-0 relative h-5">
            {ticks.map((t, idx) => {
              const posPct = (idx / (ticks.length - 1)) * 100;
              let transformClass = "-translate-x-1/2";
              if (idx === 0) transformClass = "translate-x-0";
              else if (idx === ticks.length - 1) transformClass = "-translate-x-full";

              return (
                <span
                  key={t}
                  className={`absolute top-0.5 select-none text-[12px] md:text-xs text-muted font-medium ${transformClass}`}
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
