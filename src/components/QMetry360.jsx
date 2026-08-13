import React, { useEffect, useState, useCallback } from "react";
import { Info, Loader2 } from "lucide-react";

function QMetry360() {
  const [loading, setLoading] = useState(true);
  const [bugStats, setBugStats] = useState({ total: 0, open: 0, closed: 0 });
  const [taskStats, setTaskStats] = useState({ total: 0, open: 0, closed: 0 });
  const [currentSprintId, setCurrentSprintId] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed?.sprintId || parsed?.id || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const calculateStats = (issues) => {
    let bugsTotal = 0;
    let bugsOpen = 0;
    let bugsClosed = 0;

    let tasksTotal = 0;
    let tasksOpen = 0;
    let tasksClosed = 0;

    issues.forEach((issue) => {
      const typeName = (issue.type?.name || issue.issuetype?.name || "").toLowerCase();
      const statusName = (issue.status?.name || "").toLowerCase();

      const isClosed = [
        "done",
        "closed",
        "resolved",
        "complete",
        "completed",
      ].includes(statusName);

      const isBug =
        typeName.includes("bug") ||
        typeName.includes("defect") ||
        typeName.includes("incident") ||
        typeName.includes("problem");

      if (isBug) {
        bugsTotal++;
        if (isClosed) bugsClosed++;
        else bugsOpen++;
      } else {
        tasksTotal++;
        if (isClosed) tasksClosed++;
        else tasksOpen++;
      }
    });

    setBugStats({ total: bugsTotal, open: bugsOpen, closed: bugsClosed });
    setTaskStats({ total: tasksTotal, open: tasksOpen, closed: tasksClosed });
  };

  const fetchIssuesData = useCallback(async (sprintId = null) => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) {
      setLoading(false);
      return;
    }

    let targetSprintId = sprintId;
    if (!targetSprintId) {
      const saved = localStorage.getItem("selectedSprint");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          targetSprintId = parsed?.sprintId || parsed?.id || null;
        } catch {}
      }
    }

    if (!targetSprintId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const queryParam = `?sprint_id=${targetSprintId}`;
      const url = `http://127.0.0.1:8000/jira/db-sprint-issues/${encodeURIComponent(
        companyName
      )}${queryParam}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let issues = data.issues || [];

        // If no issues found in DB, attempt a sync from Jira API
        if (issues.length === 0) {
          const syncRes = await fetch(
            `http://127.0.0.1:8000/jira/sync-boards/${encodeURIComponent(companyName)}`,
            { method: "POST" }
          );
          if (syncRes.ok) {
            const reFetchRes = await fetch(url);
            if (reFetchRes.ok) {
              const reFetchData = await reFetchRes.json();
              issues = reFetchData.issues || [];
            }
          }
        }

        calculateStats(issues);
      }
    } catch (err) {
      console.error("Error fetching Jira issues for QMetry360:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssuesData(currentSprintId);

    const handleSprintSelected = (e) => { // its a event if anything changes in sprint selected it will call this and change the values 
      const sprint = e.detail;
      const sprintId = sprint?.sprintId || sprint?.id || null;
      setCurrentSprintId(sprintId);
      fetchIssuesData(sprintId);
    };

    const handleProjectsUpdated = () => { // same as above 
      fetchIssuesData(currentSprintId);
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("jiraProjectsUpdated", handleProjectsUpdated);

    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("jiraProjectsUpdated", handleProjectsUpdated);
    };
  }, [currentSprintId, fetchIssuesData]);

  return (
    <div className="w-full h-full bg-transparent font-sans text-white p-6 md:p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar select-none">
      <div className="flex flex-col gap-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Release Readiness
            <Info size={16} className="text-[#888888]" />
            {loading && <Loader2 size={16} className="animate-spin text-blue-400 ml-2" />}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:gap-8">
          {/* Bugs Card */}
          <div className="w-80 sm:w-96 bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-7 border border-[#1e1e24] shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white flex items-center gap-2">
                Bugs
                <Info size={15} className="text-[#888888]" />
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xl">
                <span className="text-white">{loading ? "..." : bugStats.total}</span>
                <span className="text-emerald-400 text-base">↗</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[#999999] font-medium">Open</span>
                <span className="text-white font-extrabold text-base">
                  {loading ? "..." : bugStats.open}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#999999] font-medium">Closed</span>
                <span className="text-white font-extrabold text-base">
                  {loading ? "..." : bugStats.closed}
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="w-80 sm:w-96 bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-7 border border-[#1e1e24] shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white flex items-center gap-2">
                Tasks
                <Info size={15} className="text-[#888888]" />
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xl">
                <span className="text-white">{loading ? "..." : taskStats.total}</span>
                <span className="text-emerald-400 text-base">↗</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[#999999] font-medium">Open</span>
                <span className="text-white font-extrabold text-base">
                  {loading ? "..." : taskStats.open}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#999999] font-medium">Closed</span>
                <span className="text-white font-extrabold text-base">
                  {loading ? "..." : taskStats.closed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QMetry360;
