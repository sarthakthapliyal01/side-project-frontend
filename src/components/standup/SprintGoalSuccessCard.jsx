import { API_BASE_URL } from "../../utils/api";
import { EmptyState } from "../ui/ProductUI";
import React, { useState, useEffect, useCallback } from "react";
import DashboardCard from "./DashboardCard";
import { getActiveTargetParams } from "../../utils/targetHelper";

function SprintGoalSuccessCard({ currentProject }) {
  const [filterMode, setFilterMode] = useState("With added");
  const [unitMode, setUnitMode] = useState("SP");
  const [hoverIndex, setHoverIndex] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSprintGoalSuccess = useCallback((signal) => {
    const { companyName, project: targetProject } = getActiveTargetParams({
      currentProject
    });

    if (!companyName) {
      setLoading(false);
      setSprints([]);
      return;
    }

    const params = new URLSearchParams();
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `${API_BASE_URL}/jira/sprint-goal-success/${companyName}?${params.toString()}`;

    setLoading(true);
    fetch(url, { cache: "no-store", signal })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (signal?.aborted) return;
        if (data && Array.isArray(data.sprints)) {
          setSprints(data.sprints);
        } else {
          setSprints([]);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error fetching sprint goal success data:", err);
        setSprints([]);
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, [currentProject]);

  useEffect(() => {
    let controller = new AbortController();
    fetchSprintGoalSuccess(controller.signal);

    const handleJiraUpdated = () => {
      controller.abort();
      controller = new AbortController();
      fetchSprintGoalSuccess(controller.signal);
    };

    window.addEventListener("projectSelected", handleJiraUpdated);
    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("filterTypeChanged", handleJiraUpdated);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("projectSelected", handleJiraUpdated);
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("filterTypeChanged", handleJiraUpdated);
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
        className="bg-hover border border-ink/10 text-ink text-xs rounded-lg px-2.5 py-1 outline-none font-medium cursor-pointer hover:border-ink/20 transition-colors"
      >
        <option value="With added">With added</option>
        <option value="Without added">Without added</option>
      </select>

      <div className="flex items-center gap-1 bg-hover p-1 rounded-full border border-ink/10 shrink-0">
        <button
          onClick={() => setUnitMode("SP")}
          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            unitMode === "SP"
              ? "bg-accent text-on-accent shadow-none shadow-blue-500/30"
              : "text-muted hover:text-ink"
          }`}
        >
          SP
        </button>
        <button
          onClick={() => setUnitMode("Hrs")}
          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            unitMode === "Hrs"
              ? "bg-accent text-on-accent shadow-none shadow-blue-500/30"
              : "text-muted hover:text-ink"
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
        className="q-card--chart"
      >
        <EmptyState loading />
      </DashboardCard>
    );
  }

  if (!sprints || sprints.length === 0) {
    return (
      <DashboardCard
        title="Sprint Goal Success"
        infoText="Sprint goal success rate tracking"
        headerRight={headerRight}
        className="q-card--chart"
      >
        <EmptyState title="No sprint goal data available" />
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
      className="q-card--chart"
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
                  <div className="w-4 h-4 rounded-full border border-danger/80 text-danger flex items-center justify-center text-[12px] font-bold leading-none select-none">
                    ⊗
                  </div>
                </div>

                <div className="flex items-end gap-1.5 h-[155px] w-full justify-center">
                  <div
                    className={`w-2 md:w-2.5 rounded-t-xs transition-all duration-200 ${
                      isHovered ? "bg-accent brightness-125 shadow-none shadow-blue-500/50" : "bg-accent"
                    }`}
                    style={{ height: `${committedPct}%` }}
                  />
                  <div
                    className={`w-2 md:w-2.5 rounded-t-xs transition-all duration-200 ${
                      isHovered ? "bg-success brightness-125 shadow-none shadow-emerald-500/50" : "bg-success"
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
                    <div className="bg-raised/95 border border-ink/15 text-ink px-3.5 py-2.5 rounded-xl shadow-none space-y-1.5 backdrop-blur-md whitespace-nowrap min-w-[140px]">
                      <div className="text-xs font-bold text-ink tracking-wide border-b border-ink/10 pb-1">
                        {item.sprintName}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-ink">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                        <span>Committed: <span className="font-bold text-ink">{item.committed}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-ink">
                        <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                        <span>Completed: <span className="font-bold text-ink">{item.completed}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 border-t border-ink/5 text-xs font-semibold text-ink shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-ink">Committed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-ink">Completed</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default SprintGoalSuccessCard;
