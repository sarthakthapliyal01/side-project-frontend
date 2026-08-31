import React, { useState, useEffect, useCallback } from "react";
import DashboardCard from "./DashboardCard";

function SprintGoalSuccessCard({ currentProject }) {
  const [filterMode, setFilterMode] = useState("With added");
  const [unitMode, setUnitMode] = useState("SP");
  const [hoverIndex, setHoverIndex] = useState(null);

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return currentProject || localStorage.getItem("currentProject") || "";
  });

  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSprintGoalSuccess = useCallback(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setLoading(false);
      setSprints([]);
      return;
    }

    const targetProject = activeProjectId || currentProject || localStorage.getItem("currentProject") || "";

    const params = new URLSearchParams();
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `http://127.0.0.1:8000/jira/sprint-goal-success/${companyName}?${params.toString()}`;

    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data && Array.isArray(data.sprints)) {
          setSprints(data.sprints);
        } else {
          setSprints([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching sprint goal success data:", err);
        setSprints([]);
      })
      .finally(() => setLoading(false));
  }, [activeProjectId, currentProject]);

  useEffect(() => {
    fetchSprintGoalSuccess();
  }, [fetchSprintGoalSuccess]);

  useEffect(() => {
    const handleProjectSelected = (e) => {
      const pid = e?.detail || localStorage.getItem("currentProject") || "";
      setActiveProjectId(String(pid));
    };

    const handleJiraUpdated = () => {
      fetchSprintGoalSuccess();
    };

    window.addEventListener("projectSelected", handleProjectSelected);
    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);

    return () => {
      window.removeEventListener("projectSelected", handleProjectSelected);
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("jiraProjectsUpdated", handleJiraUpdated);
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
    };
  }, [fetchSprintGoalSuccess]);

  const headerRight = (
    <div className="flex items-center gap-2">
      <select
        value={filterMode}
        onChange={(e) => setFilterMode(e.target.value)}
        className="bg-[#18181d] border border-white/10 text-slate-300 text-xs rounded-lg px-2.5 py-1 outline-none font-medium cursor-pointer hover:border-white/20 transition-colors"
      >
        <option value="With added">With added</option>
        <option value="Without added">Without added</option>
      </select>

      <div className="flex items-center gap-1 bg-[#18181d] p-1 rounded-full border border-white/10 shrink-0">
        <button
          onClick={() => setUnitMode("SP")}
          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            unitMode === "SP"
              ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          SP
        </button>
        <button
          onClick={() => setUnitMode("Hrs")}
          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            unitMode === "Hrs"
              ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Hrs
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardCard
        title="Sprint Goal Success"
        infoText="Sprint goal success rate tracking"
        headerRight={headerRight}
        className="col-span-12 md:col-span-4 min-h-[320px]"
      >
        <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Goal Data...</span>
        </div>
      </DashboardCard>
    );
  }

  if (!sprints || sprints.length === 0) {
    return (
      <DashboardCard
        title="Sprint Goal Success"
        infoText="Sprint goal success rate tracking"
        headerRight={headerRight}
        className="col-span-12 md:col-span-4 min-h-[320px]"
      >
        <div className="flex flex-col items-center justify-center h-[220px] text-slate-500 gap-2">
          <span className="text-sm font-medium">No sprint goal data available</span>
        </div>
      </DashboardCard>
    );
  }

  const displayMetrics = sprints.map((s) => {
    const metrics = unitMode === "SP" ? s.sp : s.hrs;
    const committedVal = filterMode === "With added" ? metrics.committedWithAdded : metrics.committed;
    const completedVal = metrics.completed;
    return {
      sprintName: s.sprintName,
      committed: committedVal,
      completed: completedVal,
      goalMet: s.goalMet,
    };
  });

  const maxVal = Math.max(
    ...displayMetrics.map((m) => Math.max(m.committed, m.completed)),
    10
  );

  return (
    <DashboardCard
      title="Sprint Goal Success"
      infoText="Sprint goal success rate tracking"
      headerRight={headerRight}
      className="col-span-12 md:col-span-4 min-h-[320px]"
    >
      <div className="flex flex-col h-full justify-between pt-1 pb-2 px-1 relative">
        <div className="relative flex-1 w-full grid grid-cols-6 gap-2 px-2 pt-7 mt-3 pb-1 select-none min-h-[200px]">
          {displayMetrics.map((item, idx) => {
            const isHovered = hoverIndex === idx;
            const committedPct = item.committed > 0 ? Math.min(95, Math.max(4, (item.committed / maxVal) * 95)) : 2;
            const completedPct = item.completed > 0 ? Math.min(95, Math.max(4, (item.completed / maxVal) * 95)) : 2;

            const isLeftSide = idx < Math.ceil(displayMetrics.length / 2);

            return (
              <div
                key={idx}
                className="col-span-1 flex flex-col items-center justify-between h-full relative cursor-pointer group py-1"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <div className="pt-1 pb-2 shrink-0">
                  <div className="w-4 h-4 rounded-full border border-red-500/80 text-red-500 flex items-center justify-center text-[10px] font-bold leading-none select-none">
                    ⊗
                  </div>
                </div>

                <div className="flex items-end gap-1.5 h-[155px] w-full justify-center">
                  <div
                    className={`w-2 md:w-2.5 rounded-t-xs transition-all duration-200 ${
                      isHovered ? "bg-[#3b82f6] brightness-125 shadow-md shadow-blue-500/50" : "bg-[#3b82f6]"
                    }`}
                    style={{ height: `${committedPct}%` }}
                  />
                  <div
                    className={`w-2 md:w-2.5 rounded-t-xs transition-all duration-200 ${
                      isHovered ? "bg-[#22c55e] brightness-125 shadow-md shadow-emerald-500/50" : "bg-[#22c55e]"
                    }`}
                    style={{ height: `${completedPct}%` }}
                  />
                </div>

                {isHovered && (
                  <div
                    className={`absolute z-50 pointer-events-none top-[35%] ${
                      isLeftSide ? "left-1/2 ml-2" : "right-1/2 mr-2"
                    } animate-in fade-in zoom-in-95`}
                  >
                    <div className="bg-[#141419]/95 border border-white/15 text-white px-3.5 py-2.5 rounded-xl shadow-2xl space-y-1.5 backdrop-blur-md whitespace-nowrap min-w-[140px]">
                      <div className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">
                        {item.sprintName}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
                        <span>Committed: <span className="font-bold text-white">{item.committed}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shrink-0" />
                        <span>Completed: <span className="font-bold text-white">{item.completed}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/5 text-xs font-semibold text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <span className="text-slate-300">Committed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            <span className="text-slate-300">Completed</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default SprintGoalSuccessCard;
