import React, { useState, useEffect, useCallback } from "react";
import DashboardCard from "./DashboardCard";

function BurnupCard({ currentSprint, currentProject }) {
  const [unitMode, setUnitMode] = useState("SP"); // "SP" | "Hrs"
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

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
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
          setChartData(data);
        } else {
          setChartData(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching burnup data:", err);
        setChartData(null);
      })
      .finally(() => setLoading(false));
  }, [activeSprintId, currentSprint, activeProjectId, currentProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
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
      <div className="flex items-center gap-1 bg-[#18181d] p-1 rounded-full border border-white/10">
        <button
          onClick={() => setUnitMode("SP")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
            unitMode === "SP"
              ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          SP
        </button>
        <button
          onClick={() => setUnitMode("Hrs")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
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

  const titleText = "Burnup";
  const infoText = "Daily sprint story points and hours burnup tracking progress";

  if (loading) {
    return (
      <DashboardCard
        title={titleText}
        infoText={infoText}
        headerRight={headerRight}
        className="col-span-12 md:col-span-6 lg:col-span-4 min-h-[320px]"
      >
        <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Burnup Data...</span>
        </div>
      </DashboardCard>
    );
  }

  if (!hasData) {
    return (
      <DashboardCard
        title={titleText}
        infoText={infoText}
        headerRight={headerRight}
        className="col-span-12 md:col-span-6 lg:col-span-4 min-h-[320px]"
      >
        <div className="flex flex-col items-center justify-center h-[220px] text-slate-500 gap-2">
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
      className="col-span-12 md:col-span-6 lg:col-span-4 min-h-[320px]"
    >
      <div className="flex flex-col h-full justify-between pt-1 pb-2 px-1">
        {currentMetrics && (
          <div className="grid grid-cols-5 gap-2 mb-3">
            <div className="bg-[#141419] border border-white/5 rounded-xl p-2 text-center flex flex-col justify-center shadow-inner">
              <span className="text-[10px] md:text-[11px] font-medium text-slate-400 truncate">Today's</span>
              <div className="flex items-center justify-center gap-1 text-sm md:text-base font-bold text-[#3b82f6]">
                <span>{currentMetrics.todaysBurned ?? 0}</span>
                {(currentMetrics.todaysBurned ?? 0) > 0 && <span className="text-xs text-emerald-400 font-extrabold">↗</span>}
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
                    fill="#1e1e24"
                    fillOpacity="0.4"
                  />
                  <line
                    x1={colLeft}
                    y1={padTop}
                    x2={colLeft}
                    y2={padTop + chartH}
                    stroke="#ffffff"
                    strokeOpacity="0.07"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={colRight}
                    y1={padTop}
                    x2={colRight}
                    y2={padTop + chartH}
                    stroke="#ffffff"
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
                    stroke="#1e1e28"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={yPos + 3.5}
                    fill="#94a3b8"
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
                  fill="#94a3b8"
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
                stroke="#f59e0b"
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
                stroke="#06b6d4"
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
                fill="#06b6d4"
                stroke="#0c0c0e"
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
                  stroke="#ffffff"
                  strokeOpacity="0.2"
                  strokeDasharray="2 2"
                />
              </g>
            )}
          </svg>

          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dates.length && (
            <div
              className="absolute z-20 bg-[#141b2d]/95 border border-[#2b374e] rounded-lg px-2.5 py-1.5 shadow-xl text-xs text-white backdrop-blur-md pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
                top: `${(Math.min(getY(actualLine[hoverIndex]) ?? (padTop + chartH / 2), getY(idealLine[hoverIndex]) ?? (padTop + chartH / 2)) / svgHeight) * 100 - 4}%`,
              }}
            >
              <div className="font-bold text-slate-300 mb-0.5">{dates[hoverIndex]}</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span className="text-slate-400">Target Scope:</span>
                <span className="font-mono font-bold text-amber-400">{idealLine[hoverIndex] ?? "N/A"} {unitMode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span className="text-slate-400">Completed:</span>
                <span className="font-mono font-bold text-cyan-400">{actualLine[hoverIndex] ?? "N/A"} {unitMode}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-1 text-xs select-none">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-b-2 border-dashed border-amber-500" />
            <span className="text-slate-400 font-medium">Scope Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-cyan-400 rounded-full" />
            <span className="text-slate-400 font-medium">Completed</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default BurnupCard;
