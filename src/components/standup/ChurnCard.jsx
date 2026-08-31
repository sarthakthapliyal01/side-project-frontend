import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Info, X } from "lucide-react";
import DashboardCard from "./DashboardCard";

function getBezierPath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function SprintChurnModal({ onClose, currentProject, includeBugs }) {
  const [churnRows, setChurnRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setChurnRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const params = new URLSearchParams();
    if (currentProject) params.append("project_id", currentProject);
    params.append("include_bugs", includeBugs);

    fetch(`http://127.0.0.1:8000/jira/churn-data/${companyName}?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.churnData && Array.isArray(data.churnData) && data.churnData.length > 0) {
          const mapped = data.churnData.map((item) => ({
            sprintId: item.sprintId,
            sprint: item.sprint,
            issueType: "All",
            metrics: item.metrics || {},
          }));
          setChurnRows(mapped);
        } else {
          setChurnRows([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching churn data:", err);
        setChurnRows([]);
      })
      .finally(() => setLoading(false));
  }, [currentProject, includeBugs]);

  const handleIssueTypeChange = (index, selectedType) => {
    setChurnRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], issueType: selectedType };
      return copy;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[850px] bg-[#0c0c0e]/95 border border-[#1e1e24] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-auto max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-3 border-b border-[#1e1e24] bg-[#141418] shrink-0 h-[52px]">
          <h3 className="text-sm md:text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span>Sprint Churn Detailed Breakdown</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#a1a1aa] hover:text-white p-1.5 rounded-full hover:bg-[#18181d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(75vh-52px)] p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#a1a1aa] font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading sprint churn data...</span>
            </div>
          ) : churnRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#a1a1aa] font-medium">
              No sprint churn data found for selected project.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-[#141418] z-10 shadow-sm">
                <tr className="text-[#a1a1aa] border-b border-[#1e1e24] uppercase text-xs font-bold tracking-wider">
                  <th className="py-3.5 px-6 font-bold text-left">SPRINT</th>
                  <th className="py-3.5 px-6 font-bold text-left">ISSUE TYPE</th>
                  <th className="py-3.5 px-6 font-bold text-right">PLANNED</th>
                  <th className="py-3.5 px-6 font-bold text-right">ADDED</th>
                  <th className="py-3.5 px-6 font-bold text-right">REMOVED</th>
                  <th className="py-3.5 px-6 font-bold text-right">CHURN (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e24]/60 text-slate-200">
                {churnRows.map((row, idx) => {
                  const m = row.metrics?.[row.issueType] || row.metrics?.["All"] || { planned: 0, added: 0, removed: 0, churn: "N/A" };
                  return (
                    <tr key={idx} className="hover:bg-[#141418]/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white whitespace-nowrap">
                        {row.sprint}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={row.issueType}
                          onChange={(e) => handleIssueTypeChange(idx, e.target.value)}
                          className="bg-[#141418] text-white border border-[#24242c] hover:border-white/30 text-xs font-semibold rounded-lg px-3.5 py-1.5 focus:outline-none focus:border-blue-500/80 cursor-pointer transition-colors shadow-sm"
                        >
                          <option value="All" className="bg-[#141418] text-white">All</option>
                          <option value="Story" className="bg-[#141418] text-white">Story</option>
                          <option value="Task" className="bg-[#141418] text-white">Task</option>
                          <option value="Bug" className="bg-[#141418] text-white">Bug</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-300">{m.planned}</td>
                      <td className="py-4 px-6 text-right font-mono text-emerald-400">{m.added}</td>
                      <td className="py-4 px-6 text-right font-mono text-rose-400">{m.removed}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-blue-400">
                        {m.churn === "N/A" ? "N/A" : `${m.churn}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ChurnCard({ currentProject, currentSprint, sprints }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [includeBugs, setIncludeBugs] = useState("All");
  const [selectedSprintFilter, setSelectedSprintFilter] = useState("All");
  const [summaryChurn, setSummaryChurn] = useState("N/A");
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [churnDataList, setChurnDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [visibleSeries, setVisibleSeries] = useState({ Story: true, Task: true, Bug: true, All: true });
  const [hoveredLegendKey, setHoveredLegendKey] = useState(null);

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => {
      const activeKeys = Object.keys(prev).filter((k) => prev[k]);
      if (activeKeys.length === 1 && activeKeys[0] === key) {
        return { Story: true, Task: true, Bug: true, All: true };
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  const fetchChurnData = useCallback(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setChurnDataList([]);
      setSummaryChurn("N/A");
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (currentProject) params.append("project_id", currentProject);
    params.append("include_bugs", includeBugs);
    params.append("_t", String(Date.now()));

    fetch(`http://127.0.0.1:8000/jira/churn-data/${companyName}?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.churnData && Array.isArray(data.churnData) && data.churnData.length > 0) {
          const rawData = [...data.churnData].sort((a, b) => {
            const numA = (String(a.sprint || a.name || "").match(/\d+/g) || []).pop();
            const numB = (String(b.sprint || b.name || "").match(/\d+/g) || []).pop();
            const nA = numA ? parseInt(numA, 10) : 99999;
            const nB = numB ? parseInt(numB, 10) : 99999;
            if (nA !== nB) return nA - nB;
            return String(a.sprint || a.name || "").localeCompare(String(b.sprint || b.name || ""));
          });
          setChurnDataList(rawData);
        } else {
          setChurnDataList([]);
          setSummaryChurn("N/A");
        }
      })
      .catch((err) => {
        console.error("Error fetching churn data:", err);
        setChurnDataList([]);
        setSummaryChurn("N/A");
      })
      .finally(() => setLoading(false));
  }, [currentProject, includeBugs]);

  useEffect(() => {
    fetchChurnData();
  }, [fetchChurnData]);

  // Update summary churn dynamically when currentSprint or churnDataList changes
  useEffect(() => {
    if (!churnDataList || churnDataList.length === 0) {
      setSummaryChurn("N/A");
      return;
    }

    let targetSprint = null;
    if (currentSprint && currentSprint !== "all" && currentSprint !== "All Sprints") {
      targetSprint = churnDataList.find(
        (s) =>
          String(s.sprintId) === String(currentSprint) ||
          String(s.sprint).toLowerCase() === String(currentSprint).toLowerCase()
      );
    }

    if (!targetSprint) {
      // Default to latest sprint (last item in reversed rawData)
      targetSprint = churnDataList[churnDataList.length - 1];
    }

    const m = targetSprint?.metrics?.["All"];
    if (m?.churn && m.churn !== "N/A") {
      setSummaryChurn(`${m.churn}%`);
    } else {
      setSummaryChurn("N/A");
    }
  }, [churnDataList, currentSprint]);

  useEffect(() => {
    const handleJiraUpdated = () => fetchChurnData();
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);
    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("projectSelected", handleJiraUpdated);

    return () => {
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("projectSelected", handleJiraUpdated);
    };
  }, [fetchChurnData]);

  const displayedSprints = useMemo(() => {
    if (!churnDataList || churnDataList.length === 0) return [];
    if (selectedSprintFilter === "All") {
      return churnDataList.slice(-6);
    }
    const match = churnDataList.find(s => String(s.sprintId) === String(selectedSprintFilter) || s.sprint === selectedSprintFilter);
    return match ? [match] : churnDataList.slice(-6);
  }, [churnDataList, selectedSprintFilter]);

  const activeSprintIndex = useMemo(() => {
    if (!currentSprint || !displayedSprints || displayedSprints.length === 0) return -1;
    return displayedSprints.findIndex(
      (s) =>
        String(s.sprintId) === String(currentSprint) ||
        String(s.sprint).toLowerCase() === String(currentSprint).toLowerCase()
    );
  }, [displayedSprints, currentSprint]);

  const svgWidth = 520;
  const svgHeight = 200;
  const axisLeft = 56;
  const axisRight = 484;
  const padTop = 20;
  const padBottom = 42;

  const chartW = axisRight - axisLeft;
  const chartH = svgHeight - padTop - padBottom;
  const plotMargin = 24;
  const plotWidth = chartW - 2 * plotMargin;

  const actualMax = useMemo(() => {
    if (!displayedSprints || displayedSprints.length === 0) return 100;
    const values = displayedSprints.flatMap((s) => [
      s.metrics?.Story?.churnVal ?? (parseFloat(s.metrics?.Story?.churn) || 0),
      s.metrics?.Task?.churnVal ?? (parseFloat(s.metrics?.Task?.churn) || 0),
      s.metrics?.Bug?.churnVal ?? (parseFloat(s.metrics?.Bug?.churn) || 0),
      s.metrics?.All?.churnVal ?? (parseFloat(s.metrics?.All?.churn) || 0),
    ]).filter((v) => !isNaN(v) && v >= 0);

    const maxFound = Math.max(...values, 0);
    if (maxFound === 0) return 100;
    return Math.max(100, Math.ceil(maxFound / 50) * 50);
  }, [displayedSprints]);

  const numSprints = displayedSprints.length;
  const stepX = numSprints > 1 ? plotWidth / (numSprints - 1) : plotWidth / 2;

  const lineSeries = useMemo(() => {
    const types = [
      { key: "Story", color: "#22c55e", name: "Story" },
      { key: "Task", color: "#06b6d4", name: "Task" },
      { key: "Bug", color: "#c084fc", name: "Bug" },
      { key: "All", color: "#f59e0b", name: "All" }
    ];

    return types.map(t => {
      const points = displayedSprints.map((s, idx) => {
        const rawMetric = s.metrics?.[t.key];
        const isNA = !rawMetric || rawMetric.churn === "N/A";
        const valNum = isNA ? 0 : (rawMetric.churnVal ?? (parseFloat(rawMetric.churn) || 0));
        const x = numSprints > 1 ? axisLeft + plotMargin + idx * stepX : axisLeft + chartW / 2;
        const normalizedVal = Math.min(actualMax, Math.max(0, valNum));
        const y = padTop + chartH - (normalizedVal / actualMax) * chartH;
        return {
          x,
          y,
          valStr: isNA ? "N/A" : `${rawMetric.churnVal ?? rawMetric.churn}%`,
          valNum,
          isNA,
          sprint: s.sprint,
          raw: s
        };
      });

      return {
        key: t.key,
        name: t.name,
        color: t.color,
        points,
        pathD: getBezierPath(points),
        isVisible: visibleSeries[t.key] !== false
      };
    });
  }, [displayedSprints, actualMax, stepX, axisLeft, plotMargin, padTop, chartW, chartH, numSprints, visibleSeries]);

  const handleMouseMove = useCallback((e) => {
    if (!displayedSprints || displayedSprints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < numSprints; i++) {
      const xPos = numSprints > 1 ? axisLeft + plotMargin + i * stepX : axisLeft + chartW / 2;
      const diff = Math.abs(svgX - xPos);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    setHoverIndex(closestIdx);
  }, [displayedSprints, numSprints, axisLeft, plotMargin, svgWidth, stepX, chartW]);

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  const cardTitle = (
    <div className="relative flex items-center gap-2 select-none">
      <span>Churn</span>
      <span className="text-white text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
        {summaryChurn}
      </span>
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowFormulaTooltip(true)}
        onMouseLeave={() => setShowFormulaTooltip(false)}
      >
        <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white transition-colors" />
        {showFormulaTooltip && (
          <div className="absolute left-6 top-0 z-50 w-64 bg-[#141b2d]/95 border border-[#2b374e] rounded-xl p-3 shadow-2xl text-xs text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="font-bold text-amber-400 mb-1">How churn is calculated</div>
            <div className="font-mono text-[11px] bg-[#0c101a] p-1.5 rounded border border-[#1b2436] text-blue-300 mb-2">
              ((added + removed) / planned) × 100
            </div>
            <div className="font-bold text-amber-400 mb-0.5">When planned = 0</div>
            <div className="text-[11px] text-gray-300">Churn is undefined, so we show N/A. No initial commitment.</div>
          </div>
        )}
      </div>
    </div>
  );

  const cardHeaderRight = (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      <select
        value={includeBugs}
        onChange={(e) => setIncludeBugs(e.target.value)}
        className="bg-[#141418] text-white border border-[#24242c] hover:border-white/30 text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer shadow-sm max-w-[140px] truncate"
      >
        <option value="All">Include Bugs: All</option>
        <option value="Only Bugs">Only Bugs</option>
        <option value="Exclude Bugs">Exclude Bugs</option>
      </select>

      <button
        onClick={() => setIsModalOpen(true)}
        className="text-xs px-3 py-1 bg-[#1e1e28] hover:bg-[#2a2a35] text-white rounded-full border border-[#2d2d3a] transition-colors cursor-pointer font-semibold shadow-sm shrink-0 whitespace-nowrap"
      >
        Details
      </button>
    </div>
  );

  if (loading) {
    return (
      <DashboardCard title={cardTitle} className="col-span-12 md:col-span-5 min-h-[320px]" headerRight={cardHeaderRight}>
        <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Churn Data...</span>
        </div>
      </DashboardCard>
    );
  }

  if (!displayedSprints || displayedSprints.length === 0) {
    return (
      <>
        <DashboardCard title={cardTitle} className="col-span-12 md:col-span-5 min-h-[320px]" headerRight={cardHeaderRight}>
          <div className="flex flex-col items-center justify-center h-[220px] text-slate-500 gap-2">
            <span className="text-sm font-medium">No churn data available</span>
          </div>
        </DashboardCard>
        {isModalOpen && (
          <SprintChurnModal
            onClose={() => setIsModalOpen(false)}
            currentProject={currentProject}
            includeBugs={includeBugs}
          />
        )}
      </>
    );
  }

  return (
    <>
      <DashboardCard
        title={cardTitle}
        className="col-span-12 md:col-span-5 min-h-[320px]"
        headerRight={cardHeaderRight}
      >
        <div className="relative w-full h-full flex flex-col justify-between items-center select-none py-1">
          <div className="relative w-full flex-1 flex items-center justify-center min-h-[190px] my-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <line
                x1={axisLeft}
                y1={padTop}
                x2={axisLeft}
                y2={padTop + chartH}
                stroke="#24242c"
                strokeWidth="1"
              />

              {[0, 0.333, 0.666, 1].map((ratio, i) => {
                const y = padTop + ratio * chartH;
                const valLabel = Math.round(actualMax * (1 - ratio));
                return (
                  <g key={i}>
                    <line
                      x1={axisLeft}
                      y1={y}
                      x2={axisRight}
                      y2={y}
                      stroke="#1e1e28"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={axisLeft - 8}
                      y={y + 3.5}
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      {valLabel}%
                    </text>
                  </g>
                );
              })}

              {displayedSprints.map((s, idx) => {
                const x = numSprints > 1 ? axisLeft + plotMargin + idx * stepX : axisLeft + chartW / 2;
                const isHovered = hoverIndex === idx;
                const isActive = idx === activeSprintIndex;
                return (
                  <g key={idx}>
                    {(isHovered || isActive) && (
                      <line
                        x1={x}
                        y1={padTop}
                        x2={x}
                        y2={padTop + chartH}
                        stroke={isActive ? "#3b82f6" : "rgba(255,255,255,0.2)"}
                        strokeDasharray="3 3"
                        strokeWidth={isActive ? "1.5" : "1"}
                      />
                    )}
                    <text
                      x={x}
                      y={svgHeight - 12}
                      fill={isActive ? "#60a5fa" : isHovered ? "#ffffff" : "#94a3b8"}
                      fontSize="10"
                      fontWeight={isActive || isHovered ? "700" : "500"}
                      textAnchor="middle"
                    >
                      {s.sprint.length > 14 ? `${s.sprint.slice(0, 12)}...` : s.sprint}
                    </text>
                  </g>
                );
              })}

              {lineSeries.filter(s => s.isVisible).map((series) => {
                const isLegendHovered = hoveredLegendKey === series.key;
                const isAnyLegendHovered = Boolean(hoveredLegendKey);
                const opacity = isAnyLegendHovered ? (isLegendHovered ? 1 : 0.2) : 1;
                const strokeW = series.key === "All" ? (isLegendHovered ? 2.5 : 2) : (isLegendHovered ? 2.25 : 1.5);

                return (
                  <g key={series.key} className="pointer-events-none transition-opacity duration-200" style={{ opacity }}>
                    <path
                      d={series.pathD}
                      fill="none"
                      stroke={series.color}
                      strokeWidth={strokeW}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />

                    {series.points.map((pt, idx) => {
                      const isHovered = hoverIndex === idx;
                      const isActive = idx === activeSprintIndex;
                      const radius = isHovered || isActive ? 4.5 : 2.5;
                      const dotStrokeW = isHovered || isActive ? 2 : 1.25;

                      return (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={radius}
                            fill="#0c0c0e"
                            stroke={series.color}
                            strokeWidth={dotStrokeW}
                            className="transition-all duration-200"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            {hoverIndex !== null && displayedSprints[hoverIndex] && (
              <div
                className={`absolute z-50 pointer-events-none top-[10%] ${
                  hoverIndex < Math.ceil(displayedSprints.length / 2) ? "left-[35%] md:left-[42%]" : "right-[35%] md:right-[42%]"
                } animate-in fade-in zoom-in-95`}
              >
                <div className="bg-[#121217]/95 border border-[#2d2d3a] text-white px-3.5 py-2.5 rounded-xl shadow-2xl space-y-1.5 backdrop-blur-md min-w-[145px]">
                  <div className="text-xs font-bold text-white tracking-wide border-b border-[#24242c] pb-1">
                    {displayedSprints[hoverIndex].sprint}
                  </div>
                  {lineSeries.filter(s => s.isVisible).map((series) => {
                    const pt = series.points[hoverIndex];
                    const valDisplay = pt?.valStr || "N/A";
                    return (
                      <div key={series.key} className="flex items-center justify-between text-xs font-semibold gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: series.color }} />
                          <span className="text-slate-300">{series.name}:</span>
                        </div>
                        <span className="font-mono font-bold text-white">{valDisplay}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-5 border-t border-[#1e1e24]/80 pt-2.5 pb-0.5 w-full text-xs font-semibold text-slate-300 shrink-0 select-none">
            {lineSeries.map((s) => {
              const isVisible = s.isVisible;
              return (
                <div
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  onMouseEnter={() => setHoveredLegendKey(s.key)}
                  onMouseLeave={() => setHoveredLegendKey(null)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    isVisible ? "hover:bg-[#1e1e28] text-slate-200" : "opacity-40 line-through text-slate-500 hover:opacity-70"
                  }`}
                  title={`Click to ${isVisible ? "hide" : "show"} ${s.name}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: isVisible ? s.color : "#4b5563" }}
                  />
                  <span>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardCard>

      {isModalOpen && (
        <SprintChurnModal
          onClose={() => setIsModalOpen(false)}
          currentProject={currentProject}
          includeBugs={includeBugs}
        />
      )}
    </>
  );
}

export default ChurnCard;
