import { PageHeader } from "./ui/ProductUI";
import React, { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

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
      const targetProject = localStorage.getItem("currentProject");
      const params = new URLSearchParams();
      if (targetSprintId) params.append("sprint_id", targetSprintId);
      if (targetProject) params.append("project_id", targetProject);
      const queryParam = params.toString() ? `?${params.toString()}` : "";
      const url = `http://127.0.0.1:8000/jira/sprint-issues/${encodeURIComponent(
        companyName
      )}${queryParam}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let issues = data.issues || [];

        // If no issues found in DB, attempt a sync from Jira API
        if (issues.length === 0) {
          const syncRes = await fetch(
            `http://127.0.0.1:8000/jira/sync-all/${encodeURIComponent(companyName)}`,
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
    window.addEventListener("projectSelected", handleProjectsUpdated);
    window.addEventListener("jiraProjectsUpdated", handleProjectsUpdated);

    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("projectSelected", handleProjectsUpdated);
      window.removeEventListener("jiraProjectsUpdated", handleProjectsUpdated);
    };
  }, [currentSprintId, fetchIssuesData]);

  return <section className="q-page">
    <PageHeader eyebrow="QMetrix360 / delivery overview" title="Release readiness" description="A focused view of bugs and tasks in the selected sprint.">
      {loading && <Loader2 size={18} className="animate-spin text-accent" />}
    </PageHeader>
    <div className="q-readiness-grid">{[{name:"Bugs", stats:bugStats},{name:"Tasks",stats:taskStats}].map(({name,stats}) => <article className="q-readiness-card" key={name}>
      <div className="q-readiness-heading"><div><h2>{name}</h2><p className="q-readiness-label">Total in this sprint</p></div><div className="q-readiness-total">{loading ? "—" : stats.total}</div></div>
      <div className="q-readiness-meter" role="img" aria-label={`${stats.closed} of ${stats.total} ${name.toLowerCase()} closed`}><span style={{width:`${stats.total ? stats.closed / stats.total * 100 : 0}%`}} /></div>
      <div className="q-readiness-split"><div>Open<strong>{loading ? "—" : stats.open}</strong></div><div>Closed<strong>{loading ? "—" : stats.closed}</strong></div><div>Completion<strong>{loading || !stats.total ? "—" : Math.round(stats.closed / stats.total * 100) + "%"}</strong></div></div>
      {!loading && stats.total === 0 && <p className="q-readiness-empty">No {name.toLowerCase()} available for this selection.</p>}
    </article>)}</div>
  </section>;
}
export default QMetry360;
