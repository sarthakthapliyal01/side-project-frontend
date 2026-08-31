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

  // Global Project & Sprint Selection Listeners
  useEffect(() => {
    const handleSprintSelected = (e) => {
      const sprintObj = e?.detail;
      if (sprintObj) {
        const sid = String(sprintObj.id || sprintObj.sprintId || sprintObj.name || "");
        setCurrentSprint(sid);
      }
    };
    const handleProjectSelected = (e) => {
      const pid = e?.detail;
      if (pid) {
        setCurrentProject(String(pid));
      }
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("projectSelected", handleProjectSelected);
    return () => {
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("projectSelected", handleProjectSelected);
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
    <div className="w-full h-full bg-transparent font-sans text-white px-6 md:px-8 py-4 md:py-6 box-border">
      <div className="grid grid-cols-12 gap-5 md:gap-6 pb-8">
        <ChurnCard currentProject={currentProject} currentSprint={currentSprint} sprints={sprints} />
        <CapacityCard
          currentSprint={currentSprint}
          currentProject={currentProject}
          onOpenCapacityDetails={onOpenCapacityDetails}
        />
        <JiraStatusCard currentSprint={currentSprint} currentProject={currentProject} />
        <BurndownCard currentSprint={currentSprint} currentProject={currentProject} />
        <BurnupCard currentSprint={currentSprint} currentProject={currentProject} />
        <SprintGoalSuccessCard currentProject={currentProject} />
        <PullRequestsSummaryCard summary={prData.summary} />
        <PRsTableCard prs={prData.prs} />
        <SprintIssuesCard currentSprint={currentSprint} currentProject={currentProject} prs={prData.prs} />
      </div>
    </div>
  );
}

export default Standup;
