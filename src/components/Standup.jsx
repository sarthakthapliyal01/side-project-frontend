import { PageHeader } from "./ui/ProductUI";
import React, { useState, useEffect, useCallback } from "react";
import {
  ChurnCard,
  CapacityCard,
  JiraStatusCard,
  BurndownCard,
  BurnupCard,
  SprintGoalSuccessCard,
  PullRequestsSummaryCard,
  PRsTableCard,
  SprintIssuesCard,
  ReleaseBurndownCard,
} from "./standup/index";

function Standup({ onOpenCapacityDetails }) {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(() => localStorage.getItem("currentProject") || "");
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.sprintId || parsed?.id || parsed?.name || "");
      } catch {}
    }
    return localStorage.getItem("currentSprint") || "";
  });
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(() => localStorage.getItem("selectedRepo") || "All repositories");

  const [filterType, setFilterType] = useState(() => localStorage.getItem("selectedFilterType") || "Sprint");
  const [currentRelease, setCurrentRelease] = useState(() => {
    const saved = localStorage.getItem("selectedRelease");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.releaseName || parsed?.name || parsed?.id || "");
      } catch {}
    }
    return "";
  });

  const isReleaseMode = filterType === "Release";

  const [prData, setPrData] = useState({
    summary: {
      totalPRs: 0,
      openPRs: 0,
      reviewed: 0,
      unreviewed: 0,
      mergedPRs: 0,
      closedNoMerge: 0,
      avgTimeToMerge: "0h 0m",
      firstTimePassRate: "0%"
    },
    prs: []
  });

  // Global Project, Sprint, Release & Filter Type Listeners
  useEffect(() => {
    const handleSprintSelected = (e) => {
      const obj = e?.detail;
      if (obj) {
        if (obj.isRelease) {
          const rName = String(obj.releaseName || obj.name || obj.id || "");
          setCurrentRelease(rName);
        } else {
          const sid = String(obj.id || obj.sprintId || obj.name || "");
          setCurrentSprint(sid);
        }
      }
    };
    const handleReleaseSelected = (e) => {
      const relObj = e?.detail;
      if (relObj) {
        const rName = String(relObj.releaseName || relObj.name || relObj.id || "");
        setCurrentRelease(rName);
      }
    };
    const handleProjectSelected = (e) => {
      const pid = e?.detail;
      if (pid) {
        setCurrentProject(String(pid));
      }
    };
    const handleFilterTypeChanged = (e) => {
      const ft = e?.detail;
      if (ft) {
        setFilterType(String(ft));
      }
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("releaseSelected", handleReleaseSelected);
    window.addEventListener("projectSelected", handleProjectSelected);
    window.addEventListener("filterTypeChanged", handleFilterTypeChanged);
    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("releaseSelected", handleReleaseSelected);
      window.removeEventListener("projectSelected", handleProjectSelected);
      window.removeEventListener("filterTypeChanged", handleFilterTypeChanged);
    };
  }, []);

  // Project Data
  const fetchProjects = () => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    fetch(`http://127.0.0.1:8000/jira/selected-projects/${companyName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const projects = data.projects || data;
        if (Array.isArray(projects)) {
          setSelectedProjects(projects);
          if (projects.length > 0) {
            const savedProject = localStorage.getItem("currentProject");
            if (savedProject && projects.some((p) => String(p.projectId) === savedProject)) {
              setCurrentProject(savedProject);
            } else {
              setCurrentProject(String(projects[0].projectId));
            }
          } else {
            setCurrentProject("");
          }
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchProjects();
    const handleUpdate = () => fetchProjects();
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    return () => window.removeEventListener("jiraProjectsUpdated", handleUpdate);
  }, []);

  // Sprint Data
  const fetchSprints = useCallback(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    setLoadingSprints(true);

    const url = currentProject
      ? `http://127.0.0.1:8000/jira/sprints/${companyName}?project_id=${currentProject}`
      : `http://127.0.0.1:8000/jira/sprints/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.sprints?.length > 0) {
          setSprints(data.sprints);
          const savedSprintStr = localStorage.getItem("selectedSprint");
          let savedId = currentSprint;
          if (savedSprintStr) {
            try {
              const parsed = JSON.parse(savedSprintStr);
              savedId = String(parsed?.sprintId || parsed?.id || parsed?.name || "");
            } catch {}
          }
          const match = data.sprints.find((s) => String(s.id || s.sprintId || s.name) === savedId);
          if (match) {
            setCurrentSprint(String(match.id || match.sprintId || match.name));
          } else if (!currentSprint) {
            setCurrentSprint(String(data.sprints[0].id || data.sprints[0].sprintId || data.sprints[0].name));
          }
        }
      })
      .catch((err) => console.error("Error fetching sprints:", err))
      .finally(() => setLoadingSprints(false));
  }, [currentProject, currentSprint]);

  useEffect(() => {
    fetchSprints();

    const handleUpdate = () => fetchSprints();
    window.addEventListener("jiraSyncCompleted", handleUpdate);
    window.addEventListener("jiraIssuesUpdated", handleUpdate);
    window.addEventListener("jiraProjectsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("jiraSyncCompleted", handleUpdate);
      window.removeEventListener("jiraIssuesUpdated", handleUpdate);
      window.removeEventListener("jiraProjectsUpdated", handleUpdate);
    };
  }, [fetchSprints]);

  // Repository Selection Event Listener
  useEffect(() => {
    const handleRepoSelected = (e) => {
      const repo = e?.detail || "All repositories";
      setSelectedRepo(repo);
    };

    window.addEventListener("repoSelected", handleRepoSelected);
    return () => window.removeEventListener("repoSelected", handleRepoSelected);
  }, []);

  // Fetch PR Data from MongoDB
  const fetchPRData = () => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    const url = selectedRepo && selectedRepo !== "All repositories"
      ? `http://127.0.0.1:8000/github/prs/${companyName}?repo_name=${encodeURIComponent(selectedRepo)}`
      : `http://127.0.0.1:8000/github/prs/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.summary && data?.prs) {
          setPrData(data);
        }
      })
      .catch((err) => console.error("Error fetching PR data:", err));
  };

  useEffect(() => {
    fetchPRData();
    const handleUpdate = () => fetchPRData();
    window.addEventListener("githubReposUpdated", handleUpdate);
    window.addEventListener("githubPrsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("githubReposUpdated", handleUpdate);
      window.removeEventListener("githubPrsUpdated", handleUpdate);
    };
  }, [selectedRepo]);

  return (
    <div className="q-page">
      <PageHeader eyebrow="Daily delivery" title="Standup" description="Sprint health, team capacity, and delivery progress." /><div className="q-dashboard">
        <ChurnCard
          currentProject={currentProject}
          currentSprint={currentSprint}
          currentRelease={currentRelease}
          isRelease={isReleaseMode}
          sprints={sprints}
        />
        <CapacityCard
          currentSprint={currentSprint}
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={isReleaseMode}
          onOpenCapacityDetails={onOpenCapacityDetails}
        />
        <JiraStatusCard
          currentSprint={currentSprint}
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={isReleaseMode}
        />
        {isReleaseMode ? (
          <>
            <div style={{ gridColumn: "1 / -1" }}>
              <ReleaseBurndownCard
                currentRelease={currentRelease}
                currentProject={currentProject}
              />
            </div>
            <PullRequestsSummaryCard summary={prData.summary} />
            <PRsTableCard prs={prData.prs} />
            <SprintIssuesCard
              currentSprint={currentSprint}
              currentProject={currentProject}
              currentRelease={currentRelease}
              isRelease={true}
              prs={prData.prs}
            />
          </>
        ) : (
          <>
            <BurndownCard currentSprint={currentSprint} currentProject={currentProject} />
            <BurnupCard currentSprint={currentSprint} currentProject={currentProject} />
            <SprintGoalSuccessCard currentProject={currentProject} />
            <PullRequestsSummaryCard summary={prData.summary} />
            <PRsTableCard prs={prData.prs} />
            <SprintIssuesCard
              currentSprint={currentSprint}
              currentProject={currentProject}
              currentRelease={currentRelease}
              isRelease={false}
              prs={prData.prs}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Standup;
