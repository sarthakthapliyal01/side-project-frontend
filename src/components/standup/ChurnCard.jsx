import { API_BASE_URL } from "../../utils/api";
import { Modal, EmptyState } from "../ui/ProductUI";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Info } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getActiveTargetParams } from "../../utils/targetHelper";

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

function SprintChurnModal({ onClose, currentProject, currentRelease, isRelease, includeBugs }) {
  const [churnRows, setChurnRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const filterType = localStorage.getItem("selectedFilterType") || "Sprint";
  const isRelMode = filterType === "Release" || isRelease;

  let relName = currentRelease;
  if (!relName) {
    try {
      const parsed = JSON.parse(localStorage.getItem("selectedRelease") || "");
      relName = parsed?.releaseName || parsed?.name || "";
    } catch {}
  }

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
    if (isRelMode && relName) params.append("release_name", relName);
    params.append("include_bugs", includeBugs);

    fetch(`${API_BASE_URL}/jira/churn-data/${companyName}?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.churnData && Array.isArray(data.churnData) && data.churnData.length > 0) {
          let list = data.churnData;
          if (isRelMode) {
            list = data.churnData.filter(
              (item) =>
                String(item.sprintId || "").toLowerCase().startsWith("release") ||
                String(item.sprint || "").toLowerCase().startsWith("release")
            );
          }
          const mapped = list.map((item) => ({
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
  }, [currentProject, includeBugs, currentRelease, isRelease]);

  const handleIssueTypeChange = (index, selectedType) => {
    setChurnRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], issueType: selectedType };
      return copy;
    });
  };

  return (
    <Modal title={isRelMode ? "Release Churn Detailed Breakdown" : "Sprint Churn Detailed Breakdown"} onClose={onClose}>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Loading churn data...</span>
            </div>
          ) : churnRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted font-medium">
              {isRelMode ? "No release churn data found for selected project." : "No sprint churn data found for selected project."}
            </div>
          ) : (
            <table className="q-table w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-control z-10 shadow-sm">
                <tr className="text-muted border-b border-line uppercase text-xs font-bold tracking-wider">
                  <th className="py-3.5 px-6 font-bold text-left">{isRelMode ? "RELEASE" : "SPRINT"}</th>
                  <th className="py-3.5 px-6 font-bold text-left">ISSUE TYPE</th>
                  <th className="py-3.5 px-6 font-bold text-right">PLANNED</th>
                  <th className="py-3.5 px-6 font-bold text-right">ADDED</th>
                  <th className="py-3.5 px-6 font-bold text-right">REMOVED</th>
                  <th className="py-3.5 px-6 font-bold text-right">CHURN (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-ink">
                {churnRows.map((row, idx) => {
                  const m = row.metrics?.[row.issueType] || row.metrics?.["All"] || { planned: 0, added: 0, removed: 0, churn: "N/A" };
                  return (
                    <tr key={idx} className="hover:bg-control/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-ink whitespace-nowrap">
                        {row.sprint}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={row.issueType}
                          onChange={(e) => handleIssueTypeChange(idx, e.target.value)}
                          className="bg-control text-ink border border-line hover:border-ink/30 text-xs font-semibold rounded-lg px-3.5 py-1.5 focus:outline-none focus:border-accent/80 cursor-pointer transition-colors shadow-sm"
                        >
                          <option value="All" className="bg-control text-ink">All</option>
                          <option value="Story" className="bg-control text-ink">Story</option>
                          <option value="Task" className="bg-control text-ink">Task</option>
                          <option value="Bug" className="bg-control text-ink">Bug</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-ink">{m.planned}</td>
                      <td className="py-4 px-6 text-right font-mono text-success">{m.added}</td>
                      <td className="py-4 px-6 text-right font-mono text-danger">{m.removed}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-accent">
                        {m.churn === "N/A" ? "N/A" : `${m.churn}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
    </Modal>
  );
}

function ChurnCard({ currentProject, currentSprint, currentRelease, isRelease, sprints }) {
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

  const fetchChurnData = useCallback((signal) => {
    const { companyName, project: targetProject, sprint: targetSprint, release: relName, isRelMode } = getActiveTargetParams({
      currentSprint,
      currentProject,
      currentRelease,
      isRelease
    });

    if (!companyName) {
      setChurnDataList([]);
      setSummaryChurn("N/A");
      setLoading(false);
      return;
    }

    setLoading(true);

    const params = new URLSearchParams();
    if (targetProject) params.append("project_id", targetProject);
    if (isRelMode) {
      if (relName) params.append("release_name", relName);
    }
    params.append("include_bugs", includeBugs);
    params.append("_t", String(Date.now()));

    fetch(`${API_BASE_URL}/jira/churn-data/${companyName}?${params.toString()}`, { signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (signal?.aborted) return;
        if (data?.churnData && Array.isArray(data.churnData) && data.churnData.length > 0) {
          const rawData = [...data.churnData].sort((a, b) => {
            const isRelA = String(a.sprintId || a.sprint || "").toLowerCase().startsWith("release");
            const isRelB = String(b.sprintId || b.sprint || "").toLowerCase().startsWith("release");
            if (isRelA && !isRelB) return -1;
            if (!isRelA && isRelB) return 1;

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
        if (err?.name === "AbortError") return;
        console.error("Error fetching churn data:", err);
        setChurnDataList([]);
        setSummaryChurn("N/A");
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, [currentProject, includeBugs, currentRelease, isRelease]);

  useEffect(() => {
    let controller = new AbortController();
    fetchChurnData(controller.signal);

    const handleJiraUpdated = () => {
      controller.abort();
      controller = new AbortController();
      fetchChurnData(controller.signal);
    };

    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);
    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("releaseSelected", handleJiraUpdated);
    window.addEventListener("filterTypeChanged", handleJiraUpdated);
    window.addEventListener("projectSelected", handleJiraUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("releaseSelected", handleJiraUpdated);
      window.removeEventListener("filterTypeChanged", handleJiraUpdated);
      window.removeEventListener("projectSelected", handleJiraUpdated);
    };
  }, [fetchChurnData]);

  // Update summary churn dynamically when currentSprint, currentRelease or churnDataList changes
  useEffect(() => {
    if (!churnDataList || churnDataList.length === 0) {
      setSummaryChurn("N/A");
      return;
    }

    const filterType = localStorage.getItem("selectedFilterType") || "Sprint";
    const isRelMode = filterType === "Release" || isRelease;

    let targetSprint = null;
    if (isRelMode) {
      targetSprint = churnDataList.find(
        (s) =>
          String(s.sprintId || "").toLowerCase().startsWith("release") ||
          String(s.sprint || "").toLowerCase().startsWith("release")
      );
    } else if (currentSprint && currentSprint !== "all" && currentSprint !== "All Sprints") {
      targetSprint = churnDataList.find(
        (s) =>
          String(s.sprintId) === String(currentSprint) ||
          String(s.sprint).toLowerCase() === String(currentSprint).toLowerCase()
      );
    }

    if (!targetSprint) {
      // Default to latest sprint (last item in rawData)
      targetSprint = churnDataList[churnDataList.length - 1];
    }

    const m = targetSprint?.metrics?.["All"];
    if (m?.churn !== undefined && m?.churn !== null && m?.churn !== "N/A") {
      setSummaryChurn(`${m.churn}%`);
    } else {
      setSummaryChurn("0.0%");
    }
  }, [churnDataList, currentSprint, currentRelease, isRelease]);

  const displayedSprints = useMemo(() => {
    if (!churnDataList || churnDataList.length === 0) return [];

    const filterType = localStorage.getItem("selectedFilterType") || "Sprint";
    const isRelMode = filterType === "Release" || isRelease;

    if (isRelMode) {
      const relItems = churnDataList.filter(
        (s) =>
          String(s.sprintId || "").toLowerCase().startsWith("release") ||
          String(s.sprint || "").toLowerCase().startsWith("release")
      );
      if (relItems.length > 0) return relItems;
    }

    if (selectedSprintFilter === "All") {
      return churnDataList.slice(-6);
    }
    const match = churnDataList.find(s => String(s.sprintId) === String(selectedSprintFilter) || s.sprint === selectedSprintFilter);
    return match ? [match] : churnDataList.slice(-6);
  }, [churnDataList, selectedSprintFilter, isRelease]);

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
      { key: "Story", color: "var(--success)", name: "Story" },
      { key: "Task", color: "var(--cyan)", name: "Task" },
      { key: "Bug", color: "var(--color-purple)", name: "Bug" },
      { key: "All", color: "var(--warning)", name: "All" }
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
      <span className="text-accent text-base font-semibold tracking-tight">
        {summaryChurn}
      </span>
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowFormulaTooltip(true)}
        onMouseLeave={() => setShowFormulaTooltip(false)}
      >
        <Info className="w-4 h-4 text-muted cursor-pointer hover:text-ink transition-colors" />
        {showFormulaTooltip && (
          <div className="absolute left-6 top-0 z-50 w-64 bg-raised/95 border border-line-strong rounded-xl p-3 shadow-none text-xs text-ink backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="font-bold text-warning mb-1">How churn is calculated</div>
            <div className="font-mono text-[12px] bg-canvas p-1.5 rounded border border-line text-accent mb-2">
              ((added + removed) / planned) × 100
            </div>
            <div className="font-bold text-warning mb-0.5">When planned = 0</div>
            <div className="text-[12px] text-ink">Churn is undefined, so we show N/A. No initial commitment.</div>
          </div>
        )}
      </div>
    </div>
  );

  const cardHeaderRight = (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      <select
        aria-label="Churn issue types" value={includeBugs}
        onChange={(e) => setIncludeBugs(e.target.value)}
        className="bg-control text-ink border border-line hover:border-ink/30 text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer shadow-sm max-w-[140px] truncate"
      >
        <option value="All">Include Bugs: All</option>
        <option value="Only Bugs">Only Bugs</option>
        <option value="Exclude Bugs">Exclude Bugs</option>
      </select>

      <button
        onClick={() => setIsModalOpen(true)}
        className="text-xs px-3 py-1 bg-control hover:bg-hover text-ink rounded-full border border-line transition-colors cursor-pointer font-semibold shadow-sm shrink-0 whitespace-nowrap"
      >
        Details
      </button>
    </div>
  );

  if (loading) {
    return (
      <DashboardCard title={cardTitle} className="q-card--churn" headerRight={cardHeaderRight}>
        <EmptyState loading />
      </DashboardCard>
    );
  }

  if (!displayedSprints || displayedSprints.length === 0) {
    return (
      <>
        <DashboardCard title={cardTitle} className="q-card--churn" headerRight={cardHeaderRight}>
          <EmptyState title="No churn data yet" />
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
        className="q-card--churn"
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
                stroke="var(--chart-grid)"
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
                      stroke="var(--chart-grid)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={axisLeft - 8}
                      y={y + 3.5}
                      fill="var(--text-secondary)"
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
                        stroke={isActive ? "var(--accent)" : "var(--color-line-strong)"}
                        strokeDasharray="3 3"
                        strokeWidth={isActive ? "1.5" : "1"}
                      />
                    )}
                    <text
                      x={x}
                      y={svgHeight - 12}
                      fill={isActive ? "var(--accent)" : isHovered ? "var(--text-primary)" : "var(--text-secondary)"}
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
                            fill="var(--bg-surface)"
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
                <div className="bg-raised/95 border border-line text-ink px-3.5 py-2.5 rounded-xl shadow-none space-y-1.5 backdrop-blur-md min-w-[145px]">
                  <div className="text-xs font-bold text-ink tracking-wide border-b border-line pb-1">
                    {displayedSprints[hoverIndex].sprint}
                  </div>
                  {lineSeries.filter(s => s.isVisible).map((series) => {
                    const pt = series.points[hoverIndex];
                    const valDisplay = pt?.valStr || "N/A";
                    return (
                      <div key={series.key} className="flex items-center justify-between text-xs font-semibold gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: series.color }} />
                          <span className="text-ink">{series.name}:</span>
                        </div>
                        <span className="font-mono font-bold text-ink">{valDisplay}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-3 border-t border-line/80 pt-2.5 pb-0.5 w-full text-xs font-semibold text-ink shrink-0 select-none">
            {lineSeries.map((s) => {
              const isVisible = s.isVisible;
              return (
                <button type="button" aria-pressed={s.isVisible}
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  onMouseEnter={() => setHoveredLegendKey(s.key)}
                  onMouseLeave={() => setHoveredLegendKey(null)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    isVisible ? "hover:bg-control text-ink" : "opacity-40 line-through text-muted hover:opacity-70"
                  }`}
                  title={`Click to ${isVisible ? "hide" : "show"} ${s.name}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: isVisible ? s.color : "var(--text-secondary)" }}
                  />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DashboardCard>

      {isModalOpen && (
        <SprintChurnModal
          onClose={() => setIsModalOpen(false)}
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={isRelease}
          includeBugs={includeBugs}
        />
      )}
    </>
  );
}

export default ChurnCard;
