import React, { useState, useEffect, useCallback } from "react";
import DashboardCard from "./DashboardCard";

function BurndownBurnupCard({ currentSprint, currentProject }) {
  const [chartType, setChartType] = useState("burndown"); // "burndown" | "burnup"
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

    const endpoint = chartType === "burndown" ? "burndown" : "burnup";
    const url = `http://127.0.0.1:8000/jira/${endpoint}/${companyName}?${params.toString()}`;

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
        console.error(`Error fetching ${chartType} data:`, err);
        setChartData(null);
      })
      .finally(() => setLoading(false));
  }, [chartType, activeSprintId, currentSprint, activeProjectId, currentProject]);

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

  // Y-axis ticks calculation
  const maxVal = Math.max(
    totalPoints,
    ...idealLine.filter((v) => v !== null && v !== undefined),
    ...actualLine.filter((v) => v !== null && v !== undefined),
    10
  );
  const step = Math.ceil(maxVal / 4);
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const scaleMax = yTicks[yTicks.length - 1] || maxVal || 60;

  // Header Control: Toggle between Burndown/Burnup AND SP/Hrs
  const headerRight = (
    <div className="flex items-center gap-2 shrink-0">
      {/* Burndown vs Burnup toggle */}
      <div className="flex items-center gap-1 bg-[#18181d] p-1 rounded-full border border-white/10">
        <button
          onClick={() => setChartType("burndown")}
          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${chartType === "burndown"
            ? "bg-white text-black shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
            }`}
        >
          Burndown
        </button>
        <button
          onClick={() => setChartType("burnup")}
          className={`px-3 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${chartType === "burnup"
            ? "bg-white text-black shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
            }`}
        >
          Burnup
        </button>
      </div>

      {/* SP vs Hrs toggle */}
      <div className="flex items-center gap-1 bg-[#18181d] p-1 rounded-full border border-white/10">
        <button
          onClick={() => setUnitMode("SP")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${unitMode === "SP"
            ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
            : "text-slate-400 hover:text-white"
            }`}
        >
          SP
        </button>
        <button
          onClick={() => setUnitMode("Hrs")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${unitMode === "Hrs"
            ? "bg-[#3b82f6] text-white shadow-md shadow-blue-500/30"
            : "text-slate-400 hover:text-white"
            }`}
        >
          Hrs
        </button>
      </div>
    </div>
  );

  const isBurndown = chartType === "burndown";
  const titleText = isBurndown ? "Burndown" : "Burnup";
  const infoText = isBurndown
    ? "Daily sprint story points and hours burndown tracking progress"
    : "Daily sprint story points and hours burnup tracking progress";

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
          <span className="text-sm font-medium">Loading {titleText} Data...</span>
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
          <span className="text-sm font-medium">No {titleText.toLowerCase()} data available</span>
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
    const initialVal = isBurndown ? totalPoints : 0;
    idealPoints.push({ x: getX(-1), y: getY(initialVal) });
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
    const startY = getY(isBurndown ? totalPoints : 0);
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
        {/* TOP STAT CARDS (For Burndown mode) */}
        {isBurndown && currentMetrics && (
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

        {/* CHART AREA */}
        <div className={`relative flex-1 w-full min-h-[200px] flex items-center justify-center select-none ${!isBurndown ? "mt-2" : ""}`}>
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

            {/* IDEAL LINE */}
            {idealPathStr && (
              <path
                d={idealPathStr}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray={isBurndown ? "4 4" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* ACTUAL LINE */}
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

            {/* Invisible Hover Rectangles */}
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

export default BurndownBurnupCard;
