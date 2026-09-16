import React, { useState, useEffect, useCallback } from "react";
import { EmptyState } from "../ui/ProductUI";
import DashboardCard from "./DashboardCard";
import { Check } from "lucide-react";
import { getActiveTargetParams } from "../../utils/targetHelper";

function ReleaseBurndownCard({ currentRelease, currentProject }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback((signal) => {
    const { companyName, project: targetProject } = getActiveTargetParams({
      currentProject
    });

    const activeReleaseName = currentRelease || localStorage.getItem("selectedReleaseName") || "";

    if (!companyName) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (activeReleaseName) params.append("release_name", activeReleaseName);
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `http://127.0.0.1:8000/jira/release-burndown/${companyName}?${params.toString()}`;

    setLoading(true);
    fetch(url, { cache: "no-store", signal })
      .then((res) => res.ok && res.json())
      .then((resData) => {
        if (signal?.aborted) return;
        if (resData && Array.isArray(resData.sprints)) {
          setData(resData);
        } else {
          setData(null);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error fetching release burndown data:", err);
        setData(null);
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, [currentRelease, currentProject]);

  useEffect(() => {
    let controller = new AbortController();
    fetchData(controller.signal);

    const handleUpdate = () => {
      controller.abort();
      controller = new AbortController();
      fetchData(controller.signal);
    };

    window.addEventListener("releaseSelected", handleUpdate);
    window.addEventListener("sprintSelected", handleUpdate);
    window.addEventListener("projectSelected", handleUpdate);
    window.addEventListener("filterTypeChanged", handleUpdate);
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    window.addEventListener("jiraIssuesUpdated", handleUpdate);

    return () => {
      controller.abort();
      window.removeEventListener("releaseSelected", handleUpdate);
      window.removeEventListener("sprintSelected", handleUpdate);
      window.removeEventListener("projectSelected", handleUpdate);
      window.removeEventListener("filterTypeChanged", handleUpdate);
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
      window.removeEventListener("jiraIssuesUpdated", handleUpdate);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardCard title="Release Burndown" className="q-card--chart">
        <div className="p-6 h-56 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardCard>
    );
  }

  const sprints = data?.sprints || [];
  const forecast = data?.forecast || { sprintsRemaining: 0, velocityPerSprint: 0.0, remainingPoints: 0.0 };
  const releaseName = data?.releaseName || currentRelease || "Version";
  const completedPoints = data?.completedPoints ?? 0;
  const totalPoints = data?.totalPoints ?? 0;
  const unestimatedPct = data?.unestimatedPercentage ?? 0;

  if (sprints.length === 0) {
    return (
      <DashboardCard title="Release Burndown" className="q-card--chart">
        <EmptyState title="No Release Data" description="No release burndown metrics found." />
      </DashboardCard>
    );
  }

  const maxBarValue = Math.max(
    totalPoints,
    ...sprints.map((s) => (s.workRemaining || 0) + (s.workCompleted || 0) + (s.workAdded || 0)),
    60
  );

  const headerRight = (
    <div className="flex items-center gap-1.5 text-2xs font-semibold px-2 py-0.5 rounded bg-control border border-line">
      <span className="truncate max-w-[90px] text-ink">{releaseName}</span>
    </div>
  );

  return (
    <DashboardCard title="Release Burndown" headerRight={headerRight} infoText="Jira release burndown waterfall and sprint forecast" className="q-card--chart">
      <div className="flex flex-col h-full justify-between gap-3">
        {/* Release Metrics & Legend Bar */}
        <div className="flex flex-col gap-1.5 pb-2 border-b border-line/60">
          <div className="flex items-center justify-between text-2xs font-semibold text-muted">
            <span>{unestimatedPct}% unestimated</span>
            <span className="text-ink font-bold">{completedPoints} / {totalPoints} SP completed</span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-muted">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#86c478] inline-block" />
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#4a7bb0] inline-block" />
              <span>Remaining</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb] inline-block" />
              <span>Added</span>
            </div>
          </div>
        </div>

        {/* Waterfall Chart Area */}
        <div className="relative border-l border-b border-line/80 h-36 pt-2 pb-1 px-2 flex items-end justify-between gap-1.5 bg-control/10 rounded-bl-sm">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-1">
            <div className="border-b border-dashed border-line/20 w-full" />
            <div className="border-b border-dashed border-line/20 w-full" />
            <div className="border-b border-line/40 w-full" />
          </div>

          {/* Render Sprint Waterfall Bars */}
          {sprints.map((sprint, idx) => {
            const compPoints = sprint.workCompleted || 0;
            const remPoints = sprint.workRemaining || 0;
            const isForecast = sprint.isForecast;

            const compHeightPct = Math.min(45, Math.max(14, (compPoints / maxBarValue) * 100));
            const remHeightPct = Math.min(75, Math.max(25, (remPoints / maxBarValue) * 100));

            return (
              <div
                key={sprint.sprintId || idx}
                className="relative flex-1 flex flex-col items-center justify-end h-full z-10 group"
                title={`${sprint.sprintName}: Done -${compPoints} SP | Remaining +${remPoints} SP`}
              >
                {/* Completed Top Green Bar */}
                {compPoints > 0 && (
                  <div
                    style={{ height: `${compHeightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-2xs flex items-center justify-center text-[9px] font-bold ${
                      isForecast
                        ? "bg-[#cbd5e1] text-muted"
                        : "bg-[#86c478] text-[#1e3a1e]"
                    }`}
                  >
                    -{compPoints}
                  </div>
                )}

                {/* Main Remaining Blue Bar */}
                <div
                  style={{ height: `${remHeightPct}%` }}
                  className={`w-full max-w-[28px] flex flex-col justify-center items-center text-[10px] font-bold text-white shadow-2xs ${
                    isForecast
                      ? "bg-[#cbd5e1] text-muted"
                      : "bg-[#4a7bb0]"
                  }`}
                >
                  <span>{remPoints > 0 ? `+${remPoints}` : ""}</span>
                </div>

                {/* Short Sprint Label */}
                <span className="text-[9px] font-bold text-muted mt-1 truncate max-w-[32px]">
                  {sprint.sprintName?.replace(/^.*Sprint\s*/i, "S") || `S${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Compact Forecast Card */}
        <div className="mt-auto p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold truncate">
            <Check size={14} className="shrink-0 stroke-[3]" />
            <span className="truncate">{forecast.sprintsRemaining} sprints remaining</span>
          </div>
          <div className="text-[11px] font-semibold text-muted shrink-0">
            <span>{forecast.velocityPerSprint} SP/sprint</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default ReleaseBurndownCard;
