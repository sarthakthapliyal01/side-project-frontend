import { API_BASE_URL } from "../../utils/api";
import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { getActiveTargetParams } from "../../utils/targetHelper";

function CapacityCard({ currentSprint, currentProject, currentRelease, isRelease, onOpenCapacityDetails }) {

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

  const fetchCapacity = useCallback((signal) => {
    const { companyName, project: targetProject, sprint: targetSprint, release: relName, isRelMode } = getActiveTargetParams({
      currentSprint,
      currentProject,
      currentRelease,
      isRelease
    });

    if (!companyName) return;

    const params = new URLSearchParams();
    if (targetProject) params.append("project_id", targetProject);
    if (isRelMode) {
      if (relName) params.append("release_name", relName);
    } else if (targetSprint) {
      params.append("sprint_id", targetSprint);
    }
    params.append("_t", String(Date.now()));

    Promise.all([
      fetch(`${API_BASE_URL}/jira/sprint-issues/${companyName}?${params.toString()}`, { signal })
        .then(r => r.ok ? r.json() : null)
        .catch(err => err.name === "AbortError" ? Promise.reject(err) : null),
      fetch(`${API_BASE_URL}/jira/capacity-data/${companyName}?${params.toString()}`, { signal })
        .then(r => r.ok ? r.json() : null)
        .catch(err => err.name === "AbortError" ? Promise.reject(err) : null)
    ]).then(([issuesRes, capacityRes]) => {
      if (signal?.aborted) return;

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

        const activeKey = isRelMode
          ? (targetProject && relName ? `capacity_${companyName}_${targetProject}_${relName}` : null)
          : (targetProject && targetSprint ? `capacity_${companyName}_${targetProject}_${targetSprint}` : null);
        if (activeKey) {
          try {
            localStorage.setItem(activeKey, JSON.stringify(capacityRes.members));
          } catch {}
        }
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
    }).catch(err => {
      if (err?.name === "AbortError") return;
    });
  }, [currentSprint, currentProject, currentRelease, isRelease]);

  useEffect(() => {
    let controller = new AbortController();
    fetchCapacity(controller.signal);

    const handleUpdate = () => {
      controller.abort();
      controller = new AbortController();
      fetchCapacity(controller.signal);
    };

    window.addEventListener("capacityUpdated", handleUpdate);
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    window.addEventListener("jiraIssuesUpdated", handleUpdate);
    window.addEventListener("sprintSelected", handleUpdate);
    window.addEventListener("releaseSelected", handleUpdate);
    window.addEventListener("projectSelected", handleUpdate);
    window.addEventListener("filterTypeChanged", handleUpdate);

    return () => {
      controller.abort();
      window.removeEventListener("capacityUpdated", handleUpdate);
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
      window.removeEventListener("jiraIssuesUpdated", handleUpdate);
      window.removeEventListener("sprintSelected", handleUpdate);
      window.removeEventListener("releaseSelected", handleUpdate);
      window.removeEventListener("projectSelected", handleUpdate);
      window.removeEventListener("filterTypeChanged", handleUpdate);
    };
  }, [fetchCapacity]);

  const isOverloaded = capacityInfo.utilizationPercent > 100 || capacityInfo.status === "Over Loaded";

  return (
    <DashboardCard
      title="Capacity"
      className="q-card--capacity"
      headerRight={
        <button
          onClick={onOpenCapacityDetails}
          className="text-xs px-3 py-1 bg-control hover:bg-hover text-ink rounded-full border border-line transition-colors cursor-pointer font-semibold shadow-sm shrink-0 whitespace-nowrap"
        >
          Details
        </button>
      }
    >
      <div className="q-capacity-visual">
        <div className="q-capacity-total"><strong>{capacityInfo.totalCapacity}</strong><span>SP total capacity</span></div>
        <div className="q-capacity-utilization"><span>Utilization</span><strong className={isOverloaded ? "text-danger" : "text-success"}>{capacityInfo.utilizationPercent}%</strong></div>
        <div className="q-capacity-track" role="img" aria-label={`Capacity utilization ${capacityInfo.utilizationPercent}%`}><span style={{width:`${Math.min(100, capacityInfo.utilizationPercent)}%`,background:isOverloaded?"var(--danger)":"var(--success)"}} /></div>
        <div className="q-capacity-allocation"><span>Allocated <b>{capacityInfo.allocatedSP} SP</b></span><span>Available <b>{capacityInfo.remainingSP} SP</b></span></div>
        <span className={`q-capacity-status ${isOverloaded ? "text-danger" : "text-success"}`}><AlertTriangle size={13} />{capacityInfo.status}</span>
        <div className="q-capacity-counts">
          <div><b className="text-danger">{capacityInfo.overLoadedCount}</b><span>Overloaded</span></div>
          <div><b className="text-warning">{capacityInfo.underUtilizedCount}</b><span>Underutilized</span></div>
          <div><b className="text-success">{capacityInfo.remainingSP}</b><span>Remaining SP</span></div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default CapacityCard;
