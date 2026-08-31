import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import DashboardCard from "./DashboardCard";

function CapacityCard({ currentSprint, currentProject, onOpenCapacityDetails }) {
  const [capacityInfo, setCapacityInfo] = useState({
    totalCapacity: 0,
    allocatedSP: 0,
    remainingSP: 0,
    utilizationPercent: 0,
    overLoadedCount: 0,
    underUtilizedCount: 0,
    status: "Under Utilized",
    loaded: false
  });

  const fetchCapacity = useCallback(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    let targetSprint = currentSprint;
    const savedSprintStr = localStorage.getItem("selectedSprint");
    let savedSprintObj = null;
    if (savedSprintStr) {
      try {
        savedSprintObj = JSON.parse(savedSprintStr);
      } catch {}
    }

    const savedSprintId = String(savedSprintObj?.sprintId || savedSprintObj?.id || "");
    const savedSprintName = String(savedSprintObj?.name || "");

    if (!targetSprint) {
      targetSprint = savedSprintId || savedSprintName || localStorage.getItem("currentSprint") || "";
    }

    const targetProject = currentProject || localStorage.getItem("currentProject") || "";

    const candidateKeys = [];
    if (targetProject && targetSprint) candidateKeys.push(`capacity_${companyName}_${targetProject}_${targetSprint}`);
    if (targetProject && savedSprintId) candidateKeys.push(`capacity_${companyName}_${targetProject}_${savedSprintId}`);
    if (targetProject && savedSprintName) candidateKeys.push(`capacity_${companyName}_${targetProject}_${savedSprintName}`);

    let members = null;
    for (const key of candidateKeys) {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed) && parsed.length > 0) {
            members = parsed;
            break;
          }
        } catch (e) {}
      }
    }

    if (members && Array.isArray(members) && members.length > 0) {
      let totalAlloc = 0;
      let totalAvail = 0;
      let overLoaded = 0;
      let underUtilized = 0;

      members.forEach((m) => {
        const alloc = Number(m.allocatedCapacity) || 0;
        const avail = Number(m.availableCapacity) || 0;
        const leaves = Number(m.leaves) || Number(m.leave) || 0;
        const netAvail = m.netAvailableCapacity !== undefined && m.netAvailableCapacity !== null ? Number(m.netAvailableCapacity) : (avail - leaves);

        totalAlloc += alloc;
        totalAvail += netAvail;

        if (alloc > netAvail && netAvail >= 0) overLoaded++;
        else underUtilized++;
      });

      const remaining = totalAvail - totalAlloc;
      const utilPct = totalAvail > 0 ? Math.round((totalAlloc / totalAvail) * 100) : (totalAlloc > 0 ? 100 : 0);
      let status = "Under Utilized";
      if (utilPct > 100 || (totalAvail === 0 && totalAlloc > 0)) status = "Over Loaded";
      else if (utilPct >= 80) status = "Optimal";

      setCapacityInfo({
        totalCapacity: totalAvail,
        allocatedSP: totalAlloc,
        remainingSP: remaining,
        utilizationPercent: utilPct,
        overLoadedCount: overLoaded,
        underUtilizedCount: underUtilized,
        status: status,
        loaded: true
      });
    }

    const params = new URLSearchParams();
    if (targetProject) params.append("project_id", targetProject);
    if (targetSprint) params.append("sprint_id", targetSprint);
    params.append("_t", String(Date.now()));

    Promise.all([
      fetch(`http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}?${params.toString()}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`http://127.0.0.1:8000/jira/capacity-data/${companyName}?${params.toString()}`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([issuesRes, capacityRes]) => {
      let sprintIssuesAllocatedSP = 0;
      let overLoaded = 0;
      let underUtilized = 0;

      if (issuesRes?.issues && Array.isArray(issuesRes.issues)) {
        issuesRes.issues.forEach((issue) => {
          let sp = issue.storyPoints ?? issue.story_points ?? issue.customfield_10016 ?? issue.customfield_10026 ?? issue.sp ?? 0;
          if (typeof sp === "string") sp = parseFloat(sp) || 0;
          const val = Number(sp) || 0;

          const isAssigned = Boolean(issue.assignee || issue.assigneeName || issue.assigneeId);
          const statusStr = (typeof issue.status === "string" ? issue.status : issue.status?.name || "").toLowerCase();
          const isWorkedOn = statusStr.includes("dev") || statusStr.includes("progress") || statusStr.includes("qa") || statusStr.includes("closed") || statusStr.includes("done");

          if (isAssigned || isWorkedOn) {
            sprintIssuesAllocatedSP += val;
          }
        });
      }

      let totalCapacity = 0;
      let totalAllocated = 0;

      if (capacityRes?.members && Array.isArray(capacityRes.members) && capacityRes.members.length > 0) {
        let memberAllocatedSum = 0;
        let memberAvailableSum = 0;

        capacityRes.members.forEach((m) => {
          const alloc = Number(m.allocatedCapacity) || 0;
          const avail = Number(m.availableCapacity) || 0;
          const leaves = Number(m.leaves) || Number(m.leave) || 0;
          const netAvail = m.netAvailableCapacity !== undefined && m.netAvailableCapacity !== null ? Number(m.netAvailableCapacity) : (avail - leaves);
          memberAllocatedSum += alloc;
          memberAvailableSum += netAvail;

          if (alloc > netAvail && netAvail >= 0) overLoaded++;
          else underUtilized++;
        });

        totalCapacity = memberAvailableSum;
        totalAllocated = memberAllocatedSum > 0 ? memberAllocatedSum : sprintIssuesAllocatedSP;
      } else {
        totalAllocated = sprintIssuesAllocatedSP;
      }

      totalCapacity = Math.round(totalCapacity);
      totalAllocated = Math.round(totalAllocated);

      const remainingSP = totalCapacity - totalAllocated;
      const utilPct = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : (totalAllocated > 0 ? 100 : 0);

      let status = "Under Utilized";
      if (utilPct > 100 || (totalCapacity === 0 && totalAllocated > 0)) status = "Over Loaded";
      else if (utilPct >= 80) status = "Optimal";

      setCapacityInfo({
        totalCapacity: totalCapacity,
        allocatedSP: totalAllocated,
        remainingSP: remainingSP,
        utilizationPercent: utilPct,
        overLoadedCount: overLoaded,
        underUtilizedCount: underUtilized,
        status: status,
        loaded: true
      });
    });
  }, [currentSprint, currentProject]);

  useEffect(() => {
    fetchCapacity();

    const handleUpdate = () => fetchCapacity();
    window.addEventListener("capacityUpdated", handleUpdate);
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    window.addEventListener("jiraIssuesUpdated", handleUpdate);
    window.addEventListener("sprintSelected", handleUpdate);
    window.addEventListener("projectSelected", handleUpdate);

    return () => {
      window.removeEventListener("capacityUpdated", handleUpdate);
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
      window.removeEventListener("jiraIssuesUpdated", handleUpdate);
      window.removeEventListener("sprintSelected", handleUpdate);
      window.removeEventListener("projectSelected", handleUpdate);
    };
  }, [fetchCapacity]);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * Math.min(100, capacityInfo.utilizationPercent)) / 100;
  const isOverloaded = capacityInfo.utilizationPercent > 100 || capacityInfo.status === "Over Loaded";

  return (
    <DashboardCard
      title="Capacity"
      className="col-span-12 md:col-span-3 min-h-[280px]"
      headerRight={
        <button
          onClick={onOpenCapacityDetails}
          className="text-xs px-3 py-1 bg-[#1e1e28] hover:bg-[#2a2a35] text-white rounded-full border border-[#2d2d3a] transition-colors cursor-pointer font-semibold shadow-sm shrink-0 whitespace-nowrap"
        >
          Details
        </button>
      }
    >
      <div className="flex flex-col h-full justify-between">
        <div className="capacity-main flex items-center justify-start gap-4 min-h-[125px] pt-[14px] pb-[12px] shrink-0 pl-0">
          <div className="relative w-[76px] h-[76px] flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-[#1d1d28]"
                strokeWidth="6.5"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="transition-all duration-700 ease-out"
                stroke={isOverloaded ? "#ef4444" : "#10b981"}
                strokeWidth="6.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
              <span className={`text-base font-extrabold leading-none ${isOverloaded ? "text-rose-400" : "text-emerald-400"}`}>
                {capacityInfo.utilizationPercent}%
              </span>
              <span className="text-[8px] font-bold text-[#94a3b8] tracking-widest uppercase mt-0.5 leading-none">
                UTILIZATION
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center items-start min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-[34px] font-black text-white tracking-tight leading-none">
                {capacityInfo.totalCapacity}
              </span>
              <span className="text-sm font-bold text-slate-300 ml-0.5">SP</span>
            </div>
            <span className="text-xs md:text-sm text-[#a1a1aa] font-medium leading-tight mt-1">
              Total Capacity
            </span>
            <div className="mt-2">
              {isOverloaded ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Over Loaded
                </span>
              ) : capacityInfo.status === "Under Utilized" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Under Utilized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Optimal
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="capacity-breakdown relative overflow-hidden bg-[#121217] rounded-xl px-4 py-2.5 border border-[#1e1e26] my-2 shadow-inner shrink-0">
          <div
            className={`absolute top-0 left-0 bottom-0 transition-all duration-700 ease-out rounded-xl border-r ${
              isOverloaded
                ? "bg-gradient-to-r from-rose-500/30 via-rose-500/45 to-rose-500/70 border-rose-400/80"
                : "bg-gradient-to-r from-emerald-500/20 via-emerald-500/35 to-emerald-500/50 border-emerald-400/80"
            }`}
            style={{ width: `${Math.min(100, capacityInfo.utilizationPercent)}%` }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <span className="text-slate-300 font-semibold flex items-center gap-1 text-xs">
                <span className="opacity-80">👥</span>
                <span>US:</span>
              </span>
              <span className="font-bold text-white text-xs md:text-sm">{capacityInfo.allocatedSP} SP</span>
            </div>

            <div className="text-slate-500 font-bold px-1 select-none text-xs">⋮</div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#a1a1aa] font-semibold tracking-wider text-[10px] uppercase">
                AVAILABLE:
              </span>
              <span className="font-bold text-[#10b981] tracking-tight text-xs md:text-sm">
                {capacityInfo.remainingSP} SP
              </span>
            </div>
          </div>
        </div>

        <div className="capacity-footer grid grid-cols-3 gap-2 pt-3 pb-2 text-center mt-auto shrink-0">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-black text-[#ef4444] leading-tight">
              {capacityInfo.overLoadedCount}
            </span>
            <span className="text-xs text-[#a1a1aa] font-medium leading-tight mt-1">
              Over Loaded
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-black text-[#f59e0b] leading-tight">
              {capacityInfo.underUtilizedCount}
            </span>
            <span className="text-xs text-[#a1a1aa] font-medium leading-tight mt-1">
              Under Utilized
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-black text-[#10b981] leading-tight">
              {capacityInfo.remainingSP}
            </span>
            <span className="text-xs text-[#a1a1aa] font-medium leading-tight mt-1">
              Remaining
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default CapacityCard;
