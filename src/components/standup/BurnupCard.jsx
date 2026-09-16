import { API_BASE_URL } from "../../utils/api";
import { EmptyState } from "../ui/ProductUI";
import React, { useState, useEffect, useCallback } from "react";
import DashboardCard from "./DashboardCard";
import { getActiveTargetParams } from "../../utils/targetHelper";

function BurnupCard({ currentSprint, currentProject }) {
  const [unitMode, setUnitMode] = useState("SP"); // "SP" | "Hrs"
  const [hoverIndex, setHoverIndex] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback((signal) => {
    const { companyName, project: targetProject, sprint: targetSprint } = getActiveTargetParams({
      currentSprint,
      currentProject
    });

    if (!companyName) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (targetSprint) params.append("sprint_id", targetSprint);
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const url = `${API_BASE_URL}/jira/burnup/${companyName}?${params.toString()}`;

    setLoading(true);
    fetch(url, { cache: "no-store", signal })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (signal?.aborted) return;
        if (data && data.dates && data.sp) {
          setChartData(data);
        } else {
          setChartData(null);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error fetching burnup data:", err);
        setChartData(null);
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, [currentSprint, currentProject]);

  useEffect(() => {
    let controller = new AbortController();
    fetchData(controller.signal);

    const handleJiraUpdated = () => {
      controller.abort();
      controller = new AbortController();
      fetchData(controller.signal);
    };

    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("projectSelected", handleJiraUpdated);
    window.addEventListener("filterTypeChanged", handleJiraUpdated);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("projectSelected", handleJiraUpdated);
      window.removeEventListener("filterTypeChanged", handleJiraUpdated);
      window.removeEventListener("jiraProjectsUpdated", handleJiraUpdated);
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
    };
  }, [fetchData]);

  const dates = chartData?.dates || [];
  const currentMetrics = unitMode === "SP" ? chartData?.sp : chartData?.hrs;
  const hasData = Boolean(chartData && currentMetrics && dates.length > 0);

  const totalPoints = currentMetrics?.total || 0;
  const idealLine = currentMetrics?.ideal || [];
  const actualLine = currentMetrics?.actual || [];

  const maxVal = Math.max(
    totalPoints,
    ...idealLine.filter((v) => v !== null && v !== undefined),
    ...actualLine.filter((v) => v !== null && v !== undefined),
    10
  );
  const step = Math.ceil(maxVal / 4);
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const scaleMax = yTicks[yTicks.length - 1] || maxVal || 60;

  const headerRight = (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1 bg-hover p-1 rounded-full border border-ink/10">
        <button
          onClick={() => setUnitMode("SP")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            unitMode === "SP"
              ? "bg-accent text-on-accent shadow-none shadow-blue-500/30"
              : "text-muted hover:text-ink"
          }`}
        >
          SP
        </button>
        <button
          onClick={() => setUnitMode("Hrs")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
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

  const titleText = "Burnup";
  const infoText = "Daily sprint story points and hours burnup tracking progress";

  if (loading) {
    return (
      <DashboardCard
        title={titleText}
        infoText={infoText}
        headerRight={headerRight}
        className="q-card--chart"
      >
        <EmptyState loading />
      </DashboardCard>
    );
  }

  if (!hasData) {
    return (
      <DashboardCard
        title={titleText}
        infoText={infoText}
        headerRight={headerRight}
        className="q-card--chart"
      >
        <EmptyState title="No burnup data available" />
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

  let idealPoints = [];
  if (idealLine.length > 0) {
    idealPoints.push({ x: getX(-1), y: getY(0) });
    idealLine.forEach((val, idx) => {
      idealPoints.push({ x: getX(idx), y: getY(val) });
    });
  }
  const idealPathStr = idealPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const actualValidPoints = actualLine
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
    if (chartData?.isWeekend && chartData.isWeekend[idx] !== undefined) {
      return chartData.isWeekend[idx];
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
      title={titleText}
      infoText={infoText}
      headerRight={headerRight}
      className="q-card--chart"
    >
      <div className="flex flex-col h-full justify-between pt-1 pb-2 px-1">
        {currentMetrics && (
          <div className="q-chart-metrics grid grid-cols-5 gap-2 mb-3">
            <div className="bg-raised border border-ink/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-none">
              <span className="text-[12px] md:text-[12px] font-medium text-muted truncate">Today's</span>
              <div className="flex items-center justify-center gap-1 text-sm md:text-base font-bold text-accent">
                <span>{currentMetrics.todaysBurned ?? 0}</span>
                {(currentMetrics.todaysBurned ?? 0) > 0 && <span className="text-xs text-success font-semibold">↗</span>}
              </div>
            </div>

            <div className="bg-raised border border-ink/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-none">
              <span className="text-[12px] md:text-[12px] font-medium text-muted truncate">Yesterday's</span>
              <span className="text-sm md:text-base font-bold text-accent">
                {currentMetrics.yesterdaysBurned ?? 0}
              </span>
            </div>

            <div className="bg-raised border border-ink/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-none">
              <span className="text-[12px] md:text-[12px] font-medium text-muted truncate">Target</span>
              <span className="text-sm md:text-base font-bold text-accent">
                {currentMetrics.target ?? 0}
              </span>
            </div>

            <div className="bg-raised border border-ink/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-none">
              <span className="text-[12px] md:text-[12px] font-medium text-muted truncate">Comple. TT</span>
              <span className="text-sm md:text-base font-bold text-accent">
                {currentMetrics.compleTT ?? 0}
              </span>
            </div>

            <div className="bg-raised border border-ink/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-none">
              <span className="text-[12px] md:text-[12px] font-medium text-muted truncate">5 Spts. Avg</span>
              <span className="text-sm md:text-base font-bold text-accent">
                {currentMetrics.fiveSptsAvg ?? 0}
              </span>
            </div>
          </div>
        )}

        <div className="relative flex-1 w-full min-h-[200px] flex items-center justify-center select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
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
                    fill="var(--bg-control)"
                    fillOpacity="0.4"
                  />
                  <line
                    x1={colLeft}
                    y1={padTop}
                    x2={colLeft}
                    y2={padTop + chartH}
                    stroke="var(--text-primary)"
                    strokeOpacity="0.07"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={colRight}
                    y1={padTop}
                    x2={colRight}
                    y2={padTop + chartH}
                    stroke="var(--text-primary)"
                    strokeOpacity="0.07"
                    strokeDasharray="2 2"
                  />
                </g>
              );
            })}

            {yTicks.map((tickVal, i) => {
              const yPos = getY(tickVal);
              if (yPos === null) return null;
              return (
                <g key={`ytick-${i}`}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={yPos + 3.5}
                    fill="var(--text-secondary)"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {dates.map((dateStr, idx) => {
              const xPos = getX(idx);
              return (
                <text
                  key={`xtick-${idx}`}
                  x={xPos}
                  y={svgHeight - 6}
                  fill="var(--text-secondary)"
                  fontSize="9.5"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {dateStr}
                </text>
              );
            })}

            {idealPathStr && (
              <path
                d={idealPathStr}
                fill="none"
                stroke="var(--warning)"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {actualPathStr && (
              <path
                d={actualPathStr}
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {actualValidPoints.map((pt) => (
              <circle
                key={`actual-dot-${pt.idx}`}
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === pt.idx ? "4.5" : "3"}
                fill="var(--cyan)"
                stroke="var(--bg-surface)"
                strokeWidth="1.5"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoverIndex(pt.idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}

            {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dates.length && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={padTop}
                  x2={getX(hoverIndex)}
                  y2={padTop + chartH}
                  stroke="var(--text-primary)"
                  strokeOpacity="0.2"
                  strokeDasharray="2 2"
                />
              </g>
            )}
          </svg>

          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dates.length && (
            <div
              className="absolute z-20 bg-raised/95 border border-line-strong rounded-lg px-2.5 py-1.5 shadow-none text-xs text-ink backdrop-blur-md pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
                top: `${(Math.min(getY(actualLine[hoverIndex]) ?? (padTop + chartH / 2), getY(idealLine[hoverIndex]) ?? (padTop + chartH / 2)) / svgHeight) * 100 - 4}%`,
              }}
            >
              <div className="font-bold text-ink mb-0.5">{dates[hoverIndex]}</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning inline-block" />
                <span className="text-muted">Target Scope:</span>
                <span className="font-mono font-bold text-warning">{idealLine[hoverIndex] ?? "N/A"} {unitMode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan inline-block" />
                <span className="text-muted">Completed:</span>
                <span className="font-mono font-bold text-cyan">{actualLine[hoverIndex] ?? "N/A"} {unitMode}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-1 text-xs select-none">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-b-2 border-dashed border-warning" />
            <span className="text-muted font-medium">Scope Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-cyan rounded-full" />
            <span className="text-muted font-medium">Completed</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default BurnupCard;
